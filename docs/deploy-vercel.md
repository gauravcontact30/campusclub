# Deploying CampusClub to Vercel

The app is a stock Next.js 16 App Router project, so Vercel needs no build
configuration — no `vercel.json`, no overridden install or build command. What
it does need is five minutes of setup in two dashboards, in this order. Doing
Supabase second is the usual cause of a deploy that builds cleanly and then
fails on the first sign-up.

---

## 1. Import the repository

Vercel → **Add New… → Project** → import `gauravcontact30/campusclub`.

| Setting | Value |
| --- | --- |
| Framework preset | Next.js (detected) |
| Root directory | `./` |
| Build command | leave default (`next build`) |
| Install command | leave default |
| Production branch | whichever branch you want live — currently the work sits on `claude/nextjs-business-directory-app-n6fixd` |

Do **not** deploy yet. Add the environment variables first: `NEXT_PUBLIC_*`
values are inlined into the client bundle at build time, so a variable added
after a build does not reach the browser until you redeploy.

---

## 2. Environment variables

Settings → **Environment Variables**. Add each to Production, Preview and
Development unless noted.

### Required — accounts do not work without these

| Name | Where it comes from | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → **Project URL** | `https://<ref>.supabase.co`. Copy the Project URL, not the REST endpoint beside it. The app strips a `/rest/v1` suffix defensively, but the clean value is what belongs here. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same page, **anon / publishable** key | Safe in the browser. RLS is what protects the data. |
| `SUPABASE_SERVICE_ROLE_KEY` | same page, **service_role / secret** key | Server-only. Bypasses RLS entirely. Never prefix it with `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_SITE_URL` | your own domain | e.g. `https://campusclub.vercel.app`. Must be a full absolute URL — a blank value is not the same as an unset one and will fail the build at `new URL(...)` in `src/app/layout.tsx`. |

Leave every Supabase variable out entirely and the site still builds and
browses, but sign-in and sign-up will say the backend is not configured. That
is deliberate: there is no local fallback that mints a session owning nothing.

### Optional — each degrades to a labelled fallback

| Name | Without it |
| --- | --- |
| `ANTHROPIC_API_KEY` | The "Ask CampusClub" panel answers by retrieval only and says so. |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Checkout uses a clearly-labelled demo gateway: joins are recorded, nothing is charged. |
| `RAZORPAY_WEBHOOK_SECRET` | `/api/payments/razorpay/webhook` rejects every delivery, which is the correct behaviour when it cannot verify a signature. |
| `SUPER_ADMIN_EMAILS` | `/admin` falls back to the owner address in `src/lib/admin/config.ts`. |

---

## 3. Supabase: schema

SQL Editor → new query → paste the whole of [`supabase/baseline.sql`](../supabase/baseline.sql) → Run.

It is idempotent, so re-running it is safe. It creates the tables, the RLS
policies, the `handle_new_user` trigger that gives every new account a profile
row, and the RPCs the join flow calls. Optionally follow it with
`supabase/seed.sql` for demo content.

Then verify from your machine with the project's own checker:

```bash
npm run db:check
```

## 4. Supabase: auth configuration

Authentication → **URL Configuration**:

| Field | Value |
| --- | --- |
| Site URL | `https://<your-domain>` |
| Redirect URLs | `https://<your-domain>/auth/callback` |
| Redirect URLs | `https://*-<your-team>.vercel.app/auth/callback` — needed for preview deploys, which email links back to their own origin |

`/auth/callback` handles both link shapes Supabase can send (`?code=` for PKCE,
`?token_hash=&type=` for the email-OTP style) and routes recovery links to
`/reset-password`. A redirect URL missing from this allow-list is the single
most common cause of a confirmation link that lands on an error page.

Authentication → **Providers → Email**, decide one thing:

- **Confirm email ON** — members must click the emailed link before their first
  sign-in. Correct for production.
- **Confirm email OFF** — sign-up creates a session immediately. Easier for a
  demo; means unverified addresses in your user table.

---

## 5. Deploy and check

Trigger the deploy. Then, on the live URL:

1. `/` renders and the palette switcher works.
2. `/signup` creates an account; the confirmation email link returns to
   `/auth/callback` and lands you signed in.
3. `/forgot-password` sends a reset; the link opens `/reset-password`.
4. Supabase → Table Editor → `profiles` has a row whose `id` matches the new
   user in Authentication → Users. If the user exists but the profile does not,
   the trigger did not fire — check Postgres logs for the
   `handle_new_user failed` warning it raises rather than throwing.
5. `/meetups` lists meetups; joining one either takes a pass credit or opens
   checkout.

---

## Deploying from the CLI instead

```bash
npm i -g vercel
vercel login
vercel link
vercel --prod
```

The same environment variables are still required; `vercel env pull` copies
them back into a local `.env.local` once they are set in the dashboard.

---

## Rotating a leaked key

If a `service_role` key has been pasted anywhere it should not have been:
Supabase → Project Settings → API → **Reset** the service key, then update
`SUPABASE_SERVICE_ROLE_KEY` in Vercel and redeploy. The old key stops working
immediately, so do these two steps together.
