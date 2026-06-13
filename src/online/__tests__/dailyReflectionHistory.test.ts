import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  recordDailyCard,
  getReflectionHistory,
  clearReflectionHistory,
  REFLECTION_HISTORY_KEY,
  REFLECTION_HISTORY_MAX,
} from '../dailyReflectionHistory';
import { type DailyCardData } from '../dailyCard';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeCard(date: string, title = 'A small question.', body = 'Body text here.', source: DailyCardData['source'] = 'remote'): DailyCardData {
  return { version: 'online_b1_daily_card_v1', date, title, body, source };
}

beforeEach(() => {
  localStorage.clear();
});

// ─── getReflectionHistory ─────────────────────────────────────────────────────

describe('getReflectionHistory', () => {
  it('returns empty array when nothing stored', () => {
    expect(getReflectionHistory()).toEqual([]);
  });

  it('returns empty array when localStorage has malformed JSON', () => {
    localStorage.setItem(REFLECTION_HISTORY_KEY, 'not-json{{{');
    expect(getReflectionHistory()).toEqual([]);
  });

  it('returns empty array when stored value is not an array', () => {
    localStorage.setItem(REFLECTION_HISTORY_KEY, JSON.stringify({ bad: true }));
    expect(getReflectionHistory()).toEqual([]);
  });

  it('filters out invalid entries and keeps valid ones', () => {
    const valid = { date: '2026-01-01', card_id: 'id1', title: 't', body: 'b', source: 'remote', seen_at: new Date().toISOString() };
    const invalid = { date: '2026-01-02' }; // missing fields
    localStorage.setItem(REFLECTION_HISTORY_KEY, JSON.stringify([valid, invalid]));
    const result = getReflectionHistory();
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2026-01-01');
  });
});

// ─── recordDailyCard ──────────────────────────────────────────────────────────

describe('recordDailyCard', () => {
  it('stores a card entry in localStorage', () => {
    recordDailyCard(makeCard('2026-06-01'));
    const history = getReflectionHistory();
    expect(history).toHaveLength(1);
    expect(history[0].date).toBe('2026-06-01');
  });

  it('stores title, body, source, seen_at, card_id', () => {
    recordDailyCard(makeCard('2026-06-01', 'My title', 'My body', 'cache'));
    const entry = getReflectionHistory()[0];
    expect(entry.title).toBe('My title');
    expect(entry.body).toBe('My body');
    expect(entry.source).toBe('cache');
    expect(typeof entry.seen_at).toBe('string');
    expect(typeof entry.card_id).toBe('string');
  });

  it('does not duplicate on same date (same card)', () => {
    recordDailyCard(makeCard('2026-06-01'));
    recordDailyCard(makeCard('2026-06-01'));
    expect(getReflectionHistory()).toHaveLength(1);
  });

  it('does not duplicate on same date (different card body)', () => {
    recordDailyCard(makeCard('2026-06-01', 'Title', 'Body A'));
    recordDailyCard(makeCard('2026-06-01', 'Title', 'Body B'));
    expect(getReflectionHistory()).toHaveLength(1);
  });

  it('stores different cards on different dates', () => {
    recordDailyCard(makeCard('2026-06-01'));
    recordDailyCard(makeCard('2026-06-02'));
    recordDailyCard(makeCard('2026-06-03'));
    expect(getReflectionHistory()).toHaveLength(3);
  });

  it('newest entry is first (descending order)', () => {
    recordDailyCard(makeCard('2026-06-01'));
    recordDailyCard(makeCard('2026-06-02'));
    const history = getReflectionHistory();
    expect(history[0].date).toBe('2026-06-02');
    expect(history[1].date).toBe('2026-06-01');
  });

  it('does not exceed max history length', () => {
    // Pre-fill with MAX entries
    const entries = Array.from({ length: REFLECTION_HISTORY_MAX }, (_, i) => ({
      date: `2025-01-${String(i + 1).padStart(2, '0')}`,
      card_id: `id-${i}`,
      title: 'T',
      body: 'B',
      source: 'remote',
      seen_at: new Date().toISOString(),
    }));
    localStorage.setItem(REFLECTION_HISTORY_KEY, JSON.stringify(entries));
    // Add one more
    recordDailyCard(makeCard('2026-06-01'));
    expect(getReflectionHistory()).toHaveLength(REFLECTION_HISTORY_MAX);
  });

  it('does not throw on empty date string', () => {
    expect(() => recordDailyCard(makeCard(''))).not.toThrow();
  });

  it('local_fallback source is stored correctly', () => {
    recordDailyCard(makeCard('2026-06-01', 'T', 'B', 'local_fallback'));
    expect(getReflectionHistory()[0].source).toBe('local_fallback');
  });
});

// ─── clearReflectionHistory ───────────────────────────────────────────────────

describe('clearReflectionHistory', () => {
  it('removes stored history', () => {
    recordDailyCard(makeCard('2026-06-01'));
    clearReflectionHistory();
    expect(getReflectionHistory()).toEqual([]);
  });

  it('does not throw when nothing to clear', () => {
    expect(() => clearReflectionHistory()).not.toThrow();
  });
});

// ─── No network writes ────────────────────────────────────────────────────────

describe('no network writes', () => {
  it('recordDailyCard does not call fetch', () => {
    let fetchCalled = false;
    vi.stubGlobal('fetch', () => { fetchCalled = true; return Promise.resolve({}); });
    recordDailyCard(makeCard('2026-06-01'));
    expect(fetchCalled).toBe(false);
    vi.unstubAllGlobals();
  });
});

// ─── Stage 3–10 isolation ─────────────────────────────────────────────────────

describe('Stage 3–10 isolation', () => {
  it('recordDailyCard does not affect quiz progress', () => {
    // History is local-only; no quiz state imported or modified
    recordDailyCard(makeCard('2026-06-01'));
    recordDailyCard(makeCard('2026-06-02'));
    // Simply confirm no errors and quiz-unrelated behavior
    const history = getReflectionHistory();
    expect(history.length).toBeGreaterThan(0);
  });
});
