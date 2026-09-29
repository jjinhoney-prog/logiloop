# 로지루프 · LogiLoop

화주의 물류거점 선택을 돕는 Next.js(App Router · TypeScript) 플랫폼입니다. 물류사 후보 연결, 같은 조건의 비교, 직접 임차·3PL 위탁·혼합 운영 검토까지 3단계 상담을 제공합니다.

- **배포 주소**: https://logiloop.vercel.app
- **저장소**: https://github.com/jjinhoney-prog/logiloop

> 업체·매물·고객은 모두 가상 예시 데이터입니다. 창고 좌표는 권역 대표 중심점이며 실제 매물 위치가 아닙니다.

## 과제 요약

- **프로젝트**: 화주의 물류거점 선택을 돕는 로지루프
- **적용 API**: Resend(상담 접수 시 담당자 메일로 즉시 전달), 카카오맵·카카오모빌리티(창고 위치와 항만·IC 접근성)
- **조사 과정**: AI와 후보 API를 비교한 뒤 리드 수집과 거점 판단에 직결되는 API를 선정

## 외부 API 선정 과정 (AI 협업 조사)

AI와 대화하며 후보 API를 정리하고, 두 가지 기준으로 골랐습니다.

1. 실제 영업 성과(상담 리드 확보)에 바로 연결되는가
2. 화주가 거점을 고를 때 실제로 보는 판단 기준을 보여 주는가

| 후보 | 용도 | 결정 | 이유 |
| --- | --- | --- | --- |
| **Resend** | 상담·파트너 신청을 담당자 메일로 전달 | **채택** | 폼 제출이 곧바로 담당자에게 도착해 리드 수집에 직결됩니다. 서버 코드 몇 줄로 연동되고, DB 없이도 접수를 시작할 수 있습니다. |
| **카카오맵 JS SDK** | 창고 상세의 위치 지도 | **채택** | 국내 지도 품질과 한글 지명 표기가 좋고, 창고와 주요 거점의 위치 관계를 한눈에 보여 줍니다. |
| **카카오모빌리티 길찾기** | 거점까지 차량 거리·소요 시간 | **채택** | 화주가 거점을 판단할 때 핵심인 항만·공항·IC 접근성을 실제 도로 기준 숫자로 제시합니다. |
| V-World | 용도지역 등 공간정보 | 차기 검토 | 인허가·용도 검토에 유용하지만 이번 범위(리드 수집·접근성)보다 후속 단계에 가깝습니다. |

## 아키텍처

```
[브라우저] ─ 신청하기 ─▶ POST /api/inquiry ─▶ Resend ─▶ 담당자 메일
                         (서버 재검증 · 허니팟 · IP당 1분 3회 · HTML 이스케이프 · 저장 없음)

[브라우저] ─ 상세 페이지 ─▶ 카카오맵 JS SDK ─▶ 지도·거점 표시

[브라우저] ─ 상세 페이지 ─▶ GET /api/distance?id=매물ID ─▶ 카카오모빌리티 길찾기(거점 5곳)
                         (좌표는 서버에서 매물 ID로 조회 · 결과 1일 캐시 · 거점별 실패는 ‘확인 불가’)
```

- 비밀 키(`RESEND_API_KEY`, `KAKAO_REST_KEY`)는 서버 코드(`app/api/*/route.ts`)에서만 사용합니다.
- 카카오맵 JavaScript 키만 브라우저에 노출됩니다(`NEXT_PUBLIC_`). 카카오 앱에 등록한 도메인에서만 동작합니다.
- 키가 없거나 외부 API가 실패해도 화면은 동작합니다. 상담은 준비서 다운로드를, 지도는 ‘지도 설정 전’ 안내를, 거리표는 ‘거리 계산 설정 전’ 또는 ‘확인 불가’를 표시합니다.

| 파일 | 역할 |
| --- | --- |
| `app/api/inquiry/route.ts` · `lib/inquiry-email.ts` · `lib/rate-limit.ts` | 상담 접수 API, 메일 제목·본문 생성, 요청 제한 |
| `app/api/distance/route.ts` · `lib/distance.ts` | 거리 계산 API, 카카오모빌리티 호출·단위 변환 |
| `components/inquiry/inquiry-form.tsx` | 신청 폼, 전송·완료 모달·실패 토스트 |
| `components/detail/kakao-map.tsx` · `distance-table.tsx` · `location-section.tsx` | 지도, 거리표, ‘위치·접근성’ 섹션 |

## 환경변수

값은 `.env.local`(로컬)과 Vercel 환경변수에만 넣습니다. 저장소에는 이름만 있는 `.env.example`이 있습니다.

| 변수 | 사용 위치 | 설명 |
| --- | --- | --- |
| `RESEND_API_KEY` | 서버 전용 | Resend API 키 |
| `INQUIRY_TO_EMAIL` | 서버 전용 | 신청 메일을 받을 주소. 쉼표로 여러 개 |
| `NEXT_PUBLIC_KAKAO_MAP_KEY` | 브라우저 | 카카오맵 JavaScript 키 (도메인 등록으로 보호) |
| `KAKAO_REST_KEY` | 서버 전용 | 카카오 REST API 키 (카카오모빌리티 길찾기) |

- Resend는 발신 도메인 인증 전 **테스트 모드**(`onboarding@resend.dev`)입니다. 테스트 모드에서는 **Resend에 가입한 이메일 주소로만** 받을 수 있습니다.
- 카카오 개발자 콘솔의 JavaScript SDK 도메인(Web 사이트 도메인)에 `http://localhost:3000`과 배포 도메인을 등록해야 지도가 표시됩니다.

## 로컬 실행

Node.js 20.19 이상과 npm이 필요합니다.

```bash
npm ci
cp .env.example .env.local   # 값 채우기 (없어도 실행은 됨)
npm run dev                  # http://localhost:3000
```

```bash
npm run check   # lint → typecheck → 단위 테스트(Vitest) → build
npm run e2e     # Playwright E2E + axe 접근성 (처음 한 번: npx playwright install chromium)
```

테스트는 외부 API를 실제로 호출하지 않습니다. 단위 테스트는 Resend·카카오를 mock 처리하고, E2E 서버는 API 키를 비운 상태로 실행합니다.

## 배포 (Vercel)

1. Vercel에서 이 GitHub 저장소를 Import합니다. Framework는 Next.js 기본값을 사용합니다.
2. **Settings → Environment Variables**에 위 4개 변수를 등록합니다. 비밀 키는 Sensitive로 등록합니다.
3. Deploy 후 **Settings → Domains**의 주소를 카카오 앱 도메인에 추가합니다.
4. 이후 `main`에 push하면 자동으로 다시 배포됩니다. GitHub Actions가 lint·타입 검사·테스트·빌드·E2E를 실행합니다.

## 화면

| 경로 | 기능 |
| --- | --- |
| `/` | 3가지 상담 입구, 진행 과정, 공급 예시, 가이드 |
| `/warehouses` · `/partners` | 지역·온도·면적·검색어 필터, 정렬, 비교함 담기 |
| `/warehouses/[id]` · `/partners/[id]` | 조건, 확인 상태, **위치·접근성(지도·거점별 거리)**, 문의 연결 |
| `/compare` | 최대 3개 후보 비교 |
| `/consultation` · `/partnership` | 3단계 신청서 작성 → **신청하기(메일 전달)** · 복사 · 다운로드 |
| `/insights`, `/insights/[id]` | 물류 가이드 |
| `/about` | 상담 범위·비용 안내·역할 분담표 |
| `/privacy` | 개인정보 안내 (수집 항목, 목적, 보유 기간, Resend 국외 이전, 카카오 API 사용) |
| `/admin` | 가상 상담 파이프라인 데모 (저장 안 함) |

## 기술 구성

| 항목 | 버전·방식 |
| --- | --- |
| Next.js | 16.3.7 · App Router · Turbopack · `typedRoutes` |
| React | 19.3.0 |
| 언어 | TypeScript 6.0 |
| 스타일 | 전역 CSS · 폰트는 `next/font/google`로 자체 호스팅 |
| 외부 API | Resend 6.30 · 카카오맵 JS SDK · 카카오모빌리티 길찾기 |
| 테스트 | Vitest 5 · Playwright 1.63 · @axe-core/playwright |

## 저장 방식과 한계

- 상담 신청 내용은 담당자 메일로만 전달하며 서버·DB에 저장하지 않습니다.
- 비교함은 예시 ID만 브라우저 `localStorage`(`logiloop:compare`)에 저장합니다.
- 요청 제한은 서버 메모리 기반이라 Vercel 인스턴스별로 따로 계산됩니다(근사치).
- 거리는 승용차 경로 기준 추정치입니다. 대형 화물차 경로와 다를 수 있습니다.
- 예시 페이지는 `noindex, nofollow`로 검색 노출을 막았습니다. 이는 접근 통제가 아닙니다.

재구축 계획과 결정 기록은 [docs/plan.md](docs/plan.md)에 있습니다.
