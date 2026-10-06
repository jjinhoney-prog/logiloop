-- 로지루프 DB 스키마 v1 · Supabase SQL Editor에서 한 번 실행합니다.
-- 설계: docs/db-design.md · RLS 정책·트리거·ORM·Supabase Auth를 사용하지 않습니다.
-- DB 접근은 Next.js 서버의 service role 키로만 합니다.

create table if not exists public.listings (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{1,47}$'),
  type text not null check (type in ('warehouse', 'partner')),
  visibility text not null default 'hidden' check (visibility in ('hidden', 'published', 'archived')),
  name text not null check (char_length(name) between 1 and 80),
  region text not null,
  province text,
  district text not null,
  temperature text not null,
  area integer check (area > 0),
  capacity text not null default '',
  price text not null default '',
  available text not null default '',
  status_note text not null default '',
  tags text[] not null default '{}',
  height text,
  power text,
  service text not null default '',
  suitability text not null default '',
  limitation text not null default '',
  checks text[] not null default array['', '', '', ''] check (cardinality(checks) = 4),
  -- 권역 대표 좌표(실제 위치 아님). 대한민국 범위만 허용
  lat double precision not null check (lat between 33 and 39),
  lng double precision not null check (lng between 124 and 132),
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inquiries (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('consultation', 'partnership')),
  tier smallint not null check (tier between 1 and 3),
  help text not null default '',
  company text not null,
  name text not null,
  phone text not null,
  item text not null default '',
  volume text not null default '',
  region text not null default '',
  region_detail text not null default '',
  timing text not null default '',
  temperature text not null default '',
  note text not null default '',
  source text not null default '',
  consent_at timestamptz not null,
  stage text not null default '접수' check (stage in ('접수', '연락 중', '검토 중', '종결')),
  owner text not null default '',
  next_action text not null default '',
  mail_status text not null default 'pending' check (mail_status in ('pending', 'sent', 'failed', 'skipped')),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 상담 1건 ↔ 매물 0~3개. 상담이 연결된 매물은 삭제할 수 없습니다(보관 처리 사용).
create table if not exists public.inquiry_listings (
  inquiry_id bigint not null references public.inquiries (id) on delete cascade,
  listing_id text not null references public.listings (id) on delete restrict,
  primary key (inquiry_id, listing_id)
);

create index if not exists listings_type_visibility_idx on public.listings (type, visibility, sort_order);
create index if not exists inquiries_created_at_idx on public.inquiries (created_at desc);
create index if not exists inquiry_listings_listing_idx on public.inquiry_listings (listing_id);

-- 공개 키(anon)·로그인 사용자(authenticated)로는 테이블에 접근할 수 없게 합니다.
-- RLS 정책 대신 권한 자체를 회수하는 방식이며, service role(서버)은 영향을 받지 않습니다.
revoke all on table public.listings, public.inquiries, public.inquiry_listings from anon, authenticated;
