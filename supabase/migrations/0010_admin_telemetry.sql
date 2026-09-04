-- =============================================================================
-- CampusClub — admin telemetry
--
-- Backs the Super Admin dashboard: page views, API calls and their outcomes.
-- Additive; nothing existing is touched.
-- =============================================================================

create table if not exists public.admin_events (
  id          uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  kind        text        not null check (kind in ('page', 'api', 'auth')),
  path        text        not null,
  label       text        not null default '',
  method      text,
  status      integer,
  duration_ms integer,
  outcome     text        not null default 'success'
              check (outcome in ('success', 'fail', 'alert')),
  -- Message only, never a stack trace and never a request body.
  message     text,
  -- Null for anonymous traffic, which is most of it.
  user_id     uuid        references public.profiles (id) on delete set null,
  user_email  text,
  -- Opaque id from a first-party httpOnly cookie. Not derived from anything
  -- about the person, so on its own it identifies nobody.
  visitor_id  text        not null,
  referrer    text
);

-- The dashboard reads in exactly three shapes: newest first, newest first
-- within an outcome, and everything since a timestamp.
create index if not exists admin_events_occurred_idx on public.admin_events (occurred_at desc);
create index if not exists admin_events_outcome_idx  on public.admin_events (outcome, occurred_at desc);
create index if not exists admin_events_kind_idx     on public.admin_events (kind, occurred_at desc);
create index if not exists admin_events_visitor_idx  on public.admin_events (visitor_id, occurred_at desc);

alter table public.admin_events enable row level security;

-- Anyone may write one — an anonymous visitor's page view has to be
-- recordable, and the row carries nothing that is not already theirs.
drop policy if exists "anyone records their own event" on public.admin_events;
create policy "anyone records their own event" on public.admin_events
  for insert with check (true);

-- Nobody may read them through the anon key. The dashboard is a server
-- component and there is no browser query that should ever see this table;
-- with no select policy, RLS denies every read that is not service-role.
drop policy if exists "events are readable" on public.admin_events;

-- Retention. The dashboard looks at the last day or two, and an unbounded
-- append-only log of every request is a cost and a liability, not an asset.
-- Call from a scheduled job (Supabase → Integrations → Cron):
--     select public.prune_admin_events();
create or replace function public.prune_admin_events(p_keep_days integer default 30)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.admin_events
   where occurred_at < now() - (p_keep_days || ' days')::interval;
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;
