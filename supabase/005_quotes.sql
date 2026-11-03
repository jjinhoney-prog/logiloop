-- 별도 견적 저장소. 운영 적용 전 SQL 검토 및 백업 정책 확인.
create table if not exists public.quote_requests (
  id uuid primary key,
  group_id uuid not null,
  inquiry_id bigint not null references public.inquiries(id) on delete restrict,
  partner_id bigint not null references public.inquiries(id) on delete restrict,
  partner_name text not null,
  spec jsonb not null,
  state text not null default '초안' check (state in ('초안','전달 준비','전달 완료','회신 완료','종결')),
  response jsonb,
  revision uuid not null,
  access_hash text,
  expires_at bigint,
  delivery_note text not null default '',
  sent_at timestamptz,
  replied_at timestamptz,
  created_at timestamptz not null default now(),
  unique(group_id, partner_id)
);
create index if not exists quote_requests_inquiry_idx on public.quote_requests(inquiry_id, created_at desc);
alter table public.quote_requests enable row level security;
revoke all on public.quote_requests from anon, authenticated;
grant all on public.quote_requests to service_role;
