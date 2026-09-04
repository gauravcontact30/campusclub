import { describe, expect, it } from 'vitest';
import { normaliseSupabaseUrl } from '@/lib/env';

/**
 * The REST endpoint sits directly beside the project URL in the Supabase
 * dashboard and gets copied by mistake often enough to be worth a test: with
 * the suffix left on, every auth call 404s and reports itself as a credentials
 * problem.
 */
describe('normaliseSupabaseUrl', () => {
  it('leaves a correct project URL alone', () => {
    expect(normaliseSupabaseUrl('https://abcdef.supabase.co')).toBe('https://abcdef.supabase.co');
  });

  it('strips the REST suffix people copy by accident', () => {
    expect(normaliseSupabaseUrl('https://abcdef.supabase.co/rest/v1/')).toBe('https://abcdef.supabase.co');
  });

  it('strips the other versioned service paths too', () => {
    expect(normaliseSupabaseUrl('https://abcdef.supabase.co/auth/v1')).toBe('https://abcdef.supabase.co');
    expect(normaliseSupabaseUrl('https://abcdef.supabase.co/storage/v1/')).toBe('https://abcdef.supabase.co');
  });

  it('trims whitespace and trailing slashes from a pasted value', () => {
    expect(normaliseSupabaseUrl('  https://abcdef.supabase.co//  ')).toBe('https://abcdef.supabase.co');
  });

  it('keeps an empty value empty, so isSupabaseConfigured still reports demo mode', () => {
    expect(normaliseSupabaseUrl('')).toBe('');
    expect(normaliseSupabaseUrl('   ')).toBe('');
  });

  it('does not eat a self-hosted path that merely looks similar', () => {
    expect(normaliseSupabaseUrl('https://db.example.com/supabase')).toBe('https://db.example.com/supabase');
  });
});
