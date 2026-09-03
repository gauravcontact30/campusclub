import type { ReactNode } from 'react';
import { BACKEND_MODE } from '@/lib/env';

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-[calc(100dvh-68px)] lg:grid-cols-2">
      <div className="flex items-center justify-center px-5 py-14 sm:px-10">
        <div className="w-full max-w-md">
          <h1 className="display-lg text-balance text-content">{title}</h1>
          <p className="lede mt-3">{subtitle}</p>
          <div className="mt-9">{children}</div>

          {BACKEND_MODE === 'demo' && (
            <div className="mt-8 rounded-2xl border border-dashed border-content/25 p-4 text-xs leading-relaxed text-content/60">
              <p className="font-semibold text-content">Demo mode is on</p>
              <p className="mt-1">
                No Supabase keys detected, so accounts live in the seeded dataset. Sign in with{' '}
                <span className="font-mono text-content">priya@example.com</span> /{' '}
                <span className="font-mono text-content">password123</span>, or create a new account — both work.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-canvas lg:block">
        <div aria-hidden className="absolute -left-20 top-1/4 h-96 w-96 rounded-full bg-brand/30 blur-[130px]" />
        <div aria-hidden className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-signal/20 blur-[130px]" />
        <div className="relative flex h-full flex-col justify-end p-14 text-content">
          <blockquote className="font-display text-3xl font-semibold leading-tight">
            “I paid ₹99 to study with seven strangers because I could not do it alone. Eleven weeks later I still
            cannot — but now I do not have to.”
          </blockquote>
          <p className="mt-5 text-sm text-content/60">Vikram S. — 34 meetups in Pune</p>
        </div>
      </div>
    </div>
  );
}
