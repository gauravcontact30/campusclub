-- =============================================================================
-- HomeMart — core schema
-- Apply with:  supabase db push      (or paste into the SQL editor)
-- =============================================================================

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------- profiles --
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text        not null default 'HomeMart member',
  avatar_url  text,
  city        text        not null default '',
  bio         text        not null default '',
  plan        text        not null default 'free'
              check (plan in ('free', 'monthly', 'quarterly', 'annual')),
  created_at  timestamptz not null default now()
);

-- -------------------------------------------------------------- categories --
create table if not exists public.categories (
  slug  text primary key,
  name  text not null,
  icon  text not null default 'Store',
  blurb text not null default ''
);

-- -------------------------------------------------------------- businesses --
create table if not exists public.businesses (
  id            uuid primary key default gen_random_uuid(),
  slug          text        not null unique,
  name          text        not null,
  category_slug text        not null references public.categories (slug),
  tags          text[]      not null default '{}',
  description   text        not null default '',
  phone         text        not null default '',
  website       text        not null default '',
  address       text        not null default '',
  neighborhood  text        not null default '',
  city          text        not null,
  state         text        not null default '',
  postal_code   text        not null default '',
  lat           double precision not null default 0,
  lng           double precision not null default 0,
  price_level   smallint    not null default 2 check (price_level between 1 and 4),
  cover_image   text        not null default '',
  images        text[]      not null default '{}',
  -- Monday-first array of { open, close } — null values mean closed that day
  hours         jsonb       not null default '[]'::jsonb,
  amenities     text[]      not null default '{}',
  owner_id      uuid        references public.profiles (id) on delete set null,
  is_claimed    boolean     not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists businesses_city_idx        on public.businesses (city);
create index if not exists businesses_category_idx    on public.businesses (category_slug);
create index if not exists businesses_price_idx       on public.businesses (price_level);
create index if not exists businesses_name_trgm_idx   on public.businesses using gin (name gin_trgm_ops);
create index if not exists businesses_desc_trgm_idx   on public.businesses using gin (description gin_trgm_ops);

-- ----------------------------------------------------------------- reviews --
create table if not exists public.reviews (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid        not null references public.businesses (id) on delete cascade,
  user_id       uuid        not null references public.profiles (id)   on delete cascade,
  rating        smallint    not null check (rating between 1 and 5),
  title         text        not null default '',
  body          text        not null default '',
  photos        text[]      not null default '{}',
  helpful_count integer     not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- one review per person per business, editable forever
  unique (business_id, user_id)
);

create index if not exists reviews_business_idx on public.reviews (business_id, created_at desc);
create index if not exists reviews_user_idx     on public.reviews (user_id);

create table if not exists public.review_votes (
  review_id  uuid not null references public.reviews (id)  on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);

-- ------------------------------------------------------------------- saves --
create table if not exists public.saves (
  user_id     uuid not null references public.profiles (id)   on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, business_id)
);

-- ----------------------------------------------------------------- dinners --
create table if not exists public.dinner_events (
  id              uuid primary key default gen_random_uuid(),
  city            text        not null,
  neighborhood    text        not null default '',
  venue_name      text        not null default '',
  venue_reveal_at timestamptz not null,
  starts_at       timestamptz not null,
  seats_total     smallint    not null default 6,
  seats_taken     smallint    not null default 0 check (seats_taken >= 0),
  price_cents     integer     not null default 0,
  language        text        not null default 'English',
  vibe            text        not null default '',
  cover_image     text        not null default '',
  host_notes      text        not null default '',
  created_at      timestamptz not null default now()
);

create index if not exists dinner_events_city_time_idx on public.dinner_events (city, starts_at);

create table if not exists public.dinner_bookings (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid        not null references public.dinner_events (id) on delete cascade,
  user_id     uuid        not null references public.profiles (id)      on delete cascade,
  status      text        not null default 'confirmed'
              check (status in ('confirmed', 'waitlisted', 'cancelled')),
  seat_number smallint    not null default 1,
  created_at  timestamptz not null default now()
);

-- A member can hold only one live seat per table (cancelled rows may repeat).
create unique index if not exists dinner_bookings_live_idx
  on public.dinner_bookings (event_id, user_id)
  where status <> 'cancelled';

-- ---------------------------------------------------------- quiz responses --
create table if not exists public.quiz_responses (
  user_id    uuid primary key references public.profiles (id) on delete cascade,
  answers    jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------- aggregates as view --
-- Rating and review count are always derived, never stored, so they cannot drift.
create or replace view public.businesses_with_stats
with (security_invoker = true) as
  select
    b.*,
    coalesce(round(avg(r.rating)::numeric, 1), 0)::float8 as rating,
    count(r.id)::int                                      as review_count
  from public.businesses b
  left join public.reviews r on r.business_id = b.id
  group by b.id;
