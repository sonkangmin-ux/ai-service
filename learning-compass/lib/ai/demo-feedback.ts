import { DEMO_SAMPLE_WRONG_ANSWER } from "@/lib/demo/seed";
import type { Feedback, Task } from "@/lib/domain/types";

function normalize(text: string): string {
  return text.replace(/\r\n/g, "\n").trim();
}

export function demoFeedback(input: {
  id: string;
  sessionId: string;
  answerHash: string;
  createdAt: string;
  task: Task;
  answerText: string;
}): Feedback {
  const matchesSample = normalize(input.answerText) === normalize(DEMO_SAMPLE_WRONG_ANSWER);
  if (input.task.id === "l-base" && matchesSample) {
    return {
      id: input.id,
      sessionId: input.sessionId,
      answerHash: input.answerHash,
      source: "demo",
      summary: "반복마다 total을 덮어써서 마지막 값만 남았습니다.",
      strengths: ["range를 사용해 반복을 시도했습니다."],
      issues: [
        {
          criterionId: input.task.rubric[1]?.id ?? input.task.rubric[0].id,
          observation: "total = i는 이전 합을 버리고 i로 바꿉니다. 누적이 아닙니다.",
          evidenceQuote: "total = i",
        },
      ],
      nextHint: "total = total + i 로 바꾸면 1+2+3이 남습니다.",
      suggestedSupport: "example",
      limitations: ["데모 · 예시 피드백입니다. 실제 코드 실행 결과는 아닙니다."],
      createdAt: input.createdAt,
    };
  }
  return {
    id: input.id,
    sessionId: input.sessionId,
    answerHash: input.answerHash,
    source: "demo",
    summary: "데모에서는 예시 답변의 피드백을 제공합니다.",
    strengths: [],
    issues: [],
    nextHint: input.task.hints[0],
    suggestedSupport: "practice",
    limitations: ["입력을 바꿨기 때문에 고정 오답 진단을 그대로 보여주지 않습니다."],
    createdAt: input.createdAt,
  };
}
