# 구현 상태

작성일: 2026-09-10. 앱 코드는 `learning-compass/`.

## 실행한 명령

| 명령 | 결과 |
|---|---|
| `npm run lint` | 성공. 경고 4건(hooks exhaustive-deps). 오류 0 |
| `npx tsc --noEmit` | 성공 |
| `npm run test` (vitest run) | 성공. 4 파일, 19 테스트 |
| `npm run test:e2e` (playwright) | 성공. 2 테스트(게스트 핵심 흐름, 데모 격리) |
| `npm run build` | 성공(Next.js 16.3.4). 저장 상태 표시 수정 이후에는 이 환경에서 재실행하지 않음. typecheck는 이후에도 성공 |
| `npm run check:config` | 성공. 값은 출력하지 않음 |

## v2.0 완료 보고

### 1. 학습 흐름 — 구현됨, 핵심 검증 통과

온보딩, 진단, 오늘 과제, 수행, 확인문제, 보충, 경로, 기록, 데모가 연결되어 있다. 콘텐츠 18개 과제에 설명·예제·힌트·확인문제·해설이 있다. 키 없이 데모/게스트 학습이 된다.

단위 테스트: 동일 추천, 진단은 provisional, 선수 미완료 방지, base 실패→remedial, 통과→다음 개념, 시간 부족이 진도를 지우지 않음, 동일 sessionId 중복 방지, 콘텐츠 DAG·choiceId, import 거절, 데모/게스트 키 분리.

E2E: 신규 게스트 진단→기본 실패→보충 통과→다음 개념→새로고침 유지. 기존 게스트 데이터가 데모 초기화 후에도 유지.

### 2. 인증 — 구현됨, 실제 연결 미검증

`/signup` `/login` `/verify-email` `/forgot-password` `/reset-password` `/auth/confirm` `/account` UI와 오류 분기를 구현했다. Supabase가 없으면 ‘계정 기능을 준비 중입니다’를 보여 주고 가짜 가입 성공을 표시하지 않는다.

미검증: 실제 이메일 발송, 링크 만료/재사용, 잘못된 비밀번호·429·네트워크의 실서버 동작, recovery 쿠키의 실계정 왕복, 로그아웃 후 다른 계정 로그인.

`check:config`: `NEXT_PUBLIC_SUPABASE_URL` missing, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` missing, `AUTH_FLOW_SECRET` missing.

### 3. 데이터 격리·동기화 — SQL/모의 계약 완료, 실제 DB 미검증

`supabase/migrations/0001_learning_compass.sql`: RLS SELECT 본인만, 직접 INSERT/UPDATE/DELETE 회수, SECURITY DEFINER + `search_path=''`, authenticated만 RPC execute. `save_learning_state` revision 조건부 저장, `reserve_ai_request` 한도·잠금 순서.

GET/PUT `/api/learning-state`, 409 충돌 UI, 게스트 이전 제안, JSON 가져오기 검증을 구현했다.

미검증: 사용자 A/B 계정 격리, anon SELECT 거절, 같은 revision 동시 저장 경쟁, 실제 회원 동기화.

### 4. 실제 AI — 경로 구현, live 연결 미검증

Claude 서버 전용 어댑터(`@anthropic-ai/sdk`, `output_config` JSON Schema), 데모 피드백, Zod·의미 검증, fallback, 한도 RPC, 401/403/429 시 공급자 미호출 분기를 구현했다. `check:config`: `ANTHROPIC_API_KEY=missing`, `ANTHROPIC_MODEL=missing`. 실제 live 호출은 이 작업에서 실행하지 않았다.

미검증: live Claude 호출 성공, 분당/일일 한도의 실DB 원자성, 실제 타임아웃 20초.

### 5. UI 검증 — 구현됨, 뷰포트 수동 확인은 미검증

필수 화면과 상태(복구 skeleton, 저장 중/저장됨/실패, 네트워크, AI 대기, 빈 상태, 없는 taskId)를 구현했다. Playwright는 데스크톱 Chromium에서 핵심 흐름만 확인했다.

미검증: 390/768/1440px 수동 브라우저 확인, 모달 포커스 트랩의 기기별 확인.

## 19절 요구사항 표

| 항목 | 구현 | 실제 검증 |
|---|---|---|
| 가입 입력 오류·인증 대기 | 예 | 모의/UI만. 실메일 미검증 |
| 인증 링크 정상·만료·type·next | 예 | 코드 경로만. 실링크 미검증 |
| 로그인 오류·복구 | 예 | 실서버 미검증 |
| 재설정 recovery | 예 | AUTH_FLOW_SECRET 없음. 미검증 |
| 계정 격리 A/B | SQL/RLS 작성 | 실DB 미검증 |
| DB 경쟁 revision | SQL 작성 | 실DB 미검증 |
| 로그아웃·세션 만료 | UI 작성 | 실세션 미검증 |
| 게스트 이전 | UI 작성 | 회원 계정 없이 미검증 |
| AI 한도·중복 requestId | SQL/API 작성 | 실호출 0회 |
| 비밀 비노출 | 서버 전용 키, check:config 값 미출력 | 번들 전수 스캔은 미실시 |
| 반응형 화면 | 구현 | 수동 뷰포트 미검증 |

## 한계

코드 실행 채점, 전체 IT 과정, 공개 운영 준비는 완료되지 않았다. 스키마를 맞춘 모델 응답이 내용의 정확성을 보장하지 않는다. 활성 시간은 근사치다.
