import type { Task } from "@/lib/domain/types";
import { checkpoint, makeTask } from "./build";
import { commonRubric } from "./diagnosis";

export const conditionTasks: Task[] = [
  makeTask({
    skillId: "c",
    kind: "base",
    title: "60점 이상을 합격으로 분류하기",
    estimatedMinutes: 15,
    lesson:
      "조건문은 비교 결과가 True일 때만 한 갈래를 실행합니다. >= 는 기준값과 같아도 True입니다. 점수를 합격/불합격으로 나누려면 if score >= 60과 같은 비교가 필요합니다. 비교 결과는 True 또는 False입니다. 문장을 읽을 때는 '이상'이 같은 값을 포함하는지 먼저 확인하세요.",
    example: "score = 72\nif score >= 60:\n    result = '합격'\nelse:\n    result = '불합격'",
    answerPrompt: "점수가 60 이상이면 합격으로 분류하는 조건문을 작성하고, 60점을 어떻게 다루는지 설명해 주세요.",
    completionCriteria: [">= 60 비교가 있다", "60점을 합격으로 분류한다고 설명한다"],
    hints: [
      "이상이므로 > 가 아니라 >= 를 사용합니다.",
      "60 >= 60은 True입니다.",
    ],
    checkpoints: [
      checkpoint(
        "c-base-cp1",
        "59 >= 60의 결과는?",
        ["True", "False", "오류", "모르겠어요"],
        1,
        "59는 60보다 작으므로 False입니다.",
      ),
      checkpoint(
        "c-base-cp2",
        "60 >= 60의 결과는?",
        ["True", "False", "오류", "모르겠어요"],
        0,
        "같은 값도 이상이므로 True입니다.",
      ),
    ],
    rubric: commonRubric("c-base"),
  }),
  makeTask({
    skillId: "c",
    kind: "remedial",
    title: ">와 >=의 차이 확인하기",
    estimatedMinutes: 10,
    lesson:
      "> 는 기준보다 클 때만 True입니다. >= 는 같을 때도 True입니다. 경계값 60을 넣어서 두 비교를 나란히 보면 차이가 드러납니다. 문제에서 '이상'이라고 하면 같은 값을 포함해야 합니다. '초과'라고 하면 같은 값은 포함하지 않습니다.",
    example: "print(60 > 60)   # False\nprint(60 >= 60)  # True",
    answerPrompt: ">와 >=의 차이를 60점을 예로 들어 설명해 주세요.",
    completionCriteria: ["60 > 60이 False임을 말한다", "60 >= 60이 True임을 말한다"],
    hints: [
      "경계값 60을 두 비교에 모두 넣어 보세요.",
      "61은 두 비교 모두 True가 됩니다.",
    ],
    checkpoints: [
      checkpoint(
        "c-remedial-cp1",
        "60 > 60의 결과는?",
        ["True", "False", "오류", "모르겠어요"],
        1,
        "같은 값은 크기만 비교하면 False입니다.",
      ),
      checkpoint(
        "c-remedial-cp2",
        "61 >= 60의 결과는?",
        ["True", "False", "오류", "모르겠어요"],
        0,
        "61은 60보다 크므로 True입니다.",
      ),
    ],
    rubric: commonRubric("c-remedial"),
  }),
  makeTask({
    skillId: "c",
    kind: "verify",
    title: "우수와 보통을 나누는 조건",
    estimatedMinutes: 5,
    lesson:
      "80점 이상을 우수로 두려면 score >= 80을 사용합니다. 그 외는 else에서 보통으로 두면 됩니다. 79는 80보다 작으므로 보통입니다. 80은 이상이므로 우수입니다. 경계값을 표로 적어 보면 조건이 맞는지 바로 확인할 수 있습니다.",
    example: "if score >= 80:\n    grade = '우수'\nelse:\n    grade = '보통'",
    answerPrompt: "80 이상이면 우수, 그 외는 보통으로 분류하는 조건문을 작성해 주세요.",
    completionCriteria: [">= 80 조건이 있다", "else로 보통을 처리한다"],
    hints: [
      "79는 80 이상이 아니므로 보통입니다.",
      "80은 이상이므로 우수입니다.",
    ],
    checkpoints: [
      checkpoint(
        "c-verify-cp1",
        "79점은 어느 분류인가요?",
        ["우수", "보통", "오류", "모르겠어요"],
        1,
        "79 < 80이므로 보통입니다.",
      ),
      checkpoint(
        "c-verify-cp2",
        "80점은 어느 분류인가요?",
        ["우수", "보통", "오류", "모르겠어요"],
        0,
        "80 >= 80이므로 우수입니다.",
      ),
    ],
    rubric: commonRubric("c-verify"),
  }),
];
