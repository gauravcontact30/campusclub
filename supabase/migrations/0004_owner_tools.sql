-- =============================================================================
-- HomeMart — owner tools
-- Public right of reply on reviews, and an audit trail for listing claims.
-- =============================================================================

-- ------------------------------------------------------- owner replies ------
alter table public.reviews
  add column if not exists owner_response    text,
  add column if not exists owner_response_at timestamptz;

comment on column public.reviews.owner_response is
  'Public reply written by the verified owner of the business. Owners can never edit or remove the review itself.';

-- ------------------------------------------------------------- claims -------
create table if not exists public.business_claims (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid        not null references public.businesses (id) on delete cascade,
  user_id       uuid        not null references public.profiles (id)   on delete cascade,
  role          text        not null default '',
  contact_email text        not null default '',
  phone         text        not null default '',
  note          text        not null default '',
  created_at    timestamptz not null default now()
);

create index if not exists business_claims_business_idx on public.business_claims (business_id, created_at desc);

alter table public.business_claims enable row level security;

create policy "read own claims"
  on public.business_claims for select
  using (auth.uid() = user_id);

create policy "file own claim"
  on public.business_claims for insert to authenticated
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------ policies ------
-- Claiming: an authenticated member may take over a listing that has no owner,
-- and only by putting their own id on it.
create policy "claim an unowned listing"
  on public.businesses for update to authenticated
  using (owner_id is null)
  with check (owner_id = auth.uid());

-- Replying goes through a function rather than a policy. A column grant would
-- be role-wide, which would let a reviewer write a fake "owner response" on
-- their own review under the existing "edit own review" policy.
revoke update on public.reviews from authenticated;
grant update (rating, title, body, photos) on public.reviews to authenticated;

create or replace function public.set_owner_response(p_review_id uuid, p_body text)
returns public.reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  v_review public.reviews;
begin
  if not exists (
    select 1
      from public.reviews r
      join public.businesses b on b.id = r.business_id
     where r.id = p_review_id
       and b.owner_id = auth.uid()
  ) then
    raise exception 'Only the verified owner of this listing can reply to its reviews.'
      using errcode = '42501';
  end if;

  update public.reviews
     set owner_response    = nullif(p_body, ''),
         owner_response_at = case when nullif(p_body, '') is null then null else now() end
   where id = p_review_id
  returning * into v_review;

  return v_review;
end;
$$;

revoke all on function public.set_owner_response(uuid, text) from public;
grant execute on function public.set_owner_response(uuid, text) to authenticated;
