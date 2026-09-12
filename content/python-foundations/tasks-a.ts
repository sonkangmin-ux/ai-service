import type { Task } from "@/lib/domain/types";
import { checkpoint, makeTask } from "./build";
import { commonRubric } from "./diagnosis";

export const listTasks: Task[] = [
  makeTask({
    skillId: "a",
    kind: "base",
    title: "리스트의 첫 값과 길이 확인하기",
    estimatedMinutes: 15,
    lesson:
      "리스트는 여러 값을 순서대로 담습니다. 첫 값의 인덱스는 0입니다. scores[0]은 첫 점수입니다. len(scores)는 항목 개수입니다. 인덱스와 개수를 혼동하면 마지막 값을 잘못 꺼내게 됩니다. 값을 확인하는 코드를 직접 적어 보세요.",
    example: "scores = [50, 80, 90]\nfirst = scores[0]\ncount = len(scores)",
    answerPrompt: "scores=[50,80,90]의 첫 점수와 길이를 확인하는 코드를 작성해 주세요.",
    completionCriteria: ["scores[0]을 사용한다", "len(scores)를 사용한다"],
    hints: [
      "첫 인덱스는 1이 아니라 0입니다.",
      "항목이 3개이면 길이는 3입니다.",
    ],
    checkpoints: [
      checkpoint(
        "a-base-cp1",
        "scores=[50,80,90]에서 scores[0]은?",
        ["50", "80", "90", "모르겠어요"],
        0,
        "인덱스 0은 첫 값 50입니다.",
      ),
      checkpoint(
        "a-base-cp2",
        "len(scores)는?",
        ["2", "3", "90", "모르겠어요"],
        1,
        "항목이 3개이므로 길이는 3입니다.",
      ),
    ],
    rubric: commonRubric("a-base"),
  }),
  makeTask({
    skillId: "a",
    kind: "remedial",
    title: "인덱스와 값 구분하기",
    estimatedMinutes: 10,
    lesson:
      "인덱스는 위치 번호이고 값은 그 자리에 있는 데이터입니다. [10,20][1]은 위치 1의 값 20입니다. 길이가 3이면 마지막 인덱스는 2입니다. 마지막 인덱스는 길이에서 1을 뺀 값입니다. 위치와 값을 한 표에 적어 보면 구분이 쉬워집니다.",
    example: "items = [10, 20]\nprint(items[1])  # 20",
    answerPrompt: "인덱스와 값의 차이를 [10,20]을 예로 설명해 주세요.",
    completionCriteria: ["위치 1의 값이 20임을 말한다", "길이 3의 마지막 인덱스가 2임을 말한다"],
    hints: [
      "인덱스는 0부터 셉니다.",
      "마지막 인덱스 = 길이 - 1 입니다.",
    ],
    checkpoints: [
      checkpoint(
        "a-remedial-cp1",
        "[10,20][1]의 값은?",
        ["10", "20", "1", "모르겠어요"],
        1,
        "위치 1에는 20이 있습니다.",
      ),
      checkpoint(
        "a-remedial-cp2",
        "길이 3 리스트의 마지막 인덱스는?",
        ["3", "2", "0", "모르겠어요"],
        1,
        "0,1,2가 있으므로 마지막은 2입니다.",
      ),
    ],
    rubric: commonRubric("a-remedial"),
  }),
  makeTask({
    skillId: "a",
    kind: "verify",
    title: "60점 이상 개수 세기",
    estimatedMinutes: 5,
    lesson:
      "리스트를 반복하며 조건에 맞는 항목만 세면 됩니다. 시작 개수는 0입니다. 점수가 60 이상이면 1을 더합니다. [55,65,85]에서는 65와 85 두 개입니다. 빈 리스트의 길이는 0입니다.",
    example: "passed = 0\nfor score in [55, 65, 85]:\n    if score >= 60:\n        passed = passed + 1",
    answerPrompt: "[55,65,85]에서 60 이상 점수 개수를 구하는 코드를 작성해 주세요.",
    completionCriteria: ["반복과 조건이 있다", "개수를 누적한다"],
    hints: [
      "55는 포함하지 않고 65와 85만 셉니다.",
      "빈 리스트는 항목이 없으므로 길이 0입니다.",
    ],
    checkpoints: [
      checkpoint(
        "a-verify-cp1",
        "[55,65,85]에서 60 이상 개수는?",
        ["1", "2", "3", "모르겠어요"],
        1,
        "65와 85 두 개입니다.",
      ),
      checkpoint(
        "a-verify-cp2",
        "len([])의 결과는?",
        ["0", "1", "None", "모르겠어요"],
        0,
        "빈 리스트의 길이는 0입니다.",
      ),
    ],
    rubric: commonRubric("a-verify"),
  }),
];
