"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { pythonFoundations } from "@/content/python-foundations";
import { useLearning, useLearningActions } from "@/components/app/LearningProvider";
import { Alert, Badge, Button, Card, Modal, PageTitle } from "@/components/ui";
import { DEMO_SAMPLE_WRONG_ANSWER } from "@/lib/demo/seed";
import { hashAnswer, simpleId } from "@/lib/domain/hash";
import { sessionIsOpen } from "@/lib/domain/transitions";
import type { BlockReason, Feedback } from "@/lib/domain/types";

const SOURCE_LABEL = {
  live: "AI 피드백",
  demo: "데모 · 예시 피드백",
  fallback: "기본 안내",
} as const;

export function TaskScreen() {
  const params = useParams<{ taskId: string }>();
  const taskId = params.taskId;
  const task = pythonFoundations.tasks[taskId];
  const router = useRouter();
  const { state, basePath, mode, setToast, saveNow } = useLearning();
  const actions = useLearningActions();
  const [lessonOpen, setLessonOpen] = useState(true);
  const [blockedOpen, setBlockedOpen] = useState(false);
  const [blockReason, setBlockReason] = useState<BlockReason>("concept");
  const [blockNote, setBlockNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<"demo" | "live" | "unavailable">("demo");
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [showCheckResult, setShowCheckResult] = useState(false);
  const requestRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<string | null>(null);

  useEffect(() => {
    fetch("/api/ai/status")
      .then((res) => res.json())
      .then((data) => setAiStatus(data.mode))
      .catch(() => setAiStatus("unavailable"));
  }, []);

  useEffect(() => {
    if (!task) return;
    if (!state.activeSession || state.activeSession.taskId !== task.id) {
      actions.beginTask(task.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- start once for this task
  }, [taskId]);

  if (!task) {
    return (
      <Card>
        <PageTitle>과제를 찾을 수 없습니다</PageTitle>
        <p className="helper mt-2">없는 과제입니다. 학습 화면으로 돌아가 주세요.</p>
        <Link href={`${basePath}/learn`}><Button className="mt-4">돌아가기</Button></Link>
      </Card>
    );
  }

  const session = state.activeSession?.taskId === taskId ? state.activeSession : undefined;
  const draft = session?.draft ?? "";
  const feedback = state.feedbacks.find((item) => item.id === session?.latestFeedbackId);
  const canAsk = draft.trim().length > 0 && draft.length <= 4000;
  const canCheckpoint = Boolean(feedback) && draft.trim().length > 0;
  const stuck = state.recommendation?.reasonCode === "STUCK_SUPPORT" && pythonFoundations.tasks[state.recommendation.taskId ?? ""]?.skillId === task.skillId;

  async function requestFeedback() {
    if (!session || !canAsk) return;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const requestId = simpleId("req");
    requestIdRef.current = requestId;
    const answerHash = await hashAnswer(draft);
    setLoading(true);
    actions.markFeedbackWait();
    if (mode === "member") await saveNow();
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          sessionId: session.id,
          taskId,
          answerText: draft,
          hintCount: session.hintCount,
          mode: mode === "demo" ? "demo" : mode === "member" ? "user" : "demo",
        }),
      });
      const data = (await response.json()) as Feedback & { error?: string; message?: string };
      if (requestIdRef.current !== requestId) return;
      if (!response.ok) {
        setToast(data.message ?? "피드백을 가져오지 못했습니다. 초안은 유지됩니다.");
        return;
      }
      if (data.sessionId !== session.id || data.answerHash !== answerHash) return;
      actions.attachFeedback(data);
    } catch (error) {
      if ((error as Error).name !== "AbortError") setToast("피드백 요청이 실패했습니다. 초안은 유지됩니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageTitle>{task.title}</PageTitle>
      {mode === "demo" ? (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => actions.writeDraft(DEMO_SAMPLE_WRONG_ANSWER)}
          >
            예시 오답 넣기
          </Button>
          <Button variant="secondary" onClick={() => actions.writeDraft(task.example)}>
            정답 넣기
          </Button>
        </div>
      ) : null}
      {stuck ? (
        <Alert tone="warning">
          연속 보충 후에도 확인이 어려웠습니다.
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" onClick={() => setLessonOpen(true)}>개념 다시 보기</Button>
            <Button variant="secondary" onClick={() => actions.pause()}>잠시 쉬기</Button>
            <Button variant="secondary" onClick={() => navigator.clipboard.writeText(`${task.title}\n${task.answerPrompt}\n${draft}`)}>질문 정리 복사</Button>
          </div>
        </Alert>
      ) : null}
      <Card>
        <button className="font-semibold" onClick={() => setLessonOpen((value) => !value)}>
          학습 설명 {lessonOpen ? "접기" : "펼치기"}
        </button>
        {lessonOpen ? (
          <div className="mt-3 space-y-3">
            <p className="whitespace-pre-wrap">{task.lesson}</p>
            <pre className="overflow-x-auto rounded-[10px] bg-background p-3 text-[14px]">{task.example}</pre>
            <a className="text-primary" href="https://docs.python.org/3/tutorial/" target="_blank" rel="noreferrer">
              Python 공식 튜토리얼
            </a>
          </div>
        ) : null}
      </Card>
      <Card>
        <p>{task.answerPrompt}</p>
        <p className="helper mt-2">이 앱은 코드를 실행하지 않습니다. 확인문제 통과는 실행 검증이 아닙니다.</p>
        <textarea
          className="code mt-3 min-h-40 w-full rounded-[10px] border border-border p-3"
          maxLength={4000}
          value={draft}
          onChange={(event) => {
            requestRef.current?.abort();
            actions.writeDraft(event.target.value);
          }}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" disabled={!session || session.hintCount >= 2} onClick={() => actions.hint()}>
            힌트 ({session?.hintCount ?? 0}/2)
          </Button>
          <Button onClick={() => void requestFeedback()} disabled={!canAsk || loading} loading={loading}>
            {loading ? "피드백을 준비하는 중" : "피드백 요청"}
          </Button>
          <Button variant="ghost" onClick={() => setBlockedOpen(true)}>막혔어요</Button>
        </div>
        {session?.hintCount ? <p className="helper mt-2">{task.hints[Math.max(0, session.hintCount - 1)]}</p> : null}
      </Card>
      {feedback ? (
        <Card>
          <Badge tone={feedback.source === "fallback" ? "warning" : "primary"}>{SOURCE_LABEL[feedback.source]}</Badge>
          <p className="mt-2" aria-live="polite">{feedback.summary}</p>
          {feedback.strengths.length ? <ul className="mt-2 list-disc pl-5">{feedback.strengths.map((item) => <li key={item}>{item}</li>)}</ul> : null}
          {feedback.issues.map((issue) => (
            <p key={issue.criterionId} className="mt-2">{issue.observation} {issue.evidenceQuote ? `인용: ${issue.evidenceQuote}` : ""}</p>
          ))}
          <p className="helper mt-2">{feedback.nextHint}</p>
          {feedback.limitations.map((item) => <p key={item} className="helper">{item}</p>)}
        </Card>
      ) : null}
      <Card>
        <h2 className="font-semibold">확인문제</h2>
        <p className="helper">피드백을 읽은 다음 제출합니다. 정답은 제출 전에 공개하지 않습니다.</p>
        {task.checkpoints.map((checkpoint) => (
          <fieldset key={checkpoint.id} className="mt-4">
            <legend>{checkpoint.prompt}</legend>
            {checkpoint.choices.map((choice) => (
              <label key={choice.id} className="mt-2 flex min-h-12 items-center gap-2">
                <input
                  type="radio"
                  name={checkpoint.id}
                  disabled={!canCheckpoint}
                  checked={selections[checkpoint.id] === choice.id}
                  onChange={() => setSelections((current) => ({ ...current, [checkpoint.id]: choice.id }))}
                />
                {choice.text}
              </label>
            ))}
            {showCheckResult ? <p className="helper mt-1">{checkpoint.explanation}</p> : null}
          </fieldset>
        ))}
        <Button
          className="mt-4"
          disabled={!canCheckpoint || task.checkpoints.some((item) => !selections[item.id])}
          onClick={() => {
            setShowCheckResult(true);
            actions.finishAttempt({ selections });
            router.push(`${basePath}/learn`);
          }}
        >
          확인문제 제출
        </Button>
      </Card>
      {session && !sessionIsOpen(state) ? <Alert>이 세션은 이미 제출되었습니다.</Alert> : null}
      <p className="helper">AI 상태: {aiStatus === "live" ? "연결 설정됨(실제 성공은 요청 후 확인)" : aiStatus === "demo" ? "데모/예시" : "사용 불가"}</p>
      <Modal open={blockedOpen} title="막힌 이유" onClose={() => setBlockedOpen(false)}>
        {(["concept", "error", "time", "other"] as const).map((value) => (
          <label key={value} className="mt-2 flex h-12 items-center gap-2">
            <input type="radio" checked={blockReason === value} onChange={() => setBlockReason(value)} />
            {{ concept: "어려운 개념", error: "오류", time: "시간 부족", other: "기타" }[value]}
          </label>
        ))}
        <textarea className="mt-3 w-full rounded-[10px] border border-border p-3" value={blockNote} onChange={(e) => setBlockNote(e.target.value)} />
        <p className="helper mt-2">시간 부족은 능력 실패로 처리하지 않습니다. 초안은 보존됩니다.</p>
        <Button
          className="mt-3"
          onClick={() => {
            if (blockReason === "time") actions.pause();
            else actions.finishAttempt({ blockReason });
            setBlockedOpen(false);
            router.push(`${basePath}/learn`);
          }}
        >
          저장하고 나가기
        </Button>
      </Modal>
    </div>
  );
}
