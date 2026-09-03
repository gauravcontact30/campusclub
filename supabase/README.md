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
supabase db push          # runs migrations/0001 → 0006
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
| `seed.sql` | the eight fixed categories |

## 3. Load the demo content

The businesses and dinners live in `src/lib/data/seed.ts` so both backends share
one source of truth. Push them up with:

```bash
curl -X POST http://localhost:3000/api/admin/seed \
     -H "x-seed-key: $SUPABASE_SERVICE_ROLE_KEY"
```

## 4. Auth settings

*Authentication → Providers → Email*: enable email/password. Turn **Confirm
email** off while developing, or sign-ups will sit unverified. Add
`http://localhost:3000/**` to *URL Configuration → Redirect URLs*.

## How the two backends stay interchangeable

Every repository function in `src/lib/data/*` branches on
`isSupabaseConfigured()`. The Supabase branch reads the same shapes the demo
branch returns (`src/types`), so pages, components and tests never learn which
one answered.
