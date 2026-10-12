-- 로지루프 DB 변경 v3 · 002_source_url.sql 실행 후 한 번 실행합니다.
-- 매물 카드·상세에 보여줄 대표 사진 주소. 지음부동산 홈페이지에 올린 사진만 허용합니다.

alter table public.listings
  add column if not exists image_url text
  check (image_url ~ '^https://ziumrealty\.com/uploads/item/[0-9]{1,8}/[A-Za-z0-9_.-]+$');
