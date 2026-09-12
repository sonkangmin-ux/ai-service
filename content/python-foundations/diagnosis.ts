import type { DiagnosisItem, RubricItem } from "@/lib/domain/types";
import { choices } from "./build";

function item(
  skillId: string,
  prompt: string,
  code: string,
  options: [string, string, string, string],
  correctIndex: 0 | 1 | 2,
): DiagnosisItem {
  const built = choices(`${skillId}-d`, options, correctIndex);
  return { skillId, prompt, code, ...built };
}

export const diagnosisItems: DiagnosisItem[] = [
  item("v", "다음 코드를 실행한 뒤 x의 값은 무엇인가요?", "x = 3\nx = x + 2", ["3", "5", "32", "모르겠어요"], 1),
  item("c", "score=60일 때 score>=60의 결과는 무엇인가요?", "score = 60\nscore >= 60", ["True", "False", "오류", "모르겠어요"], 0),
  item("l", "total=0에서 range(3)의 각 i를 더한 최종 total은?", "total = 0\nfor i in range(3):\n    total = total + i", ["2", "3", "6", "모르겠어요"], 1),
  item("a", "scores=[70,80,90]에서 scores[1]은?", "scores = [70, 80, 90]\nscores[1]", ["70", "80", "90", "모르겠어요"], 1),
  item("f", "def twice(x): return x*2 에서 twice(4)는?", "def twice(x):\n    return x * 2\n\ntwice(4)", ["2", "4", "8", "모르겠어요"], 2),
];

export const commonRubric = (prefix: string): RubricItem[] => [
  { id: `${prefix}-req`, description: "과제에서 요구한 계산이나 조건을 코드 또는 설명에 포함했는가" },
  { id: `${prefix}-change`, description: "값의 변화나 비교를 관찰 가능하게 설명했는가" },
  { id: `${prefix}-form`, description: "요청한 결과 형태(식, 조건, 함수)를 빠뜨리지 않았는가" },
];
