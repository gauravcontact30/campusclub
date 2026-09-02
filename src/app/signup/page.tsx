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
  if (user) redirect('/dinners');
  const { next } = await searchParams;

  return (
    <AuthShell
      title="Two minutes to your first table."
      subtitle="Create an account, answer six questions, and pick the Wednesday that suits you."
    >
      <AuthForm mode="signup" next={next ?? '/dinners/quiz'} />
    </AuthShell>
  );
}
