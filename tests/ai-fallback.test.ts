import { describe, expect, it } from 'vitest';
import { demoAnswer } from '@/lib/ai/fallback';

/**
 * Demo mode is retrieval, not intelligence, so what matters is that it routes
 * to the right source and never overstates what it found.
 */
describe('demoAnswer', () => {
  it('answers pricing from the plans, not the directory', async () => {
    const answer = await demoAnswer('what does membership cost?');
    expect(answer).toContain('Explorer');
    expect(answer).toContain('/pricing');
  });

  it('routes club wording to the dinners', async () => {
    const answer = await demoAnswer('how do the wednesday dinners work?');
    expect(answer).toMatch(/seats left/);
    expect(answer).toContain('/dinners/');
  });

  it('treats a bare "dinner" as a restaurant search, not the dinner club', async () => {
    const answer = await demoAnswer('somewhere for dinner in London tonight');
    expect(answer).toContain('/businesses/');
    expect(answer).not.toMatch(/seats left/);
  });

  it('pulls keywords out of a sentence the substring matcher could never match', async () => {
    const answer = await demoAnswer('best rated coffee in Bengaluru');
    expect(answer).toContain('/businesses/');
    expect(answer).toContain('Bengaluru');
  });

  it('says so when only the city matched, rather than claiming the words did', async () => {
    // Words with no hope of matching any listing text — "mechanic" does, as a
    // bike shop's description mentions one, which is the matcher working.
    const answer = await demoAnswer('a zeppelin taxidermist in New York');
    expect(answer).toContain('Nothing matched those words');
    expect(answer).toContain('New York');
  });
});
