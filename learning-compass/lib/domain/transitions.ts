import { SKILL_ORDER } from "./ids";
import { recommendNext } from "./recommend";
import { allCheckpointsCorrect, diagnosisCorrect, scoreCheckpoint } from "./scoring";
import type {
  AppState,
  Attempt,
  BlockReason,
  ContentPack,
  Diagnosis,
  PlanChange,
  Profile,
  Recommendation,
  SkillProgress,
  TaskSession,
} from "./types";

export function recomputeProgress(state: AppState, content: ContentPack): SkillProgress[] {
  const map = new Map<string, SkillProgress>();
  for (const skillId of SKILL_ORDER) {
    map.set(skillId, { skillId, status: "unseen", supportFailures: 0 });
  }

  for (const skillId of state.diagnosis?.provisionalSkillIds ?? []) {
    const current = map.get(skillId);
    if (current && current.status === "unseen") {
      map.set(skillId, { ...current, status: "provisional" });
    }
  }

  const cycleMarker = new Map<string, "none" | "remedial" | "verify">();
  for (const skillId of SKILL_ORDER) cycleMarker.set(skillId, "none");

  for (const attempt of state.attempts) {
    const task = content.tasks[attempt.taskId];
    if (!task) continue;
    const current = map.get(task.skillId);
    if (!current) continue;

    if (current.status === "verified") {
      map.set(task.skillId, { ...current, lastAttemptId: attempt.id });
      continue;
    }

    if (attempt.outcome === "passed" && allCheckpointsCorrect(attempt.checkpointResults)) {
      map.set(task.skillId, {
        ...current,
        status: "verified",
        verifiedAt: attempt.submittedAt,
        lastAttemptId: attempt.id,
        supportFailures: 0,
      });
      cycleMarker.set(task.skillId, "none");
      continue;
    }

    if (attempt.blockReason === "time") {
      map.set(task.skillId, {
        ...current,
        status: current.status === "unseen" || current.status === "provisional" ? "in_progress" : current.status,
        lastAttemptId: attempt.id,
      });
      continue;
    }

    if (attempt.outcome === "failed" || attempt.outcome === "blocked") {
      let supportFailures = current.supportFailures;
      const marker = cycleMarker.get(task.skillId) ?? "none";
      if (task.kind === "remedial") {
        cycleMarker.set(task.skillId, "remedial");
      } else if (task.kind === "verify" && marker === "remedial") {
        supportFailures += 1;
        cycleMarker.set(task.skillId, "none");
      }
      map.set(task.skillId, {
        ...current,
        status: "needs_support",
        supportFailures,
        lastAttemptId: attempt.id,
      });
    }
  }

  if (state.activeSession) {
    const task = content.tasks[state.activeSession.taskId];
    if (task) {
      const current = map.get(task.skillId);
      if (current && current.status !== "verified" && current.status !== "needs_support") {
        map.set(task.skillId, { ...current, status: "in_progress" });
      }
    }
  }

  return SKILL_ORDER.map((skillId) => map.get(skillId)!);
}

export function withRecommendation(
  state: AppState,
  content: ContentPack,
  ids: { recommendationId: string; planChangeId: string },
  at: string,
  attemptId?: string,
): AppState {
  const next = recommendNext(state, content);
  const previousTaskId = state.recommendation?.taskId ?? undefined;
  if (
    state.recommendation &&
    state.recommendation.taskId === next.taskId &&
    state.recommendation.reasonCode === next.reasonCode
  ) {
    return state;
  }
  const recommendation: Recommendation = {
    id: ids.recommendationId,
    taskId: next.taskId,
    reasonCode: next.reasonCode,
    reasonText: next.reasonText,
    basedOnAttemptIds: next.basedOnAttemptIds,
    createdAt: at,
  };
  const planChange: PlanChange = {
    id: ids.planChangeId,
    previousTaskId,
    nextTaskId: next.taskId ?? undefined,
    reasonCode: next.reasonCode,
    explanation: next.reasonText,
    attemptId,
    createdAt: at,
  };
  return {
    ...state,
    recommendation,
    planChanges: [...state.planChanges, planChange],
  };
}

export function setProfile(state: AppState, profile: Profile): AppState {
  return { ...state, profile };
}

export function setSessionMinutes(state: AppState, minutes: Profile["sessionMinutes"]): AppState {
  if (!state.profile) return state;
  return {
    ...state,
    profile: { ...state.profile, sessionMinutes: minutes },
  };
}

export function applyDiagnosis(
  state: AppState,
  content: ContentPack,
  responses: { skillId: string; choiceId: string }[] | "skip",
  at: string,
): AppState {
  let diagnosis: Diagnosis;
  if (responses === "skip") {
    diagnosis = { responses: [], provisionalSkillIds: [], skippedAt: at };
  } else {
    const provisionalSkillIds = content.diagnosis
      .filter((item) => {
        const response = responses.find((entry) => entry.skillId === item.skillId);
        return response ? diagnosisCorrect(item, response.choiceId) : false;
      })
      .map((item) => item.skillId);
    diagnosis = { responses, provisionalSkillIds, completedAt: at };
  }
  const next: AppState = { ...state, diagnosis };
  next.progress = recomputeProgress(next, content);
  return next;
}

export function startTask(
  state: AppState,
  content: ContentPack,
  taskId: string,
  sessionId: string,
  at: string,
  eventId: string,
): AppState {
  if (state.activeSession && sessionIsOpen(state)) {
    return state;
  }
  const session: TaskSession = {
    id: sessionId,
    taskId,
    startedAt: at,
    updatedAt: at,
    draft: "",
    hintCount: 0,
    activeSeconds: 0,
    state: "in_progress",
    checkpointSelections: {},
  };
  const next: AppState = {
    ...state,
    activeSession: session,
    events: [
      ...state.events,
      { id: eventId, type: "task_started", sessionId, taskId, at },
    ],
  };
  next.progress = recomputeProgress(next, content);
  return next;
}

export function sessionIsOpen(state: AppState): boolean {
  const session = state.activeSession;
  if (!session) return false;
  if (session.state === "result") return false;
  return !state.attempts.some((attempt) => attempt.sessionId === session.id);
}

export function updateDraft(state: AppState, draft: string, at: string): AppState {
  if (!state.activeSession || !sessionIsOpen(state)) return state;
  return {
    ...state,
    activeSession: {
      ...state.activeSession,
      draft,
      updatedAt: at,
    },
  };
}

export function recordHint(state: AppState, at: string): AppState {
  if (!state.activeSession || !sessionIsOpen(state)) return state;
  const hintCount = Math.min(2, state.activeSession.hintCount + 1);
  return {
    ...state,
    activeSession: { ...state.activeSession, hintCount, updatedAt: at },
  };
}

export function addActiveSeconds(state: AppState, seconds: number, visible: boolean): AppState {
  if (!state.activeSession || state.activeSession.state !== "in_progress" || !visible) {
    return state;
  }
  return {
    ...state,
    activeSession: {
      ...state.activeSession,
      activeSeconds: state.activeSession.activeSeconds + seconds,
    },
  };
}

export function pauseSession(state: AppState, at: string): AppState {
  if (!state.activeSession || !sessionIsOpen(state)) return state;
  return {
    ...state,
    activeSession: { ...state.activeSession, state: "paused", updatedAt: at },
  };
}

export function resumeSession(state: AppState, at: string): AppState {
  if (!state.activeSession || state.activeSession.state !== "paused") return state;
  return {
    ...state,
    activeSession: { ...state.activeSession, state: "in_progress", updatedAt: at },
  };
}

export function setSessionState(
  state: AppState,
  sessionState: TaskSession["state"],
  at: string,
): AppState {
  if (!state.activeSession || !sessionIsOpen(state)) return state;
  return {
    ...state,
    activeSession: { ...state.activeSession, state: sessionState, updatedAt: at },
  };
}

export function applyFeedbackToSession(state: AppState, feedbackId: string, at: string): AppState {
  if (!state.activeSession) return state;
  return {
    ...state,
    activeSession: {
      ...state.activeSession,
      latestFeedbackId: feedbackId,
      state: "checkpoint",
      updatedAt: at,
    },
  };
}

export function submitAttempt(
  state: AppState,
  content: ContentPack,
  input: {
    attemptId: string;
    eventId: string;
    at: string;
    outcome?: Attempt["outcome"];
    blockReason?: BlockReason;
    checkpointSelections?: Record<string, string>;
  },
): AppState {
  const session = state.activeSession;
  if (!session) return state;
  if (state.attempts.some((attempt) => attempt.sessionId === session.id)) {
    return state;
  }
  const task = content.tasks[session.taskId];
  if (!task) return state;

  let outcome: Attempt["outcome"] = input.outcome ?? "failed";
  let checkpointResults: Attempt["checkpointResults"] = [];
  if (!input.blockReason) {
    const selections = input.checkpointSelections ?? session.checkpointSelections;
    checkpointResults = task.checkpoints.map((checkpoint) =>
      scoreCheckpoint(checkpoint, selections[checkpoint.id]),
    );
    outcome = allCheckpointsCorrect(checkpointResults) ? "passed" : "failed";
  } else if (input.blockReason === "time") {
    outcome = "blocked";
  } else {
    outcome = "blocked";
  }

  const attempt: Attempt = {
    id: input.attemptId,
    sessionId: session.id,
    taskId: session.taskId,
    submittedAt: input.at,
    outcome,
    answerText: session.draft,
    checkpointResults,
    hintCount: session.hintCount,
    activeSeconds: session.activeSeconds,
    blockReason: input.blockReason,
    feedbackId: session.latestFeedbackId,
  };

  const next: AppState = {
    ...state,
    attempts: [...state.attempts, attempt],
    activeSession: { ...session, state: "result", updatedAt: input.at },
    events: [
      ...state.events,
      {
        id: input.eventId,
        type: "attempt_submitted",
        sessionId: session.id,
        taskId: session.taskId,
        at: input.at,
      },
    ],
  };
  next.progress = recomputeProgress(next, content);
  return next;
}

export function clearFinishedSession(state: AppState): AppState {
  if (!state.activeSession || sessionIsOpen(state)) return state;
  return { ...state, activeSession: undefined };
}

export function resetLearning(content: ContentPack, profile?: Profile): AppState {
  const empty: AppState = {
    schemaVersion: stateSchemaVersion(),
    contentVersion: content.version,
    profile,
    attempts: [],
    feedbacks: [],
    progress: [],
    planChanges: [],
    events: [],
  };
  empty.progress = recomputeProgress(empty, content);
  return empty;
}

function stateSchemaVersion(): number {
  return 1;
}
