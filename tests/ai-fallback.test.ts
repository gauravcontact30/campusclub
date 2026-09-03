import { beforeEach, describe, expect, it } from 'vitest';
import { demoAnswer } from '@/lib/ai/fallback';
import { resetDb } from '@/lib/data/store';

/**
 * Demo mode is retrieval, not intelligence, so what matters is that it routes
 * to the right source and never overstates what it found.
 */
beforeEach(() => {
  resetDb();
});

describe('demoAnswer', () => {
  it('answers a pricing question with the join-fee model, not a subscription pitch', async () => {
    const answer = await demoAnswer('how much does it cost to join?');
    expect(answer).toMatch(/join fee/i);
    expect(answer).toContain('/meetups');
  });

  it('leads with "you do not need a pass" when asked about passes', async () => {
    const answer = await demoAnswer('should I get a membership?');
    expect(answer).toMatch(/do not need a pass/i);
    expect(answer).toContain('Starter');
    expect(answer).toContain('/passes');
  });

  it('answers refunds from the cancellation rule', async () => {
    const answer = await demoAnswer('can I get a refund if I cancel?');
    expect(answer).toMatch(/6 hours/);
    expect(answer).toContain('/my-meetups');
  });

  it('points hosts at the host page and says they keep the fee', async () => {
    const answer = await demoAnswer('how do I host my own meetup?');
    expect(answer).toContain('/host');
    expect(answer).toMatch(/keep the whole join fee/i);
  });

  it('searches the board for an activity and links real meetups', async () => {
    const answer = await demoAnswer('badminton in Bengaluru');
    expect(answer).toMatch(/meetups? match that/);
    expect(answer).toMatch(/\/meetups\/[a-z0-9-]+/);
    expect(answer).toMatch(/to join/);
  });

  it('narrows to a city when one is named', async () => {
    const answer = await demoAnswer('something to do in Chennai');
    expect(answer).toContain('Chennai');
  });

  it('is honest when only the city matched and the words did not', async () => {
    const answer = await demoAnswer('a zeppelin taxidermist in Pune');
    expect(answer).toMatch(/Nothing matched those words/);
    expect(answer).toContain('Pune');
  });

  it('admits it found nothing rather than inventing something', async () => {
    const answer = await demoAnswer('zeppelin taxidermy');
    expect(answer).toMatch(/could not find anything/i);
    expect(answer).toContain('/meetups');
  });
});
