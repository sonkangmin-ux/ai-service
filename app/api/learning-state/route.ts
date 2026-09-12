import { NextRequest, NextResponse } from "next/server";
import { originAllowed } from "@/lib/auth/safe-next";
import { appStateSchema, learningStatePutSchema } from "@/lib/domain/schema";
import { createServerSupabase } from "@/lib/supabase/server";
import { pythonFoundations } from "@/content/python-foundations";
import { recommendNext } from "@/lib/domain/recommend";

export const dynamic = "force-dynamic";

function noStore(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET() {
  const supabase = await createServerSupabase();
  if (!supabase) return noStore({ error: "auth_unavailable" }, 401);
  const { data: userData } = await supabase.auth.getClaims();
  if (!userData?.claims) return noStore({ error: "unauthorized" }, 401);
  const { data, error } = await supabase
    .from("learning_states")
    .select("payload, revision, updated_at")
    .maybeSingle();
  if (error) return noStore({ error: "read_failed" }, 500);
  if (!data) return noStore({ payload: null, revision: -1 });
  return noStore({ payload: data.payload, revision: data.revision, updatedAt: data.updated_at });
}

export async function PUT(request: NextRequest) {
  if (!originAllowed(request)) return noStore({ error: "origin" }, 403);
  const supabase = await createServerSupabase();
  if (!supabase) return noStore({ error: "auth_unavailable" }, 401);
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return noStore({ error: "unauthorized" }, 401);
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 2 * 1024 * 1024) return noStore({ error: "too_large" }, 400);
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return noStore({ error: "invalid_json" }, 400);
  }
  const parsed = learningStatePutSchema.safeParse(json);
  if (!parsed.success) return noStore({ error: "invalid", message: parsed.error.issues[0]?.message }, 400);
  recommendNext(parsed.data.payload, pythonFoundations);
  const { data, error } = await supabase.rpc("save_learning_state", {
    expected_revision: parsed.data.expectedRevision,
    payload: parsed.data.payload,
  });
  if (error) return noStore({ error: "save_failed" }, 500);
  const result = data as { status?: string; revision?: number; updatedAt?: string };
  if (result?.status === "conflict") return noStore({ error: "conflict", revision: result.revision }, 409);
  if (result?.status === "invalid") return noStore({ error: "invalid" }, 400);
  if (result?.status === "unauthorized") return noStore({ error: "unauthorized" }, 401);
  return noStore({ revision: result.revision, updatedAt: result.updatedAt });
}

void appStateSchema;
