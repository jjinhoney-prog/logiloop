-- 공개용 운영 권역만 저장. 상세 주소·연락처는 포함하지 않는다.
alter table public.listings add column if not exists operating_regions jsonb not null default '[]'::jsonb;
