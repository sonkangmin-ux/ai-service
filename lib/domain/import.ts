import { MAX_IMPORT_BYTES } from "./ids";
import { parseAppState } from "./schema";
import type { AppState } from "./types";

export function validateImportJson(
  raw: string,
  current: AppState,
): { ok: true; data: AppState } | { ok: false; message: string } {
  if (new TextEncoder().encode(raw).length > MAX_IMPORT_BYTES) {
    return { ok: false, message: "파일이 2MB를 넘습니다. 기존 데이터는 그대로 둡니다." };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, message: "JSON 형식이 아닙니다. 기존 데이터는 그대로 둡니다." };
  }
  if (parsed && typeof parsed === "object" && "contentVersion" in parsed) {
    const version = (parsed as { contentVersion?: unknown }).contentVersion;
    if (version !== current.contentVersion) {
      return {
        ok: false,
        message: `콘텐츠 버전(${String(version)})이 현재(${current.contentVersion})와 달라 가져올 수 없습니다.`,
      };
    }
  }
  const result = parseAppState(parsed);
  if (!result.ok) {
    return { ok: false, message: `${result.message} 기존 데이터는 그대로 둡니다.` };
  }
  return result;
}

export function exportLearningJson(state: AppState): string {
  const payload: AppState = {
    schemaVersion: state.schemaVersion,
    contentVersion: state.contentVersion,
    profile: state.profile,
    diagnosis: state.diagnosis,
    activeSession: state.activeSession,
    attempts: state.attempts,
    feedbacks: state.feedbacks,
    progress: state.progress,
    recommendation: state.recommendation,
    planChanges: state.planChanges,
    events: state.events,
  };
  return JSON.stringify(payload, null, 2);
}
