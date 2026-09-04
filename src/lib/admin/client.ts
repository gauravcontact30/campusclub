import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * The client the dashboard reads through.
 *
 * It has to be the service-role one. Every table the dashboard reports on is
 * protected by row-level security written for members: `payments` is readable
 * only by the person who made it, and `admin_events` has no select policy at
 * all. Read through the admin's own session and the revenue page would show
 * only the admin's own payments and the log would be empty — correct
 * behaviour from RLS, useless as a dashboard.
 *
 * Safe because every caller is a server component or a server action behind
 * the /admin gate; the key is never sent to a browser. If the key is missing
 * the session client is returned instead, so pages render with whatever that
 * account may legitimately see rather than crashing — the dashboard says so.
 */
export async function adminReadClient() {
  return createSupabaseAdminClient() ?? (await createSupabaseServerClient());
}
