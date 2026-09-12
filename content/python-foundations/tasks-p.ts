import type { Task } from "@/lib/domain/types";
import { checkpoint, makeTask } from "./build";
import { commonRubric } from "./diagnosis";

const dictA = "{'count': 3, 'passed': 2, 'average': 70.0}";
const dictEmpty = "{'count': 0, 'passed': 0, 'average': 0}";
const dictSingle = "{'count': 1, 'passed': 1, 'average': 60.0}";
const dictMix = "{'count': 2, 'passed': 1, 'average': 50.0}";
const dictThree = "{'count': 3, 'passed': 2, 'average': 60.0}";

export const projectTasks: Task[] = [
  makeTask({
    skillId: "p",
    kind: "base",
    title: "점수 요약 함수 만들기",
    estimatedMinutes: 30,
    lesson:
      "summarize_scores(scores)는 점수 리스트를 받아 개수, 합격 수, 평균을 담은 딕셔너리를 반환합니다. 합격은 60 이상입니다. 빈 리스트의 평균은 0으로 두어 0으로 나누지 않습니다. 점수는 이미 0~100의 유효한 숫자라고 가정합니다. 이 앱은 코드를 실행하지 않으므로, 확인문제는 반환값 형태를 점검할 뿐 실행 통과를 뜻하지 않습니다.",
    example:
      "def summarize_scores(scores):\n    count = len(scores)\n    if count == 0:\n        return {'count': 0, 'passed': 0, 'average': 0}\n    passed = 0\n    total = 0\n    for score in scores:\n        total = total + score\n        if score >= 60:\n            passed = passed + 1\n    return {'count': count, 'passed': passed, 'average': total / count}",
    answerPrompt:
      "summarize_scores(scores)를 작성하세요. 반환형은 {'count': 전체 개수, 'passed': 60 이상 개수, 'average': 평균}입니다. 15분 세션이면 초안을 저장한 뒤 이어서 작성해도 됩니다.",
    completionCriteria: [
      "빈 리스트에서 평균 0을 반환한다",
      "count, passed, average 키를 반환한다",
    ],
    hints: [
      "[50,70,90]은 count 3, passed 2, average 70.0입니다.",
      "빈 리스트는 나눗셈 전에 길이 0을 확인하세요.",
    ],
    checkpoints: [
      checkpoint(
        "p-base-cp1",
        "summarize_scores([50,70,90])의 결과는?",
        [dictA, "{'count': 3, 'passed': 3, 'average': 70.0}", "{'count': 2, 'passed': 2, 'average': 70.0}", "모르겠어요"],
        0,
        "세 개 중 60 이상은 70과 90 두 개이고 평균은 70.0입니다. 이 확인은 코드 실행 통과를 뜻하지 않습니다.",
      ),
      checkpoint(
        "p-base-cp2",
        "summarize_scores([])의 결과는?",
        [dictEmpty, "{'count': 0, 'passed': 0, 'average': None}", "{'count': 0, 'passed': 0, 'average': 0.0}", "모르겠어요"],
        0,
        "빈 리스트는 count 0, passed 0, average 0입니다.",
      ),
    ],
    rubric: commonRubric("p-base"),
  }),
  makeTask({
    skillId: "p",
    kind: "remedial",
    title: "빈 리스트와 합격 개수 나누어 보기",
    estimatedMinutes: 15,
    lesson:
      "평균을 구하기 전에 길이가 0인지 확인하지 않으면 0으로 나누게 됩니다. 합격 개수는 평균과 별도로 조건을 세면 됩니다. [60]은 한 개이고 합격이며 평균 60.0입니다. [0,100]은 두 개 중 합격 한 개, 평균 50.0입니다. 두 계산을 한 번에 섞지 말고 순서대로 적으세요.",
    example:
      "count = len(scores)\nif count == 0:\n    average = 0\nelse:\n    average = sum(scores) / count",
    answerPrompt: "빈 리스트에서 0으로 나누지 않는 방법과, 합격 개수를 세는 방법을 따로 설명해 주세요.",
    completionCriteria: ["길이 0이면 평균 0", "60 이상만 센다"],
    hints: [
      "[60]은 count 1, passed 1, average 60.0입니다.",
      "[0,100]은 평균 50.0이고 합격은 100 한 개입니다.",
    ],
    checkpoints: [
      checkpoint(
        "p-remedial-cp1",
        "summarize_scores([60])의 결과는?",
        [dictSingle, "{'count': 1, 'passed': 0, 'average': 60.0}", dictEmpty, "모르겠어요"],
        0,
        "한 개이고 60 이상이므로 합격 1, 평균 60.0입니다.",
      ),
      checkpoint(
        "p-remedial-cp2",
        "summarize_scores([0,100])의 결과는?",
        [dictMix, "{'count': 2, 'passed': 2, 'average': 50.0}", "{'count': 2, 'passed': 1, 'average': 100.0}", "모르겠어요"],
        0,
        "두 개 중 100만 합격이고 평균은 50.0입니다.",
      ),
    ],
    rubric: commonRubric("p-remedial"),
  }),
  makeTask({
    skillId: "p",
    kind: "verify",
    title: "요약 함수 다시 확인하기",
    estimatedMinutes: 10,
    lesson:
      "같은 규칙을 다른 입력으로 확인합니다. [30,60,90]은 세 개, 합격은 60과 90, 평균은 60.0입니다. 빈 리스트는 여전히 count 0, passed 0, average 0입니다. 함수가 같은 키를 항상 반환하는지 확인하세요. AI 검토와 확인문제, 직접 실행 확인은 서로 다른 증거입니다.",
    example: "summarize_scores([30, 60, 90])\nsummarize_scores([])",
    answerPrompt: "종합 함수가 [30,60,90]과 빈 리스트에서 어떤 딕셔너리를 반환해야 하는지 코드 또는 설명으로 적어 주세요.",
    completionCriteria: ["[30,60,90]의 반환을 맞춘다", "빈 리스트 반환을 맞춘다"],
    hints: [
      "30+60+90=180, 180/3=60.0입니다.",
      "빈 리스트 평균을 0으로 유지하세요.",
    ],
    checkpoints: [
      checkpoint(
        "p-verify-cp1",
        "summarize_scores([30,60,90])의 결과는?",
        [dictThree, dictA, "{'count': 3, 'passed': 3, 'average': 60.0}", "모르겠어요"],
        0,
        "합격은 60과 90 두 개이고 평균은 60.0입니다.",
      ),
      checkpoint(
        "p-verify-cp2",
        "summarize_scores([])의 결과는?",
        [dictEmpty, dictSingle, "{'count': 0, 'passed': 0, 'average': None}", "모르겠어요"],
        0,
        "빈 리스트는 count 0, passed 0, average 0입니다.",
      ),
    ],
    rubric: commonRubric("p-verify"),
  }),
];
