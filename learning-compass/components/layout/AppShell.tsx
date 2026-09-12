"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Alert, Button, Modal, Skeleton, ToastViewport } from "@/components/ui";
import { useLearning } from "@/components/app/LearningProvider";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { LEGACY_USER_STORAGE_KEY } from "@/lib/domain/ids";

const NAV = [
  { href: "/learn", label: "오늘" },
  { href: "/path", label: "학습 경로" },
  { href: "/history", label: "기록" },
  { href: "/settings", label: "설정" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { mode, basePath, state, saveStatus, toast, setToast, conflict, ready, saveNow, exportJson, online } = useLearning();
  const pathname = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const name = state.profile?.displayName || (mode === "guest" ? "게스트" : "학습자");
  const initial = name.slice(0, 1);
  const saveLabel =
    saveStatus === "saving"
      ? "저장 중"
      : saveStatus === "saved"
        ? "저장됨"
        : saveStatus === "failed"
          ? "저장 실패"
          : saveStatus === "conflict"
            ? "동기화 충돌"
            : saveStatus === "offline"
              ? "네트워크 끊김"
              : "";

  if (!ready) {
    return (
      <div className="mx-auto max-w-[1120px] p-8">
        <p className="helper mb-4">기록을 복구 중입니다.</p>
        <Skeleton className="h-24" />
        <Skeleton className="mt-4 h-64" />
      </div>
    );
  }

  const nav = NAV.map((item) => ({ ...item, href: `${basePath}${item.href}` }));

  async function logout() {
    const supabase = createBrowserSupabase();
    await supabase?.auth.signOut();
    router.push("/");
  }

  return (
    <div className="min-h-full bg-background">
      {mode === "demo" ? (
        <div className="bg-warning px-4 py-2 text-center text-[14px] text-white">예시 학습 기록으로 체험 중</div>
      ) : null}
      <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 md:px-8">
        <div className="flex items-center gap-3">
          <button className="h-12 w-12 lg:hidden" aria-label="메뉴" onClick={() => setDrawer(true)}>
            메뉴
          </button>
          <Link href={mode === "demo" ? "/demo" : "/"} className="font-semibold">
            AI 학습 나침반
          </Link>
        </div>
        <div className="flex items-center gap-3 text-[14px]">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">{initial}</span>
          <span>{name}</span>
          {mode === "guest" ? <span className="helper">이 브라우저에 저장됨</span> : null}
          <span className="helper" aria-live="polite">
            {saveLabel}
          </span>
        </div>
      </header>
      <div className="mx-auto flex max-w-[calc(var(--content)+var(--sidebar)+64px)]">
        <aside className="hidden w-[224px] shrink-0 border-r border-border lg:flex lg:min-h-[calc(100vh-64px)] lg:flex-col lg:p-4">
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-12 items-center rounded-[10px] px-3 ${pathname === item.href ? "bg-background font-semibold" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto space-y-2 p-2">
            {mode === "member" ? (
              <Button variant="ghost" className="w-full" onClick={() => setLogoutOpen(true)}>
                로그아웃
              </Button>
            ) : (
              <Link href="/signup" className="helper block">
                계정으로 저장
              </Link>
            )}
          </div>
        </aside>
        <main id="main" className="min-w-0 flex-1 px-4 py-6 pb-24 md:px-8 lg:px-8 lg:pb-8">
          {!online ? <Alert tone="warning">네트워크가 끊겼습니다. 초안은 화면에 유지됩니다.</Alert> : null}
          {conflict ? (
            <Alert tone="error">
              다른 창이나 기기에서 기록이 변경됐습니다.
              <div className="mt-2 flex gap-2">
                <Button onClick={() => window.location.reload()}>최신 기록 불러오기</Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const blob = new Blob([exportJson()], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "learning-draft.json";
                    a.click();
                  }}
                >
                  현재 초안 내보내기
                </Button>
              </div>
            </Alert>
          ) : null}
          <div className="mx-auto max-w-[1120px]">{children}</div>
        </main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        {nav.map((item) => (
          <Link key={item.href} href={item.href} className="flex flex-1 items-center justify-center text-[12px]">
            {item.label}
          </Link>
        ))}
      </nav>
      {drawer ? (
        <div className="fixed inset-0 z-40 bg-text/40 lg:hidden">
          <div className="h-full w-[224px] bg-surface p-4">
            <Button variant="ghost" onClick={() => setDrawer(false)}>
              닫기
            </Button>
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="mt-2 flex h-12 items-center" onClick={() => setDrawer(false)}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      <Modal open={logoutOpen} title="로그아웃" onClose={() => setLogoutOpen(false)}>
        <p className="helper">미저장 초안이 있으면 먼저 저장하거나 내보낼 수 있습니다. 저장 실패를 성공으로 숨기지 않습니다.</p>
        <div className="mt-4 flex flex-col gap-2">
          <Button
            onClick={async () => {
              const ok = await saveNow();
              if (ok) await logout();
              else setToast("저장에 실패했습니다. 내보내기 후 로그아웃할 수 있습니다.");
            }}
          >
            저장 후 로그아웃
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              const blob = new Blob([exportJson()], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "learning-export.json";
              a.click();
            }}
          >
            내보내기
          </Button>
          <Button variant="ghost" onClick={() => setLogoutOpen(false)}>
            취소
          </Button>
        </div>
      </Modal>
      <ToastViewport message={toast} onClear={() => setToast(null)} />
    </div>
  );
}

export function GuestLegacyBanner() {
  const { legacyOffer, dismissLegacyOffer, importJson, setToast } = useLearning();
  if (!legacyOffer) return null;
  return (
    <Alert tone="warning">
      이 브라우저에 예전 기록이 있습니다. 회원 데이터로 자동 처리하지 않습니다.
      <div className="mt-2 flex gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            const raw = window.localStorage.getItem(LEGACY_USER_STORAGE_KEY);
            if (raw) {
              const error = importJson(raw);
              setToast(error ?? "게스트 기록으로 옮겼습니다.");
            }
            dismissLegacyOffer();
          }}
        >
          게스트 기록으로 가져오기
        </Button>
        <Button variant="ghost" onClick={dismissLegacyOffer}>
          닫기
        </Button>
      </div>
    </Alert>
  );
}
