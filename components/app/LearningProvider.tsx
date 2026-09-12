"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { pythonFoundations } from "@/content/python-foundations";
import { createDemoState } from "@/lib/demo/seed";
import { createEmptyState } from "@/lib/domain/empty";
import { simpleId } from "@/lib/domain/hash";
import {
  DEMO_STORAGE_KEY,
  GUEST_MODE_KEY,
  GUEST_STORAGE_KEY,
  LEGACY_OFFER_KEY,
  LEGACY_USER_STORAGE_KEY,
} from "@/lib/domain/ids";
import { exportLearningJson, validateImportJson } from "@/lib/domain/import";
import { recommendNext } from "@/lib/domain/recommend";
import {
  addActiveSeconds,
  applyDiagnosis,
  applyFeedbackToSession,
  clearFinishedSession,
  pauseSession,
  recordHint,
  resetLearning,
  resumeSession,
  setProfile,
  setSessionMinutes,
  setSessionState,
  startTask,
  submitAttempt,
  updateDraft,
  withRecommendation,
} from "@/lib/domain/transitions";
import type { AppState, BlockReason, Feedback, Profile } from "@/lib/domain/types";

export type AppMode = "guest" | "member" | "demo";
export type SaveStatus = "idle" | "saving" | "saved" | "failed" | "conflict" | "offline";

type LearningContextValue = {
  mode: AppMode;
  basePath: string;
  ready: boolean;
  state: AppState;
  saveStatus: SaveStatus;
  toast: string | null;
  conflict: boolean;
  legacyOffer: boolean;
  guestMigrateOffer: "none" | "empty-account" | "existing-account";
  online: boolean;
  setToast: (value: string | null) => void;
  patch: (updater: (current: AppState) => AppState, persist?: boolean) => void;
  saveNow: () => Promise<boolean>;
  importJson: (raw: string) => string | null;
  exportJson: () => string;
  resetAll: () => void;
  restoreDemo: () => void;
  applyGuestToAccount: () => Promise<boolean>;
  dismissLegacyOffer: () => void;
  dismissGuestMigrate: () => void;
};

const LearningContext = createContext<LearningContextValue | null>(null);

function readLocal(key: string): AppState | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  const parsed = validateImportJson(raw, createEmptyState());
  return parsed.ok ? parsed.data : null;
}

function writeLocal(key: string, state: AppState) {
  window.localStorage.setItem(key, exportLearningJson(state));
}

export function LearningProvider({
  mode,
  children,
}: {
  mode: AppMode;
  children: ReactNode;
}) {
  const [state, setState] = useState<AppState>(createEmptyState);
  const [ready, setReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [toast, setToast] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [legacyOffer, setLegacyOffer] = useState(false);
  const [guestMigrateOffer, setGuestMigrateOffer] = useState<"none" | "empty-account" | "existing-account">("none");
  const [online, setOnline] = useState(true);
  const [revision, setRevision] = useState(-1);
  const stateRef = useRef(state);
  const revisionRef = useRef(-1);
  const queueRef = useRef<AppState | null>(null);
  const inflightRef = useRef(false);
  const mutationRef = useRef(simpleId("mut"));

  const basePath = mode === "demo" ? "/demo" : "";
  const storageKey = mode === "demo" ? DEMO_STORAGE_KEY : GUEST_STORAGE_KEY;

  const persistMember = async (payload: AppState) => {
    if (conflict) return false;
    inflightRef.current = true;
    setSaveStatus("saving");
    const mutationId = mutationRef.current;
    try {
      const response = await fetch("/api/learning-state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedRevision: revisionRef.current,
          payload,
          mutationId,
        }),
      });
      if (response.status === 409) {
        setConflict(true);
        setSaveStatus("conflict");
        setToast("다른 창이나 기기에서 기록이 변경됐습니다");
        return false;
      }
      if (!response.ok) {
        setSaveStatus("failed");
        setToast("저장에 실패했습니다. 초안은 메모리에 남아 있습니다. 내보내기를 사용할 수 있습니다.");
        return false;
      }
      const data = (await response.json()) as { revision: number };
      setRevision(data.revision);
      revisionRef.current = data.revision;
      mutationRef.current = simpleId("mut");
      setSaveStatus("saved");
      return true;
    } catch {
      setSaveStatus("failed");
      setToast("저장에 실패했습니다. 새로고침하면 미저장 초안이 사라질 수 있습니다.");
      return false;
    } finally {
      inflightRef.current = false;
      if (queueRef.current) {
        const next = queueRef.current;
        queueRef.current = null;
        void persistMember(next);
      }
    }
  };

  useEffect(() => {
    stateRef.current = state;
    revisionRef.current = revision;
  }, [state, revision]);

  const persist = (payload: AppState) => {
    if (mode === "guest" || mode === "demo") {
      try {
        writeLocal(storageKey, payload);
        setSaveStatus("saved");
      } catch {
        setSaveStatus("failed");
        setToast("로컬 저장에 실패했습니다. 내보내기를 사용해 주세요.");
      }
      return;
    }
    if (inflightRef.current) {
      queueRef.current = payload;
      return;
    }
    void persistMember(payload);
  };

  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      if (mode === "demo") {
        const existing = readLocal(DEMO_STORAGE_KEY);
        setState(existing ?? createDemoState());
        setReady(true);
        return;
      }
      if (mode === "guest") {
        const existing = readLocal(GUEST_STORAGE_KEY);
        setState(existing ?? createEmptyState());
        if (window.localStorage.getItem(LEGACY_USER_STORAGE_KEY) && !window.localStorage.getItem(LEGACY_OFFER_KEY)) {
          setLegacyOffer(true);
        }
        window.localStorage.setItem(GUEST_MODE_KEY, "guest");
        setReady(true);
        return;
      }
      const response = await fetch("/api/learning-state", { cache: "no-store" });
      if (cancelled) return;
      if (!response.ok) {
        setState(createEmptyState());
        setReady(true);
        return;
      }
      const data = (await response.json()) as { payload: AppState | null; revision: number };
      setRevision(data.revision);
      revisionRef.current = data.revision;
      if (data.payload) {
        setState(data.payload);
        const guest = readLocal(GUEST_STORAGE_KEY);
        if (guest?.profile) setGuestMigrateOffer("existing-account");
      } else {
        const guest = readLocal(GUEST_STORAGE_KEY);
        setState(createEmptyState());
        if (guest?.profile) setGuestMigrateOffer("empty-account");
      }
      setReady(true);
    };
    void start();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => {
      setOnline(false);
      setSaveStatus("offline");
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const delay = mode === "member" ? 1000 : 500;
    const timer = window.setTimeout(() => persist(stateRef.current), delay);
    return () => window.clearTimeout(timer);
  }, [state, ready, mode]);

  const secondsRef = useRef(0);
  useEffect(() => {
    if (!ready) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") secondsRef.current += 1;
    }, 1000);
    const flush = () => {
      const added = secondsRef.current;
      if (!added) return;
      secondsRef.current = 0;
      setState((current) => addActiveSeconds(current, added, true));
    };
    const onVisibility = () => {
      if (document.visibilityState !== "visible") flush();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      flush();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ready]);

  const patch = (updater: (current: AppState) => AppState) => {
    setSaveStatus((current) => (current === "conflict" || current === "offline" ? current : "saving"));
    setState((current) => {
      const withTime = addActiveSeconds(current, secondsRef.current, true);
      secondsRef.current = 0;
      return updater(withTime);
    });
  };

  const saveNow = async () => {
    if (mode === "member") return persistMember(stateRef.current);
    persist(stateRef.current);
    return saveStatus !== "failed";
  };

  const value = useMemo<LearningContextValue>(
    () => ({
      mode,
      basePath,
      ready,
      state,
      saveStatus,
      toast,
      conflict,
      legacyOffer,
      guestMigrateOffer,
      online,
      setToast,
      patch,
      saveNow,
      importJson: (raw) => {
        const result = validateImportJson(raw, stateRef.current);
        if (!result.ok) return result.message;
        setState(result.data);
        return null;
      },
      exportJson: () => exportLearningJson(stateRef.current),
      resetAll: () => {
        const next = resetLearning(pythonFoundations, stateRef.current.profile);
        setState(next);
      },
      restoreDemo: () => {
        const next = createDemoState();
        setState(next);
        writeLocal(DEMO_STORAGE_KEY, next);
      },
      applyGuestToAccount: async () => {
        const guest = readLocal(GUEST_STORAGE_KEY);
        if (!guest) return false;
        setState(guest);
        const ok = await persistMember(guest);
        if (ok) {
          setGuestMigrateOffer("none");
          setToast("계정으로 가져왔습니다. 브라우저 게스트 기록을 지울지는 설정에서 선택할 수 있습니다.");
        }
        return ok;
      },
      dismissLegacyOffer: () => {
        window.localStorage.setItem(LEGACY_OFFER_KEY, "1");
        setLegacyOffer(false);
      },
      dismissGuestMigrate: () => setGuestMigrateOffer("none"),
    }),
    [mode, basePath, ready, state, saveStatus, toast, conflict, legacyOffer, guestMigrateOffer, online, patch, saveNow, persistMember],
  );

  return <LearningContext.Provider value={value}>{children}</LearningContext.Provider>;
}

export function useLearning() {
  const value = useContext(LearningContext);
  if (!value) throw new Error("LearningProvider missing");
  return value;
}

export function useLearningActions() {
  const { patch, state, mode } = useLearning();
  const content = pythonFoundations;
  return {
    saveProfile: (profile: Profile) =>
      patch((current) =>
        withRecommendation(setProfile(current, profile), content, ids(), now()),
      ),
    skipOrCompleteDiagnosis: (responses: { skillId: string; choiceId: string }[] | "skip") =>
      patch((current) =>
        withRecommendation(applyDiagnosis(current, content, responses, now()), content, ids(), now()),
      ),
    beginTask: (taskId: string) =>
      patch((current) => {
        const started = startTask(current, content, taskId, simpleId("sess"), now(), simpleId("evt"));
        return withRecommendation(started, content, ids(), now());
      }),
    writeDraft: (draft: string) => patch((current) => updateDraft(current, draft, now())),
    hint: () => patch((current) => recordHint(current, now())),
    pause: () => patch((current) => pauseSession(current, now())),
    resume: () => patch((current) => resumeSession(current, now())),
    markFeedbackWait: () => patch((current) => setSessionState(current, "awaiting_feedback", now())),
    attachFeedback: (feedback: Feedback) =>
      patch((current) => ({
        ...applyFeedbackToSession(current, feedback.id, now()),
        feedbacks: [...current.feedbacks, feedback],
      })),
    finishAttempt: (input?: { blockReason?: BlockReason; selections?: Record<string, string> }) =>
      patch((current) => {
        const submitted = submitAttempt(current, content, {
          attemptId: simpleId("att"),
          eventId: simpleId("evt"),
          at: now(),
          blockReason: input?.blockReason,
          checkpointSelections: input?.selections,
        });
        const cleared = clearFinishedSession(submitted);
        return withRecommendation(cleared, content, ids(), now(), submitted.attempts.at(-1)?.id);
      }),
    changeMinutes: (minutes: Profile["sessionMinutes"]) =>
      patch((current) => setSessionMinutes(current, minutes)),
    currentRecommendation: recommendNext(state, content),
    isDemo: mode === "demo",
  };
}

function ids() {
  return { recommendationId: simpleId("rec"), planChangeId: simpleId("plan") };
}
function now() {
  return new Date().toISOString();
}
