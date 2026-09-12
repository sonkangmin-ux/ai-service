import { pythonFoundations } from "@/content/python-foundations";
import { KNOWN_TASK_IDS } from "./ids";
import type { ContentPack } from "./types";

export function validateContent(content: ContentPack = pythonFoundations): string[] {
  const errors: string[] = [];
  const skillIds = new Set(Object.keys(content.skills));
  const taskIds = new Set(Object.keys(content.tasks));

  for (const skillId of content.track.skillOrder) {
    if (!skillIds.has(skillId)) errors.push(`missing skill ${skillId}`);
  }

  for (const [id, skill] of Object.entries(content.skills)) {
    for (const prereq of skill.prerequisiteIds) {
      if (!skillIds.has(prereq)) errors.push(`unknown prereq ${prereq} on ${id}`);
      if (prereq === id) errors.push(`self prereq on ${id}`);
    }
    for (const taskId of [skill.baseTaskId, skill.remedialTaskId, skill.verifyTaskId]) {
      if (!taskIds.has(taskId)) errors.push(`skill ${id} missing task ${taskId}`);
    }
  }

  if (hasCycle(content)) errors.push("skill DAG has a cycle");

  for (const [taskId, task] of Object.entries(content.tasks)) {
    if (!KNOWN_TASK_IDS.has(taskId)) errors.push(`unexpected task id ${taskId}`);
    if (task.lesson.trim().length < 40) errors.push(`${taskId} lesson too short`);
    if (task.checkpoints.length !== 2) errors.push(`${taskId} needs 2 checkpoints`);
    if (task.hints.length !== 2) errors.push(`${taskId} needs 2 hints`);
    for (const checkpoint of task.checkpoints) {
      const matches = checkpoint.choices.filter((choice) => choice.id === checkpoint.correctChoiceId);
      if (matches.length !== 1) {
        errors.push(`${checkpoint.id} correctChoiceId must match exactly one choice`);
      }
      const texts = checkpoint.choices.map((choice) => choice.text);
      if (new Set(texts).size !== texts.length) {
        errors.push(`${checkpoint.id} choices must be unique`);
      }
    }
  }

  const diagnosisSkills = new Set(content.diagnosis.map((item) => item.skillId));
  if (diagnosisSkills.size !== 5) errors.push("diagnosis should cover 5 concept skills");
  for (const item of content.diagnosis) {
    const matches = item.choices.filter((choice) => choice.id === item.correctChoiceId);
    if (matches.length !== 1) errors.push(`diagnosis ${item.skillId} correctChoiceId mismatch`);
  }
  return errors;
}

function hasCycle(content: ContentPack): boolean {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string): boolean => {
    if (visited.has(id)) return false;
    if (visiting.has(id)) return true;
    visiting.add(id);
    for (const prereq of content.skills[id]?.prerequisiteIds ?? []) {
      if (visit(prereq)) return true;
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  };
  return content.track.skillOrder.some(visit);
}
