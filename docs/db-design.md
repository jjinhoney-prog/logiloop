# 로지루프 DB 설계 — 4주차 최종과제 (Supabase)

> 작성 2026-10-06 · 대상 `_code/logiloop` · 범위: 필수 A(매물 DB·관리) + 필수 B(상담 저장·관리). 선택 C(거리 사전 저장)는 제외.

## 0. 결정 요약

| 항목 | 결정 | 이유 |
|---|---|---|
| DB | Supabase Postgres (서울 리전, 무료 플랜) | 강의 실습 기준 |
| 접근 방식 | **서버에서만** `@supabase/supabase-js` + service role 키 | 브라우저에 DB 키를 내보내지 않음 |
| ORM · 트리거 · RLS 정책 · Supabase Auth | **사용 안 함** | 강사 금지 항목 |
| 외부 차단 | 테이블 권한을 `anon`·`authenticated`에서 `revoke` | RLS 없이도 공개 키로 테이블을 읽을 수 없게 함 |
| 관리자 인증 | 비밀번호 1개(`ADMIN_PASSWORD`) + HMAC 서명 httpOnly 쿠키(8시간) | 단일 운영자. Supabase Auth 미사용 |
| 권한 검사 위치 | 관리자 페이지 렌더링 시 + **모든 Server Action 첫 줄** | Server Action은 URL 없이도 직접 POST 가능 |
| 매물 삭제 | 하지 않음. `visibility = archived`(보관) | 상담과 매물의 연결 보존 |
| 신규 매물 노출 | 기본 `hidden`(비공개) | 오프마켓 노출 방지 |
| 상담 저장 순서 | DB 저장 → 메일 발송 → `mail_status` 갱신 | 메일 실패에도 상담 보존 |
| 공개 페이지 렌더링 | 요청마다 DB 조회(`force-dynamic`) | 관리자 수정이 즉시 반영. 트래픽이 작아 캐시 불필요 |
| DB 미연결 시 | 공개 화면은 기존 예시 7건(`lib/seed-listings.ts`), 상담은 메일만, 관리자는 "DB 연결 전" 안내 | 키 발급 전에도 사이트·테스트 동작 |

## 1. ERD

```
listings 1 ──< inquiry_listings >── 1 inquiries
 (매물)          (연결 테이블)           (상담)
```

- 상담 1건은 0~3개 매물을 함께 검토할 수 있고, 매물 1개에는 여러 상담이 연결됩니다(다대다).
- `inquiry_listings.listing_id`는 `on delete restrict`입니다. 상담이 연결된 매물은 DB에서도 삭제할 수 없습니다.
- 일반 상담(매물 선택 없음)은 연결 행이 없습니다.

## 2. 테이블

### listings (매물·파트너)

| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | text PK | URL에 쓰는 영문 ID (`busan-01`) |
| type | text | `warehouse` · `partner` |
| visibility | text | `hidden`(기본) · `published` · `archived` |
| name · region · province · district | text | 주소는 **동·권역 단위까지**. 번지 입력은 서버가 거부 |
| temperature · capacity · price · available | text | |
| area | integer | ㎡. 파트너는 비움 |
| status_note | text | 카드에 표시되는 확인 상태 메모 |
| tags | text[] | |
| height · power | text | |
| service · suitability · limitation | text | |
| checks | text[4] | 공급자 입력·서류·현장·화주 조건 확인 |
| lat · lng | double | **권역 대표 좌표**(실제 위치 아님). 지도·거리 계산용 |
| sort_order | integer | 작은 값이 먼저 |
| created_at · updated_at | timestamptz | `updated_at`은 앱에서 갱신(트리거 미사용) |

### inquiries (상담·파트너 신청)

| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | bigint identity PK | |
| kind | text | `consultation` · `partnership` |
| tier · help | | 상담 등급 · 파트너 유형 |
| company · name · phone | text | **개인정보** |
| item · volume · region · region_detail · timing · temperature · note · source | text | |
| consent_at | timestamptz | 동의 시각 |
| stage | text | `접수`(기본) · `연락 중` · `검토 중` · `종결` |
| owner · next_action | text | 담당자 · 다음 확인 사항 |
| mail_status | text | `pending` · `sent` · `failed` · `skipped` |
| closed_at | timestamptz | `종결` 시각. 보유기간 계산 기준 |
| created_at · updated_at | timestamptz | |

### inquiry_listings (상담 ↔ 매물)

| 컬럼 | 타입 | 비고 |
|---|---|---|
| inquiry_id | bigint FK → inquiries | 상담 삭제 시 함께 삭제 |
| listing_id | text FK → listings | 매물 삭제 차단 |

SQL 원본: [supabase/schema.sql](../supabase/schema.sql) · 예시 7건: [supabase/seed.sql](../supabase/seed.sql)

## 3. 데이터 흐름

| 화면·API | 읽기/쓰기 | 조건 |
|---|---|---|
| `/`, `/warehouses`, `/partners`, `/compare` | listings 읽기 | `visibility = published`만 |
| `/warehouses/[id]`, `/partners/[id]` | listings 1건 | 비공개·보관 매물은 **URL 직접 입력 시에도 404** |
| `/api/listings` | 공개 매물 요약(id·이름·지역·유형·온도) | 비교함 ID 검증·WebMCP 도구용 |
| `/api/distance` | 공개 매물 좌표 | 비공개 매물은 404 |
| `/consultation` | 후보 ID → 공개 매물 이름 | 비공개 ID는 무시 |
| `POST /api/inquiry` | inquiries + inquiry_listings 쓰기 → 메일 | 아래 4절 |
| `/admin` | 전체 읽기, 상담 상태·담당자 변경, 매물 공개 전환·보관 | 관리자 쿠키 필수 |
| `/admin/listings/new`, `/admin/listings/[id]` | 매물 등록·수정 | 관리자 쿠키 필수 |

## 4. 상담 접수 처리

| DB | 메일 키 | 처리 | 응답 |
|---|---|---|---|
| 연결 | 있음 | 저장 → 발송 → `sent`/`failed` 기록 | 저장 성공이면 200 (메일 실패여도) |
| 연결 | 없음 | 저장, `skipped` 기록 | 200 |
| 연결 | 있음 | **저장 실패** → 메일만 시도 | 메일 성공 200 / 둘 다 실패 502 |
| 미연결 | 있음 | 메일만 (기존 동작) | 200 / 502 |
| 미연결 | 없음 | — | 503 "접수 설정 전" |

관리자 화면에서 메일 실패 건을 표시합니다.

## 5. 관리자 인증

- 로그인: `/admin/login`에서 `ADMIN_PASSWORD`와 비교합니다(SHA-256 후 `timingSafeEqual`). IP당 10분 5회 제한.
- 세션: `만료시각.HMAC(만료시각)` 쿠키 `ll_admin` (httpOnly · SameSite=Strict · Path=/admin · 프로덕션 Secure · 8시간). 서명 키 = `SESSION_SECRET` + 비밀번호이므로 **비밀번호를 바꾸면 기존 세션이 모두 끊깁니다.**
- 검사: `/admin` 하위 페이지는 렌더링 전 `requireAdmin()`, 모든 Server Action은 첫 줄에서 `assertAdmin()`.

## 6. 환경변수 (총 8개, 신규 4개)

| 변수 | 공개 범위 | 신규 |
|---|---|---|
| `SUPABASE_URL` | 서버 전용 | ✔ |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 · **Sensitive** | ✔ |
| `ADMIN_PASSWORD` | 서버 전용 · Sensitive | ✔ |
| `SESSION_SECRET` | 서버 전용 · Sensitive · 32자 이상 | ✔ |
| `RESEND_API_KEY` · `INQUIRY_TO_EMAIL` · `KAKAO_REST_KEY` | 서버 전용 | 기존 |
| `NEXT_PUBLIC_KAKAO_MAP_KEY` | 브라우저 | 기존 |

`NEXT_PUBLIC_` 접두사를 붙인 Supabase 키는 만들지 않습니다. anon 키는 사용하지 않습니다.

## 7. 보유기간·파기

- 상담 기록은 `종결` 후 1년 보관 후 파기합니다(개인정보 안내와 일치).
- 파기는 월 1회 SQL Editor에서 수동으로 실행합니다.

```sql
delete from public.inquiries where stage = '종결' and closed_at < now() - interval '1 year';
```

※ 보유기간·처리위탁 문구는 실운영 전 변호사 검토 필요

## 8. 강의 체크포인트 대조

| 체크 | 상태 |
|---|---|
| DB 기능 1개 이상 | 매물 CRUD(삭제 대신 보관) + 상담 저장·관리 |
| RLS 정책 | 미사용. 대신 권한 `revoke` + 서버 전용 접근 |
| 트리거 | 미사용 (`updated_at`은 앱에서 설정) |
| ORM | 미사용 (supabase-js 쿼리 빌더만) |
| Supabase Auth | 미사용 (자체 비밀번호 세션) |
| SQL 파일 | `supabase/schema.sql`, `supabase/seed.sql` |
| 키 관리 | service role 키 서버 전용, Vercel Sensitive, Git 미커밋 |

## 9. 실행계획 (2026-10-06 확정 · 진행 상태)

| # | 단계 | 담당 | 상태 |
|---|---|---|---|
| 1 | 설계 문서·SQL 작성 (본 문서, `supabase/*.sql`) | Claude | 완료 |
| 2 | 구현: 매물 DB 이전 · 관리자 인증 · 매물 관리 · 상담 저장·관리 · 메일 연동 · 안내문 | Claude | 완료 (DB 미연결 상태로 검증) |
| 3 | 화면 피드백 1차: 다크모드 가독성, "함께 검토할 후보"를 신청 완료 후로 이동 | Claude | 완료 |
| 4 | Supabase 가입 → 프로젝트 생성(서울) → `schema.sql`·`seed.sql` 실행 → 키 발급 | 대표 | 대기 |
| 5 | `.env.local`에 신규 변수 4개 입력 → 로컬 검증(아래 체크리스트) | 대표 + Claude | 대기 |
| 6 | 커밋·Push → Vercel 변수 8개 확인(신규 4개 Sensitive) → Redeploy → 배포 검증 | 대표 승인 후 | 대기 |
| 7 | 3주차 API 점검: Vercel 카카오·Resend 변수, 카카오 Web 도메인에 배포 주소 등록 | 대표 | 대기 (DB와 별도) |
| 8 | 시크릿 창에서 제출 주소 확인 → 제출 | 대표 | 대기 |
| 9 | 화면 피드백 2차: 툴팁(모바일 탭 지원), 커스텀 드롭다운, textarea 크기, 상담 버튼 확대 | Claude | 제출 범위 밖 |
| 10 | 지음 실매물 85건 가져오기(A안: 비공개 등록, 공개 매물은 지음 홈페이지로 연결) | Claude | SQL·스크립트 준비 완료, DB 반영 대기 |
| 11 | 실매물 검토 16건 확인 → 관리자 화면에서 매물별 공개 전환 | 대표 | 대기 |
| — | 선택 C: 거리 사전 저장 | — | 제외 |

### 로컬·배포 검증 체크리스트 (완료 기준)

- [ ] `/warehouses`·`/partners`에 DB의 예시 7건이 표시된다
- [ ] 로그아웃 상태에서 `/admin`, `/admin/listings/new` 접근 시 로그인 화면으로 이동한다
- [ ] 매물 등록 → 목록에 "비공개"로 표시, 공개 화면·상세 URL(직접 입력)에서는 404
- [ ] "공개" 전환 → 공개 목록에 나타남 / "비공개" → 사라짐 / "보관" → 관리자 목록에만 남음
- [ ] 일반 상담·매물 상세 "이 물건 문의" 상담이 각각 저장되고, 후자는 검토 후보 열에 매물명이 표시된다
- [ ] 진행 상태(접수·연락 중·검토 중·종결)와 담당자 변경이 새로고침 후에도 유지된다
- [ ] `RESEND_API_KEY`를 일부러 틀리게 넣고 접수 → 화면은 접수 완료, 관리자 목록에 "발송 실패"
- [ ] 번지 주소(예: "녹산동 123번지")로 매물 저장 시 거부된다
- [ ] 브라우저 개발자도구 Network·Sources에서 `service_role` 키 문자열이 검색되지 않는다

## 10. 지음 실매물 가져오기 (A안)

| 항목 | 결정 |
|---|---|
| 원장 | Notion '로지루프 창고 소스 DB' (지음부동산 홈페이지 공개 매물 85건) |
| 기준서 관계 | 기준서 v3 §4 "자동 수집·재게시·DB 연동은 별도 검토" → 대표 지시(2026-10-06)로 A안 채택: 비공개 등록, 공개 매물 상세에 지음부동산 매물 링크 |
| 노출 | 전량 `hidden`. 대표가 관리자 화면에서 매물별로 공개 |
| 출처 표시 | `source_url`(지음 매물 상세 주소)이 있으면 실매물, 없으면 '예시' 라벨 |
| 좌표 | 카카오 주소 검색으로 구·동(리) 중심점 |
| 내부 메모 | 매물명 앞 `[…]`는 이름에서 빼고 '확인이 필요한 사항'으로 이동 |
| 데이터 보관 | 원본·생성 SQL은 `supabase/private/`(git 제외, 저장소 공개 상태) |

실행 순서

1. SQL Editor에서 `supabase/002_source_url.sql` 실행
2. `node --experimental-strip-types scripts/build-zium-import.mts` (원본 → SQL·JSON·검토 목록 재생성)
3. `node --experimental-strip-types scripts/apply-zium-import.mts` 로 건수 확인 → `--apply` 로 반영
4. `supabase/private/import-review.md`의 검토 대상(2026-10-06 기준 16건)은 원장 확인 후 공개
