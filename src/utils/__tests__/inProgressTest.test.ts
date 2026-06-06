import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage
const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
});

function makeBase() {
  return {
    testNumber: 1,
    testSessionId: null as string | null,
    testAnswerIndex: 3,
    testContentIds: ['A', 'B', 'C'],
    currentItemId: 'B' as string | null,
    pendingAnswer: '',
    pendingSelection: null as string | null,
    selectedCard: null as string | null,
    canUndoAnswer: false,
    nextCardIds: [] as string[],
    skipEvents: [] as never[],
    swapEvents: [] as never[],
    exitEvents: [] as never[],
    returnEvents: [] as never[],
    userId: null as string | null,
    lang: 'en',
    startedAt: '2026-06-06T10:00:00.000Z',
    premiumState: null as null,
  };
}

describe('inProgressTest — Stage 1', () => {
  beforeEach(() => { Object.keys(store).forEach(k => delete store[k]); });

  it('save and load round-trips correctly with v4 fields', async () => {
    const { saveInProgressTest, loadInProgressTest } = await import('../inProgressTest');
    saveInProgressTest(makeBase());
    const loaded = loadInProgressTest();
    expect(loaded?.testAnswerIndex).toBe(3);
    expect(loaded?.testContentIds).toEqual(['A', 'B', 'C']);
    expect(loaded?.userId).toBeNull();
    expect(loaded?.lang).toBe('en');
    expect(loaded?.startedAt).toBe('2026-06-06T10:00:00.000Z');
    expect(loaded?.premiumState).toBeNull();
  });

  it('persists userId when provided', async () => {
    const { saveInProgressTest, loadInProgressTest } = await import('../inProgressTest');
    saveInProgressTest({ ...makeBase(), userId: 'user-abc-123' });
    const loaded = loadInProgressTest();
    expect(loaded?.userId).toBe('user-abc-123');
  });

  it('persists lang when PL', async () => {
    const { saveInProgressTest, loadInProgressTest } = await import('../inProgressTest');
    saveInProgressTest({ ...makeBase(), lang: 'pl' });
    const loaded = loadInProgressTest();
    expect(loaded?.lang).toBe('pl');
  });

  it('persists startedAt timestamp', async () => {
    const { saveInProgressTest, loadInProgressTest } = await import('../inProgressTest');
    const ts = new Date().toISOString();
    saveInProgressTest({ ...makeBase(), startedAt: ts });
    const loaded = loadInProgressTest();
    expect(loaded?.startedAt).toBe(ts);
  });

  it('persists premiumState', async () => {
    const { saveInProgressTest, loadInProgressTest } = await import('../inProgressTest');
    saveInProgressTest({ ...makeBase(), premiumState: { unlocked: true, source: 'supabase' } });
    const loaded = loadInProgressTest();
    expect(loaded?.premiumState?.unlocked).toBe(true);
    expect(loaded?.premiumState?.source).toBe('supabase');
  });

  it('returns null when nothing saved', async () => {
    const { loadInProgressTest } = await import('../inProgressTest');
    expect(loadInProgressTest()).toBeNull();
  });

  it('returns null when testContentIds is empty', async () => {
    const { saveInProgressTest, loadInProgressTest } = await import('../inProgressTest');
    saveInProgressTest({ ...makeBase(), testContentIds: [] });
    expect(loadInProgressTest()).toBeNull();
  });

  it('migrates v3 save (no v4 fields) with safe defaults', async () => {
    // Manually write a v3-shaped record to localStorage
    store['to99_in_progress_test'] = JSON.stringify({
      version: 3,
      testNumber: 2,
      testSessionId: null,
      testAnswerIndex: 5,
      testContentIds: ['X', 'Y', 'Z'],
      currentItemId: 'Y',
      pendingAnswer: '',
      pendingSelection: null,
      selectedCard: null,
      canUndoAnswer: false,
      nextCardIds: [],
      skipEvents: [],
      swapEvents: [],
      exitEvents: [],
      returnEvents: [],
      updatedAt: new Date().toISOString(),
      // no userId, lang, startedAt, premiumState
    });
    const { loadInProgressTest } = await import('../inProgressTest');
    const loaded = loadInProgressTest();
    expect(loaded).not.toBeNull();
    expect(loaded?.testAnswerIndex).toBe(5);
    // v4 migration defaults
    expect(loaded?.userId).toBeNull();
    expect(loaded?.lang).toBe('en');
    expect(loaded?.startedAt).toBeTruthy(); // falls back to updatedAt
    expect(loaded?.premiumState).toBeNull();
  });

  it('migrates v2 save with safe defaults', async () => {
    store['to99_in_progress_test'] = JSON.stringify({
      version: 2,
      testNumber: 1,
      testSessionId: null,
      testAnswerIndex: 2,
      testContentIds: ['P', 'Q'],
      currentItemId: 'P',
      pendingAnswer: '',
      pendingSelection: null,
      selectedCard: null,
      canUndoAnswer: false,
      nextCardIds: [],
      updatedAt: new Date().toISOString(),
      // v2: no event arrays, no v4 fields
    });
    const { loadInProgressTest } = await import('../inProgressTest');
    const loaded = loadInProgressTest();
    expect(loaded).not.toBeNull();
    expect(loaded?.skipEvents).toEqual([]);
    expect(loaded?.swapEvents).toEqual([]);
    expect(loaded?.lang).toBe('en');
    expect(loaded?.startedAt).toBeTruthy();
  });

  it('rejects unknown version', async () => {
    store['to99_in_progress_test'] = JSON.stringify({
      version: 99,
      testContentIds: ['A'],
      updatedAt: new Date().toISOString(),
    });
    const { loadInProgressTest } = await import('../inProgressTest');
    expect(loadInProgressTest()).toBeNull();
  });
});
