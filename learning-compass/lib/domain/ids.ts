export const TRACK_ID = "python-foundations";
export const GOAL_ID = "score-report";
export const SKILL_ORDER = ["v", "c", "l", "a", "f", "p"] as const;
export type SkillId = (typeof SKILL_ORDER)[number];

export const KNOWN_SKILL_IDS = new Set<string>(SKILL_ORDER);
export const TASK_KINDS = ["base", "remedial", "verify"] as const;

export const KNOWN_TASK_IDS = new Set(
  SKILL_ORDER.flatMap((skill) => TASK_KINDS.map((kind) => `${skill}-${kind}`)),
);

export const GUEST_STORAGE_KEY = "learning-compass:guest:v1";
export const DEMO_STORAGE_KEY = "learning-compass:demo:v1";
export const LEGACY_USER_STORAGE_KEY = "learning-compass:user:v1";
export const GUEST_MODE_KEY = "learning-compass:mode";
export const LEGACY_OFFER_KEY = "learning-compass:legacy-offer:v1";

export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
export const MAX_ANSWER_LENGTH = 4000;
export const MAX_GOAL_NOTE = 200;
export const MAX_DISPLAY_NAME = 20;
export const MAX_ATTEMPTS = 400;
export const MAX_EVENTS = 800;
export const MAX_FEEDBACKS = 400;
export const MAX_PLAN_CHANGES = 400;
