import { NextRequest, NextResponse } from "next/server";
import { pythonFoundations } from "@/content/python-foundations";
import { demoFeedback } from "@/lib/ai/demo-feedback";
import { fallbackFeedback } from "@/lib/ai/fallback";
import { generateLiveFeedback } from "@/lib/ai/claude";
import { originAllowed } from "@/lib/auth/safe-next";
import { isLiveAiConfigured, isSupabaseConfigured, userDailyLimit } from "@/lib/config";
import { hashAnswer, simpleId } from "@/lib/domain/hash";
import { feedbackRequestSchema } from "@/lib/domain/schema";
import { appStateSchema } from "@/lib/domain/schema";
import { createServerSupabase } from "@/lib/supabase/server";
import type { AppState, Feedback } from "@/lib/domain/types";

export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  if (!originAllowed(request)) return json({ error: "origin" }, 403);
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 16 * 1024) return json({ error: "too_large" }, 400);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  const parsed = feedbackRequestSchema.safeParse(body);
  if (!parsed.success) return json({ error: "invalid", message: parsed.error.issues[0]?.message }, 400);
  const task = pythonFoundations.tasks[parsed.data.taskId];
  if (!task) return json({ error: "not_found" }, 404);

  const createdAt = new Date().toISOString();
  const answerHash = await hashAnswer(parsed.data.answerText);
  const id = simpleId("fb");

  if (parsed.data.mode === "demo" || !isLiveAiConfigured()) {
    const feedback =
      parsed.data.mode === "demo"
        ? demoFeedback({ id, sessionId: parsed.data.sessionId, answerHash, createdAt, task, answerText: parsed.data.answerText })
        : fallbackFeedback({ id, sessionId: parsed.data.sessionId, answerHash, createdAt, task });
    return json(feedback);
  }

  const supabase = await createServerSupabase();
  if (!supabase || !isSupabaseConfigured()) return json({ error: "unauthorized" }, 401);
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return json({ error: "unauthorized" }, 401);

  const { data: row } = await supabase.from("learning_states").select("payload").maybeSingle();
  const payloadResult = appStateSchema.safeParse(row?.payload);
  const state: AppState | null = payloadResult.success ? payloadResult.data : null;
  if (!state?.activeSession || state.activeSession.id !== parsed.data.sessionId || state.activeSession.taskId !== parsed.data.taskId) {
    return json({ error: "session_mismatch" }, 409);
  }

  const envCap = userDailyLimit();
  const remaining = await supabase.rpc("ai_remaining_today");
  if (typeof remaining.data === "number" && remaining.data <= 0) {
    return json({ error: "limited", message: "오늘 AI 요청 한도에 도달했습니다. 기본 설명으로 계속 학습할 수 있습니다" }, 429);
  }
  if (typeof remaining.data === "number" && remaining.data > envCap) {
    // App-side cap cannot raise DB limits; it can only lower them.
  }

  const reserved = await supabase.rpc("reserve_ai_request", {
    request_id: parsed.data.requestId,
    input_hash: answerHash,
  });
  if (reserved.error) {
    return json(
      fallbackFeedback({ id, sessionId: parsed.data.sessionId, answerHash, createdAt, task }),
    );
  }
  const status = (reserved.data as { status?: string; result?: Feedback })?.status;
  if (status === "unauthorized") return json({ error: "unauthorized" }, 401);
  if (status === "limited") {
    return json({ error: "limited", message: "오늘 AI 요청 한도에 도달했습니다. 기본 설명으로 계속 학습할 수 있습니다" }, 429);
  }
  if (status === "conflict") return json({ error: "conflict" }, 409);
  if (status === "pending") return json({ error: "pending", message: "이전 요청을 확인 중입니다." }, 202);
  if (status === "failed_replay" || status === "expired") {
    return json({ error: "retry_with_new_id", message: "같은 요청 ID로는 다시 호출하지 않습니다. 새 요청으로 재시도해 주세요." }, 409);
  }
  if (status === "replay" && (reserved.data as { result?: Feedback }).result) {
    return json((reserved.data as { result: Feedback }).result);
  }

  const live = await generateLiveFeedback({
    task,
    answerText: parsed.data.answerText,
    question: parsed.data.question,
  });
  const feedback: Feedback = live.ok
    ? {
        id,
        sessionId: parsed.data.sessionId,
        answerHash,
        source: "live",
        ...live.data,
        createdAt,
      }
    : fallbackFeedback({ id, sessionId: parsed.data.sessionId, answerHash, createdAt, task });

  await supabase.rpc("complete_ai_request", {
    request_id: parsed.data.requestId,
    request_status: live.ok ? "succeeded" : "failed",
    result: live.ok ? feedback : null,
  });
  return json(feedback, live.ok ? 200 : 200);
}
