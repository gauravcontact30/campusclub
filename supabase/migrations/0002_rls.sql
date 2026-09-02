-- =============================================================================
-- SitNext — row level security
-- Public data stays readable by anyone; everything personal is owner-scoped.
-- =============================================================================

alter table public.profiles        enable row level security;
alter table public.categories      enable row level security;
alter table public.businesses      enable row level security;
alter table public.reviews         enable row level security;
alter table public.review_votes    enable row level security;
alter table public.saves           enable row level security;
alter table public.dinner_events   enable row level security;
alter table public.dinner_bookings enable row level security;
alter table public.quiz_responses  enable row level security;

-- ---------------------------------------------------------------- profiles --
create policy "profiles are public"      on public.profiles for select using (true);
create policy "insert own profile"       on public.profiles for insert with check (auth.uid() = id);
create policy "update own profile"       on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- ------------------------------------------------------ categories/business --
create policy "categories are public"    on public.categories for select using (true);
create policy "businesses are public"    on public.businesses for select using (true);
create policy "members can add listings" on public.businesses for insert to authenticated with check (true);
create policy "owners edit listings"     on public.businesses for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ----------------------------------------------------------------- reviews --
create policy "reviews are public"       on public.reviews for select using (true);
create policy "write own review"         on public.reviews for insert to authenticated with check (auth.uid() = user_id);
create policy "edit own review"          on public.reviews for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own review"        on public.reviews for delete using (auth.uid() = user_id);

create policy "votes are public"         on public.review_votes for select using (true);
create policy "cast own vote"            on public.review_votes for insert to authenticated with check (auth.uid() = user_id);
create policy "retract own vote"         on public.review_votes for delete using (auth.uid() = user_id);

-- ------------------------------------------------------------------- saves --
create policy "read own saves"           on public.saves for select using (auth.uid() = user_id);
create policy "add own save"             on public.saves for insert to authenticated with check (auth.uid() = user_id);
create policy "remove own save"          on public.saves for delete using (auth.uid() = user_id);

-- ----------------------------------------------------------------- dinners --
create policy "dinners are public"       on public.dinner_events for select using (true);

create policy "read own bookings"        on public.dinner_bookings for select using (auth.uid() = user_id);
create policy "book own seat"            on public.dinner_bookings for insert to authenticated with check (auth.uid() = user_id);
create policy "update own booking"       on public.dinner_bookings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------------------------- quiz --
create policy "read own quiz"            on public.quiz_responses for select using (auth.uid() = user_id);
create policy "write own quiz"           on public.quiz_responses for insert to authenticated with check (auth.uid() = user_id);
create policy "update own quiz"          on public.quiz_responses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
