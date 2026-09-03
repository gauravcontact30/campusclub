import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/layout/auth-shell';
import { AuthForm } from '@/components/layout/auth-form';
import { getCurrentUser } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Create an account' };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect('/meetups');
  const { next } = await searchParams;

  return (
    <AuthShell
      title="Two minutes, then pick something."
      subtitle="Free to create. You only ever pay the join fee for the meetups you actually go to."
    >
      <AuthForm mode="signup" next={next ?? '/profile/interests'} />
    </AuthShell>
  );
}
