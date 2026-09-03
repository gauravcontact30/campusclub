# Supabase setup

The app runs without any of this — with no keys it uses a seeded in-memory
dataset so every screen and flow works locally. Follow these steps when you want
real persistence.

## 1. Create the project

1. Create a project at [supabase.com](https://supabase.com).
2. Copy **Project URL**, **anon key** and **service_role key** from
   *Project Settings → API*.
3. Put them in `.env.local`:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...
   SUPABASE_SERVICE_ROLE_KEY=ey...        # server only, never expose
   ```

## 2. Apply the schema

Either with the CLI:

```bash
supabase link --project-ref <ref>
supabase db push          # runs migrations/0001 → 0008
psql "$DATABASE_URL" -f supabase/seed.sql
```

…or by pasting each file into the SQL editor **in order**:

| File | What it creates |
| --- | --- |
| `migrations/0001_schema.sql` | tables, indexes, `businesses_with_stats` view |
| `migrations/0002_rls.sql` | row-level security for every table |
| `migrations/0003_functions.sql` | new-user trigger, helpful-vote RPC, seat counters |
| `migrations/0004_owner_tools.sql` | owner responses, business claims, `set_owner_response()` |
| `migrations/0005_rename_brand.sql` | brand rename to SitNext — only needed on a database created before it |
| `migrations/0006_rename_to_vibeclub.sql` | brand rename to VibeClub — same |
| `migrations/0007_meetups.sql` | **the current model**: `meetups`, `joins`, `payments`, `vouches`, the three stats views, seat and credit functions, RLS — and it retires the directory and supper-club tables at the end |
| `migrations/0008_rename_to_campusclub.sql` | brand rename to CampusClub: the `profiles.full_name` default, the placeholder rows, and the signup trigger |
| `seed.sql` | the eight fixed categories |

`0007` is a forward migration, so an existing database migrates rather than
being rebuilt: members' old plans are carried across to the new pass tiers
before the `plan` column is dropped, and the old tables are only dropped once
everything new is in place. On a fresh project the earlier files still have to
run first — they create `profiles` and the auth trigger that `0007` builds on.

## 3. Load the demo content

The meetups live in `src/lib/data/seed.ts` so both backends share one source of
truth. Meetups reference a host in `profiles`, which only exists once somebody
has signed up — so **create at least one account first**, then push:

```bash
curl -X POST http://localhost:3000/api/admin/seed \
     -H "x-seed-key: $SUPABASE_SERVICE_ROLE_KEY"
```

Any seeded meetup whose host has not signed up is reassigned to the first
profile that exists, rather than inserted with a dangling foreign key.

## 4. Payments (optional)

Razorpay is independent of Supabase. Add `NEXT_PUBLIC_RAZORPAY_KEY_ID`,
`RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` to switch checkout from the
demo gateway to the real one, and point a webhook at
`/api/payments/razorpay/webhook`. Without them the join flow still works
end to end and says, everywhere it is visible, that nothing is charged.

## 5. Auth settings

*Authentication → Providers → Email*: enable email/password. Turn **Confirm
email** off while developing, or sign-ups will sit unverified. Add
`http://localhost:3000/**` to *URL Configuration → Redirect URLs*.

## How the two backends stay interchangeable

Every repository function in `src/lib/data/*` branches on
`isSupabaseConfigured()`. The Supabase branch reads the same shapes the demo
branch returns (`src/types`), so pages, components and tests never learn which
one answered.
