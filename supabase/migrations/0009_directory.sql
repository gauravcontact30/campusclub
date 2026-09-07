-- ===========================================================================
-- 0009 — the directory
--
-- Additive only. Touches no passes, payments or join table: the production
-- subscription schema is mid-repair and the two must not entangle.
--
-- The taxonomy here is deliberately NOT public.categories. That table holds
-- the 24 things people do together; this one holds what a place is. A cafe is
-- not an activity and "Exam prep" is not a business type.
-- ===========================================================================

create extension if not exists pg_trgm;

-- ================================================= business_categories ======
create table if not exists public.business_categories (
  slug        text primary key,
  name        text not null,
  icon        text not null default 'Store',
  parent_slug text references public.business_categories (slug),
  blurb       text not null default ''
);

insert into public.business_categories (slug, name, icon, parent_slug, blurb) values
  ('food-drink',    'Food & drink',  'UtensilsCrossed', null, 'Restaurants, cafes, bakeries and the chai stall on the corner.'),
  ('active-life',   'Active life',   'Dumbbell',        null, 'Gyms, courts, pools and parks.'),
  ('study-work',    'Study & work',  'BookOpen',        null, 'Libraries, reading rooms, coaching centres, coworking desks.'),
  ('beauty-spas',   'Beauty & spas', 'Scissors',        null, 'Salons, barbers, spas.'),
  ('shopping',      'Shopping',      'ShoppingBag',     null, 'Books, clothes, electronics, groceries.'),
  ('nightlife',     'Nightlife',     'Martini',         null, 'Bars, pubs and places open late.'),
  ('home-services', 'Home services', 'Wrench',          null, 'Repairs, laundry, movers.'),
  ('health',        'Health',        'Stethoscope',     null, 'Clinics, pharmacies, dentists.'),

  ('restaurants',       'Restaurants',       'UtensilsCrossed', 'food-drink',    'Sit-down meals.'),
  ('cafes',             'Cafes',             'Coffee',          'food-drink',    'Coffee, and a table you can sit at for three hours.'),
  ('bakeries',          'Bakeries',          'Croissant',       'food-drink',    'Bread, cake, puffs.'),
  ('fast-food',         'Fast food',         'Sandwich',        'food-drink',    'Quick, cheap, standing room.'),
  ('ice-cream',         'Ice cream',         'IceCreamCone',    'food-drink',    'Cones and kulfi.'),
  ('gyms',              'Gyms',              'Dumbbell',        'active-life',   'Weights and machines.'),
  ('sports-venues',     'Sports venues',     'Volleyball',      'active-life',   'Courts, turf and grounds.'),
  ('swimming',          'Swimming',          'Waves',           'active-life',   'Pools.'),
  ('parks',             'Parks',             'Trees',           'active-life',   'Green space to run or sit in.'),
  ('yoga-studios',      'Yoga studios',      'Flower2',         'active-life',   'Mats and morning classes.'),
  ('libraries',         'Libraries',         'Library',         'study-work',    'Quiet, free, and usually full by nine.'),
  ('coaching-centres',  'Coaching centres',  'GraduationCap',   'study-work',    'CAT, GATE, UPSC, NEET.'),
  ('coworking',         'Coworking',         'Briefcase',       'study-work',    'A desk by the day.'),
  ('colleges',          'Colleges',          'School',          'study-work',    'Campuses and institutes.'),
  ('salons',            'Salons',            'Scissors',        'beauty-spas',   'Hair and grooming.'),
  ('spas',              'Spas',              'Flower',          'beauty-spas',   'Massage and treatments.'),
  ('barbers',           'Barbers',           'Scissors',        'beauty-spas',   'A chair and a cut.'),
  ('bookshops',         'Bookshops',         'BookMarked',      'shopping',      'New, second-hand and exam guides.'),
  ('clothing',          'Clothing',          'Shirt',           'shopping',      'Clothes and shoes.'),
  ('electronics',       'Electronics',       'Smartphone',      'shopping',      'Phones, laptops, repairs.'),
  ('groceries',         'Groceries',         'ShoppingCart',    'shopping',      'Supermarkets and kirana.'),
  ('stationery',        'Stationery',        'PenLine',         'shopping',      'Notebooks, printing, photocopies.'),
  ('bars',              'Bars',              'Martini',         'nightlife',     'Drinks and a late close.'),
  ('pubs',              'Pubs',              'Beer',            'nightlife',     'Beer and a television.'),
  ('clubs',             'Clubs',             'Disc3',           'nightlife',     'Music, and a cover charge.'),
  ('laundry',           'Laundry',           'WashingMachine',  'home-services', 'Wash, iron, dry-clean.'),
  ('repairs',           'Repairs',           'Wrench',          'home-services', 'Electricians, plumbers, hardware.'),
  ('car-repair',        'Car repair',        'Car',             'home-services', 'Garages and service centres.'),
  ('clinics',           'Clinics',           'Stethoscope',     'health',        'Doctors and small hospitals.'),
  ('pharmacies',        'Pharmacies',        'Pill',            'health',        'Chemists.'),
  ('dentists',          'Dentists',          'Smile',           'health',        'Teeth.')
on conflict (slug) do update
  set name = excluded.name, icon = excluded.icon,
      parent_slug = excluded.parent_slug, blurb = excluded.blurb;

-- ========================================================== businesses ======
create table if not exists public.businesses (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  city_slug     text not null,
  category_slug text not null references public.business_categories (slug),
  address       text not null default '',
  locality      text not null default '',
  lat           double precision not null,
  lng           double precision not null,
  phone         text,
  website       text,
  hours         jsonb  not null default '{}',
  price_band    smallint check (price_band between 1 and 4),
  osm_type      text,
  osm_id        bigint,
  attribution   text not null default 'OpenStreetMap contributors, ODbL',

  -- Maintained by the trigger below, not derived per request. Deriving is
  -- right for hundreds of meetups (see withAggregates in store.ts) and wrong
  -- at directory scale, where a city page would aggregate the whole review
  -- table on every load.
  rating        numeric(2,1) not null default 0,
  review_count  integer      not null default 0,

  claimed_by    uuid references public.profiles (id) on delete set null,
  claimed_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- The default-sort key. Stored generated so the Recommended ordering is one
  -- index scan: on import day every row has no reviews, and sorting by rating
  -- would be arbitrary.
  completeness smallint generated always as (
    (case when hours <> '{}'::jsonb then 1 else 0 end) +
    (case when phone    is not null and phone    <> '' then 1 else 0 end) +
    (case when website  is not null and website  <> '' then 1 else 0 end) +
    (case when address  <> '' then 1 else 0 end) +
    (case when locality <> '' then 1 else 0 end)
  ) stored,

  search_vector tsvector generated always as (
    to_tsvector('simple',
      coalesce(name, '') || ' ' || coalesce(locality, '') || ' ' || coalesce(address, ''))
  ) stored,

  unique (osm_type, osm_id)
);

create index if not exists businesses_city_cat_idx on public.businesses (city_slug, category_slug);
create index if not exists businesses_name_trgm    on public.businesses using gin (name gin_trgm_ops);
create index if not exists businesses_search_idx   on public.businesses using gin (search_vector);
create index if not exists businesses_rank_idx     on public.businesses (city_slug, rating desc, review_count desc);
create index if not exists businesses_reco_idx     on public.businesses (city_slug, completeness desc, rating desc, name);

-- ==================================================== business_reviews ======
create table if not exists public.business_reviews (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references public.businesses (id) on delete cascade,
  user_id        uuid not null references public.profiles (id) on delete cascade,
  rating         integer not null check (rating between 1 and 5),
  body           text not null,
  photos         text[] not null default '{}',
  owner_reply    text,
  owner_reply_at timestamptz,
  created_at     timestamptz not null default now(),
  unique (business_id, user_id)
);

create index if not exists business_reviews_business_idx on public.business_reviews (business_id, created_at desc);

-- The single writer that keeps businesses.rating honest.
create or replace function public.refresh_business_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare target uuid;
begin
  target := coalesce(new.business_id, old.business_id);
  update public.businesses b
     set rating       = coalesce((select round(avg(r.rating)::numeric, 1) from public.business_reviews r where r.business_id = target), 0),
         review_count = (select count(*) from public.business_reviews r where r.business_id = target),
         updated_at   = now()
   where b.id = target;
  return null;
end;
$$;

drop trigger if exists business_reviews_rating on public.business_reviews;
create trigger business_reviews_rating
  after insert or update or delete on public.business_reviews
  for each row execute function public.refresh_business_rating();

-- Author name/avatar alongside the review, mirroring vouches_with_author.
create or replace view public.business_reviews_with_author as
  select r.*, p.full_name as author_name, p.avatar_url as author_avatar
    from public.business_reviews r
    join public.profiles p on p.id = r.user_id;

-- ============================================== meetups.venue_business ======
alter table public.meetups
  add column if not exists venue_business_id uuid references public.businesses (id) on delete set null;

create index if not exists meetups_venue_idx on public.meetups (venue_business_id);

-- =============================================================== RLS ========
alter table public.business_categories enable row level security;
alter table public.businesses          enable row level security;
alter table public.business_reviews    enable row level security;

drop policy if exists "business categories are public" on public.business_categories;
create policy "business categories are public" on public.business_categories for select using (true);

-- Read-only to everyone. Writes belong to the importer, which uses the service
-- role and bypasses RLS entirely — there is deliberately no insert policy.
drop policy if exists "businesses are public" on public.businesses;
create policy "businesses are public" on public.businesses for select using (true);

drop policy if exists "business reviews are public" on public.business_reviews;
create policy "business reviews are public" on public.business_reviews for select using (true);

drop policy if exists "members write their own business reviews" on public.business_reviews;
create policy "members write their own business reviews" on public.business_reviews
  for insert with check (auth.uid() = user_id);

drop policy if exists "authors edit their own business reviews" on public.business_reviews;
create policy "authors edit their own business reviews" on public.business_reviews
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Written now, inert until the claims milestone: nothing sets claimed_by yet.
drop policy if exists "owners reply to reviews on a claimed business" on public.business_reviews;
create policy "owners reply to reviews on a claimed business" on public.business_reviews
  for update using (
    exists (select 1 from public.businesses b
             where b.id = business_reviews.business_id and b.claimed_by = auth.uid())
  );
