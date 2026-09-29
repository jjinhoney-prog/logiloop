# 로지루프 Next.js 재구축 계획

> 작성 2026-09-29 · 대상 `_code/logiloop` · 목표: 현 프로토타입의 **모든 기능·문구·동작을 1:1 이관**하면서 Next.js 최신 안정판 규약으로 새로 구성

---

## 0. 요약

| 항목 | 현재 | 재구축 목표 |
|---|---|---|
| Next.js | 16.3.5 (`^16.2.0`) | **16.3.7** (npm `latest`, 2026-09-29 기준) |
| React / React DOM | 19.2.x | **19.3.0** |
| 언어 | JSX + `.mjs` (압축형 한 줄 코드) | **TypeScript** (`.tsx`/`.ts`), 가독성 포맷 |
| 번들러 | Turbopack (16 기본값) | Turbopack 유지 (`--turbopack` 플래그 불필요) |
| 린트 | 없음 | ESLint 10 flat config + `eslint-config-next/core-web-vitals` + `/typescript` (`next lint`는 16에서 제거됨) |
| 스타일 | `globals.css` 1파일 47KB | 동일 디자인 유지, **CSS Modules + 공통 토큰 파일**로 분할 (Tailwind 미사용) |
| 폰트 | CSS `@import` Google Fonts | **`next/font/google`** 셀프호스팅 (외부 요청 제거) |
| 아이콘 | lucide-react 0.577 | lucide-react **1.48.0** (메이저 업 — 아이콘명 검증 필요) |
| 테스트 | `node --test` 10건 | **Vitest** 단위 + **Playwright** E2E (공식 가이드 `02-guides/testing`) |
| 타입 라우트 | 없음 | `typedRoutes: true` + `PageProps<'/…'>` 전역 헬퍼 |
| 데이터 | `lib/data.js` 가상 데이터 | 동일 데이터, 타입 정의 추가 (DB·Supabase 연동은 범위 밖) |

근거 문서: `node_modules/next/dist/docs/01-app/` — `01-getting-started/01-installation.md`, `18-upgrading.md`, `02-guides/upgrading/version-16.md`, `02-guides/ai-agents.md`, `03-api-reference/05-config/01-next-config-js/{typedRoutes,reactCompiler,cacheComponents}.md`, `05-config/02-typescript.md`, `05-config/03-eslint.md`, `01-getting-started/13-fonts.md`.

---

## 1. 이관 대상 기능 인벤토리 (누락 금지 체크리스트)

### 1.1 라우트

| 경로 | 현재 파일 | 렌더링 | 핵심 기능 |
|---|---|---|---|
| `/` | `app/page.jsx` → `components/home.jsx` | Client | 인트로·전국 권역 패널, 3등급 카드(→`/consultation?tier=n`), 진행 4단계 스트립, 예시 매물 3개(비교 토글), 가이드 2개, 도움 카드 |
| `/warehouses` | `components/catalog.jsx` `type="warehouse"` | Client | 검색어·지역(17개 시·도)·온도·면적 필터, 정렬(기본/이름/면적), 초기화, 빈 상태, 비교 도크 |
| `/warehouses/[id]` | `components/detail.jsx` | SSG (`generateStaticParams`, `dynamicParams=false`) | 기본 조건 dl, 태그, 4단계 확인 상태, 적합/주의 블록, 문의 CTA(`tier=1&target=`, `tier=2&target=`), 비교함 토글 |
| `/partners` | catalog `type="partner"` | Client | 위와 동일(면적 필터·면적 정렬 제외) |
| `/partners/[id]` | detail | SSG | 위와 동일 |
| `/compare` | `components/compare.jsx` | Client | 최대 3개 비교표 10행, 개별 제거·모두 비우기, 로딩(`ready`) 상태, 빈 상태, `/consultation?tier=2&candidates=a,b,c` 이동 |
| `/consultation` | `components/inquiry-form.jsx` | 동적 (`await searchParams`) | `tier`(1~3 검증), `candidates`(콤마, 최대 3), `target` 파싱 → 3단계 폼 |
| `/consultation` loading | `app/consultation/loading.jsx` | — | 로딩 표시 |
| `/partnership` | inquiry-form `partnership` | Client | 파트너 유형 2종, 품목 선택 입력 |
| `/insights` | 서버 컴포넌트 | Static | 피처 블록 + 가이드 카드 3개 |
| `/insights/[id]` | 서버 컴포넌트 | SSG | 섹션 3개 본문, CTA, `generateMetadata` |
| `/about` | 서버 컴포넌트 | Static | 약속 문구, 등급 3개, 역할 분담표(`Roles`), 8단계 타임라인 |
| `/privacy` | 서버 컴포넌트 | Static | 프로토타입 개인정보 안내 5개 절 |
| `/admin` | `components/admin.jsx` | Client | 통계 카드 3개, 탭 2개(상담 파이프라인·공급 확인 이력), 등급 필터, 행 선택 편집기(상태 8종·등급 **상향만**·다음 확인·작업시간 1~480분 가산), 시범 한도 4지표, 운영 원칙 |
| 404 | `app/not-found.jsx` | — | 홈 이동 |
| error | `app/error.jsx` | Client | `reset` 재시도 |
| 아이콘 | `app/icon.svg` | — | 파비콘 |

### 1.2 공통 셸·상태

- **Shell**: 스킵 링크, 사이드바 5메뉴 + 비교함 카운트 배지, 활성 경로 표시(`aria-current`), 모바일 햄버거·백드롭, 파트너 참여·운영 워크스페이스(DEMO) 보조 링크, 상단 breadcrumb(경로별 라벨 매핑), 프리뷰 라벨, 상담 신청 버튼, 푸터.
- **PlatformProvider** (Context):
  - `selected` 비교 ID 배열 — `localStorage['logiloop:compare']` 저장/복원, 존재하지 않는 ID 제거·중복 제거·최대 3개.
  - `ready` 플래그 (hydration 후 true).
  - `toggle` — 3개 초과 시 토스트 “비교 후보는 최대 3개까지…”.
  - `clear`, `notify` — 토스트 4초 자동 소멸, `role="status"`.
  - **WebMCP 도구 등록** (`document.modelContext.registerTool`): `read_comparison_candidates`(읽기), `set_comparison_candidates`(최대 3개 고유 ID 검증 후 `flushSync` 반영). `AbortController`로 해제. 미지원 브라우저는 무동작.

### 1.3 폼 (상담·파트너 준비서)

- 3단계: 필요한 도움 → 기본 조건 → 준비서 확인(미전송).
- 필드: company·name·phone(필수), item(상담 시 필수), volume, region(아직 모름 + 17개 시·도 + 복수 지역), regionDetail(150자), timing 5종, temperature 5종, note(2000자), source 6종, consent(필수).
- 검증 `validateInquiry`: 공백 거부, 전화 `^0[0-9]{8,10}$`(공백·하이픈 제거 후), 파트너는 item 면제. 첫 오류 필드 포커스, `aria-invalid`/`aria-describedby`.
- 결과: 텍스트 요약(`<pre>`), **클립보드 복사**(실패 시 안내), **.txt 다운로드**(`로지루프_상담_준비서.txt` / `로지루프_파트너_준비서.txt`), 수정 버튼.
- 서버 전송·저장 **없음** (이관 후에도 유지 — Server Action 추가 금지).

### 1.4 순수 로직 (`lib/logic.mjs`)

`filterListings`(타입·지역/광역 `province`·온도·면적·검색어 대소문자 무시, 면적 미상은 “미만”에서 제외) · `validateInquiry` · `toggleSelection`(불변·최대 3).

### 1.5 데이터 (`lib/data.js`)

`regions`(18) · `tiers`(3) · `listings`(창고 4 + 파트너 3, 모두 가상) · `articles`(3) · `demoInquiries`(3).

### 1.6 설정·배포

- 메타데이터: title template `%s | 로지루프`, description, `robots: noindex, nofollow`.
- 보안 헤더: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`; `poweredByHeader: false`.
- `.env.example` (`NEXT_PUBLIC_SITE_URL`), GitHub Actions CI(Node 22, `npm ci` → `npm run check`), Vercel 연결(`.vercel/`), `.gitignore`(전략백서 NFC·NFD 두 표기 제외).
- CSS: 반응형 브레이크포인트 390 / 760 / 1000 / 1200 / 1600px, `prefers-reduced-motion`, `print`.

---

## 2. 목표 구조

```
logiloop/
├─ AGENTS.md / CLAUDE.md           # next dev가 관리 블록 upsert — 유지
├─ next.config.ts
├─ tsconfig.json
├─ eslint.config.mjs
├─ vitest.config.ts / playwright.config.ts
├─ app/
│  ├─ layout.tsx                   # next/font, metadata, Providers, Shell
│  ├─ globals.css                  # 리셋 + 토큰(:root 변수) + 공통 유틸
│  ├─ icon.svg / not-found.tsx / error.tsx
│  ├─ page.tsx
│  ├─ (catalog)/warehouses/{page.tsx,[id]/page.tsx}
│  ├─ (catalog)/partners/{page.tsx,[id]/page.tsx}
│  ├─ compare/page.tsx
│  ├─ consultation/{page.tsx,loading.tsx}
│  ├─ partnership/page.tsx
│  ├─ insights/{page.tsx,[id]/page.tsx}
│  ├─ about/page.tsx · privacy/page.tsx · admin/page.tsx
├─ components/
│  ├─ shell/ (Sidebar, Topbar, Footer, nav.ts)
│  ├─ providers/ (compare-provider.tsx, toast.tsx, webmcp.ts)
│  ├─ catalog/ (Catalog, Filters, CatalogCard, ComparisonDock)
│  ├─ detail/ · compare/ · inquiry/ (InquiryForm, steps, summary.ts) · admin/
│  └─ ui/ (PageHeading, DemoNotice, Empty, SectionTitle, Roles)
├─ lib/
│  ├─ types.ts (Listing, Tier, Article, DemoInquiry, InquiryData)
│  ├─ data.ts · logic.ts · inquiry-summary.ts · search-params.ts
└─ tests/ (unit/*.test.ts, e2e/*.spec.ts)
```

원칙
- **서버 컴포넌트 기본**, 상호작용 있는 최소 단위만 `'use client'`. 현재 Home·Detail 전체가 Client인 것을 → 정적 부분은 Server, 비교 토글 버튼만 Client 섬(island)으로 분리.
- 준비서 요약 문자열 생성(`summary()`)을 순수 함수 `lib/inquiry-summary.ts`로 추출해 단위 테스트 대상에 포함.
- `consultation`의 searchParams 파싱을 `lib/search-params.ts`로 추출(테스트 가능).

---

## 3. 단계별 작업 계획

### Phase 0 — 준비 (0.5일)
- [ ] 현재 버전 기준선 캡처: 모든 라우트 데스크톱(1440)·모바일(390) 스크린샷 → `tests/baseline/` (시각 비교 기준)
- [ ] `npm test` 10건·`npm run build` 통과 확인, 라우트별 빌드 출력(Static/SSG/Dynamic) 기록
- [ ] 작업 방식 결정 (§6 결정 사항 1): 신규 폴더 vs 현 폴더 브랜치
- [ ] git 기준 커밋 생성 (현재 전 파일 untracked 상태)

### Phase 1 — 스캐폴딩 (0.5일)
- [ ] `npx create-next-app@latest` — TypeScript Yes · ESLint · Tailwind **No** · `src/` No · App Router · alias `@/*` · AGENTS.md Yes · React Compiler (§6 결정 사항 3)
- [ ] `package.json`: `engines.node >=20.19.0` 유지(문서 최소 20.9), scripts
  `dev` / `build` / `start` / `lint: eslint` / `typecheck: next typegen && tsc --noEmit` / `test: vitest run` / `e2e: playwright test` / `check: lint → typecheck → test → build`
- [ ] `next.config.ts`: `poweredByHeader:false`, 보안 헤더 4종 이관, `typedRoutes:true`, (선택) `reactCompiler:true`
- [ ] `cacheComponents`는 **미사용** — 외부 데이터 fetch가 없고 전 페이지 정적/클라이언트 구성이라 이득 없음. DB 연동 단계에서 재검토
- [ ] `middleware` 불필요(16에서 `proxy`로 개칭). 보안 헤더는 config `headers()`로 충분
- [ ] AGENTS.md 관리 블록(`<!-- BEGIN:nextjs-agent-rules -->`) 유지, 프로젝트 규칙은 블록 밖에 추가

### Phase 2 — 도메인 계층 (0.5일)
- [ ] `lib/types.ts` 작성 — `Listing`은 `type: 'warehouse' | 'partner'`, `area?`, `province?`, `checks: [string,string,string,string]`
- [ ] `lib/data.ts` 데이터 **값 그대로** 이관 (문구 변경 금지)
- [ ] `lib/logic.ts` 이관 + 기존 테스트 10건을 Vitest로 포팅 → 전부 통과
- [ ] `lib/inquiry-summary.ts`, `lib/search-params.ts` 추출 + 테스트 추가

### Phase 3 — 디자인 시스템·셸 (1일)
- [ ] `globals.css` 분해: `:root` 토큰(`--bg --surface --ink --muted --line --navy --lime --teal --radius --shadow`)·리셋·버튼·폼 공통은 globals 유지, 컴포넌트별 규칙은 `*.module.css`
- [ ] `next/font/google`: Manrope + Noto Sans KR → CSS 변수(`--font-manrope`, `--font-noto-kr`)로 주입. Noto Sans KR는 한글 subset 미지원 시 `preload:false` 처리 (문서 `components/font.md` subsets/preload 항목)
- [ ] 반응형 브레이크포인트·`prefers-reduced-motion`·`print` 규칙 전부 이관
- [ ] Shell(사이드바·모바일 메뉴·breadcrumb·푸터) 이관, 라우트→라벨 매핑을 `nav.ts` 상수로
- [ ] Phase 0 스크린샷과 대조

### Phase 4 — 상태·Provider (0.5일)
- [ ] `CompareProvider`: localStorage 키 **`logiloop:compare` 동일 유지**(기존 사용자 비교함 호환), 정제 규칙·`ready`·최대 3 토스트 동일
- [ ] Toast 분리 (`role="status"`, 4초)
- [ ] WebMCP 등록 로직을 `webmcp.ts`로 분리, `document.modelContext` 타입 선언(`global.d.ts`) 추가, 동작 동일

### Phase 5 — 페이지 이관 (2일)
순서: 정적 → 목록 → 상세 → 비교 → 폼 → 관리자
- [ ] `/about`, `/privacy`, `/insights`, `/insights/[id]` (Server, `generateStaticParams`, `dynamicParams=false`, `generateMetadata`에서 `await params`)
- [ ] `/` 홈 (Server + `CompareToggle` Client 섬)
- [ ] `/warehouses`, `/partners` 카탈로그 (Client — 필터 상태) — 선택: 필터를 URL searchParams로 동기화할지 §6 결정 사항 4
- [ ] `/warehouses/[id]`, `/partners/[id]` (Server + Client 섬), 타입 불일치 ID는 `notFound()`
- [ ] `/compare`
- [ ] `/consultation`(`PageProps<'/consultation'>`로 `await searchParams`), `loading.tsx`, `/partnership`
- [ ] `/admin` (등급 하향 불가·1~480분 검증·미저장 안내 유지)
- [ ] `not-found.tsx`, `error.tsx` — 16.3 문서(`03-file-conventions/error.md`) 권장에 따라 “다시 시도” 버튼을 `reset()` → **`retry()`**(재요청 후 재렌더)로 교체

### Phase 6 — 검증 (1일)
- [ ] 단위: logic·summary·search-params 100% 분기
- [ ] E2E (Playwright):
  - 필터 조합·초기화·빈 상태 / 비교 3개 한도 토스트 / 새로고침 후 비교함 복원 / 잘못된 ID 정제
  - 상세 → 상담 CTA 쿼리 전달 / 비교 → `tier=2&candidates` 전달
  - 폼 필수값 오류·포커스 이동 / 파트너 item 면제 / 복사·다운로드 파일명
  - 관리자 등급 하향 비활성·시간 가산·범위 오류
  - 모바일 메뉴 열기/닫기, 스킵 링크, `aria-current`
  - 404: `/warehouses/partner-01`, `/insights/unknown`
- [ ] 접근성: axe 점검(Playwright 연동) — 기존 aria 속성 회귀 없음
- [ ] 시각 회귀: Phase 0 스크린샷 대비
- [ ] 응답 헤더 4종·`noindex` 메타 확인
- [ ] 문서 권장 런타임 검증: `next dev` 실행 후 주요 인터랙션 상태에서 dev indicator·브라우저/서버 로그 오류 0건

### Phase 7 — 배포·마감 (0.5일)
- [ ] CI 갱신: `actions/checkout@v4`·`setup-node@v4`(Node 22) → `npm ci` → `npm run check` → Playwright(`npx playwright install --with-deps`)
- [ ] `.gitignore` 이관 (+ `next-env.d.ts`, `playwright-report/`, `test-results/`)
- [ ] README 갱신: 스택 버전·스크립트·폴더 구조
- [ ] Vercel 프리뷰 배포 — **외부 URL 생성이므로 대표 승인 후 실행**

총 예상: **약 6.5일** (1인 기준)

---

## 4. 이관 규칙

| 규칙 | 내용 |
|---|---|
| 문구 | 화면 문구·안내·면책 표현은 한 글자도 바꾸지 않음. 변경은 별도 PR |
| 정책 | “미전송”·“미저장”·“예시 데이터”·“등급 하향 불가”·“미확인 비용 0원 금지” 표기 유지 |
| 데이터 | 가상 데이터만. 실제 업체명·연락처·비공개 가격·고객 정보 코드 반입 금지 |
| 저장 | localStorage에는 비교 ID만. 폼 입력은 메모리만 |
| 서버 기능 | Server Action·Route Handler·DB 추가 없음 (이번 범위 밖) |
| 전략백서 | `로지루프_전략백서_v1.3_정본.md` 수정·커밋 금지 (`.gitignore` 유지) |

---

## 5. 리스크

| 리스크 | 영향 | 대응 |
|---|---|---|
| lucide-react 0.x → 1.x 메이저 업 | 아이콘 이름 변경·제거 시 빌드 실패 | 사용 아이콘 28종(`LayoutDashboard, Warehouse, Truck, GitCompareArrows, BookOpen, ArrowUpRight, ArrowRight, ArrowLeft, Plus, Menu, X, Handshake, Settings2, Search, SlidersHorizontal, Workflow, Check, MapPin, RotateCcw, Info, CircleHelp, Clock3, ClipboardList, Users, Filter, Download, Clipboard, FileCheck2`) 설치 직후 import 검증, 실패 시 0.577 고정 |
| CSS 분할 시 스타일 누락 | 레이아웃 깨짐 | 1차는 globals.css 통째 이관 → 스크린샷 일치 확인 → 2차 모듈 분할 |
| next/font 전환 | 글꼴 굵기·자간 미세 변화 | weight 400~900 동일 지정, 시각 비교 |
| Server/Client 경계 재배치 | hydration 불일치(localStorage) | `ready` 플래그 패턴 유지, 서버 렌더 시 비교 상태 미표시 |
| React Compiler | 드물게 동작 차이 | 선택 사항. 켜는 경우 E2E 전부 통과 조건 |
| `error.tsx` 규약 | 16.3에서 `retry()` 권장, `reset()`은 예외용 | `retry()` 적용, 구현 시 번들 문서 재확인 |

---

## 6. 결정 필요 사항 (착수 전)

1. **작업 위치**: (A) 현 폴더에서 새 브랜치로 교체 — 권장, Vercel 연결 유지 / (B) `_code/logiloop-next` 신규 폴더
2. **TypeScript 전환** 여부 — 권장 Yes (typedRoutes·PageProps 활용)
3. **React Compiler** 활성화 여부 — 권장 No(1차), 안정화 후 검토
4. **카탈로그 필터 URL 동기화** — 기능 추가에 해당. “그대로 이관” 원칙상 1차 No
5. **디자인 팔레트** — 현재 로지루프 자체 팔레트(네이비·라임) 유지 vs 회사 디자인 시스템(§13: `#FEE109`·`#F4F5F7`) 적용. “그대로 이관” 원칙상 1차는 현 팔레트 유지

---

## 7. 완료 기준

- [ ] §1 인벤토리 전 항목 동작 확인 (E2E 체크)
- [ ] `npm run check` 통과 (lint·typecheck·unit·build)
- [ ] Playwright E2E·axe 통과
- [ ] 16개 라우트 스크린샷이 기준선과 시각적으로 동일
- [ ] 외부 요청 없음(폰트 셀프호스팅), 폼 데이터 네트워크 전송 0건 (DevTools Network 확인)
- [ ] README·CI 갱신
