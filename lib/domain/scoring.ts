import type { Checkpoint, CheckpointResult, ContentPack, DiagnosisItem } from "./types";

export function scoreCheckpoint(
  checkpoint: Checkpoint,
  choiceId: string | undefined,
): CheckpointResult {
  return {
    checkpointId: checkpoint.id,
    choiceId: choiceId ?? "",
    correct: Boolean(choiceId) && choiceId === checkpoint.correctChoiceId,
  };
}

export function allCheckpointsCorrect(results: CheckpointResult[]): boolean {
  return results.length === 2 && results.every((result) => result.correct);
}

export function diagnosisCorrect(
  item: DiagnosisItem,
  choiceId: string,
): boolean {
  return choiceId === item.correctChoiceId;
}

export function getTaskCheckpoints(content: ContentPack, taskId: string) {
  const task = content.tasks[taskId];
  if (!task) return null;
  return task.checkpoints;
}
