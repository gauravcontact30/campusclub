-- =============================================================================
-- VibeClub — brand rename (SitNext → VibeClub)
-- 0001 and 0003 were updated in place so a fresh database is correct from the
-- start. This migration exists for databases that already ran them.
--
-- 0005 is deliberately left alone: it is the record of the previous rename that
-- has already been applied, and rewriting an applied migration makes the file
-- disagree with what is actually in Postgres.
-- =============================================================================

alter table public.profiles
  alter column full_name set default 'VibeClub member';

-- Only rows still carrying a placeholder, from either era. A member who typed
-- their own name is not what is being renamed.
update public.profiles
  set full_name = 'VibeClub member'
  where full_name in ('SitNext member', 'HomeMart member');

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
