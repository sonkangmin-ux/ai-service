import type { Task } from "@/lib/domain/types";
import { checkpoint, makeTask } from "./build";
import { commonRubric } from "./diagnosis";

export const loopTasks: Task[] = [
  makeTask({
    skillId: "l",
    kind: "base",
    title: "반복문으로 합계 구하기",
    estimatedMinutes: 15,
    lesson:
      "for 문은 주어진 값들을 하나씩 꺼내 같은 작업을 반복합니다. range(1, 4)는 1, 2, 3을 만듭니다. 끝 숫자 4는 포함되지 않습니다. 합계를 구하려면 total에 매번 더해야 합니다. total = i처럼 덮어쓰면 마지막 값만 남습니다.",
    example: "total = 0\nfor i in range(1, 4):\n    total = total + i\n# total은 6",
    answerPrompt: "range(1,4)를 반복해 total에 누적하는 코드를 작성하고, 최종 값이 되는 이유를 설명해 주세요.",
    completionCriteria: ["total = total + i 형태의 누적이 있다", "1+2+3=6을 설명한다"],
    hints: [
      "range(1, 4)의 값은 1, 2, 3입니다.",
      "누적하려면 total = total + i 를 사용합니다.",
    ],
    checkpoints: [
      checkpoint(
        "l-base-cp1",
        "range(1, 4)가 만드는 값은?",
        ["1,2,3,4", "1,2,3", "0,1,2,3", "모르겠어요"],
        1,
        "끝 숫자는 포함되지 않으므로 1, 2, 3입니다.",
      ),
      checkpoint(
        "l-base-cp2",
        "1+2+3을 누적한 total은?",
        ["3", "4", "6", "모르겠어요"],
        2,
        "1+2+3=6입니다.",
      ),
    ],
    rubric: commonRubric("l-base"),
  }),
  makeTask({
    skillId: "l",
    kind: "remedial",
    title: "누적과 덮어쓰기 구분하기",
    estimatedMinutes: 10,
    lesson:
      "total = total + i는 이전 합에 i를 더합니다. total = i는 이전 합을 버리고 i로 바꿉니다. [1,2,3]을 순서대로 보면 누적은 0→1→3→6입니다. 덮어쓰기는 마지막 3만 남습니다. 합계 과제에서 결과가 너무 작다면 덮어쓰기를 의심하세요.",
    example: "total = 0\nfor i in [1, 2, 3]:\n    total = i\n# total은 3",
    answerPrompt: "[1,2,3]에서 누적값이 바뀌는 순서를 적고, total=i가 왜 누적이 아닌지 설명해 주세요.",
    completionCriteria: ["0에서 1,2를 더한 중간값을 말한다", "덮어쓰기를 구분한다"],
    hints: [
      "초기 0에 1을 더하면 1, 다시 2를 더하면 3입니다.",
      "total = i는 누적이 아니라 교체입니다.",
    ],
    checkpoints: [
      checkpoint(
        "l-remedial-cp1",
        "초기 0에서 1과 2를 더한 값은?",
        ["1", "2", "3", "모르겠어요"],
        2,
        "0+1+2=3입니다.",
      ),
      checkpoint(
        "l-remedial-cp2",
        "total = i는 어떤 동작인가요?",
        ["누적", "덮어쓰기", "곱셈", "모르겠어요"],
        1,
        "이전 값을 버리고 i로 바꿉니다.",
      ),
    ],
    rubric: commonRubric("l-remedial"),
  }),
  makeTask({
    skillId: "l",
    kind: "verify",
    title: "range로 합계 다시 확인하기",
    estimatedMinutes: 5,
    lesson:
      "range(1, 5)는 1부터 4까지입니다. 합은 10입니다. range(4)는 0,1,2,3 네 번 반복합니다. 반복 횟수와 합계는 다른 질문입니다. 코드를 쓸 때는 시작값, 끝값, 누적 식을 한 줄씩 점검하세요.",
    example: "total = 0\nfor i in range(1, 5):\n    total = total + i",
    answerPrompt: "range(1,5)를 더하는 코드와 최종 합이 되는 이유를 적어 주세요.",
    completionCriteria: ["1부터 4까지 더한다", "합이 10임을 설명한다"],
    hints: [
      "1+2+3+4=10입니다.",
      "range(4)는 네 번 반복하지만 값은 0부터 시작합니다.",
    ],
    checkpoints: [
      checkpoint(
        "l-verify-cp1",
        "1부터 4까지 더한 total은?",
        ["6", "10", "15", "모르겠어요"],
        1,
        "1+2+3+4=10입니다.",
      ),
      checkpoint(
        "l-verify-cp2",
        "range(4)의 반복 횟수는?",
        ["3", "4", "5", "모르겠어요"],
        1,
        "0,1,2,3이므로 4번입니다.",
      ),
    ],
    rubric: commonRubric("l-verify"),
  }),
];
