-- Public supplier conditions and consented request summaries. No anonymous table access.
alter table public.listings add column if not exists public_partner jsonb;
create table if not exists public.request_publications (
 id uuid primary key, inquiry_id bigint not null references public.inquiries(id) on delete restrict,
 snapshot jsonb not null, state text not null default 'draft' check(state in ('draft','approved','published','closed','withdrawn')),
 revision uuid not null, approval_hash text, approval_expires_at bigint, approved_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(state not in ('approved','published') or approved_at is not null)
);
create table if not exists public.request_interests (
 id uuid primary key, publication_id uuid not null references public.request_publications(id) on delete restrict,
 details jsonb not null, state text not null default '신원 확인 전', created_at timestamptz not null default now()
);
create index if not exists request_publications_state_idx on public.request_publications(state,created_at desc);
create index if not exists request_interests_publication_idx on public.request_interests(publication_id);
alter table public.request_publications enable row level security;
alter table public.request_interests enable row level security;
revoke all on public.request_publications, public.request_interests from anon, authenticated;
grant all on public.request_publications, public.request_interests to service_role;
