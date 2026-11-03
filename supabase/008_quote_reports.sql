-- 화주용 비교 리포트. 견적 묶음(group_id)당 1건. 운영 적용 전 SQL 검토 및 백업 확인.
-- 업체 회신 금액은 quote_requests에만 저장하고, 여기에는 담당자 의견·공개 설정·화주 응답만 둔다.
create table if not exists public.quote_reports (
  group_id uuid primary key,
  inquiry_id bigint not null references public.inquiries(id) on delete restrict,
  settings jsonb not null default '{}'::jsonb,
  access_hash text,
  expires_at bigint,
  delivery_note text not null default '',
  issued_at timestamptz,
  sent_at timestamptz,
  replies jsonb not null default '[]'::jsonb,
  revision uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists quote_reports_inquiry_idx on public.quote_reports(inquiry_id);
alter table public.quote_reports enable row level security;
revoke all on public.quote_reports from anon, authenticated;
grant all on public.quote_reports to service_role;
