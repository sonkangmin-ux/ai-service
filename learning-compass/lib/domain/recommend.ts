import { SKILL_ORDER } from "./ids";
import { reasonText } from "./reasons";
import type {
  AppState,
  Attempt,
  ContentPack,
  RecommendationResult,
  SkillProgress,
  Task,
} from "./types";

export function getProgressMap(state: AppState): Map<string, SkillProgress> {
  return new Map(state.progress.map((item) => [item.skillId, item]));
}

export function skillStatus(state: AppState, skillId: string): SkillProgress {
  return (
    state.progress.find((item) => item.skillId === skillId) ?? {
      skillId,
      status: "unseen",
      supportFailures: 0,
    }
  );
}

export function prereqsVerified(
  state: AppState,
  content: ContentPack,
  skillId: string,
): boolean {
  const skill = content.skills[skillId];
  if (!skill) return false;
  return skill.prerequisiteIds.every(
    (id) => skillStatus(state, id).status === "verified",
  );
}

export function sessionIsIncomplete(state: AppState): boolean {
  const session = state.activeSession;
  if (!session) return false;
  if (session.state === "result") return false;
  return !state.attempts.some((attempt) => attempt.sessionId === session.id);
}

export function lastAttemptsForSkill(state: AppState, skillId: string, content: ContentPack): Attempt[] {
  const taskIds = new Set(
    Object.values(content.tasks)
      .filter((task) => task.skillId === skillId)
      .map((task) => task.id),
  );
  return state.attempts.filter((attempt) => taskIds.has(attempt.taskId));
}

function lastMeaningfulAttempt(attempts: Attempt[]): Attempt | undefined {
  for (let i = attempts.length - 1; i >= 0; i -= 1) {
    const attempt = attempts[i];
    if (attempt.blockReason === "time") continue;
    return attempt;
  }
  return undefined;
}

function supportReason(
  state: AppState,
  content: ContentPack,
  skillId: string,
  progress: SkillProgress,
): { task: Task; code: RecommendationResult["reasonCode"] } {
  const skill = content.skills[skillId];
  const remedial = content.tasks[skill.remedialTaskId];
  const verify = content.tasks[skill.verifyTaskId];
  const last = lastMeaningfulAttempt(lastAttemptsForSkill(state, skillId, content));
  const lastTask = last ? content.tasks[last.taskId] : undefined;
  if (progress.supportFailures >= 2) {
    const next = lastTask?.kind === "remedial" ? verify : remedial;
    return { task: next, code: "STUCK_SUPPORT" };
  }
  if (lastTask?.kind === "remedial" && last && last.outcome !== "passed") {
    return { task: verify, code: "SUPPORT_RECHECK" };
  }
  return { task: remedial, code: "CHECKPOINT_SUPPORT" };
}

export function recommendNext(state: AppState, content: ContentPack): RecommendationResult {
  const session = state.activeSession;
  if (session && (session.state === "paused" || sessionIsIncomplete(state))) {
    const task = content.tasks[session.taskId];
    return {
      taskId: session.taskId,
      reasonCode: "RESUME",
      reasonText: reasonText("RESUME", task, content),
      basedOnAttemptIds: lastAttemptsForSkill(state, task?.skillId ?? "", content)
        .slice(-2)
        .map((item) => item.id),
    };
  }

  const firstOpen = SKILL_ORDER.find((skillId) => {
    if (!prereqsVerified(state, content, skillId)) return false;
    return skillStatus(state, skillId).status !== "verified";
  });

  if (!firstOpen) {
    return {
      taskId: null,
      reasonCode: "COURSE_COMPLETE",
      reasonText: reasonText("COURSE_COMPLETE", undefined, content),
      basedOnAttemptIds: state.attempts.slice(-3).map((item) => item.id),
    };
  }

  const progress = skillStatus(state, firstOpen);
  const skill = content.skills[firstOpen];
  const previousVerified = SKILL_ORDER.slice(0, SKILL_ORDER.indexOf(firstOpen)).every(
    (id) => skillStatus(state, id).status === "verified",
  );
  const basedOnAttemptIds = lastAttemptsForSkill(state, firstOpen, content)
    .slice(-3)
    .map((item) => item.id);

  if (progress.status === "in_progress") {
    const last = lastMeaningfulAttempt(lastAttemptsForSkill(state, firstOpen, content));
    const currentTaskId =
      last && last.outcome !== "passed"
        ? supportReason(state, content, firstOpen, progress).task.id
        : progress.status === "in_progress" && last
          ? last.taskId
          : skill.baseTaskId;
    const task = content.tasks[currentTaskId] ?? content.tasks[skill.baseTaskId];
    const code = task.kind === "verify" && !last ? "DIAGNOSIS_VERIFY" : "RESUME";
    return {
      taskId: task.id,
      reasonCode: last ? (task.kind === "remedial" ? "CHECKPOINT_SUPPORT" : code) : "RESUME",
      reasonText: reasonText(last && task.kind === "remedial" ? "CHECKPOINT_SUPPORT" : "RESUME", task, content),
      basedOnAttemptIds,
    };
  }

  if (progress.status === "provisional") {
    const task = content.tasks[skill.verifyTaskId];
    return {
      taskId: task.id,
      reasonCode: "DIAGNOSIS_VERIFY",
      reasonText: reasonText("DIAGNOSIS_VERIFY", task, content),
      basedOnAttemptIds,
    };
  }

  if (progress.status === "needs_support") {
    const { task, code } = supportReason(state, content, firstOpen, progress);
    return {
      taskId: task.id,
      reasonCode: code,
      reasonText: reasonText(code, task, content),
      basedOnAttemptIds,
    };
  }

  const task = content.tasks[skill.baseTaskId];
  const code = previousVerified && SKILL_ORDER.indexOf(firstOpen) > 0 ? "PREREQUISITE_COMPLETE" : "INITIAL_BASE";
  return {
    taskId: task.id,
    reasonCode: code,
    reasonText: reasonText(code, task, content),
    basedOnAttemptIds,
  };
}
