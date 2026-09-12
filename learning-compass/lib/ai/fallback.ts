import type { Feedback, Task } from "@/lib/domain/types";

export function fallbackFeedback(input: {
  id: string;
  sessionId: string;
  answerHash: string;
  createdAt: string;
  task: Task;
}): Feedback {
  return {
    id: input.id,
    sessionId: input.sessionId,
    answerHash: input.answerHash,
    source: "fallback",
    summary: "AI 연결이 원활하지 않아 기본 학습 안내를 보여드려요.",
    strengths: [],
    issues: [
      {
        criterionId: input.task.rubric[0]?.id ?? "generic",
        observation: input.task.completionCriteria[0] ?? "과제 설명을 다시 읽고 빠뜨린 항목을 보완해 보세요.",
        evidenceQuote: "",
      },
    ],
    nextHint: input.task.hints[0],
    suggestedSupport: "concept",
    limitations: [
      "이 안내는 답변을 실제로 분석한 결과가 아닙니다.",
      "확인문제는 그대로 제출할 수 있습니다.",
    ],
    createdAt: input.createdAt,
  };
}
