import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage
const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
});

describe('inProgressTest', () => {
  beforeEach(() => { Object.keys(store).forEach(k => delete store[k]); });

  it('save and load round-trips correctly', async () => {
    const { saveInProgressTest, loadInProgressTest } = await import('../inProgressTest');
    saveInProgressTest({
      testNumber: 1,
      testSessionId: null,
      testAnswerIndex: 3,
      testContentIds: ['A', 'B', 'C'],
      currentItemId: 'B',
      pendingAnswer: '',
      pendingSelection: null,
      selectedCard: null,
      canUndoAnswer: false,
      nextCardIds: [],
      skipEvents: [],
      swapEvents: [],
      exitEvents: [],
      returnEvents: [],
    });
    const loaded = loadInProgressTest();
    expect(loaded?.testAnswerIndex).toBe(3);
    expect(loaded?.testContentIds).toEqual(['A', 'B', 'C']);
  });

  it('returns null when nothing saved', async () => {
    const { loadInProgressTest } = await import('../inProgressTest');
    expect(loadInProgressTest()).toBeNull();
  });
});
