# 로지루프 · LogiLoop

전국 물류 네트워크 구축을 목표로 화주의 물류거점 선택을 돕는 다중 페이지 Next.js(App Router · TypeScript) 플랫폼입니다. `로지루프 전략백서 v1.3`을 기준으로 후보 연결·조건 비교·운영방식 검토의 3단계 상담을 구현했습니다. 지역 전략은 사용자 요청에 따라 부울경 중심에서 전국 확장 목표로 변경했습니다. 원본 전략백서는 수정하지 않았습니다.

**현재 버전은 프런트엔드 프로토타입입니다. Supabase, 데이터베이스, 외부 인증, 실제 접수·발송을 사용하지 않습니다.** 예시 업체·매물·고객은 모두 가상 데이터이며 화면에 표시됩니다.

## 실행

Node.js 20.19 이상 (배포 권장: Node.js 22)과 npm이 필요합니다.

```bash
npm ci
npm run dev
```

브라우저에서 http://localhost:3000 을 엽니다.

```bash
npm run lint       # ESLint (eslint-config-next core-web-vitals + typescript)
npm run typecheck  # 라우트 타입 생성 후 tsc
npm test           # Vitest 단위 테스트 (필터·입력 검증·비교함·준비서 문구·URL 파싱)
npm run build      # 배포 빌드 (Turbopack)
npm start          # 프로덕션 서버
npm run check      # lint → typecheck → test → build
npm run e2e        # Playwright E2E + axe 접근성 (빌드 후 3200 포트에서 실행)
```

처음 E2E를 돌릴 때는 `npx playwright install chromium`으로 브라우저를 설치합니다.

## 기술 구성

| 항목 | 버전·방식 |
| --- | --- |
| Next.js | 16.3.7 · App Router · Turbopack · `typedRoutes` |
| React | 19.3.0 |
| 언어 | TypeScript 6.0 (`typescript-eslint`가 6.1 미만만 지원) |
| 스타일 | `app/globals.css` 전역 CSS · 폰트는 `next/font/google`로 빌드 시 자체 호스팅 |
| 아이콘 | lucide-react 1.48 |
| 린트 | ESLint 9 flat config (`eslint-plugin-react`가 ESLint 10 미지원) |
| 테스트 | Vitest 5 · Playwright 1.63 · @axe-core/playwright |

재구축 계획과 결정 사항은 [docs/plan.md](docs/plan.md)에 있습니다. `tests/baseline/`은 재구축 전 프로토타입의 화면 기준선(데스크톱 1440 · 모바일 390)입니다.

## 상담 접수 메일 (Resend)

`/consultation`·`/partnership`의 ‘신청하기’는 `POST /api/inquiry`로 전송되고, 서버가 Resend로 담당자 메일에 전달합니다. 서버·DB에는 저장하지 않습니다.

`.env.local`(로컬)과 Vercel 환경변수에만 값을 넣습니다. 코드·저장소에 키를 넣지 마세요.

| 변수 | 설명 |
| --- | --- |
| `RESEND_API_KEY` | Resend API 키 (서버 전용, `NEXT_PUBLIC_` 금지) |
| `INQUIRY_TO_EMAIL` | 받는 주소. 쉼표로 여러 개 가능 |

- 발신 주소는 `onboarding@resend.dev`(도메인 인증 전 **테스트 모드**)입니다. **테스트 모드에서는 Resend에 가입한 이메일 주소로만 받을 수 있습니다.** 다른 주소로 받으려면 Resend에서 발신 도메인을 인증한 뒤 `app/api/inquiry/route.ts`의 `FROM`을 바꿉니다.
- 키가 없으면 API는 `503`과 “접수 설정 전” 메시지로 응답하고, 화면은 준비서 다운로드를 안내합니다.
- 서버 재검증(필수값·전화번호·선택지·길이), HTML 이스케이프, 허니팟(`website`), IP당 1분 3회 제한(메모리 기반 · 인스턴스별 근사치)을 적용합니다.
- 테스트는 Resend를 mock 처리하며 실제로 발송하지 않습니다.

## 화면

| 경로 | 기능 |
| --- | --- |
| `/` | 3가지 상담 입구, 진행 과정, 공급 예시, 가이드 |
| `/warehouses` | 지역·온도·면적·검색어 필터, 정렬, 비교함 |
| `/warehouses/[id]` | 창고 조건·4가지 확인 상태·미확인 항목·문의 연결 |
| `/partners` | 물류사·3PL 서비스 검색·필터 |
| `/partners/[id]` | 서비스·취급 조건·확인 단계·문의 연결 |
| `/compare` | 최대 3개 후보 비교, 삭제·전체 비우기 |
| `/consultation` | 3단계 상담 준비서 작성·검증·복사·다운로드 |
| `/partnership` | 물류사·임대센터 파트너 참여 준비서 |
| `/insights`, `/insights/[id]` | 물류 가이드 목록·상세 |
| `/about` | 상담 범위·비용 안내·역할 분담표·진행 과정 |
| `/privacy` | 현재 프로토타입의 정보 처리 안내 |
| `/admin` | 가상 상담 파이프라인, 등급 상향, 상태·시간 편집, 공급 확인 이력 |

Next.js App Router의 실제 경로로 분리되어 있으며 URL 직접 접속과 새로고침이 가능합니다. 모바일에서는 접이식 메뉴를 사용합니다.

## 구현 범위와 저장 방식

- 서버 컴포넌트가 기본이며, 필터·비교함·폼·관리 데모처럼 상호작용이 필요한 부분만 클라이언트 컴포넌트입니다. Next.js의 Node.js 서버 실행 구조입니다.
- Supabase SDK·키·SQL·연동 코드는 없습니다. 환경 변수 없이 실행됩니다.
- 비교함에는 예시 ID만 `localStorage`의 `logiloop:compare` 키에 저장합니다.
- 폼의 이름·전화번호는 React 메모리에만 유지됩니다. 서버로 전송하지 않고 다운로드·복사도 사용자가 선택합니다. 새로고침·화면 이탈 시 사라집니다.
- 상담 완료로 표시하지 않습니다. **‘준비서 확인 · 미전송’** 단계까지만 제공됩니다.
- `/admin`은 공개 데모입니다. 실제 연락처·고객·비공개 가격을 입력하거나 코드에 넣지 마세요. 편집 결과는 저장되지 않습니다.
- 비교함은 공개된 예시 조건을 비교하는 화면입니다. 비공개 견적 등록·만료 링크 공유·파일 업로드·실제 고객 CRM은 아직 구현하지 않았습니다.
- 실시간 가용성, 자동 추천 점수, 실제 거래 성과를 표시하지 않습니다.
- 예시 페이지의 검색 노출을 막기 위해 기본 메타데이터를 `noindex, nofollow`로 설정했습니다. 이는 인증이나 접근 통제가 아닙니다.
- 글꼴(Manrope · Noto Sans KR)은 빌드 시 내려받아 사이트에서 직접 제공합니다. 방문자 브라우저는 Google Fonts에 요청하지 않습니다.

## GitHub에 올리기

GitHub에서 빈 저장소를 만들고 이 폴더를 해당 저장소에 연결합니다. 원본 전략백서는 내부 문서이므로 `.gitignore`에서 제외했습니다. 공개 저장소에는 제품 코드와 이 README만 올리는 구성을 권장합니다.

```bash
git init -b main
git add .
git commit -m "Build LogiLoop React platform prototype"
git remote add origin https://github.com/YOUR_ACCOUNT/YOUR_REPOSITORY.git
git push -u origin main
```

이 프로젝트 폴더에는 별도 로컬 Git 저장소를 초기화해 두었습니다. 따라서 `git init`은 생략해도 됩니다. 실제 원격 저장소 생성·push는 이 작업에서 실행하지 않았습니다. GitHub Actions에서 테스트와 빌드가 실행됩니다.

## Vercel 배포

1. Vercel에서 **Add New → Project**를 선택합니다.
2. 위 GitHub 저장소를 가져옵니다.
3. Framework Preset은 **Next.js**, Root Directory는 저장소 루트입니다.
4. Node.js 버전을 **22.x**로 설정합니다.
5. Build Command `npm run build`, Install Command `npm ci`를 사용합니다. Output Directory는 Next.js 기본값을 유지합니다.
6. 환경 변수 설정 없이 **Deploy**합니다.

미리보기 배포는 바로 가능합니다. 실제 영업용 접수를 열기 전에는 연락 창구·정식 개인정보 안내·공급 데이터·등록 권한·인증·지속 저장 방식을 먼저 연결해야 합니다. Vercel 함수의 로컬 파일 시스템을 고객 DB로 사용하는 구현은 포함하지 않았습니다.

## 수정할 곳

- `lib/data.ts` · `lib/types.ts`: 가상 공급 자료, 가이드, 상담 등급·관리 데모와 타입
- `lib/logic.ts`: 필터·입력 검증·비교 선택 규칙
- `lib/inquiry-summary.ts` · `lib/search-params.ts`: 준비서 문구, 상담 URL 파라미터 해석
- `app/globals.css`: 반응형 디자인·색상·타이포그래피 (뒤쪽 가독성 보정 규칙은 선언 순서에 의존하므로 순서 유지)
- `components/shell/`: 메뉴·헤더·푸터 (`nav.ts`에 메뉴·breadcrumb 라벨)
- `components/providers/`: 비교함 상태(`logiloop:compare`)·토스트·WebMCP 도구 등록
- `components/inquiry/`: 상담·파트너 준비서
- `components/admin/`: 내부 업무 흐름 데모
- `app/layout.tsx`: 제목·설명·검색 노출 정책·글꼴

공급 데이터를 실제 정보로 바꿀 때는 예시 안내만 지우지 말고 회사명·사진 사용 권한, 기준일, 가용성, 공개 가능한 가격, 확인 상태를 함께 갱신하세요. 개인정보·비공개 견적은 클라이언트 소스에 넣지 않습니다.

## 백서 반영

- 단순 후보 연결을 허용하며, 모든 상담에 정밀 분석을 강요하지 않습니다.
- 1등급 무료 / 2등급 한도 내 무료 / 3등급 범위·비용 사전 협의로 구분합니다.
- 공급자 입력·서류 확인·현장 확인·화주 조건 수용 확인을 구분합니다.
- 미확인 비용을 0원으로 표시하거나 단일 점수로 추천하지 않습니다.
- 홈페이지에 주체별 역할 분담을 공개합니다.
- 관리자 예시는 상담 등급 하향을 막습니다.
- 시범 한도 12주·5건·건당 8시간·총 40시간은 **백서 권장값**으로 표시합니다.

개발 참고: [Next.js 공식 문서](https://nextjs.org/docs), [Vercel의 Next.js 배포 안내](https://vercel.com/docs/frameworks/full-stack/nextjs).

## 선택적 브라우저 에이전트 연동

`document.modelContext`를 제공하는 브라우저에서는 예시 후보 조회와 비교함 변경 도구를 등록합니다. 미지원 브라우저에서는 아무 기능도 추가하지 않습니다. 해당 실험 API를 지원하는 검증 환경이 없어 이 연동은 런타임 검증하지 않았습니다. 일반 사용자 기능에는 필요하지 않습니다.

## 전국 확장 방향

검색과 상담 폼에서 전국 17개 시·도를 선택할 수 있습니다. 기존 김해·양산·창원 예시는 경남 필터에 포함됩니다. 상담 준비서에는 상세 지역과 복수 거점을 적을 수 있습니다. 현재 공급 자료는 부울경의 가상 예시만 있으며, 전국 확보 실적을 의미하지 않습니다. 실제 권역별 공급은 확인 후 추가합니다.
