import type { Checkpoint, Choice, RubricItem, Task, TaskKind } from "@/lib/domain/types";

export function choices(
  prefix: string,
  items: [string, string, string, string],
  correctIndex: 0 | 1 | 2,
): { choices: Choice[]; correctChoiceId: string } {
  const mapped = items.map((text, index) => ({
    id: `${prefix}-${index}`,
    text,
  }));
  return { choices: mapped, correctChoiceId: mapped[correctIndex].id };
}

export function checkpoint(
  id: string,
  prompt: string,
  items: [string, string, string, string],
  correctIndex: 0 | 1 | 2,
  explanation: string,
): Checkpoint {
  const built = choices(id, items, correctIndex);
  return { id, prompt, ...built, explanation };
}

export function makeTask(input: {
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
}): Task {
  return {
    id: `${input.skillId}-${input.kind}`,
    ...input,
  };
}
