# Supabase setup — `campusclub_db`

The app runs without any of this — with no keys it uses a seeded in-memory
dataset so every screen and flow works locally. Follow these steps when you want
real persistence.

## 1. Create the project

1. Create a project at [supabase.com](https://supabase.com). Any project name
   works; this document calls the database `campusclub_db`.
2. Copy **Project URL**, **anon key** and **service_role key** from
   *Project Settings → API*.
3. Put them in `.env.local`:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...
   SUPABASE_SERVICE_ROLE_KEY=ey...        # server only, never expose
   ```

The app switches backends on those keys alone — no code change, no flag. With
both public keys present every repository function talks to Postgres; without
them it talks to the in-memory store.

## 2. Apply the schema

**On a fresh project, run one file:**

```bash
psql "$DATABASE_URL" -f supabase/baseline.sql
```

…or paste `supabase/baseline.sql` into the SQL editor and run it. It is the
whole current schema — tables, indexes, views, functions, the signup trigger,
row-level security and all 24 categories — and it is idempotent, so running it
twice is safe. **Do not also run `migrations/0001`–`0009` on a fresh project:**
the baseline is those nine files collapsed, minus the renames and the retired
directory tables.

**On a database that already carries part of the chain**, run the numbered
migrations instead — they migrate forward and keep existing rows:

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
| `migrations/0009_more_categories.sql` | sixteen more categories alongside the original eight — movies, gaming, book club, cycling, and the rest of `src/lib/constants.ts`'s `CATEGORIES` |
| `seed.sql` | all 24 fixed categories, for a fresh project seeded outside the migration chain |

`0007` is a forward migration, so an existing database migrates rather than
being rebuilt: members' old plans are carried across to the new pass tiers
before the `plan` column is dropped, and the old tables are only dropped once
everything new is in place.

## 2b. Check it took

```bash
npm run db:check
```

It verifies the keys are readable, the project answers, every table, view and
RPC the app calls exists, the 24 categories are loaded, and that row-level
security really is on — an anonymous client must not be able to read
`payments`. It exits non-zero on any failure, so it can gate a deploy.

## 3. Load the demo content

The meetups live in `src/lib/data/seed.ts` so both backends share one source of
truth. Meetups reference a host in `profiles`, which only exists once somebody
has signed up — so **turn on email auth (step 5) and create at least one
account first**, then push:

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

## 6. Cover images (optional)

`meetups.cover_image` holds a URL per meetup and always wins when set — upload
to Supabase Storage and store the public URL there. When it is null the app
falls back to `PHOTO_COVERS` in `src/lib/media/covers.ts` (keyed by category),
and when that is empty too it draws a themed cover from the category's colour
pair. All three paths are supported; nothing is a placeholder.

Whichever host you use must be allowlisted in `next.config.ts` — Unsplash and
`*.supabase.co` already are. Prove every configured URL resolves before
deploying, because a dead one falls back silently:

```bash
npm run media:check
```

## How the two backends stay interchangeable

Every repository function in `src/lib/data/*` branches on
`isSupabaseConfigured()`. The Supabase branch reads the same shapes the demo
branch returns (`src/types`), so pages, components and tests never learn which
one answered.
