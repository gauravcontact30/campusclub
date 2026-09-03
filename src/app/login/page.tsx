import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/layout/auth-shell';
import { AuthForm } from '@/components/layout/auth-form';
import { getCurrentUser } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect('/');
  const { next } = await searchParams;

  return (
    <AuthShell title="Welcome back." subtitle="Sign in to join meetups, manage your pass and see who is coming.">
      <AuthForm mode="signin" next={next ?? '/'} />
    </AuthShell>
  );
}
