export const SCHEMA_VERSION = 1;
export const CONTENT_VERSION = "1.0" as const;

export type TaskKind = "base" | "remedial" | "verify";
export type Experience = "first" | "seen_syntax" | "wrote_code";
export type SessionMinutes = 15 | 30 | 45;
export type SessionState =
  | "ready"
  | "in_progress"
  | "paused"
  | "awaiting_feedback"
  | "checkpoint"
  | "result";
export type AttemptOutcome = "passed" | "failed" | "blocked";
export type FeedbackSource = "live" | "demo" | "fallback";
export type SuggestedSupport = "concept" | "example" | "practice" | "none";
export type SkillStatus =
  | "unseen"
  | "provisional"
  | "in_progress"
  | "needs_support"
  | "verified";
export type BlockReason = "concept" | "error" | "time" | "other";
export type EventType =
  | "recommendation_viewed"
  | "task_started"
  | "feedback_requested"
  | "attempt_submitted";
export type ReasonCode =
  | "INITIAL_BASE"
  | "DIAGNOSIS_VERIFY"
  | "RESUME"
  | "CHECKPOINT_SUPPORT"
  | "SUPPORT_RECHECK"
  | "PREREQUISITE_COMPLETE"
  | "COURSE_COMPLETE"
  | "STUCK_SUPPORT"
  | "REVIEW_OPTIONAL";

export type Choice = { id: string; text: string };

export type Checkpoint = {
  id: string;
  prompt: string;
  choices: Choice[];
  correctChoiceId: string;
  explanation: string;
};

export type RubricItem = { id: string; description: string };

export type Track = {
  id: string;
  title: string;
  goalIds: string[];
  skillOrder: string[];
};

export type Goal = {
  id: string;
  trackId: string;
  title: string;
  description: string;
  targetSkillIds: string[];
  finalTaskId: string;
};

export type Skill = {
  id: string;
  trackId: string;
  title: string;
  prerequisiteIds: string[];
  baseTaskId: string;
  remedialTaskId: string;
  verifyTaskId: string;
};

export type Task = {
  id: string;
  skillId: string;
  kind: TaskKind;
  title: string;
  estimatedMinutes: number;
  lesson: string;
  example: string;
  answerPrompt: string;
  completionCriteria: string[];
  hints: [string, string];
  checkpoints: [Checkpoint, Checkpoint];
  rubric: RubricItem[];
};

export type DiagnosisItem = {
  skillId: string;
  prompt: string;
  code?: string;
  choices: Choice[];
  correctChoiceId: string;
};

export type ContentPack = {
  version: typeof CONTENT_VERSION;
  track: Track;
  goals: Record<string, Goal>;
  skills: Record<string, Skill>;
  tasks: Record<string, Task>;
  diagnosis: DiagnosisItem[];
};

export type Profile = {
  displayName?: string;
  goalId: string;
  goalNote?: string;
  experience: Experience;
  sessionMinutes: SessionMinutes;
  createdAt: string;
};

export type Diagnosis = {
  responses: { skillId: string; choiceId: string }[];
  provisionalSkillIds: string[];
  completedAt?: string;
  skippedAt?: string;
};

export type TaskSession = {
  id: string;
  taskId: string;
  startedAt: string;
  updatedAt: string;
  draft: string;
  hintCount: number;
  activeSeconds: number;
  state: SessionState;
  checkpointSelections: Record<string, string>;
  latestFeedbackId?: string;
};

export type CheckpointResult = {
  checkpointId: string;
  choiceId: string;
  correct: boolean;
};

export type Attempt = {
  id: string;
  sessionId: string;
  taskId: string;
  submittedAt: string;
  outcome: AttemptOutcome;
  answerText: string;
  checkpointResults: CheckpointResult[];
  hintCount: number;
  activeSeconds: number;
  blockReason?: BlockReason;
  feedbackId?: string;
};

export type FeedbackIssue = {
  criterionId: string;
  observation: string;
  evidenceQuote: string;
};

export type Feedback = {
  id: string;
  sessionId: string;
  answerHash: string;
  source: FeedbackSource;
  summary: string;
  strengths: string[];
  issues: FeedbackIssue[];
  nextHint: string;
  suggestedSupport: SuggestedSupport;
  limitations: string[];
  createdAt: string;
};

export type SkillProgress = {
  skillId: string;
  status: SkillStatus;
  supportFailures: number;
  verifiedAt?: string;
  lastAttemptId?: string;
};

export type Recommendation = {
  id: string;
  taskId: string | null;
  reasonCode: ReasonCode;
  reasonText: string;
  basedOnAttemptIds: string[];
  createdAt: string;
};

export type PlanChange = {
  id: string;
  previousTaskId?: string;
  nextTaskId?: string;
  reasonCode: ReasonCode;
  explanation: string;
  attemptId?: string;
  createdAt: string;
};

export type AppEvent = {
  id: string;
  type: EventType;
  sessionId?: string;
  taskId?: string;
  at: string;
};

export type AppState = {
  schemaVersion: number;
  contentVersion: typeof CONTENT_VERSION;
  profile?: Profile;
  diagnosis?: Diagnosis;
  activeSession?: TaskSession;
  attempts: Attempt[];
  feedbacks: Feedback[];
  progress: SkillProgress[];
  recommendation?: Recommendation;
  planChanges: PlanChange[];
  events: AppEvent[];
};

export type RecommendationResult = {
  taskId: string | null;
  reasonCode: ReasonCode;
  reasonText: string;
  basedOnAttemptIds: string[];
};
