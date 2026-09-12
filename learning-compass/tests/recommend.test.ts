import { pythonFoundations } from "../content/python-foundations";
import { createEmptyState } from "../lib/domain/empty";
import { GOAL_ID } from "../lib/domain/ids";
import { recommendNext } from "../lib/domain/recommend";
import {
  applyDiagnosis,
  recomputeProgress,
  setProfile,
  setSessionMinutes,
  startTask,
  submitAttempt,
  withRecommendation,
} from "../lib/domain/transitions";
import type { AppState } from "../lib/domain/types";
import { describe, expect, it } from "vitest";

const content = pythonFoundations;

function baseState(): AppState {
  const profile = {
    goalId: GOAL_ID,
    experience: "first" as const,
    sessionMinutes: 15 as const,
    createdAt: "2026-09-01T00:00:00.000Z",
  };
  let state = setProfile(createEmptyState(), profile);
  state = applyDiagnosis(state, content, "skip", profile.createdAt);
  return state;
}

function passTask(state: AppState, taskId: string, sessionId: string): AppState {
  let next = startTask(state, content, taskId, sessionId, "2026-09-01T00:00:00.000Z", `evt_${sessionId}`);
  next = { ...next, activeSession: { ...next.activeSession!, draft: "답변입니다" } };
  const task = content.tasks[taskId];
  const selections = Object.fromEntries(task.checkpoints.map((item) => [item.id, item.correctChoiceId]));
  return submitAttempt(next, content, {
    attemptId: `att_${sessionId}`,
    eventId: `evt2_${sessionId}`,
    at: "2026-09-01T00:01:00.000Z",
    checkpointSelections: selections,
  });
}

function failTask(state: AppState, taskId: string, sessionId: string): AppState {
  let next = startTask(state, content, taskId, sessionId, "2026-09-01T00:00:00.000Z", `evt_${sessionId}`);
  next = { ...next, activeSession: { ...next.activeSession!, draft: "답변입니다" } };
  const task = content.tasks[taskId];
  const wrong = task.checkpoints[0].choices.find((choice) => choice.id !== task.checkpoints[0].correctChoiceId)!.id;
  const selections = Object.fromEntries(task.checkpoints.map((item) => [item.id, wrong]));
  return submitAttempt(next, content, {
    attemptId: `att_${sessionId}`,
    eventId: `evt2_${sessionId}`,
    at: "2026-09-01T00:01:00.000Z",
    checkpointSelections: selections,
  });
}

describe("recommendNext", () => {
  it("returns the same task and reason for the same state", () => {
    const state = baseState();
    expect(recommendNext(state, content)).toEqual(recommendNext(state, content));
    expect(recommendNext(state, content).taskId).toBe("v-base");
    expect(recommendNext(state, content).reasonCode).toBe("INITIAL_BASE");
  });

  it("marks diagnosis hits as provisional, not verified", () => {
    let state = setProfile(createEmptyState(), {
      goalId: GOAL_ID,
      experience: "first",
      sessionMinutes: 15,
      createdAt: "2026-09-01T00:00:00.000Z",
    });
    const responses = content.diagnosis.map((item) => ({ skillId: item.skillId, choiceId: item.correctChoiceId }));
    state = applyDiagnosis(state, content, responses, "2026-09-01T00:00:00.000Z");
    expect(state.progress.find((item) => item.skillId === "v")?.status).toBe("provisional");
    expect(recommendNext(state, content).taskId).toBe("v-verify");
    expect(recommendNext(state, content).reasonCode).toBe("DIAGNOSIS_VERIFY");
  });

  it("does not recommend a later skill before prerequisites are verified", () => {
    const state = baseState();
    expect(recommendNext(state, content).taskId).toBe("v-base");
    expect(recommendNext(state, content).taskId).not.toBe("c-base");
  });

  it("recommends remedial after base failure and verify after remedial failure", () => {
    let state = failTask(baseState(), "v-base", "s1");
    state = { ...state, activeSession: undefined, progress: recomputeProgress(state, content) };
    expect(recommendNext(state, content).taskId).toBe("v-remedial");
    state = failTask(state, "v-remedial", "s2");
    state = { ...state, activeSession: undefined, progress: recomputeProgress(state, content) };
    expect(recommendNext(state, content).taskId).toBe("v-verify");
  });

  it("moves to the next skill after pass", () => {
    let state = passTask(baseState(), "v-base", "s1");
    state = { ...state, activeSession: undefined, progress: recomputeProgress(state, content) };
    expect(state.progress.find((item) => item.skillId === "v")?.status).toBe("verified");
    expect(recommendNext(state, content).taskId).toBe("c-base");
  });

  it("treats time shortage as pause without wiping progress", () => {
    let state = startTask(baseState(), content, "v-base", "s-time", "2026-09-01T00:00:00.000Z", "e-time");
    state = { ...state, activeSession: { ...state.activeSession!, draft: "초안 유지" } };
    const blocked = submitAttempt(state, content, {
      attemptId: "att-time",
      eventId: "evt-time",
      at: "2026-09-01T00:02:00.000Z",
      blockReason: "time",
    });
    expect(blocked.activeSession?.draft).toBe("초안 유지");
    expect(blocked.progress.find((item) => item.skillId === "v")?.status).not.toBe("unseen");
    expect(blocked.attempts[0]?.blockReason).toBe("time");
  });

  it("does not clear progress when session minutes change", () => {
    let state = passTask(baseState(), "v-base", "s1");
    state = setSessionMinutes(state, 45);
    expect(state.progress.find((item) => item.skillId === "v")?.status).toBe("verified");
    expect(state.attempts).toHaveLength(1);
  });

  it("does not duplicate Attempt or PlanChange for the same sessionId", () => {
    let state = startTask(baseState(), content, "v-base", "same", "2026-09-01T00:00:00.000Z", "e1");
    state = { ...state, activeSession: { ...state.activeSession!, draft: "답변" } };
    const selections = Object.fromEntries(
      content.tasks["v-base"].checkpoints.map((item) => [item.id, item.correctChoiceId]),
    );
    const first = submitAttempt(state, content, {
      attemptId: "a1",
      eventId: "e2",
      at: "2026-09-01T00:01:00.000Z",
      checkpointSelections: selections,
    });
    const second = submitAttempt(first, content, {
      attemptId: "a2",
      eventId: "e3",
      at: "2026-09-01T00:02:00.000Z",
      checkpointSelections: selections,
    });
    expect(second.attempts).toHaveLength(1);
    const withPlan = withRecommendation(second, content, { recommendationId: "r1", planChangeId: "p1" }, "2026-09-01T00:03:00.000Z");
    const again = withRecommendation(withPlan, content, { recommendationId: "r2", planChangeId: "p2" }, "2026-09-01T00:04:00.000Z");
    expect(again.planChanges).toHaveLength(withPlan.planChanges.length);
  });
});
