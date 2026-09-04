-- =============================================================================
-- CampusClub — brand rename
--
-- Forward-only, like every migration here: 0006 is applied history and editing
-- it would change nothing in a database that has already run it. This is the
-- file that actually renames the brand in Postgres.
-- =============================================================================

-- The default a new profile is created with.
alter table public.profiles alter column full_name set default 'CampusClub member';

-- Existing rows that only ever carried the placeholder. Anyone who set a real
-- name is left alone.
update public.profiles
   set full_name = 'CampusClub member'
 where full_name in ('VibeClub member', 'SitNext member', 'HomeMart member');

-- The signup trigger writes that same fallback, so it has to move too.
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
    coalesce(new.raw_user_meta_data ->> 'full_name', 'CampusClub member'),
    coalesce(new.raw_user_meta_data ->> 'city', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
