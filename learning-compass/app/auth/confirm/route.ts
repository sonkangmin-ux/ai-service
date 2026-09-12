import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createRecoveryCookieValue, recoveryCookieName, recoveryCookieOptions } from "@/lib/auth/recovery";
import { safeNextPath } from "@/lib/auth/safe-next";
import { isSupabaseConfigured } from "@/lib/config";

const ALLOWED_TYPES = new Set(["signup", "email", "recovery"]);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") ?? "";
  const next = safeNextPath(searchParams.get("next"), type === "recovery" ? "/reset-password" : "/learn");

  if (!isSupabaseConfigured() || !token_hash || !ALLOWED_TYPES.has(type)) {
    return NextResponse.redirect(new URL("/login?error=confirm", request.url));
  }

  const response = NextResponse.redirect(new URL(type === "recovery" ? "/reset-password" : next, request.url));
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  const { data, error } = await supabase.auth.verifyOtp({
    type: type as "signup" | "email" | "recovery",
    token_hash,
  });
  if (error || !data.user) {
    return NextResponse.redirect(new URL("/login?error=expired", request.url));
  }
  if (type === "recovery") {
    const value = createRecoveryCookieValue(data.user.id);
    if (value) response.cookies.set(recoveryCookieName, value, recoveryCookieOptions);
  }
  return response;
}
