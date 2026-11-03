-- Immutable document snapshot, separate party capabilities and version-bound signatures.
create table if not exists public.agreements (
 id uuid primary key, inquiry_id bigint references public.inquiries(id) on delete restrict,
 document jsonb not null, document_hash text not null, state text not null check(state in ('draft','sent','completed','void')),
 revision uuid not null, signatures jsonb not null default '[null,null]', access_hashes jsonb not null default '[null,null]',
 expires_at bigint, verification_note text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.agreements enable row level security;
revoke all on public.agreements from anon,authenticated;
grant all on public.agreements to service_role;
