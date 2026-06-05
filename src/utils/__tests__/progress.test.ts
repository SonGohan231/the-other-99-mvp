import { describe, it, expect } from 'vitest';

describe('Test progress calculation', () => {
  it('question 6 of 17 should be ~35.3%', () => {
    const testIndex = 5; // 0-based (on question 6)
    const testTotal = 17;
    const questionNum = testIndex + 1; // 6
    const progressPct = Math.round((questionNum / testTotal) * 100);
    expect(progressPct).toBe(35);
  });

  it('first question should be ~6%', () => {
    const progressPct = Math.round((1 / 17) * 100);
    expect(progressPct).toBe(6);
  });

  it('last question should be 100%', () => {
    const progressPct = Math.round((17 / 17) * 100);
    expect(progressPct).toBe(100);
  });
});

describe('testSession helpers', () => {
  it('TEST_USER_ID is stable', async () => {
    const { TEST_USER_ID } = await import('../testSession');
    expect(TEST_USER_ID).toBe('local-test-user');
  });
});
