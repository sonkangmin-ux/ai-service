import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createRecoveryCookieValue, recoveryCookieName, recoveryCookieOptions } from "@/lib/auth/recovery";
import { safeNextPath } from "@/lib/auth/safe-next";
import { isSupabaseConfigured } from "@/lib/config";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"), "/learn");
  const fail = new URL("/login?error=confirm", origin);

  if (!isSupabaseConfigured() || !code) {
    return NextResponse.redirect(fail);
  }

  const response = NextResponse.redirect(new URL(next, origin));
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

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(fail);
  }
  if (next === "/reset-password") {
    const value = createRecoveryCookieValue(data.user.id);
    if (value) response.cookies.set(recoveryCookieName, value, recoveryCookieOptions);
  }
  return response;
}
