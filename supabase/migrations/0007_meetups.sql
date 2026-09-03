-- =============================================================================
-- VibeClub — the meetup model
--
-- The product moved from a business directory plus a supper club to a board of
-- local meetups people pay a per-meetup join fee to attend. This migration adds
-- that model alongside the old tables and retires them at the end, so an
-- already-deployed database migrates forward rather than being rebuilt.
--
-- Apply with:  supabase db push      (or paste into the SQL editor)
-- =============================================================================

-- ------------------------------------------------------------ profiles ------
-- `plan` becomes `pass`, and members now carry a credit balance and the
-- categories they want in their feed.
alter table public.profiles add column if not exists pass text not null default 'payg';
alter table public.profiles add column if not exists credits integer not null default 0;
alter table public.profiles add column if not exists interests text[] not null default '{}';
alter table public.profiles add column if not exists verified boolean not null default false;

do $$
begin
  -- Carry the old membership across so nobody loses what they paid for.
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'profiles' and column_name = 'plan') then
    update public.profiles set pass = case
      when plan = 'annual'    then 'unlimited'
      when plan = 'quarterly' then 'regular'
      when plan = 'monthly'   then 'starter'
      else 'payg'
    end
    where pass = 'payg';

    alter table public.profiles drop constraint if exists profiles_plan_check;
    alter table public.profiles drop column plan;
  end if;
end $$;

alter table public.profiles drop constraint if exists profiles_pass_check;
alter table public.profiles add constraint profiles_pass_check
  check (pass in ('payg', 'starter', 'regular', 'unlimited'));

alter table public.profiles drop constraint if exists profiles_credits_check;
alter table public.profiles add constraint profiles_credits_check check (credits >= 0);

-- ----------------------------------------------------------- categories -----
alter table public.categories add column if not exists verb text not null default '';

delete from public.categories where slug not in (
  'group-study','exam-prep','dinner','breakfast-lunch','gym','sports','outdoors','skills'
);

insert into public.categories (slug, name, icon, verb, blurb) values
  ('group-study',     'Group study',        'BookOpen',        'Study together',    'Three hours, phones face down, one table.'),
  ('exam-prep',       'Exam prep',          'GraduationCap',   'Prep together',     'Mock tests and doubt-clearing for CAT, GATE, UPSC, NEET.'),
  ('dinner',          'Dinner',             'UtensilsCrossed', 'Eat together',      'A long table, six people, no phones out.'),
  ('breakfast-lunch', 'Breakfast & lunch',  'Croissant',       'Eat together',      'Idli runs at seven, thali at one.'),
  ('gym',             'Gym',                'Dumbbell',        'Train together',    'A spotter, a schedule, and someone who notices you skipped.'),
  ('sports',          'Sports',             'Volleyball',      'Play together',     'Badminton, football, box cricket — teams made on the spot.'),
  ('outdoors',        'Runs & outdoors',    'Footprints',      'Move together',     'Sunrise runs, lake loops, weekend treks.'),
  ('skills',          'Skills & hobbies',   'Palette',         'Practise together', 'Sketching, open mics, chess, language practice.')
on conflict (slug) do update
  set name = excluded.name, icon = excluded.icon, verb = excluded.verb, blurb = excluded.blurb;

-- -------------------------------------------------------------- meetups -----
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

-- --------------------------------------------------------------- joins ------
create table if not exists public.joins (
  id            uuid primary key default gen_random_uuid(),
  meetup_id     uuid        not null references public.meetups (id) on delete cascade,
  user_id       uuid        not null references public.profiles (id) on delete cascade,
  status        text        not null default 'confirmed'
                check (status in ('confirmed', 'waitlisted', 'cancelled')),
  spot_number   integer     not null default 1,
  amount_cents  integer     not null default 0,
  -- Free text rather than a foreign key: 'credit' is a legitimate value, and a
  -- payment row may be deleted for retention reasons without erasing the join.
  payment_id    text,
  created_at    timestamptz not null default now()
);

-- One live join per person per meetup. Cancelled rows are excluded so somebody
-- who changed their mind can come back.
create unique index if not exists joins_one_live_per_member
  on public.joins (meetup_id, user_id)
  where status <> 'cancelled';

create index if not exists joins_user_idx   on public.joins (user_id);
create index if not exists joins_meetup_idx on public.joins (meetup_id);

-- ------------------------------------------------------------ payments ------
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

-- ------------------------------------------------------------- vouches ------
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

-- --------------------------------------------------------------- saves ------
-- The old saves table pointed at businesses. Rebuild it against meetups.
drop table if exists public.saves;
create table public.saves (
  user_id    uuid        not null references public.profiles (id) on delete cascade,
  meetup_id  uuid        not null references public.meetups (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, meetup_id)
);

-- ========================================================== views ============

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
  (select count(*) from public.meetups m where m.host_id = p.id)               as hosted_count,
  coalesce((
    select round(avg(v.rating)::numeric, 1)
    from public.vouches v
    join public.meetups m on m.id = v.meetup_id
    where m.host_id = p.id
  ), 0)                                                                        as host_rating
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

-- ======================================================= functions ==========

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

-- The default full name follows the brand.
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
    coalesce(new.raw_user_meta_data ->> 'full_name', 'VibeClub member'),
    coalesce(new.raw_user_meta_data ->> 'city', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ============================================================= RLS ==========

alter table public.meetups  enable row level security;
alter table public.joins    enable row level security;
alter table public.payments enable row level security;
alter table public.vouches  enable row level security;
alter table public.saves    enable row level security;

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

-- Payments are readable only by the person who made them. Writes come from the
-- server with the service-role key, never from a browser.
drop policy if exists "members read their own payments" on public.payments;
create policy "members read their own payments" on public.payments
  for select using (auth.uid() = user_id);

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

drop policy if exists "members manage their own saves" on public.saves;
create policy "members manage their own saves" on public.saves
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =================================================== retiring the old ======

-- The directory and supper-club tables have no place in the new model. Dropped
-- last so everything above can be applied even if these are already gone.
drop view if exists public.businesses_with_stats;
drop table if exists public.review_helpful_votes;
drop table if exists public.business_claims;
drop table if exists public.quiz_responses;
drop table if exists public.dinner_bookings;
drop table if exists public.dinner_events;
drop table if exists public.reviews;
drop table if exists public.businesses;

drop function if exists public.increment_seats_taken(uuid);
drop function if exists public.decrement_seats_taken(uuid);
