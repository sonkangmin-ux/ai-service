# AI 학습 나침반

IT 입문자가 목표와 수행 결과로 지금 할 과제를 정하고, 막힌 부분만 보충하며 작은 결과물까지 완주하도록 돕는 학습 앱입니다. 첫 과정은 Python 입문이며, 최종 목표는 점수 목록에서 합격자 수와 평균을 계산하는 함수를 만드는 것입니다.

이 앱은 범용 AI보다 더 똑똑하다고 주장하지 않습니다. 준비된 과제, 수행 기록, 선수관계, 재도전, 변화 이유를 한 흐름으로 제공합니다. 코드는 실행하지 않으며, 확인문제와 AI 검토는 실행 통과와 다릅니다.

## 필요 환경

- Node.js 24.x (개발 시 24.18.1에서 확인)
- npm 11.x

실제 패키지 버전은 `package.json`을 따릅니다. 현재 앱은 Next.js 16.3.4, React 19.2.8, Tailwind CSS 4, Zod 4.6.1, `@supabase/ssr` 0.12.7, `@anthropic-ai/sdk` 0.124.0을 사용합니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 을 엽니다.

## 데모 체험

시작 화면의 **3분 데모** 또는 http://localhost:3000/demo 로 들어갑니다. 데모는 별도 저장소를 쓰며 회원/게스트 기록을 덮어쓰지 않습니다. 상단에 ‘예시 학습 기록으로 체험 중’이 유지됩니다.

게스트는 **가입 없이 체험**으로 온보딩을 시작할 수 있습니다. 기록은 이 브라우저의 localStorage에만 남습니다.

## 실제 AI 설정

`.env.example`을 `.env.local`로 복사한 뒤 운영자가 값을 넣습니다. 채팅 서비스 구독은 이 앱의 API 키가 아닙니다.

```dotenv
AI_MODE=live
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=
```

모델 ID는 Anthropic 콘솔에서 현재 이용 가능한 값을 확인하세요. 키가 없거나 `AI_MODE=demo`이면 피드백은 예시/기본 안내입니다. Anthropic 키는 서버에만 두고 `NEXT_PUBLIC_`·localStorage·클라이언트 코드·응답·로그에 넣지 마세요.

자세한 절차는 `SETUP.md`를 봅니다.

## Netlify

저장소 루트가 Next.js 앱입니다. Base directory는 비워 두고 Build command는 `npm run build`입니다. 환경변수는 Netlify 콘솔에 넣으며 `.env.local`은 올리지 않습니다. `APP_URL`은 배포 주소로 바꿉니다.

## 테스트

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
npm run check:config
```

`check:config`는 변수명과 configured/missing/invalid만 출력하며 키 값은 출력하지 않습니다.

## 저장 방식

- 게스트: `learning-compass:guest:v1` localStorage
- 데모: `learning-compass:demo:v1` localStorage
- 회원: Supabase `learning_states.payload` (원본은 DB). 브라우저에 학습 본문을 영구 캐시하지 않습니다.

회원가입·로그인·비밀번호 재설정은 Supabase Auth입니다. `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`가 없으면 가입/로그인 화면에 ‘계정 기능을 준비 중입니다’를 보여 주고 가짜 가입 성공을 표시하지 않습니다. 콘솔 절차는 `SETUP.md`를 봅니다.

## 검증 여부

구현 시점 기준:

- 학습 흐름(게스트·데모·추천 규칙·콘텐츠): 단위 테스트와 가능한 E2E로 검증
- 실제 인증(이메일 확인·로그인 복구): 외부 Supabase 프로젝트 없음 → **미검증**
- 실제 DB/RLS/계정 격리: SQL과 모의 계약만 검토 → **미검증**
- 실제 Claude 호출: live 설정·키를 이 작업에서 검증하지 않음 → **미검증**

현재 한계는 `IMPLEMENTATION_STATUS.md`에 있습니다. 코드 실행 채점, 전체 IT 과정, 공개 운영 준비는 완료되지 않았습니다.
