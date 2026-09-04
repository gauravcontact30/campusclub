import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthShell } from '@/components/layout/auth-shell';
import { NewPasswordForm } from '@/components/layout/reset-forms';
import { getCurrentUser } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Choose a new password' };

/**
 * Reached from the emailed recovery link, which /auth/callback exchanges for a
 * session before redirecting here. No session means the link expired, was
 * already used, or somebody typed the URL — all of which want the same answer.
 */
export default async function ResetPasswordPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <AuthShell
        title="That link has expired."
        subtitle="Reset links are good for one hour and one use. Ask for a fresh one and it will work."
      >
        <Link
          href="/forgot-password"
          className="inline-flex h-12 w-full items-center justify-center rounded-full bg-brand px-6 font-semibold text-on-brand transition-transform hover:scale-[1.01] active:scale-[0.99]"
        >
          Send a new link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password." subtitle={`Setting a new password for ${user.email}.`}>
      <NewPasswordForm />
    </AuthShell>
  );
}
