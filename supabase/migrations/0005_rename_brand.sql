-- =============================================================================
-- SitNext — brand rename
-- 0001 and 0003 were updated in place so a fresh database is correct from the
-- start. This migration exists for databases that already ran them: editing an
-- applied migration changes nothing that is already in Postgres.
-- =============================================================================

-- ------------------------------------------------------- default display name --
alter table public.profiles
  alter column full_name set default 'SitNext member';

-- Only touch rows still carrying the old placeholder. A member who typed their
-- own name — or who happens to be called this — is not what we are renaming.
update public.profiles
  set full_name = 'SitNext member'
  where full_name = 'HomeMart member';

-- ------------------------------------------- signup trigger's fallback name --
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
    coalesce(new.raw_user_meta_data ->> 'full_name', 'SitNext member'),
    coalesce(new.raw_user_meta_data ->> 'city', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
