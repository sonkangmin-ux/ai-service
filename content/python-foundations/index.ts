import { GOAL_ID, TRACK_ID } from "@/lib/domain/ids";
import type { ContentPack, Skill } from "@/lib/domain/types";
import { diagnosisItems } from "./diagnosis";
import { listTasks } from "./tasks-a";
import { conditionTasks } from "./tasks-c";
import { functionTasks } from "./tasks-f";
import { loopTasks } from "./tasks-l";
import { projectTasks } from "./tasks-p";
import { variableTasks } from "./tasks-v";

const skills: Skill[] = [
  { id: "v", trackId: TRACK_ID, title: "변수·자료형", prerequisiteIds: [], baseTaskId: "v-base", remedialTaskId: "v-remedial", verifyTaskId: "v-verify" },
  { id: "c", trackId: TRACK_ID, title: "조건문", prerequisiteIds: ["v"], baseTaskId: "c-base", remedialTaskId: "c-remedial", verifyTaskId: "c-verify" },
  { id: "l", trackId: TRACK_ID, title: "반복·누적", prerequisiteIds: ["c"], baseTaskId: "l-base", remedialTaskId: "l-remedial", verifyTaskId: "l-verify" },
  { id: "a", trackId: TRACK_ID, title: "리스트", prerequisiteIds: ["l"], baseTaskId: "a-base", remedialTaskId: "a-remedial", verifyTaskId: "a-verify" },
  { id: "f", trackId: TRACK_ID, title: "함수·반환", prerequisiteIds: ["a"], baseTaskId: "f-base", remedialTaskId: "f-remedial", verifyTaskId: "f-verify" },
  { id: "p", trackId: TRACK_ID, title: "종합 과제", prerequisiteIds: ["f"], baseTaskId: "p-base", remedialTaskId: "p-remedial", verifyTaskId: "p-verify" },
];

const tasks = [...variableTasks, ...conditionTasks, ...loopTasks, ...listTasks, ...functionTasks, ...projectTasks];

export const pythonFoundations: ContentPack = {
  version: "1.0",
  track: {
    id: TRACK_ID,
    title: "Python 입문",
    goalIds: [GOAL_ID],
    skillOrder: ["v", "c", "l", "a", "f", "p"],
  },
  goals: {
    [GOAL_ID]: {
      id: GOAL_ID,
      trackId: TRACK_ID,
      title: "점수 목록에서 합격자 수와 평균을 계산하는 함수 만들기",
      description: "변수, 조건, 반복, 리스트, 함수를 이어서 연습하고 summarize_scores를 완성합니다. 기간은 보장하지 않으며 7회 내외의 짧은 세션을 기본 안내로 둡니다.",
      targetSkillIds: ["v", "c", "l", "a", "f", "p"],
      finalTaskId: "p-base",
    },
  },
  skills: Object.fromEntries(skills.map((skill) => [skill.id, skill])),
  tasks: Object.fromEntries(tasks.map((task) => [task.id, task])),
  diagnosis: diagnosisItems,
};

export function getContent(): ContentPack {
  return pythonFoundations;
}
