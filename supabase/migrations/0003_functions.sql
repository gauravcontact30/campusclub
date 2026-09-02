-- =============================================================================
-- HomeMart — triggers and RPCs
-- =============================================================================

-- A profile row for every new auth user, populated from the signup metadata.
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
    coalesce(new.raw_user_meta_data ->> 'full_name', 'HomeMart member'),
    coalesce(new.raw_user_meta_data ->> 'city', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep reviews.updated_at honest.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reviews_touch_updated_at on public.reviews;
create trigger reviews_touch_updated_at
  before update on public.reviews
  for each row execute function public.touch_updated_at();

-- Vote / un-vote a review and return the fresh count in one round trip.
create or replace function public.toggle_review_helpful(p_review_id uuid, p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing boolean;
  v_count    integer;
begin
  select exists (
    select 1 from public.review_votes where review_id = p_review_id and user_id = p_user_id
  ) into v_existing;

  if v_existing then
    delete from public.review_votes where review_id = p_review_id and user_id = p_user_id;
  else
    insert into public.review_votes (review_id, user_id) values (p_review_id, p_user_id);
  end if;

  update public.reviews r
     set helpful_count = (select count(*) from public.review_votes v where v.review_id = r.id)
   where r.id = p_review_id
  returning helpful_count into v_count;

  return coalesce(v_count, 0);
end;
$$;

-- Seat counters. Guarded so a table can never oversell or go negative.
create or replace function public.increment_seats_taken(p_event_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.dinner_events
     set seats_taken = least(seats_total, seats_taken + 1)
   where id = p_event_id;
$$;

create or replace function public.decrement_seats_taken(p_event_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.dinner_events
     set seats_taken = greatest(0, seats_taken - 1)
   where id = p_event_id;
$$;
