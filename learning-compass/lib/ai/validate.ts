import type { ModelFeedback } from "@/lib/domain/schema";
import type { FeedbackIssue, RubricItem } from "@/lib/domain/types";

export function validateModelFeedback(
  data: ModelFeedback,
  answerText: string,
  rubric: RubricItem[],
): { ok: true; data: ModelFeedback } | { ok: false; reason: string } {
  const rubricIds = new Set(rubric.map((item) => item.id));
  for (const issue of data.issues) {
    if (!rubricIds.has(issue.criterionId)) {
      return { ok: false, reason: "unknown criterionId" };
    }
    if (issue.evidenceQuote && !answerText.includes(issue.evidenceQuote)) {
      return { ok: false, reason: "evidenceQuote not in answer" };
    }
  }
  return { ok: true, data };
}

export function sanitizeIssues(issues: FeedbackIssue[], answerText: string, rubricIds: Set<string>): FeedbackIssue[] {
  return issues.filter(
    (issue) =>
      rubricIds.has(issue.criterionId) &&
      (issue.evidenceQuote === "" || answerText.includes(issue.evidenceQuote)),
  );
}
