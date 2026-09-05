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
whole schema — tables, indexes, views, functions, the sign-up trigger,
row-level security and all 24 categories — and it is idempotent, so running it
twice is safe.

There is no numbered migration chain any more. It described a product that no
longer exists (a business directory, two brand renames, a supper club) and the
baseline is the single source of truth for `campusclub_db`. If you are bringing
an older database forward, the honest path now is to run the baseline against a
fresh project and migrate the rows you want to keep.

| File | What it creates |
| --- | --- |
| `baseline.sql` | Everything: `profiles`, `meetups`, `joins`, `payments`, `vouches`, `saves`, the three stats views, the seat and credit functions, the sign-up trigger, RLS on every table, and the 24 categories |
| `seed.sql` | Just the 24 fixed categories, for reseeding the catalogue on its own |

### How sign-up actually works

`auth.users` is Supabase's, and holds the email and password hash. `profiles`
is ours, one row per user, and is written by the `on_auth_user_created`
trigger the moment an account is created — it reads `full_name` and `city`
out of the sign-up metadata the app sends.

That trigger runs **inside the same transaction as the `auth.users` insert**,
so anything it raises rolls the whole sign-up back and Supabase answers with
the famously unhelpful *"Database error saving new user"*. Ours therefore
catches every exception, logs a warning and lets the account through: the app
falls back to the sign-up metadata when no profile row exists, so a missing
row is a cosmetic problem while a blocked sign-up is a broken product.

`profiles` is readable only by its owner. Public reads of a member — host
cards, attendee lists, vouch authors — go through the
`profiles_with_host_stats`, `joins_with_member` and `vouches_with_author`
views, which expose display fields only. A blanket public select on the table
would hand `pass` and `credits` to anyone who called PostgREST directly.

## 2b. Check it took

```bash
npm run db:check
```

It verifies the keys are readable, the project answers, every table, view and
RPC the app calls exists, the 24 categories are loaded, and that row-level
security really is on — an anonymous client must not be able to read
`payments`. It exits non-zero on any failure, so it can gate a deploy.

## 2c. Check sign-up and sign-in specifically

```bash
npm run auth:check
```

`db:check` proves the schema is there; this proves a person can actually get an
account. It creates one throwaway address, then reports which of the usual
causes is in the way:

| What it reports | What to do |
| --- | --- |
| Supabase is not configured | The env vars are under the wrong names. They need the `NEXT_PUBLIC_` prefix — see `.env.example` |
| Anon key rejected | Recopy it from *Project Settings → API* |
| Service-role key rejected | Same, but note this one also blocks `/api/admin/seed` and anything else that bypasses RLS |
| No categories | `baseline.sql` was never run |
| Email confirmation is ON | Expected in production with SMTP configured. In development it is the usual culprit: the built-in mailer allows only a couple of sends an hour, so sign-ups start returning `over_email_send_rate_limit` almost immediately. Turn it off at *Authentication → Sign In / Providers → Email → Confirm email* |
| No profile row was created | The `on_auth_user_created` trigger is missing. Re-run `baseline.sql`; it is idempotent |

With a service-role key present it deletes the throwaway account afterwards.
Without one it says so and leaves it for you to remove.

One thing it cannot see from outside: the **redirect allowlist**. If you keep
email confirmation on, every origin you sign up from — `http://localhost:3000`,
`http://localhost:3001`, each preview domain — must be listed under
*Authentication → URL Configuration → Redirect URLs*, or the confirmation link
lands on the Site URL with no session and looks like a silent failure.

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

*Authentication → Providers → Email*: enable email/password. Add
`http://localhost:3000/**` to *URL Configuration → Redirect URLs*.

**Confirm email** decides which of two sign-up flows you get, and both work:

| Setting | What happens |
| --- | --- |
| Off (easiest while developing) | `signUp` returns a session, the visitor is signed in immediately and lands on interest-picking. |
| On | Supabase returns **no session**. The app says "check your inbox" and stays on the sign-up page rather than redirecting a signed-out visitor into a members-only page. They confirm, then sign in. |

The profile row is created by the `on_auth_user_created` trigger in
`baseline.sql`, from the `full_name` and `city` passed as sign-up metadata —
not by the app. That matters because with confirmation on there is no session
at sign-up time, so the app *cannot* write to `profiles`: the
`insert own profile` policy requires `auth.uid() = id`. If sign-ups succeed
but every profile comes out as "CampusClub member" with no city, the trigger
is missing — re-run the functions section of `baseline.sql`.

Signing up with an address that already has an account is not an error to
Supabase: it returns a user with an empty `identities` array rather than
confirm to a stranger that the address is registered. The app treats that as
"account exists, sign in instead".

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

## 7. The Super Admin dashboard

`/admin` is gated by an email allowlist in `src/lib/admin/config.ts`, defaulting
to the owner's address and overridable with `SUPER_ADMIN_EMAILS` (comma
separated). Sign up with that address in this project and the dashboard opens;
everybody else is redirected home.

It reads through the **service-role** key. Every table it reports on is
protected by row-level security written for members — `payments` is readable
only by whoever made it, and `admin_events` has no select policy at all — so
without `SUPABASE_SERVICE_ROLE_KEY` the revenue page shows only the admin's own
payments and the log comes back empty. That is RLS working, not a bug, but it
makes the dashboard useless; set the key.

`admin_events` grows with traffic. Prune it on a schedule
(*Integrations → Cron*):

```sql
select public.prune_admin_events(30);   -- keep 30 days
```

## How the two backends stay interchangeable

Every repository function in `src/lib/data/*` branches on
`isSupabaseConfigured()`. The Supabase branch reads the same shapes the demo
branch returns (`src/types`), so pages, components and tests never learn which
one answered.
