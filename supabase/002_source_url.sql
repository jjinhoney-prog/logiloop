-- 로지루프 DB 변경 v2 · schema.sql·seed.sql 실행 후 한 번 실행합니다.
-- 지음부동산 홈페이지 매물을 로지루프 후보로 연결하기 위한 출처 주소 컬럼.
-- 값이 있으면 실매물(상세 화면에 지음부동산 매물 링크), 없으면 화면 확인용 예시로 표시합니다.

alter table public.listings
  add column if not exists source_url text
  check (source_url ~ '^https://ziumrealty\.com/item/view/[0-9]{1,8}$');
