# 구현 결정

- 기존 저장소에는 `CURSOR_BUILD_SPEC.md`만 있었고 앱 코드는 없었다. Next.js 앱은 npm 이름 제약 때문에 `learning-compass/`에 생성했다.
- Next.js 16.3.4 + App Router + TypeScript + Tailwind CSS 4 + Zod 4. 공식 create-next-app 기본값을 따랐다.
- Next.js 16 관례에 따라 세션 갱신은 `proxy.ts`와 `@supabase/ssr`의 `getClaims`를 사용한다. 비밀번호 변경과 live AI 요청은 `getUser`로 현재 사용자를 확인한다.
- AI는 Claude만 구현한다. `@anthropic-ai/sdk`의 `messages.create`와 `output_config.format` JSON Schema를 사용한다. 환경변수는 `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`로 통일한다. 모델 ID는 `ANTHROPIC_MODEL`만 본다.
- 시스템 한글 폰트를 쓰고 next/font 외부 다운로드는 제거했다.
- 회원 AppState는 계정당 스냅샷 1개(`learning_states`)로 저장한다. 장기 통계 모델이라고 주장하지 않는다.
- `.env.local`의 기존 비밀 값은 읽거나 덮어쓰지 않았다. 운영자가 `ANTHROPIC_API_KEY`와 `ANTHROPIC_MODEL`을 직접 넣는다.
