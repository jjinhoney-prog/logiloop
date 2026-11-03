-- Administrator-only manual Modusign tracking; existing agreement RLS applies.
alter table public.agreements add column if not exists external_agreement jsonb;
comment on column public.agreements.external_agreement is 'Manual Modusign document reference/status/evidence; not API-verified signatures';
