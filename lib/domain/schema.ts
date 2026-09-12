import { z } from "zod";
import {
  CONTENT_VERSION,
  SCHEMA_VERSION,
  type AppState,
  type Feedback,
} from "./types";
import {
  GOAL_ID,
  KNOWN_SKILL_IDS,
  KNOWN_TASK_IDS,
  MAX_ANSWER_LENGTH,
  MAX_ATTEMPTS,
  MAX_DISPLAY_NAME,
  MAX_EVENTS,
  MAX_FEEDBACKS,
  MAX_GOAL_NOTE,
  MAX_PLAN_CHANGES,
} from "./ids";

const iso = z.string().min(1).max(40);
const id = z.string().min(1).max(80);
const skillId = z.string().refine((value) => KNOWN_SKILL_IDS.has(value), "unknown skill");
const taskId = z.string().refine((value) => KNOWN_TASK_IDS.has(value), "unknown task");
const optionalTaskId = z.union([taskId, z.null()]);

export const profileSchema = z.object({
  displayName: z.string().min(1).max(MAX_DISPLAY_NAME).optional(),
  goalId: z.literal(GOAL_ID),
  goalNote: z.string().max(MAX_GOAL_NOTE).optional(),
  experience: z.enum(["first", "seen_syntax", "wrote_code"]),
  sessionMinutes: z.union([z.literal(15), z.literal(30), z.literal(45)]),
  createdAt: iso,
});

export const diagnosisSchema = z.object({
  responses: z
    .array(z.object({ skillId, choiceId: z.string().min(1).max(80) }))
    .max(8),
  provisionalSkillIds: z.array(skillId).max(8),
  completedAt: iso.optional(),
  skippedAt: iso.optional(),
});

export const taskSessionSchema = z.object({
  id,
  taskId,
  startedAt: iso,
  updatedAt: iso,
  draft: z.string().max(MAX_ANSWER_LENGTH),
  hintCount: z.number().int().min(0).max(2),
  activeSeconds: z.number().int().min(0).max(60 * 60 * 24 * 30),
  state: z.enum([
    "ready",
    "in_progress",
    "paused",
    "awaiting_feedback",
    "checkpoint",
    "result",
  ]),
  checkpointSelections: z.record(z.string(), z.string().max(80)).default({}),
  latestFeedbackId: z.string().max(80).optional(),
});

export const attemptSchema = z.object({
  id,
  sessionId: id,
  taskId,
  submittedAt: iso,
  outcome: z.enum(["passed", "failed", "blocked"]),
  answerText: z.string().max(MAX_ANSWER_LENGTH),
  checkpointResults: z
    .array(
      z.object({
        checkpointId: z.string().min(1).max(80),
        choiceId: z.string().min(1).max(80),
        correct: z.boolean(),
      }),
    )
    .max(4),
  hintCount: z.number().int().min(0).max(2),
  activeSeconds: z.number().int().min(0).max(60 * 60 * 24 * 30),
  blockReason: z.enum(["concept", "error", "time", "other"]).optional(),
  feedbackId: z.string().max(80).optional(),
});

export const feedbackSchema = z.object({
  id,
  sessionId: id,
  answerHash: z.string().min(1).max(128),
  source: z.enum(["live", "demo", "fallback"]),
  summary: z.string().max(300),
  strengths: z.array(z.string().max(300)).max(2),
  issues: z
    .array(
      z.object({
        criterionId: z.string().min(1).max(80),
        observation: z.string().max(400),
        evidenceQuote: z.string().max(400),
      }),
    )
    .max(3),
  nextHint: z.string().max(300),
  suggestedSupport: z.enum(["concept", "example", "practice", "none"]),
  limitations: z.array(z.string().max(300)).max(6),
  createdAt: iso,
});

export const modelFeedbackSchema = z.object({
  summary: z.string().min(1).max(300),
  strengths: z.array(z.string().max(300)).max(2),
  issues: z
    .array(
      z.object({
        criterionId: z.string().min(1).max(80),
        observation: z.string().max(400),
        evidenceQuote: z.string().max(400),
      }),
    )
    .max(3),
  nextHint: z.string().max(300),
  suggestedSupport: z.enum(["concept", "example", "practice", "none"]),
  limitations: z.array(z.string().max(300)).max(6),
});

export const skillProgressSchema = z.object({
  skillId,
  status: z.enum([
    "unseen",
    "provisional",
    "in_progress",
    "needs_support",
    "verified",
  ]),
  supportFailures: z.number().int().min(0).max(20),
  verifiedAt: iso.optional(),
  lastAttemptId: z.string().max(80).optional(),
});

export const recommendationSchema = z.object({
  id,
  taskId: optionalTaskId,
  reasonCode: z.enum([
    "INITIAL_BASE",
    "DIAGNOSIS_VERIFY",
    "RESUME",
    "CHECKPOINT_SUPPORT",
    "SUPPORT_RECHECK",
    "PREREQUISITE_COMPLETE",
    "COURSE_COMPLETE",
    "STUCK_SUPPORT",
    "REVIEW_OPTIONAL",
  ]),
  reasonText: z.string().min(1).max(400),
  basedOnAttemptIds: z.array(z.string().max(80)).max(20),
  createdAt: iso,
});

export const planChangeSchema = z.object({
  id,
  previousTaskId: taskId.optional(),
  nextTaskId: taskId.optional(),
  reasonCode: recommendationSchema.shape.reasonCode,
  explanation: z.string().min(1).max(400),
  attemptId: z.string().max(80).optional(),
  createdAt: iso,
});

export const eventSchema = z.object({
  id,
  type: z.enum([
    "recommendation_viewed",
    "task_started",
    "feedback_requested",
    "attempt_submitted",
  ]),
  sessionId: z.string().max(80).optional(),
  taskId: taskId.optional(),
  at: iso,
});

export const appStateSchema = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    contentVersion: z.literal(CONTENT_VERSION),
    profile: profileSchema.optional(),
    diagnosis: diagnosisSchema.optional(),
    activeSession: taskSessionSchema.optional(),
    attempts: z.array(attemptSchema).max(MAX_ATTEMPTS),
    feedbacks: z.array(feedbackSchema).max(MAX_FEEDBACKS),
    progress: z.array(skillProgressSchema).max(12),
    recommendation: recommendationSchema.optional(),
    planChanges: z.array(planChangeSchema).max(MAX_PLAN_CHANGES),
    events: z.array(eventSchema).max(MAX_EVENTS),
  })
  .superRefine((state, ctx) => {
    if (state.recommendation?.taskId === null && state.recommendation.reasonCode !== "COURSE_COMPLETE") {
      ctx.addIssue({
        code: "custom",
        message: "null taskId is allowed only for COURSE_COMPLETE",
        path: ["recommendation", "taskId"],
      });
    }
  });

export const signupSchema = z
  .object({
    displayName: z.string().trim().min(2, "표시 이름은 2~20자로 입력해 주세요.").max(MAX_DISPLAY_NAME, "표시 이름은 2~20자로 입력해 주세요."),
    email: z.email("이메일 형식을 확인해 주세요.").max(254),
    password: z.string().min(12, "비밀번호는 12~128자여야 합니다.").max(128, "비밀번호는 12~128자여야 합니다."),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.email("이메일 형식을 확인해 주세요.").max(254),
  password: z.string().min(1, "비밀번호를 입력해 주세요.").max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.email("이메일 형식을 확인해 주세요.").max(254),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(12, "비밀번호는 12~128자여야 합니다.").max(128),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
  });

export const feedbackRequestSchema = z.object({
  requestId: z.string().min(8).max(80),
  sessionId: z.string().min(1).max(80),
  taskId,
  answerText: z.string().min(1).max(MAX_ANSWER_LENGTH),
  hintCount: z.number().int().min(0).max(2),
  question: z.string().max(500).optional(),
  mode: z.enum(["user", "demo"]),
});

export const learningStatePutSchema = z.object({
  expectedRevision: z.number().int().min(-1),
  payload: appStateSchema,
  mutationId: z.string().min(8).max(80),
});

export function parseAppState(input: unknown): { ok: true; data: AppState } | { ok: false; message: string } {
  const parsed = appStateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "형식이 올바르지 않습니다." };
  }
  return { ok: true, data: parsed.data };
}

export function parseModelFeedback(input: unknown): { ok: true; data: z.infer<typeof modelFeedbackSchema> } | { ok: false; message: string } {
  const parsed = modelFeedbackSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "모델 응답이 스키마와 다릅니다." };
  }
  return { ok: true, data: parsed.data };
}

export type ModelFeedback = z.infer<typeof modelFeedbackSchema>;
export type FeedbackDto = Feedback;
