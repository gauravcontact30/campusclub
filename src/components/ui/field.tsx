import { cn } from '@/lib/utils';
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';

const control =
  'w-full rounded-2xl border border-frost/15 bg-noir-700 px-4 py-3 text-sm text-frost placeholder:text-frost/50 transition-colors focus:border-orchid focus:outline-none focus:ring-2 focus:ring-orchid/40';

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-frost">
        {label}
      </label>
      {hint && <p className="text-xs text-frost/55">{hint}</p>}
      {children}
      {error && (
        <p role="alert" className="text-xs font-medium text-orchid-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, 'min-h-[140px] resize-y', className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(control, 'appearance-none bg-[length:0]', className)} {...props}>
      {children}
    </select>
  );
}
