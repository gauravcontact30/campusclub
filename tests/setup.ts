import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(cleanup);

// jsdom implements neither of these, and components that scroll results into
// view after a filter or a page change would throw rather than render.
if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = vi.fn();

// next/navigation is not available outside the app runtime.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));
