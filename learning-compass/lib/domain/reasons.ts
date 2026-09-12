import type { ContentPack, ReasonCode, Task } from "./types";

export function reasonText(
  code: ReasonCode,
  task: Task | undefined,
  content: ContentPack,
): string {
  const skillTitle = task ? content.skills[task.skillId]?.title ?? "이 개념" : "다음 개념";
  switch (code) {
    case "INITIAL_BASE":
      return `${skillTitle}의 기본 과제로 시작합니다. 짧은 설명과 확인문제로 개념을 확인합니다.`;
    case "DIAGNOSIS_VERIFY":
      return `진단에서 ${skillTitle}을 예비 확인했습니다. 설명을 생략하고 확인 과제부터 제안합니다.`;
    case "RESUME":
      return `이어서 ${task?.title ?? "이전 과제"}를 진행합니다. 초안과 진도는 그대로 둡니다.`;
    case "CHECKPOINT_SUPPORT":
      return `${skillTitle}의 확인문제에서 보완이 필요해 짧은 보충 과제를 준비했어요.`;
    case "SUPPORT_RECHECK":
      return `보충 설명을 확인한 뒤 ${skillTitle}을 다시 확인하는 과제를 제안합니다.`;
    case "PREREQUISITE_COMPLETE":
      return `앞선 개념을 확인했으니 이제 ${skillTitle}을 이어서 연습합니다.`;
    case "COURSE_COMPLETE":
      return "모든 개념과 종합 과제를 확인했습니다. 결과물과 기록을 살펴보거나 복습할 수 있습니다.";
    case "STUCK_SUPPORT":
      return `${skillTitle}에서 연속 보충 후에도 확인이 어려웠습니다. 개념 다시 보기, 잠시 쉬기, 질문 정리 중 하나를 선택하세요.`;
    case "REVIEW_OPTIONAL":
      return `이미 확인한 ${skillTitle}을 복습합니다. 기존 완료 상태는 유지됩니다.`;
    default:
      return "지금 할 과제를 준비했습니다.";
  }
}
