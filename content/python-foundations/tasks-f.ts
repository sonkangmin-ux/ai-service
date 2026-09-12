import type { Task } from "@/lib/domain/types";
import { checkpoint, makeTask } from "./build";
import { commonRubric } from "./diagnosis";

export const functionTasks: Task[] = [
  makeTask({
    skillId: "f",
    kind: "base",
    title: "두 수를 더해 반환하는 함수",
    estimatedMinutes: 15,
    lesson:
      "함수는 이름을 붙여 둔 코드 묶음입니다. def로 만들고 return으로 값을 돌려줍니다. add(a, b)는 두 입력을 받아 합을 반환하면 됩니다. 반환된 값은 호출한 곳에 다시 나타납니다. print는 화면에 보여 줄 뿐 값이 되지는 않습니다.",
    example: "def add(a, b):\n    return a + b\n\nadd(2, 5)  # 7",
    answerPrompt: "두 수를 더해 반환하는 add(a,b)를 작성해 주세요.",
    completionCriteria: ["def add(a, b)가 있다", "return a + b가 있다"],
    hints: [
      "함수 안에서 print만 하면 호출 결과는 None입니다.",
      "return은 호출자에게 값을 전달합니다.",
    ],
    checkpoints: [
      checkpoint(
        "f-base-cp1",
        "add(2,5)의 반환값은?",
        ["25", "7", "None", "모르겠어요"],
        1,
        "2+5=7입니다.",
      ),
      checkpoint(
        "f-base-cp2",
        "return의 역할은?",
        ["화면 출력", "호출자에게 값 전달", "변수 삭제", "모르겠어요"],
        1,
        "return은 호출한 쪽으로 값을 돌려줍니다.",
      ),
    ],
    rubric: commonRubric("f-base"),
  }),
  makeTask({
    skillId: "f",
    kind: "remedial",
    title: "print와 return 구분하기",
    estimatedMinutes: 10,
    lesson:
      "print는 사람이 읽도록 출력합니다. return은 프로그램이 이어 쓰도록 값을 전달합니다. return이 없으면 함수 결과는 None입니다. plus(x)가 x+1을 반환하면 plus(3)은 4입니다. 결과를 다시 계산에 쓰려면 return이 필요합니다.",
    example: "def show(x):\n    print(x)\n\nresult = show(3)\n# 화면에는 3, result는 None",
    answerPrompt: "print와 return의 차이를 짧은 예와 함께 설명해 주세요.",
    completionCriteria: ["return 없는 함수가 None임을 말한다", "return 예를 포함한다"],
    hints: [
      "출력과 반환은 다른 동작입니다.",
      "def plus(x): return x+1 이면 plus(3)은 4입니다.",
    ],
    checkpoints: [
      checkpoint(
        "f-remedial-cp1",
        "return이 없는 함수의 반환값은?",
        ["0", "None", "오류", "모르겠어요"],
        1,
        "명시적으로 돌려주지 않으면 None입니다.",
      ),
      checkpoint(
        "f-remedial-cp2",
        "def plus(x): return x+1 일 때 plus(3)은?",
        ["3", "4", "None", "모르겠어요"],
        1,
        "3+1=4를 반환합니다.",
      ),
    ],
    rubric: commonRubric("f-remedial"),
  }),
  makeTask({
    skillId: "f",
    kind: "verify",
    title: "합격 여부를 반환하는 함수",
    estimatedMinutes: 5,
    lesson:
      "is_pass(score)는 점수가 60 이상이면 True, 아니면 False를 반환합니다. 비교식 자체를 return하면 됩니다. 60은 합격이고 59는 불합격입니다. 함수 이름을 보면 결과가 True/False여야 한다는 힌트를 얻을 수 있습니다.",
    example: "def is_pass(score):\n    return score >= 60",
    answerPrompt: "합격 여부를 반환하는 is_pass(score)를 작성해 주세요.",
    completionCriteria: ["비교 결과를 return한다", "60 이상을 True로 둔다"],
    hints: [
      "return score >= 60 한 줄로 충분합니다.",
      "59는 False, 60은 True입니다.",
    ],
    checkpoints: [
      checkpoint(
        "f-verify-cp1",
        "is_pass(60)의 결과는?",
        ["True", "False", "60", "모르겠어요"],
        0,
        "60 이상이므로 True입니다.",
      ),
      checkpoint(
        "f-verify-cp2",
        "is_pass(59)의 결과는?",
        ["True", "False", "59", "모르겠어요"],
        1,
        "59는 60 미만이므로 False입니다.",
      ),
    ],
    rubric: commonRubric("f-verify"),
  }),
];
