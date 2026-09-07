import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/layout/auth-shell';
import { AuthForm } from '@/components/layout/auth-form';
import { getCurrentUser } from '@/lib/auth/session';
import { AUTH_IMAGE_IDS } from '@/lib/media/auth';

export const metadata: Metadata = { title: 'Create an account' };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect('/meetups');
  const { next } = await searchParams;

  return (
    <AuthShell
      title="Create your account."
      subtitle="It takes about a minute, and it is free."
      imageId={AUTH_IMAGE_IDS.signup}
      next={next ?? '/profile/interests'}
    >
      <AuthForm mode="signup" next={next ?? '/profile/interests'} />
    </AuthShell>
  );
}
