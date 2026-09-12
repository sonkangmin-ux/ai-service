"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { pythonFoundations } from "@/content/python-foundations";
import { useLearning, useLearningActions } from "@/components/app/LearningProvider";
import { Badge, Button, Card, Input, Modal, PageTitle, ProgressSteps } from "@/components/ui";
import { GOAL_ID } from "@/lib/domain/ids";
import { skillStatus } from "@/lib/domain/recommend";
import type { Experience, SessionMinutes } from "@/lib/domain/types";

export function OnboardingScreen() {
  const router = useRouter();
  const { basePath, state } = useLearning();
  const { saveProfile } = useLearningActions();
  const [displayName, setDisplayName] = useState(state.profile?.displayName ?? "");
  const [goalNote, setGoalNote] = useState(state.profile?.goalNote ?? "");
  const [experience, setExperience] = useState<Experience>(state.profile?.experience ?? "first");
  const [minutes, setMinutes] = useState<SessionMinutes>(state.profile?.sessionMinutes ?? 15);
  const goal = pythonFoundations.goals[GOAL_ID];

  return (
    <div className="space-y-6">
      <PageTitle>목표와 조건</PageTitle>
      <p className="helper">이번 버전의 과제는 Python 입문으로 한정됩니다. 장기 직무 전체를 맞춤 경로로 만들지 않습니다.</p>
      <Card className="space-y-4">
        <Input label="표시 이름 (선택)" value={displayName} maxLength={20} onChange={(e) => setDisplayName(e.target.value)} />
        <div>
          <p className="label">고정된 Python 목표</p>
          <p className="mt-1">{goal.title}</p>
          <p className="helper mt-1">{goal.description}</p>
        </div>
        <label className="block">
          <span className="label">자유 목표 메모</span>
          <textarea
            maxLength={200}
            value={goalNote}
            onChange={(e) => setGoalNote(e.target.value)}
            className="mt-2 min-h-24 w-full rounded-[10px] border border-border p-3"
          />
        </label>
        <fieldset>
          <legend className="label">경험 수준</legend>
          <p className="helper">설명 길이만 조정하며 통과 판정에는 쓰지 않습니다.</p>
          {[
            ["first", "처음"],
            ["seen_syntax", "문법을 본 적 있음"],
            ["wrote_code", "작은 코드를 써봄"],
          ].map(([value, label]) => (
            <label key={value} className="mt-2 flex h-12 items-center gap-2">
              <input type="radio" checked={experience === value} onChange={() => setExperience(value as Experience)} />
              {label}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend className="label">세션 시간</legend>
          {[15, 30, 45].map((value) => (
            <label key={value} className="mt-2 mr-4 inline-flex h-12 items-center gap-2">
              <input type="radio" checked={minutes === value} onChange={() => setMinutes(value as SessionMinutes)} />
              {value}분
            </label>
          ))}
        </fieldset>
        <Button
          onClick={() => {
            saveProfile({
              displayName: displayName || undefined,
              goalId: GOAL_ID,
              goalNote: goalNote || undefined,
              experience,
              sessionMinutes: minutes,
              createdAt: state.profile?.createdAt ?? new Date().toISOString(),
            });
            router.push(`${basePath}/diagnosis`);
          }}
        >
          진단으로
        </Button>
      </Card>
    </div>
  );
}

export function DiagnosisScreen() {
  const router = useRouter();
  const { basePath, state, patch } = useLearning();
  const { skipOrCompleteDiagnosis } = useLearningActions();
  const items = pythonFoundations.diagnosis;
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>(
    Object.fromEntries((state.diagnosis?.responses ?? []).map((item) => [item.skillId, item.choiceId])),
  );
  const item = items[index];
  const selected = responses[item.skillId];

  return (
    <div className="space-y-6">
      <PageTitle>짧은 진단</PageTitle>
      <ProgressSteps current={index + 1} total={items.length} />
      <Card>
        <p>{item.prompt}</p>
        {item.code ? <pre className="mt-3 overflow-x-auto rounded-[10px] bg-background p-3 text-[14px]">{item.code}</pre> : null}
        <div className="mt-4 space-y-2">
          {item.choices.map((choice) => (
            <label key={choice.id} className="flex min-h-12 items-center gap-2 rounded-[10px] border border-border px-3">
              <input
                type="radio"
                name={item.skillId}
                checked={selected === choice.id}
                onChange={() => {
                  const next = { ...responses, [item.skillId]: choice.id };
                  setResponses(next);
                  patch((current) => ({
                    ...current,
                    diagnosis: {
                      responses: Object.entries(next).map(([skillId, choiceId]) => ({ skillId, choiceId })),
                      provisionalSkillIds: current.diagnosis?.provisionalSkillIds ?? [],
                    },
                  }));
                }}
              />
              {choice.text}
            </label>
          ))}
        </div>
        <div className="mt-6 flex gap-2">
          <Button variant="secondary" disabled={index === 0} onClick={() => setIndex((value) => value - 1)}>
            이전
          </Button>
          {index < items.length - 1 ? (
            <Button disabled={!selected} onClick={() => setIndex((value) => value + 1)}>
              다음
            </Button>
          ) : (
            <Button
              disabled={items.some((entry) => !responses[entry.skillId])}
              onClick={() => {
                skipOrCompleteDiagnosis(items.map((entry) => ({ skillId: entry.skillId, choiceId: responses[entry.skillId] })));
                router.push(`${basePath}/learn`);
              }}
            >
              제출
            </Button>
          )}
        </div>
      </Card>
      <Button
        variant="ghost"
        onClick={() => {
          skipOrCompleteDiagnosis("skip");
          router.push(`${basePath}/learn`);
        }}
      >
        진단 건너뛰기
      </Button>
      <p className="helper">진단 정답은 예비 확인이며 개념 완료와 다릅니다.</p>
    </div>
  );
}

const STATUS_LABEL = {
  unseen: "미확인",
  provisional: "예비 확인",
  in_progress: "학습 중",
  needs_support: "보충 필요",
  verified: "확인 완료",
} as const;

export function LearnScreen() {
  const { state, basePath } = useLearning();
  const { currentRecommendation, beginTask, changeMinutes } = useLearningActions();
  const task = currentRecommendation.taskId ? pythonFoundations.tasks[currentRecommendation.taskId] : undefined;
  const goal = pythonFoundations.goals[GOAL_ID];
  const order = pythonFoundations.track.skillOrder;
  const currentIndex = task ? order.indexOf(pythonFoundations.tasks[task.id].skillId) : order.length;
  const upcoming = order.slice(currentIndex, currentIndex + 3);
  const [minutesOpen, setMinutesOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <p className="label">목표</p>
        <PageTitle>{goal.title}</PageTitle>
        <p className="helper">단원 {Math.min(currentIndex + 1, order.length)}/{order.length} · 세션 {state.profile?.sessionMinutes ?? 15}분</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          {task ? (
            <Card>
              <h2 className="text-[20px] font-semibold break-words">{task.title}</h2>
              <p className="mt-3">{currentRecommendation.reasonText}</p>
              <p className="helper mt-2">예상 {task.estimatedMinutes}분</p>
              <ul className="mt-3 list-disc pl-5">
                {task.completionCriteria.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link href={`${basePath}/task/${task.id}`} className="mt-4 inline-block">
                <Button onClick={() => beginTask(task.id)}>시작하기</Button>
              </Link>
            </Card>
          ) : (
            <Card>
              <h2 className="text-[20px] font-semibold">과정을 확인했습니다</h2>
              <p className="mt-2">{currentRecommendation.reasonText}</p>
              <Link href={`${basePath}/history`}><Button className="mt-4">기록 보기</Button></Link>
            </Card>
          )}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link href={`${basePath}/path`}>
              <Button variant="secondary">기초 설명부터 보기</Button>
            </Link>
            <Button variant="ghost" onClick={() => setMinutesOpen(true)}>오늘 시간 변경</Button>
          </div>
        </div>
        <Card>
          <h2 className="font-semibold">확인된 개념과 다음 개념</h2>
          <ul className="mt-3 space-y-2">
            {upcoming.map((skillId) => (
              <li key={skillId} className="flex items-center justify-between">
                <span>{pythonFoundations.skills[skillId].title}</span>
                <Badge>{STATUS_LABEL[skillStatus(state, skillId).status]}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Modal open={minutesOpen} title="오늘 시간 변경" onClose={() => setMinutesOpen(false)}>
        <p className="helper">진도와 초안은 지우지 않습니다.</p>
        <div className="mt-4 flex gap-2">
          {([15, 30, 45] as const).map((value) => (
            <Button key={value} variant="secondary" onClick={() => { changeMinutes(value); setMinutesOpen(false); }}>
              {value}분
            </Button>
          ))}
        </div>
      </Modal>
    </div>
  );
}

export function PathScreen() {
  const { state, basePath } = useLearning();
  const { beginTask } = useLearningActions();
  const rec = state.recommendation?.taskId;
  return (
    <div className="space-y-4">
      <PageTitle>학습 경로</PageTitle>
      <p className="helper">이 순서는 MVP용 단순 교육 순서이며 유일한 최적 순서라고 주장하지 않습니다.</p>
      {pythonFoundations.track.skillOrder.map((skillId, index) => {
        const skill = pythonFoundations.skills[skillId];
        const progress = skillStatus(state, skillId);
        const locked = skill.prerequisiteIds.some((id) => skillStatus(state, id).status !== "verified");
        return (
          <Card key={skillId}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">{index + 1}. {skill.title}</h2>
              <Badge tone={progress.status === "verified" ? "success" : progress.status === "needs_support" ? "warning" : "muted"}>
                {STATUS_LABEL[progress.status]}
              </Badge>
            </div>
            {locked && progress.status !== "verified" ? (
              <p className="helper mt-2">선행 개념이 끝나기 전에는 미리보기만 가능합니다.</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {[skill.baseTaskId, skill.remedialTaskId, skill.verifyTaskId].map((taskId) => (
                  <Link key={taskId} href={`${basePath}/task/${taskId}`}>
                    <Button variant={taskId === rec ? "primary" : "secondary"} onClick={() => beginTask(taskId)}>
                      {pythonFoundations.tasks[taskId].title}
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

export function HistoryScreen() {
  const { state } = useLearning();
  const last = [...state.attempts].reverse();
  const passedFinal = skillStatus(state, "p").status === "verified";
  const finalAttempt = [...state.attempts].reverse().find((item) => item.taskId.startsWith("p-") && item.outcome === "passed");
  return (
    <div className="space-y-4">
      <PageTitle>기록</PageTitle>
      <p className="helper">활성 시간은 탭이 보이고 세션이 진행 중일 때의 근사치입니다.</p>
      {passedFinal && finalAttempt ? (
        <Card>
          <h2 className="font-semibold">최종 결과 요약</h2>
          <ul className="mt-2 space-y-1">
            <li>AI 검토: {state.feedbacks.some((item) => item.id === finalAttempt.feedbackId && item.source === "live") ? "있음" : "없음"}</li>
            <li>확인문제 통과: 예</li>
            <li>직접 실행 확인(자기보고): 이 앱은 코드를 실행하지 않습니다</li>
          </ul>
          <Button className="mt-3" onClick={() => navigator.clipboard.writeText(finalAttempt.answerText)}>코드 복사</Button>
        </Card>
      ) : null}
      {last.length === 0 ? <p className="helper">아직 기록이 없습니다.</p> : null}
      {last.map((attempt, index) => {
        const change = state.planChanges.find((item) => item.attemptId === attempt.id);
        const prev = last[index + 1];
        return (
          <Card key={attempt.id}>
            <p className="label">{new Date(attempt.submittedAt).toLocaleString("ko-KR")}</p>
            <h2 className="font-semibold">{pythonFoundations.tasks[attempt.taskId]?.title}</h2>
            <p>결과: {attempt.outcome} · 힌트 {attempt.hintCount} · 약 {Math.round(attempt.activeSeconds / 60)}분</p>
            <p className="helper">피드백 출처: {state.feedbacks.find((item) => item.id === attempt.feedbackId)?.source ?? "없음"}</p>
            {change ? <p className="mt-2">이전 {pythonFoundations.tasks[change.previousTaskId ?? ""]?.title ?? "없음"} → 이후 {pythonFoundations.tasks[change.nextTaskId ?? ""]?.title ?? "완료"} · {change.explanation}</p> : null}
            {prev ? <p className="helper">직전 과제: {pythonFoundations.tasks[prev.taskId]?.title}</p> : null}
          </Card>
        );
      })}
    </div>
  );
}
