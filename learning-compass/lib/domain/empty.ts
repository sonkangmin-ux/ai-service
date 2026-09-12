import { CONTENT_VERSION, SCHEMA_VERSION, type AppState } from "./types";

export function createEmptyState(): AppState {
  return {
    schemaVersion: SCHEMA_VERSION,
    contentVersion: CONTENT_VERSION,
    attempts: [],
    feedbacks: [],
    progress: [],
    planChanges: [],
    events: [],
  };
}
