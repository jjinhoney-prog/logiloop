-- 로지루프 DB 변경 · 3PL 업체 로고를 공개 매물 이미지로 쓸 수 있게 합니다.
-- 기존: 지음부동산 홈페이지 사진 주소만 허용 → 업체가 등록 때 올린 로고(PNG·JPEG·WEBP, 48,000자 이하)를 3PL 매물에 한해 추가 허용.
-- 앱(lib/partner-brand.ts validPartnerLogo)이 같은 형식을 먼저 검사합니다. SVG·외부 주소는 받지 않습니다.

alter table public.listings drop constraint if exists listings_image_url_check;
alter table public.listings add constraint listings_image_url_check check (
  image_url is null
  or image_url ~ '^https://ziumrealty\.com/uploads/item/[0-9]{1,8}/[A-Za-z0-9_.-]+$'
  or (type = 'partner' and length(image_url) <= 48000 and image_url ~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$')
);
