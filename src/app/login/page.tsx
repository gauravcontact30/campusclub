import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/layout/auth-shell';
import { AuthForm } from '@/components/layout/auth-form';
import { getCurrentUser } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect('/');
  const { next, error } = await searchParams;

  return (
    <AuthShell title="Welcome back." subtitle="Sign in to join meetups, manage your pass and see who is coming.">
      {/* /auth/callback bounces a rejected or expired email link back here
          with the reason attached — otherwise it lands silently and looks
          like the link simply did nothing. */}
      {error && (
        <p role="alert" className="mb-5 rounded-2xl border border-brand/35 bg-brand/10 p-4 text-sm text-content/80">
          {error}
        </p>
      )}
      <AuthForm mode="signin" next={next ?? '/'} />
    </AuthShell>
  );
}
