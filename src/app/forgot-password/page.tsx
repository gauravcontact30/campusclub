import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/layout/auth-shell';
import { ForgotPasswordForm } from '@/components/layout/reset-forms';
import { getCurrentUser } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Reset your password' };

export default async function ForgotPasswordPage() {
  // Somebody already signed in does not need this; sending them here would
  // just be a dead end with their own session already active.
  if (await getCurrentUser()) redirect('/profile');

  return (
    <AuthShell
      title="Let's get you back in."
      subtitle="Give us the address on your account and we will email a link that sets a new password."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
