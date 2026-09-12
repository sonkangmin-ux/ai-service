import { pythonFoundations } from "@/content/python-foundations";
import { createEmptyState } from "@/lib/domain/empty";
import { GOAL_ID } from "@/lib/domain/ids";
import { withRecommendation } from "@/lib/domain/transitions";
import type { AppState, Attempt } from "@/lib/domain/types";

function passedAttempt(id: string, sessionId: string, taskId: string, at: string): Attempt {
  const task = pythonFoundations.tasks[taskId];
  return {
    id,
    sessionId,
    taskId,
    submittedAt: at,
    outcome: "passed",
    answerText: "예시 학습 기록",
    checkpointResults: task.checkpoints.map((checkpoint) => ({
      checkpointId: checkpoint.id,
      choiceId: checkpoint.correctChoiceId,
      correct: true,
    })),
    hintCount: 0,
    activeSeconds: 240,
  };
}

export function createDemoState(at = "2026-09-01T00:00:00.000Z"): AppState {
  const seeded: AppState = {
    ...createEmptyState(),
    profile: {
      displayName: "체험 학습자",
      goalId: GOAL_ID,
      experience: "seen_syntax",
      sessionMinutes: 15,
      createdAt: at,
    },
    diagnosis: {
      responses: [],
      provisionalSkillIds: [],
      skippedAt: at,
    },
    attempts: [
      passedAttempt("demo_att_v", "demo_sess_v", "v-verify", at),
      passedAttempt("demo_att_c", "demo_sess_c", "c-verify", at),
    ],
    progress: [
      { skillId: "v", status: "verified", supportFailures: 0, verifiedAt: at, lastAttemptId: "demo_att_v" },
      { skillId: "c", status: "verified", supportFailures: 0, verifiedAt: at, lastAttemptId: "demo_att_c" },
      { skillId: "l", status: "in_progress", supportFailures: 0 },
      { skillId: "a", status: "unseen", supportFailures: 0 },
      { skillId: "f", status: "unseen", supportFailures: 0 },
      { skillId: "p", status: "unseen", supportFailures: 0 },
    ],
    activeSession: {
      id: "demo_sess_l",
      taskId: "l-base",
      startedAt: at,
      updatedAt: at,
      draft: "",
      hintCount: 0,
      activeSeconds: 60,
      state: "in_progress",
      checkpointSelections: {},
    },
  };
  return withRecommendation(
    seeded,
    pythonFoundations,
    { recommendationId: "demo_rec_1", planChangeId: "demo_plan_1" },
    at,
  );
}

export const DEMO_SAMPLE_WRONG_ANSWER = `total = 0
for i in range(1, 4):
    total = i`;
