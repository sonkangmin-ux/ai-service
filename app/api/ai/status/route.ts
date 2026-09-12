import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { isLiveAiConfigured, isSupabaseConfigured, userDailyLimit } from "@/lib/config";

export async function GET() {
  const live = isLiveAiConfigured();
  const mode = live ? "live" : "demo";
  const supabase = await createServerSupabase();
  if (!supabase || !isSupabaseConfigured()) {
    return NextResponse.json({ mode, requiresLogin: true });
  }
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json({ mode, requiresLogin: true });
  }
  const remaining = await supabase.rpc("ai_remaining_today");
  const remainingToday =
    typeof remaining.data === "number" ? Math.min(remaining.data, userDailyLimit()) : undefined;
  return NextResponse.json({
    mode,
    requiresLogin: false,
    remainingToday,
  });
}
