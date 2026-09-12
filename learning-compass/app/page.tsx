"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";
import { DEMO_STORAGE_KEY, GUEST_MODE_KEY, GUEST_STORAGE_KEY } from "@/lib/domain/ids";
import { createBrowserSupabase } from "@/lib/supabase/client";

export default function HomePage() {
  const router = useRouter();
  const [hasRecord, setHasRecord] = useState(false);

  useEffect(() => {
    const guest = Boolean(
      window.localStorage.getItem(GUEST_STORAGE_KEY) || window.localStorage.getItem(DEMO_STORAGE_KEY),
    );
    queueMicrotask(() => setHasRecord(guest));
    const supabase = createBrowserSupabase();
    supabase?.auth
      .getUser()
      .then(({ data }) => {
        if (data.user) setHasRecord(true);
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className="min-h-full bg-background">
      <header className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-5 md:px-8">
        <span className="font-semibold">AI 학습 나침반</span>
        <Link href="/login" className="text-primary">
          로그인
        </Link>
      </header>
      <main id="main" className="mx-auto max-w-[720px] px-5 py-12 md:px-8">
        <h1 className="page-title">지금 무엇을 공부할지, 수행 결과로 정하세요.</h1>
        <p className="mt-3 text-[16px] leading-[26px]">Python 기초를 연습하고 작은 프로그램을 완성합니다.</p>
        <p className="helper mt-2">무료는 앱 이용료가 없다는 의미이며 AI 요청에는 한도가 있습니다.</p>
        <div className="mt-8 flex flex-col gap-3">
          <Button className="w-full" onClick={() => router.push("/signup")}>
            무료로 시작하기
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              window.localStorage.setItem(GUEST_MODE_KEY, "guest");
              router.push("/onboarding");
            }}
          >
            가입 없이 체험
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => router.push("/demo")}>
            3분 데모
          </Button>
          {hasRecord ? (
            <Button variant="secondary" className="w-full" onClick={() => router.push("/learn")}>
              이어서 학습
            </Button>
          ) : null}
        </div>
        <Card className="mt-10">
          <p className="helper">
            이번 과정은 Python 입문 하나입니다. 장기 직무 경로를 생성하지 않으며, 점수 목록에서 합격자 수와 평균을 계산하는 함수 만들기를 목표로 합니다.
          </p>
        </Card>
      </main>
    </div>
  );
}
