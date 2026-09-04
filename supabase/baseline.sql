-- =============================================================================
-- CampusClub — full baseline schema for a fresh `campusclub_db`
--
-- WHAT THIS IS
--   The entire current-state schema in one idempotent file: tables, indexes,
--   views, functions, the signup trigger, row-level security, and the 24 fixed
--   categories. Run this ONCE on a brand-new Supabase project and the app is
--   ready — no migration chain, no renames, no dropped legacy tables.
--
-- WHEN TO USE WHICH
--   Fresh project  → this file only. Do NOT also run migrations/0001–0009.
--   Existing project (already carries some of 0001–0009) → run the numbered
--     chain instead; it migrates forward and preserves rows. Running this file
--     on such a database is harmless but redundant.
--
-- APPLY
--   psql "$DATABASE_URL" -f supabase/baseline.sql
--   …or paste the whole file into the Supabase SQL editor and run it.
--
-- VERIFY
--   npm run db:check
-- =============================================================================

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ============================================================ profiles ======
-- One row per auth.users row, written by the on_auth_user_created trigger at
-- the bottom of this file. Everything the product knows about a member that is
-- not a credential lives here.
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text        not null default 'CampusClub member',
  avatar_url text,
  city       text        not null default '',
  bio        text        not null default '',
  -- Which pass they hold. 'payg' = no pass, they pay each join outright.
  pass       text        not null default 'payg'
             check (pass in ('payg', 'starter', 'regular', 'unlimited')),
  -- Pre-bought joins left on the pass. 'unlimited' ignores this.
  credits    integer     not null default 0 check (credits >= 0),
  -- Categories they want in their feed — set during onboarding.
  interests  text[]      not null default '{}',
  -- Phone/ID verified. Shown as a badge; gates nothing.
  verified   boolean     not null default false,
  created_at timestamptz not null default now()
);

-- ========================================================== categories ======
create table if not exists public.categories (
  slug  text primary key,
  name  text not null,
  icon  text not null default 'Store',   -- lucide-react icon name
  verb  text not null default '',        -- "Study together", "Eat together"…
  blurb text not null default ''
);

-- The 24 fixed categories. Kept in lockstep with CATEGORIES in
-- src/lib/constants.ts — meetups reference these by slug.
insert into public.categories (slug, name, icon, verb, blurb) values
  ('group-study',     'Group study',        'BookOpen',       'Study together',     'Three hours, phones face down, one table.'),
  ('exam-prep',       'Exam prep',          'GraduationCap',  'Prep together',      'Mock tests and doubt-clearing for CAT, GATE, UPSC, NEET.'),
  ('dinner',          'Dinner',             'UtensilsCrossed','Eat together',       'A long table, six people, no phones out.'),
  ('breakfast-lunch', 'Breakfast & lunch',  'Croissant',      'Eat together',       'Idli runs at seven, thali at one.'),
  ('gym',             'Gym',                'Dumbbell',       'Train together',     'A spotter, a schedule, and someone who notices you skipped.'),
  ('sports',          'Sports',             'Volleyball',     'Play together',      'Badminton, football, box cricket — teams made on the spot.'),
  ('outdoors',        'Runs & outdoors',    'Footprints',     'Move together',      'Sunrise runs, lake loops, weekend treks.'),
  ('skills',          'Skills & hobbies',   'Palette',        'Practise together',  'Sketching, open mics, chess, language practice.'),
  ('movies-shows',    'Movies & shows',     'Clapperboard',   'Watch together',     'One screen, one pick everybody agreed on, popcorn split four ways.'),
  ('gaming',          'Gaming',             'Gamepad2',       'Play together',      'Couch co-op and LAN nights — bring your own controller.'),
  ('board-games',     'Board games',        'Dices',          'Play together',      'Catan at nine, Codenames after, nobody keeps score past midnight.'),
  ('music-jam',       'Music & jamming',    'Guitar',         'Jam together',       'Bring an instrument or just your voice — nobody is auditioning.'),
  ('open-mic',        'Open mic & karaoke', 'Mic2',           'Perform together',   'Five minutes on stage, or just cheer from the second row.'),
  ('book-club',       'Book club',          'Library',        'Read together',      'One book a month, opinions stronger than the coffee.'),
  ('coffee-chat',     'Coffee & hangouts',  'Coffee',         'Talk together',      'No agenda, one table, the good kind of small talk.'),
  ('weekend-trips',   'Weekend trips',      'Plane',          'Explore together',   'A short trip, split costs, someone else planned the itinerary.'),
  ('photography',     'Photography',        'Camera',         'Shoot together',     'Golden-hour walks with people who also stop for the light.'),
  ('cycling',         'Cycling',            'Bike',           'Ride together',      'Sunrise pace lines before the traffic wakes up.'),
  ('hiking-treks',    'Hiking & treks',     'Mountain',       'Climb together',     'Weekend trails — one person always over-packs the snacks.'),
  ('cooking',         'Cooking & baking',   'ChefHat',        'Cook together',      'One kitchen, one recipe, dinner is whatever comes out of it.'),
  ('arts-crafts',     'Art & craft',        'Brush',          'Create together',    'Paint, pottery, whatever is half-finished in your cupboard.'),
  ('volunteering',    'Volunteering',       'HeartHandshake', 'Give back together', 'A few hours that matter more than another scroll session.'),
  ('networking',      'Networking',         'Briefcase',      'Connect together',   'Career talk over coffee, no pitch decks required.'),
  ('pet-meetups',     'Pet meetups',        'PawPrint',       'Walk together',      'Dogs do the introductions so you do not have to.')
on conflict (slug) do update
  set name = excluded.name, icon = excluded.icon, verb = excluded.verb, blurb = excluded.blurb;

-- ============================================================= meetups ======
create table if not exists public.meetups (
  id             uuid primary key default gen_random_uuid(),
  slug           text        not null unique,
  title          text        not null,
  category_slug  text        not null references public.categories (slug),
  host_id        uuid        not null references public.profiles (id) on delete cascade,
  description    text        not null default '',
  agenda         text[]      not null default '{}',
  bring          text[]      not null default '{}',
  venue_name     text        not null default '',
  address        text        not null default '',
  area           text        not null default '',
  city           text        not null default '',
  state          text        not null default '',
  lat            double precision,
  lng            double precision,
  starts_at      timestamptz not null,
  ends_at        timestamptz not null,
  spots_total    integer     not null default 8 check (spots_total between 2 and 60),
  spots_taken    integer     not null default 0 check (spots_taken >= 0),
  join_fee_cents integer     not null default 0 check (join_fee_cents between 0 and 500000),
  level          text        not null default 'any'
                 check (level in ('any', 'beginner', 'intermediate', 'serious')),
  audience       text        not null default 'everyone'
                 check (audience in ('everyone', 'women', 'men')),
  language       text        not null default 'English',
  cadence        text        not null default 'once'
                 check (cadence in ('once', 'weekly', 'daily')),
  cover_image    text,
  tags           text[]      not null default '{}',
  created_at     timestamptz not null default now(),
  -- A meetup that ends before it starts is a data bug, not a short meetup.
  constraint meetups_runs_forward check (ends_at > starts_at),
  -- Overselling is the one thing this table must never allow.
  constraint meetups_not_oversold check (spots_taken <= spots_total)
);

create index if not exists meetups_starts_at_idx on public.meetups (starts_at);
create index if not exists meetups_city_idx      on public.meetups (lower(city));
create index if not exists meetups_category_idx  on public.meetups (category_slug);
create index if not exists meetups_host_idx      on public.meetups (host_id);
create index if not exists meetups_title_trgm    on public.meetups using gin (title gin_trgm_ops);

-- =============================================================== joins ======
create table if not exists public.joins (
  id           uuid primary key default gen_random_uuid(),
  meetup_id    uuid        not null references public.meetups (id) on delete cascade,
  user_id      uuid        not null references public.profiles (id) on delete cascade,
  status       text        not null default 'confirmed'
               check (status in ('confirmed', 'waitlisted', 'cancelled')),
  spot_number  integer     not null default 1,
  amount_cents integer     not null default 0,
  -- Free text rather than a foreign key: 'credit' is a legitimate value, and a
  -- payment row may be deleted for retention reasons without erasing the join.
  payment_id   text,
  created_at   timestamptz not null default now()
);

-- One live join per person per meetup. Cancelled rows are excluded so somebody
-- who changed their mind can come back.
create unique index if not exists joins_one_live_per_member
  on public.joins (meetup_id, user_id)
  where status <> 'cancelled';

create index if not exists joins_user_idx   on public.joins (user_id);
create index if not exists joins_meetup_idx on public.joins (meetup_id);

-- ============================================================ payments ======
create table if not exists public.payments (
  id                 text        primary key,
  user_id            uuid        not null references public.profiles (id) on delete cascade,
  provider           text        not null check (provider in ('razorpay', 'demo')),
  purpose            text        not null check (purpose in ('join', 'pass')),
  order_id           text        not null unique,
  gateway_payment_id text,
  amount_cents       integer     not null check (amount_cents >= 0),
  currency           text        not null default 'INR',
  status             text        not null default 'created'
                     check (status in ('created', 'paid', 'failed', 'refunded')),
  meetup_id          uuid        references public.meetups (id) on delete set null,
  pass_id            text,
  created_at         timestamptz not null default now()
);

create index if not exists payments_user_idx on public.payments (user_id, created_at desc);

-- ============================================================= vouches ======
create table if not exists public.vouches (
  id            uuid primary key default gen_random_uuid(),
  meetup_id     uuid        not null references public.meetups (id) on delete cascade,
  user_id       uuid        not null references public.profiles (id) on delete cascade,
  rating        integer     not null check (rating between 1 and 5),
  body          text        not null,
  highlights    text[]      not null default '{}',
  host_reply    text,
  host_reply_at timestamptz,
  created_at    timestamptz not null default now(),
  unique (meetup_id, user_id)
);

create index if not exists vouches_meetup_idx on public.vouches (meetup_id);

-- =============================================================== saves ======
create table if not exists public.saves (
  user_id    uuid        not null references public.profiles (id) on delete cascade,
  meetup_id  uuid        not null references public.meetups (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, meetup_id)
);

-- =============================================================== views ======

-- Rating and vouch count are derived here rather than stored on the row, so
-- they can never drift from the vouches that produced them.
create or replace view public.meetups_with_stats as
select
  m.*,
  coalesce(round(avg(v.rating)::numeric, 1), 0) as rating,
  count(v.id)                                   as vouch_count
from public.meetups m
left join public.vouches v on v.meetup_id = m.id
group by m.id;

-- A host's public face: their profile plus the reputation they have earned.
create or replace view public.profiles_with_host_stats as
select
  p.id,
  p.full_name,
  p.avatar_url,
  p.city,
  p.bio,
  p.verified,
  p.created_at,
  (select count(*) from public.meetups m where m.host_id = p.id) as hosted_count,
  coalesce((
    select round(avg(v.rating)::numeric, 1)
    from public.vouches v
    join public.meetups m on m.id = v.meetup_id
    where m.host_id = p.id
  ), 0)                                                          as host_rating
from public.profiles p;

create or replace view public.vouches_with_author as
select v.*, p.full_name as author_name, p.avatar_url as author_avatar, m.host_id
from public.vouches v
join public.profiles p on p.id = v.user_id
join public.meetups  m on m.id = v.meetup_id;

create or replace view public.joins_with_member as
select j.*, p.full_name, p.avatar_url
from public.joins j
join public.profiles p on p.id = j.user_id;

-- =========================================================== functions ======

-- Seat accounting. `security definer` because a member may not update the
-- meetup row directly — only take a spot on it — and the not-oversold
-- constraint is what makes the increment safe under concurrency.
create or replace function public.increment_spots_taken(p_meetup_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.meetups
     set spots_taken = spots_taken + 1
   where id = p_meetup_id
     and spots_taken < spots_total;
$$;

create or replace function public.decrement_spots_taken(p_meetup_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.meetups
     set spots_taken = greatest(0, spots_taken - 1)
   where id = p_meetup_id;
$$;

-- Spends one pass credit, atomically. Returns true when a credit was actually
-- taken (or none was needed), false when the balance was empty — so the caller
-- can fall back to charging rather than granting a free join.
create or replace function public.spend_join_credit(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pass text;
begin
  select pass into v_pass from public.profiles where id = p_user_id;
  if v_pass is null then return false; end if;
  if v_pass = 'unlimited' then return true; end if;

  update public.profiles
     set credits = credits - 1
   where id = p_user_id
     and credits > 0;

  return found;
end;
$$;

-- A host replying to feedback on their own meetup, and nobody else's.
create or replace function public.reply_to_vouch(p_vouch_id uuid, p_host_id uuid, p_body text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.vouches v
     set host_reply = p_body, host_reply_at = now()
    from public.meetups m
   where v.id = p_vouch_id
     and m.id = v.meetup_id
     and m.host_id = p_host_id;

  return found;
end;
$$;

-- ======================================================= auth wiring ======
-- Supabase Auth owns credentials. `auth.users` holds the email and the
-- password hash; `public.profiles` holds everything else, one row per user,
-- written by this trigger the moment an account is created.
--
-- The exception handler is the important part. A trigger on auth.users runs
-- inside the same transaction as the INSERT, so ANY error it raises rolls the
-- whole sign-up back and Supabase answers the API call with the notoriously
-- opaque "Database error saving new user". That turns a cosmetic problem —
-- an over-long city string, a column added later with no default — into a
-- product that cannot register anybody.
--
-- The account matters more than the profile row: the app already falls back
-- to the sign-up metadata when no profile is found (see getCurrentUser), so
-- failing soft here costs nothing and failing hard costs everything.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, city)
  values (
    new.id,
    -- Trimmed and length-capped so a hostile or accidental 10k-character
    -- metadata value cannot be what breaks the insert. `coalesce` around the
    -- `nullif` matters: full_name is NOT NULL, and passing an explicit NULL
    -- does not fall back to the column default — it raises.
    coalesce(nullif(left(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 80), ''), 'CampusClub member'),
    left(trim(coalesce(new.raw_user_meta_data ->> 'city', '')), 80)
  )
  on conflict (id) do nothing;
  return new;
exception
  when others then
    -- Logged, not raised. The account is created either way.
    raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
    return new;
end;
$$;

-- Nobody should be able to call this directly; it exists for the trigger.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ================================================================= RLS ======
-- Public data stays readable by anyone; everything personal is owner-scoped.

alter table public.profiles   enable row level security;
alter table public.categories enable row level security;
alter table public.meetups    enable row level security;
alter table public.joins      enable row level security;
alter table public.payments   enable row level security;
alter table public.vouches    enable row level security;
alter table public.saves      enable row level security;

-- ---------------------------------------------------------------- profiles --
-- Owner-only, deliberately.
--
-- A blanket "profiles are public" select policy was exposing `pass` and
-- `credits` — what a member pays for and how much of it is left — to any
-- anonymous caller who hit PostgREST directly. Nothing in the product needs
-- that: every public read of a member (host cards, attendee lists, vouch
-- authors) goes through profiles_with_host_stats, joins_with_member or
-- vouches_with_author, which select only display fields and, being plain
-- views, are not subject to this policy.
drop policy if exists "profiles are public" on public.profiles;
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- The columns a member may change are limited by the app, not by this policy;
-- `pass` and `credits` are only ever written by the service role after a
-- verified payment, which bypasses RLS.
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- -------------------------------------------------------------- categories --
drop policy if exists "categories are public" on public.categories;
create policy "categories are public" on public.categories for select using (true);

-- ----------------------------------------------------------------- meetups --
-- Meetups are a public board; only the host may change one.
drop policy if exists "meetups are public" on public.meetups;
create policy "meetups are public" on public.meetups for select using (true);

drop policy if exists "members create their own meetups" on public.meetups;
create policy "members create their own meetups" on public.meetups
  for insert with check (auth.uid() = host_id);

drop policy if exists "hosts edit their own meetups" on public.meetups;
create policy "hosts edit their own meetups" on public.meetups
  for update using (auth.uid() = host_id) with check (auth.uid() = host_id);

drop policy if exists "hosts delete their own meetups" on public.meetups;
create policy "hosts delete their own meetups" on public.meetups
  for delete using (auth.uid() = host_id);

-- ------------------------------------------------------------------- joins --
-- A member sees their own joins; a host sees the joins on their meetups, which
-- is what makes the attendee list work without exposing anyone else's calendar.
drop policy if exists "members read their own joins" on public.joins;
create policy "members read their own joins" on public.joins
  for select using (
    auth.uid() = user_id
    or exists (select 1 from public.meetups m where m.id = meetup_id and m.host_id = auth.uid())
  );

drop policy if exists "members create their own joins" on public.joins;
create policy "members create their own joins" on public.joins
  for insert with check (auth.uid() = user_id);

drop policy if exists "members update their own joins" on public.joins;
create policy "members update their own joins" on public.joins
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------- payments --
-- Readable only by the person who made them. Writes come from the server with
-- the service-role key, never from a browser.
drop policy if exists "members read their own payments" on public.payments;
create policy "members read their own payments" on public.payments
  for select using (auth.uid() = user_id);

-- ----------------------------------------------------------------- vouches --
drop policy if exists "vouches are public" on public.vouches;
create policy "vouches are public" on public.vouches for select using (true);

-- The rule that makes the ratings on this site worth reading, enforced in the
-- database rather than only in the action: you must have a confirmed join on a
-- meetup that has already finished.
drop policy if exists "only attendees leave vouches" on public.vouches;
create policy "only attendees leave vouches" on public.vouches
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1
        from public.joins j
        join public.meetups m on m.id = j.meetup_id
       where j.meetup_id = vouches.meetup_id
         and j.user_id = auth.uid()
         and j.status = 'confirmed'
         and m.ends_at < now()
    )
  );

drop policy if exists "authors edit their own vouches" on public.vouches;
create policy "authors edit their own vouches" on public.vouches
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------------------------- saves --
drop policy if exists "members manage their own saves" on public.saves;
create policy "members manage their own saves" on public.saves
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ======================================================== admin_events ======
-- Backs the Super Admin dashboard. See migrations/0010_admin_telemetry.sql;
-- kept in step with it.

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
