"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { LearningProvider, useLearning, type AppMode } from "@/components/app/LearningProvider";
import { AppShell, GuestLegacyBanner } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/config";
import { GUEST_MODE_KEY, GUEST_STORAGE_KEY } from "@/lib/domain/ids";
import { createBrowserSupabase } from "@/lib/supabase/client";

function Gate({ children }: { children: ReactNode }) {
  const { ready, state, mode, basePath } = useLearning();
  const pathname = usePathname();
  const router = useRouter();
  const path = pathname.replace(/^\/demo/, "") || "/";

  useEffect(() => {
    if (!ready) return;
    const learningPaths = ["/learn", "/task", "/path", "/history", "/settings", "/diagnosis"];
    const needsProfile = learningPaths.some((item) => path === item || path.startsWith("/task"));
    if (needsProfile && !state.profile) router.replace(`${basePath}/onboarding`);
  }, [ready, state.profile, path, router, basePath]);

  if (!ready) {
    return (
      <div className="p-8">
        <p className="helper mb-4">기록을 복구 중입니다.</p>
        <Skeleton className="h-40" />
      </div>
    );
  }
  return (
    <AppShell>
      {mode === "guest" ? <GuestLegacyBanner /> : null}
      {children}
    </AppShell>
  );
}

async function detectMember(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = createBrowserSupabase();
  if (!supabase) return false;
  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error("auth-timeout")), 2500);
      }),
    ]);
    return Boolean(result.data.user);
  } catch {
    return false;
  }
}

export function AppSession({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mode, setMode] = useState<AppMode | null>(() =>
    pathname.startsWith("/demo") ? "demo" : null,
  );

  useEffect(() => {
    if (pathname.startsWith("/demo")) return;
    let cancelled = false;
    const run = async () => {
      const member = await detectMember();
      if (cancelled) return;
      if (member) {
        setMode("member");
        return;
      }
      const guest = window.localStorage.getItem(GUEST_MODE_KEY) || window.localStorage.getItem(GUEST_STORAGE_KEY);
      if (guest || pathname === "/onboarding") {
        window.localStorage.setItem(GUEST_MODE_KEY, "guest");
        setMode("guest");
        return;
      }
      router.replace("/login");
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (!mode) {
    return (
      <div className="p-8">
        <p className="helper mb-4">기록을 복구 중입니다.</p>
        <Skeleton className="h-40" />
      </div>
    );
  }
  return (
    <LearningProvider mode={mode}>
      <Gate>{children}</Gate>
    </LearningProvider>
  );
}
