"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLearning, useLearningActions } from "@/components/app/LearningProvider";
import { Alert, Button, Card, Input, Modal, PageTitle } from "@/components/ui";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { GUEST_STORAGE_KEY } from "@/lib/domain/ids";

export function SettingsScreen() {
  const { mode, state, importJson, exportJson, resetAll, restoreDemo, saveStatus, guestMigrateOffer, applyGuestToAccount, dismissGuestMigrate } = useLearning();
  const { changeMinutes } = useLearningActions();
  const [email, setEmail] = useState("");
  const [name, setName] = useState(state.profile?.displayName ?? "");
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmImport, setConfirmImport] = useState<string | null>(null);
  const [importError, setImportError] = useState("");
  const [ai, setAi] = useState<{ mode: string; remainingToday?: number } | null>(null);

  useEffect(() => {
    fetch("/api/ai/status").then((res) => res.json()).then(setAi).catch(() => setAi(null));
    createBrowserSupabase()?.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  return (
    <div className="space-y-6">
      <PageTitle>설정</PageTitle>
      {guestMigrateOffer !== "none" ? (
        <Alert>
          이 브라우저의 기록을 계정으로 가져올까요? {guestMigrateOffer === "existing-account" ? "계정에 이미 기록이 있어 기본은 유지입니다." : "계정 기록이 비어 있습니다."}
          <div className="mt-2 flex gap-2">
            {guestMigrateOffer === "empty-account" || guestMigrateOffer === "existing-account" ? (
              <Button onClick={() => void applyGuestToAccount()}>가져오기</Button>
            ) : null}
            <Button variant="ghost" onClick={dismissGuestMigrate}>지금은 유지</Button>
          </div>
        </Alert>
      ) : null}
      <Card className="space-y-3">
        <h2 className="font-semibold">프로필</h2>
        {mode === "member" ? <p>이메일: {email || "확인 중"}</p> : <p className="helper">게스트는 이 브라우저에 저장됩니다.</p>}
        <Input label="표시 이름" value={name} maxLength={20} onChange={(e) => setName(e.target.value)} />
        {mode === "member" ? (
          <>
            <Button
              variant="secondary"
              onClick={async () => {
                if (email) await createBrowserSupabase()?.auth.resetPasswordForEmail(email);
              }}
            >
              비밀번호 재설정 요청
            </Button>
            <Link href="/account"><Button variant="ghost">계정</Button></Link>
          </>
        ) : (
          <div className="flex gap-2">
            <Link href="/signup"><Button>가입</Button></Link>
            <Link href="/login"><Button variant="secondary">로그인</Button></Link>
          </div>
        )}
      </Card>
      <Card>
        <h2 className="font-semibold">학습 설정</h2>
        <div className="mt-3 flex gap-2">
          {([15, 30, 45] as const).map((value) => (
            <Button key={value} variant={state.profile?.sessionMinutes === value ? "primary" : "secondary"} onClick={() => changeMinutes(value)}>
              {value}분
            </Button>
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="font-semibold">AI 이용 현황</h2>
        <p className="mt-2">상태: {ai?.mode ?? "확인 중"}</p>
        {typeof ai?.remainingToday === "number" ? <p>오늘 남은 요청: {ai.remainingToday}</p> : <p className="helper">남은 횟수는 로그인 회원에게만 표시됩니다.</p>}
      </Card>
      <Card className="space-y-3">
        <h2 className="font-semibold">데이터 관리</h2>
        <p className="helper">저장 상태: {saveStatus}. 학습 데이터만 내보내며 쿠키·토큰·이메일·API 키는 넣지 않습니다.</p>
        <Button
          variant="secondary"
          onClick={() => {
            const blob = new Blob([exportJson()], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "learning-compass.json";
            a.click();
          }}
        >
          JSON 내보내기
        </Button>
        <input
          type="file"
          accept="application/json"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const raw = await file.text();
            setConfirmImport(raw);
          }}
        />
        {importError ? <Alert tone="error">{importError}</Alert> : null}
        {mode === "demo" ? <Button onClick={restoreDemo}>데모 초기화</Button> : (
          <Button variant="danger" onClick={() => setConfirmReset(true)}>학습 초기화</Button>
        )}
        {mode === "member" ? (
          <Button
            variant="ghost"
            onClick={() => {
              window.localStorage.removeItem(GUEST_STORAGE_KEY);
            }}
          >
            가져온 뒤 게스트 기록 삭제 제안 실행
          </Button>
        ) : null}
      </Card>
      <Modal open={confirmReset} title="학습을 초기화할까요?" onClose={() => setConfirmReset(false)}>
        <p>기록이 비워지고 되돌릴 수 없습니다.</p>
        <div className="mt-4 flex gap-2">
          <Button variant="danger" onClick={() => { resetAll(); setConfirmReset(false); }}>초기화</Button>
          <Button variant="ghost" onClick={() => setConfirmReset(false)}>취소</Button>
        </div>
      </Modal>
      <Modal open={Boolean(confirmImport)} title="가져오면 현재 기록을 덮어씁니다" onClose={() => setConfirmImport(null)}>
        <p>잘못된 JSON이면 기존 데이터는 그대로 둡니다.</p>
        <div className="mt-4 flex gap-2">
          <Button
            onClick={() => {
              if (!confirmImport) return;
              const error = importJson(confirmImport);
              setImportError(error ?? "");
              setConfirmImport(null);
            }}
          >
            덮어쓰기
          </Button>
          <Button variant="ghost" onClick={() => setConfirmImport(null)}>취소</Button>
        </div>
      </Modal>
    </div>
  );
}

export function AccountScreen() {
  const [email, setEmail] = useState("");
  const router = useRouter();
  useEffect(() => {
    createBrowserSupabase()?.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace("/login");
      setEmail(data.user?.email ?? "");
    });
  }, [router]);
  return (
    <div className="space-y-4">
      <PageTitle>계정</PageTitle>
      <Card>
        <p>이메일: {email}</p>
        <Link href="/settings"><Button className="mt-4">설정으로</Button></Link>
      </Card>
    </div>
  );
}
