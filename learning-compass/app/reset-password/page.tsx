import { cookies } from "next/headers";
import { ResetPasswordForm } from "@/components/auth/AuthScreens";
import { readRecoveryCookieValue, recoveryCookieName } from "@/lib/auth/recovery";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function ResetPasswordPage() {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return <ResetPasswordForm allowed={false} />;
  }
  const { data } = await supabase.auth.getUser();
  const cookie = (await cookies()).get(recoveryCookieName)?.value;
  const allowed = Boolean(data.user && cookie && readRecoveryCookieValue(cookie, data.user.id));
  return <ResetPasswordForm allowed={allowed} />;
}
