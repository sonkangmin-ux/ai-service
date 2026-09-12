import type { Task } from "@/lib/domain/types";
import { checkpoint, makeTask } from "./build";
import { commonRubric } from "./diagnosis";

export const variableTasks: Task[] = [
  makeTask({
    skillId: "v",
    kind: "base",
    title: "가격과 수량으로 총액 구하기",
    estimatedMinutes: 15,
    lesson:
      "변수는 값을 이름에 담아 두고 나중에 쓰는 상자입니다. 같은 이름에 새 값을 넣으면 이전 값은 바뀝니다. 숫자끼리 더하거나 곱하면 계산 결과가 나오고, 그 결과를 다른 변수에 저장할 수 있습니다. 문자열은 따옴표로 감싼 글자이며 숫자와 바로 더할 수 없습니다. 이번 과제에서는 가격과 수량을 변수에 담고 총액을 식으로 표현합니다.",
    example: "price = 500\ncount = 2\ntotal = price * count\n# total은 1000",
    answerPrompt: "price=1200, count=3일 때 총액을 구하는 식과, 그 식이 의미하는 바를 설명해 주세요.",
    completionCriteria: [
      "price와 count를 사용한 곱셈 식이 있다",
      "총액이 3600이 되는 이유를 설명한다",
    ],
    hints: [
      "총액은 한 개 가격에 개수를 곱하면 됩니다.",
      "1200 * 3을 계산하면 3600입니다. 이 식을 변수 이름으로 적어 보세요.",
    ],
    checkpoints: [
      checkpoint(
        "v-base-cp1",
        "1200 * 3의 결과는?",
        ["3600", "1203", "1500", "모르겠어요"],
        0,
        "가격에 수량을 곱하면 1200 * 3 = 3600입니다.",
      ),
      checkpoint(
        "v-base-cp2",
        "int('12') + 3의 결과는?",
        ["123", "15", "'123'", "모르겠어요"],
        1,
        "int('12')는 숫자 12가 되므로 12 + 3 = 15입니다. 문자열과 숫자를 바로 더하면 오류가 납니다.",
      ),
    ],
    rubric: commonRubric("v-base"),
  }),
  makeTask({
    skillId: "v",
    kind: "remedial",
    title: "문자열 '7'과 숫자 7 구분하기",
    estimatedMinutes: 10,
    lesson:
      "따옴표로 감싼 '7'은 글자이고, 따옴표 없는 7은 숫자입니다. 글자끼리 더하면 이어 붙고, 숫자끼리 더하면 계산됩니다. 글자를 숫자로 바꾸려면 int()를 사용합니다. 반대로 숫자를 글자로 바꾸려면 str()을 사용합니다. 오류 메시지에 str과 int가 함께 나오면 자료형을 먼저 확인하세요.",
    example: "text = '7'\nnumber = 7\n# text + '2' -> '72'\n# number + 2 -> 9",
    answerPrompt: "문자열 '7'과 숫자 7의 차이를 한 가지 연산 예와 함께 설명해 주세요.",
    completionCriteria: [
      "문자열 연결과 숫자 덧셈을 구분한다",
      "int()로 변환하는 예를 포함한다",
    ],
    hints: [
      "'7'+'2'는 글자를 이어 붙여 '72'가 됩니다.",
      "int('7')+2는 숫자로 바꾼 뒤 더하므로 9입니다.",
    ],
    checkpoints: [
      checkpoint(
        "v-remedial-cp1",
        "'7' + '2'의 결과는?",
        ["9", "'72'", "72", "모르겠어요"],
        1,
        "문자열은 이어 붙이므로 '7'+'2'는 '72'입니다.",
      ),
      checkpoint(
        "v-remedial-cp2",
        "int('7') + 2의 결과는?",
        ["'72'", "72", "9", "모르겠어요"],
        2,
        "int('7')은 숫자 7이므로 7 + 2 = 9입니다.",
      ),
    ],
    rubric: commonRubric("v-remedial"),
  }),
  makeTask({
    skillId: "v",
    kind: "verify",
    title: "변수에 담긴 값 추적하기",
    estimatedMinutes: 5,
    lesson:
      "b = a는 a의 현재 숫자를 복사해 b에 넣습니다. 이후 a를 바꿔도 b는 이미 복사된 값을 가지고 있습니다. 정수와 같은 숫자는 값이 복사됩니다. 나눗셈 5/2는 2.5처럼 소수 결과를 만듭니다. 값을 추적할 때는 각 줄이 끝난 뒤 변수 표를 그려 보면 실수가 줄어듭니다.",
    example: "a = 1\nb = a\na = 2\n# b는 1, a는 2",
    answerPrompt: "a=4; b=a; a=9를 실행한 뒤 b의 값과 그 이유를 적어 주세요.",
    completionCriteria: ["b가 4임을 말한다", "복사가 일어난 시점을 설명한다"],
    hints: [
      "b = a는 그 순간의 a 값을 복사합니다.",
      "a를 나중에 바꿔도 이미 복사된 b는 그대로입니다.",
    ],
    checkpoints: [
      checkpoint(
        "v-verify-cp1",
        "a=4; b=a; a=9 다음 b는?",
        ["9", "4", "13", "모르겠어요"],
        1,
        "b는 a가 4일 때 복사되었으므로 4입니다.",
      ),
      checkpoint(
        "v-verify-cp2",
        "5 / 2의 결과는?",
        ["2", "2.5", "3", "모르겠어요"],
        1,
        "파이썬 3에서 / 는 소수 나눗셈이므로 5/2=2.5입니다.",
      ),
    ],
    rubric: commonRubric("v-verify"),
  }),
];
