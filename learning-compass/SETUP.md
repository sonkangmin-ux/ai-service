# 운영자 설정

비밀 값을 채팅·git·스크린샷으로 공유하지 마세요. `.env.example`을 `.env.local`로 복사한 뒤 운영자 기기에서만 채웁니다.

## 1. 패키지

Node.js 설치 후 `learning-compass`에서 `npm install`을 실행합니다.

## 2. Supabase 프로젝트

운영자가 Supabase 프로젝트를 만듭니다. 연결 정보가 없으면 이 저장소만으로 프로젝트가 생성된 것이 아닙니다.

`.env.local`에 다음을 넣습니다.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

publishable key는 공개용 식별 키입니다. secret/service-role 키는 이 앱에서 사용하지 않습니다.

## 3. 마이그레이션

`supabase/migrations/0001_learning_compass.sql`을 새 개발용 DB에 실행합니다. 기존 DB면 적용 전 충돌과 기존 데이터 영향을 확인하고 destructive reset을 실행하지 않습니다. RLS 활성화와 anon 쓰기 거절을 확인합니다.

## 4. Auth

Email/password를 켜고 이메일 확인을 활성화합니다. 비밀번호 최소 길이를 12로 맞춥니다. Auth Site URL을 `APP_URL`(로컬 기본 `http://localhost:3000`)로 두고 인증·recovery redirect만 허용 목록에 넣습니다. 광범위 wildcard는 로컬 시연에 필요하지 않습니다.

## 5. 이메일 템플릿

공식 SSR 방식에 맞춰 `/auth/confirm`으로 이어지는 `token_hash`와 `type` 링크를 사용합니다. signup/email과 recovery를 혼동하지 않습니다. `token_hash`를 일반 next 파라미터나 로그에 복사하지 않습니다. 웹메일 미리보기로 링크가 이미 사용된 경우 재요청 경로(`/verify-email`, `/forgot-password`)를 제공합니다.

## 6. 메일 테스트

로컬 Supabase 메일함 또는 운영자가 통제하는 개발용 이메일만 사용합니다. 실제 사용자에게 메일을 보내는 통합 테스트는 하지 않습니다. 호스팅 환경의 기본 발송 제한은 콘솔·공식 문서로 확인하고, 필요할 때 운영자가 custom SMTP를 설정합니다. SMTP 비밀번호는 Supabase 콘솔에서만 관리합니다.

## 7. AUTH_FLOW_SECRET

운영자 기기에서 생성합니다.

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

나온 값은 `.env.local`에만 넣습니다. 이 값이 없으면 비밀번호 recovery 완료 기능은 비활성화됩니다. 서명 없는 쿠키로 우회하지 않습니다.

## 8. Claude

Anthropic 콘솔에서 API 키를 만들고, 현재 이용 가능한 모델 ID를 `ANTHROPIC_MODEL`에 넣습니다. 키는 `ANTHROPIC_API_KEY`에만 두고 `AI_MODE=live`로 바꾼 뒤 서버를 재시작합니다. 채팅 구독은 API 키를 대신하지 않습니다. 가격·무료 할당량은 앱에 하드코딩하지 않으니 공급자 콘솔을 확인하세요.

환경변수 `AI_USER_DAILY_LIMIT` / `AI_GLOBAL_DAILY_LIMIT`는 앱 측 추가 상한입니다. DB `private.app_limits`도 따로 적용되므로, 한도를 올리려면 환경변수와 DB를 함께 바꿉니다.

## 9. 개발용 확인

가입 → 메일 인증 → 로그인 → 피드백 한 번 → 로그아웃 → 재로그인 복구를 확인합니다. 키가 설정됐다는 사실과 실제 호출 성공은 구분합니다. 오류에는 ‘설정 필요/사용 한도/일시적 연결 오류’만 보여 주고 원본 비밀은 노출하지 않습니다.

## 10. 호스팅

이번 작업에서 production 호스팅은 실행하지 않습니다. 추후 호스팅 시 환경변수, HTTPS, 정확한 APP_URL/redirect, 메일 발송, RLS·사용량 제한을 그 환경에서 확인해야 합니다.

## 설정 조합

- Supabase 없음: 게스트와 데모. 가입/로그인은 준비 중. live AI 금지.
- Supabase 정상·Claude 없음: 가입·로그인·동기화 가능, 피드백은 예시/기본 안내.
- Supabase 정상·Claude 정상: 인증 회원에게 실제 AI 허용, 게스트는 예시/기본 안내.
- Supabase 일시 장애: 회원 저장 실패 표시, 초안 메모리 보존. 게스트 자동 전환이나 로그인 성공 위장 없음.
- AUTH_FLOW_SECRET 없음: recovery 완료 비활성화.
