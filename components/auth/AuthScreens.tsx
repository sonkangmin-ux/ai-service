"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { Alert, Button, Input, PageTitle } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/config";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { loginSchema, signupSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/domain/schema";

function AuthFrame({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <main id="main" className="mx-auto flex min-h-full max-w-[440px] flex-col justify-center px-5 py-12">
      <p className="font-semibold">AI 학습 나침반</p>
      <PageTitle>{title}</PageTitle>
      <p className="helper mt-2">{description}</p>
      <div className="mt-6">{children}</div>
    </main>
  );
}

function Unavailable({ nextGuest = "/onboarding" }: { nextGuest?: string }) {
  return (
    <div className="space-y-3">
      <Alert>계정 기능을 준비 중입니다. 운영자가 Supabase를 연결하면 회원가입과 로그인을 사용할 수 있습니다.</Alert>
      <Link href={nextGuest}>
        <Button className="w-full">게스트로 시작</Button>
      </Link>
      <Link href="/demo">
        <Button variant="secondary" className="w-full">
          3분 데모
        </Button>
      </Link>
    </div>
  );
}

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  if (!isSupabaseConfigured()) {
    return (
      <AuthFrame title="회원가입" description="이메일로 계정을 만들고 학습 기록을 저장합니다.">
        <Unavailable />
      </AuthFrame>
    );
  }
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = {
      displayName: String(form.get("displayName") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
      confirmPassword: String(form.get("confirmPassword") ?? ""),
    };
    const parsed = signupSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        next[String(issue.path[0])] = issue.message;
      }
      setError(next);
      return;
    }
    setLoading(true);
    setFormError("");
    const supabase = createBrowserSupabase();
    const { error: signError } = await supabase!.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { data: { displayName: parsed.data.displayName } },
    });
    setLoading(false);
    if (signError) {
      if (signError.status === 429) setFormError("요청이 많습니다. 잠시 후 다시 시도해 주세요.");
      else setFormError("가입 요청을 처리하지 못했습니다. 이메일 또는 네트워크를 확인해 주세요.");
      return;
    }
    sessionStorage.setItem("lc-verify-email", parsed.data.email);
    router.push("/verify-email");
  }
  return (
    <AuthFrame title="회원가입" description="이메일 확인 후에 학습 기록이 계정에 저장됩니다.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <Input name="displayName" label="표시 이름" maxLength={20} error={error.displayName} />
        <Input name="email" label="이메일" type="email" autoComplete="email" maxLength={254} error={error.email} />
        <Input name="password" label="비밀번호" passwordToggle autoComplete="new-password" error={error.password} helper="12~128자" />
        <Input name="confirmPassword" label="비밀번호 확인" passwordToggle autoComplete="new-password" error={error.confirmPassword} />
        {formError ? <Alert tone="error">{formError}</Alert> : null}
        <Button type="submit" className="w-full" loading={loading}>
          가입하기
        </Button>
      </form>
      <p className="helper mt-4">
        이미 계정이 있나요? <Link href="/login">로그인</Link>
      </p>
    </AuthFrame>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [unverified, setUnverified] = useState("");
  if (!isSupabaseConfigured()) {
    return (
      <AuthFrame title="로그인" description="계정으로 학습 기록을 불러옵니다.">
        <Unavailable />
      </AuthFrame>
    );
  }
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = loginSchema.safeParse({
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "입력을 확인해 주세요.");
      return;
    }
    setLoading(true);
    setError("");
    const supabase = createBrowserSupabase();
    const { error: signError } = await supabase!.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (signError) {
      if (signError.status === 429) setError("요청이 많습니다. 잠시 후 다시 시도해 주세요.");
      else if (signError.message.toLowerCase().includes("email not confirmed")) {
        setUnverified(parsed.data.email);
        setError("이메일 확인이 필요합니다.");
      } else setError("이메일 또는 비밀번호를 확인해 주세요");
      return;
    }
    router.replace("/learn");
  }
  return (
    <AuthFrame title="로그인" description="저장해 둔 학습을 이어서 합니다.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <Input name="email" label="이메일" type="email" autoComplete="email" />
        <Input name="password" label="비밀번호" passwordToggle autoComplete="current-password" />
        {error ? <Alert tone="error">{error}</Alert> : null}
        {unverified ? (
          <Button
            type="button"
            variant="secondary"
            onClick={async () => {
              await createBrowserSupabase()?.auth.resend({ type: "signup", email: unverified });
            }}
          >
            인증 메일 다시 보내기
          </Button>
        ) : null}
        <Button type="submit" className="w-full" loading={loading}>
          로그인
        </Button>
      </form>
      <p className="helper mt-4">
        <Link href="/forgot-password">비밀번호 찾기</Link>
        {" · "}
        <Link href="/signup">가입</Link>
      </p>
    </AuthFrame>
  );
}

export function VerifyEmailScreen() {
  const [email, setEmail] = useState("");
  const [wait, setWait] = useState(0);
  useClientEmail(setEmail);
  return (
    <AuthFrame title="이메일 확인" description="받은 링크를 열면 가입이 완료됩니다. 확인 전에는 회원 학습이 저장되지 않습니다.">
      <p className="helper">{maskEmail(email) || "이메일을 확인하는 중입니다."}</p>
      <Button
        className="mt-4 w-full"
        disabled={wait > 0}
        onClick={async () => {
          if (!email) return;
          setWait(60);
          await createBrowserSupabase()?.auth.resend({ type: "signup", email });
          const timer = window.setInterval(() => setWait((value) => (value <= 1 ? (clearInterval(timer), 0) : value - 1)), 1000);
        }}
      >
        {wait > 0 ? `${wait}초 후 재전송` : "인증 메일 재전송"}
      </Button>
      <Link href="/signup" className="helper mt-4 block">
        다른 이메일로 다시 가입
      </Link>
    </AuthFrame>
  );
}

function useClientEmail(setter: (value: string) => void) {
  useEffect(() => {
    setter(sessionStorage.getItem("lc-verify-email") ?? "");
  }, [setter]);
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain || !name) return "";
  return `${name.slice(0, 1)}***@${domain}`;
}

export function ForgotPasswordForm() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  if (!isSupabaseConfigured()) {
    return (
      <AuthFrame title="비밀번호 재설정" description="계정 이메일로 재설정 안내를 보냅니다.">
        <Unavailable nextGuest="/login" />
      </AuthFrame>
    );
  }
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = forgotPasswordSchema.safeParse({ email: String(new FormData(event.currentTarget).get("email") ?? "").trim() });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "");
      return;
    }
    const { error: resetError } = await createBrowserSupabase()!.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
    });
    if (resetError?.status === 429) setError("발송 제한에 도달했습니다. 잠시 후 다시 시도해 주세요.");
    else if (resetError) setError("네트워크 문제로 요청하지 못했습니다.");
    else setDone(true);
  }
  return (
    <AuthFrame title="비밀번호 재설정" description="계정이 있는지는 알려 드리지 않고, 요청 접수만 안내합니다.">
      {done ? <Alert tone="success">재설정 안내를 요청했습니다. 메일이 오지 않으면 스팸함을 확인해 주세요.</Alert> : (
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input name="email" label="이메일" type="email" autoComplete="email" />
          {error ? <Alert tone="error">{error}</Alert> : null}
          <Button type="submit" className="w-full">요청하기</Button>
        </form>
      )}
      <Link href="/login" className="helper mt-4 block">로그인</Link>
    </AuthFrame>
  );
}

export function ResetPasswordForm({ allowed }: { allowed: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  if (!allowed) {
    return (
      <AuthFrame title="재설정 링크가 필요합니다" description="이메일 링크를 통해 들어온 뒤에만 비밀번호를 바꿀 수 있습니다.">
        <Link href="/forgot-password"><Button className="w-full">재설정 다시 요청</Button></Link>
      </AuthFrame>
    );
  }
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = resetPasswordSchema.safeParse({
      password: String(form.get("password") ?? ""),
      confirmPassword: String(form.get("confirmPassword") ?? ""),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "");
      return;
    }
    const supabase = createBrowserSupabase();
    const { error: updateError } = await supabase!.auth.updateUser({ password: parsed.data.password });
    if (updateError) {
      setError("비밀번호를 바꾸지 못했습니다. 링크가 만료됐을 수 있습니다.");
      return;
    }
    await supabase!.auth.signOut();
    await fetch("/api/auth/recovery", { method: "DELETE" });
    router.replace("/login");
  }
  return (
    <AuthFrame title="새 비밀번호" description="변경이 끝나면 다시 로그인합니다.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <Input name="password" label="새 비밀번호" passwordToggle autoComplete="new-password" />
        <Input name="confirmPassword" label="비밀번호 확인" passwordToggle autoComplete="new-password" />
        {error ? <Alert tone="error">{error}</Alert> : null}
        <Button type="submit" className="w-full">변경하고 로그아웃</Button>
      </form>
    </AuthFrame>
  );
}
