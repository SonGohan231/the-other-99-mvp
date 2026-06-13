import { describe, it, expect } from 'vitest';
import { computeDailyCard, getTodayDateStr, type DailyCardData } from '../dailyCard';
import { LOCAL_FALLBACK_CONFIG, type RemoteConfig, REMOTE_CONFIG_VERSION } from '../remoteConfig';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeConfig(cards: Array<{ title: string; body: string }>, seedOffset = 0): RemoteConfig {
  return {
    version: REMOTE_CONFIG_VERSION,
    feature_flags: { daily_card_enabled: true, daily_card_show_on_dashboard: true },
    daily_card: { seed_offset: seedOffset, cards },
  };
}

const TWO_CARDS = makeConfig([
  { title: 'A small question for today.', body: 'Body one that is long enough to be a real question?' },
  { title: "Today's reflection is ready.", body: 'Body two — a different question to reflect on.' },
]);

// ─── Version ──────────────────────────────────────────────────────────────────

describe('version', () => {
  it('result.version is online_b1_daily_card_v1', () => {
    const r = computeDailyCard('2026-06-13', TWO_CARDS, 'remote');
    expect(r.version).toBe('online_b1_daily_card_v1');
  });
});

// ─── Determinism ──────────────────────────────────────────────────────────────

describe('determinism', () => {
  it('same date + same config returns identical card', () => {
    const a = computeDailyCard('2026-06-13', TWO_CARDS, 'remote');
    const b = computeDailyCard('2026-06-13', TWO_CARDS, 'remote');
    expect(a.title).toBe(b.title);
    expect(a.body).toBe(b.body);
  });

  it('same date + null config returns identical card', () => {
    const a = computeDailyCard('2026-06-13', null);
    const b = computeDailyCard('2026-06-13', null);
    expect(a.title).toBe(b.title);
    expect(a.body).toBe(b.body);
  });

  it('returns a card from the config cards array', () => {
    const r = computeDailyCard('2026-06-01', TWO_CARDS, 'remote');
    const bodies = TWO_CARDS.daily_card.cards.map((c) => c.body);
    expect(bodies).toContain(r.body);
  });
});

// ─── Date variance ────────────────────────────────────────────────────────────

describe('date variance', () => {
  it('can return different cards on different dates', () => {
    const dates = ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05', '2026-01-06', '2026-01-07'];
    const results = new Set(dates.map((d) => computeDailyCard(d, TWO_CARDS, 'remote').body));
    // With 2 cards and 7 dates, should see both at some point
    expect(results.size).toBeGreaterThanOrEqual(2);
  });

  it('uses a 365-date range without error', () => {
    for (let i = 0; i < 365; i++) {
      const date = new Date(2026, 0, 1);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().slice(0, 10);
      const r = computeDailyCard(dateStr, TWO_CARDS, 'remote');
      expect(typeof r.title).toBe('string');
      expect(typeof r.body).toBe('string');
    }
  });
});

// ─── seed_offset changes selection ───────────────────────────────────────────

describe('seed_offset', () => {
  it('different seed_offset can produce different card for same date', () => {
    const configA = makeConfig(TWO_CARDS.daily_card.cards, 0);
    const configB = makeConfig(TWO_CARDS.daily_card.cards, 7);
    // Not guaranteed different for every date, but over 10 dates should differ at least once
    const results = new Set<string>();
    for (let d = 1; d <= 10; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`;
      results.add(computeDailyCard(date, configA, 'remote').body + '|' + computeDailyCard(date, configB, 'remote').body);
    }
    const pairs = [...results];
    const differ = pairs.some((p) => p.split('|')[0] !== p.split('|')[1]);
    expect(differ).toBe(true);
  });
});

// ─── null config fallback ─────────────────────────────────────────────────────

describe('null config fallback', () => {
  it('uses local fallback cards when config is null', () => {
    const r = computeDailyCard('2026-06-13', null);
    const localBodies = LOCAL_FALLBACK_CONFIG.daily_card.cards.map((c) => c.body);
    expect(localBodies).toContain(r.body);
  });

  it('source is local_fallback when config is null', () => {
    const r = computeDailyCard('2026-06-13', null);
    expect(r.source).toBe('local_fallback');
  });
});

// ─── source field ─────────────────────────────────────────────────────────────

describe('source field', () => {
  it('source is remote when config provided with remote source', () => {
    const r = computeDailyCard('2026-06-13', TWO_CARDS, 'remote');
    expect(r.source).toBe('remote');
  });

  it('source is cache when config provided with cache source', () => {
    const r = computeDailyCard('2026-06-13', TWO_CARDS, 'cache');
    expect(r.source).toBe('cache');
  });

  it('source is local_fallback when config is null regardless of source arg', () => {
    const r = computeDailyCard('2026-06-13', null, 'remote');
    expect(r.source).toBe('local_fallback');
  });
});

// ─── date field ───────────────────────────────────────────────────────────────

describe('date field', () => {
  it('result.date matches the input dateStr', () => {
    const r = computeDailyCard('2026-06-13', TWO_CARDS, 'remote');
    expect(r.date).toBe('2026-06-13');
  });

  it('result.date is correct for past date', () => {
    const r = computeDailyCard('2025-01-01', null);
    expect(r.date).toBe('2025-01-01');
  });
});

// ─── forbidden copy ───────────────────────────────────────────────────────────

describe('forbidden copy — local fallback cards', () => {
  const FORBIDDEN = [
    'streak', 'do not lose', 'only today', 'secret unlock', 'you must come back',
    'urgency', 'shame', 'casino', 'better than', 'worse than', 'subscription',
    'purchase', 'buy', 'payment', 'unlock now', 'only one more',
  ];

  it('no local fallback card title contains forbidden phrases', () => {
    for (const card of LOCAL_FALLBACK_CONFIG.daily_card.cards) {
      const text = card.title.toLowerCase();
      for (const phrase of FORBIDDEN) {
        expect(text).not.toContain(phrase);
      }
    }
  });

  it('no local fallback card body contains forbidden phrases', () => {
    for (const card of LOCAL_FALLBACK_CONFIG.daily_card.cards) {
      const text = card.body.toLowerCase();
      for (const phrase of FORBIDDEN) {
        expect(text).not.toContain(phrase);
      }
    }
  });
});

describe('forbidden copy — computed card output', () => {
  const FORBIDDEN = [
    'streak', 'do not lose', 'only today', 'secret unlock', 'you must come back',
    'urgency', 'shame', 'casino', 'better than', 'worse than', 'subscription',
    'purchase', 'buy', 'payment', 'unlock now', 'only one more',
  ];
  const DATES = ['2026-01-01', '2026-03-15', '2026-06-13', '2026-09-01', '2026-12-31'];

  for (const date of DATES) {
    it(`no forbidden phrase in card for ${date} (null config)`, () => {
      const r = computeDailyCard(date, null);
      const combined = (r.title + ' ' + r.body).toLowerCase();
      for (const phrase of FORBIDDEN) {
        expect(combined).not.toContain(phrase);
      }
    });
  }
});

// ─── Android / offline safety ─────────────────────────────────────────────────

describe('offline safety', () => {
  it('works without network — null config returns valid card', () => {
    const r = computeDailyCard('2026-06-13', null);
    expect(typeof r.title).toBe('string');
    expect(r.title.length).toBeGreaterThan(0);
    expect(typeof r.body).toBe('string');
    expect(r.body.length).toBeGreaterThan(0);
  });

  it('does not throw on unusual date strings', () => {
    expect(() => computeDailyCard('2099-12-31', null)).not.toThrow();
    expect(() => computeDailyCard('2000-01-01', null)).not.toThrow();
    expect(() => computeDailyCard('', null)).not.toThrow();
  });
});

// ─── getTodayDateStr ──────────────────────────────────────────────────────────

describe('getTodayDateStr', () => {
  it('returns a YYYY-MM-DD string', () => {
    const s = getTodayDateStr();
    expect(s).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns the current date', () => {
    const expected = new Date().toISOString().slice(0, 10);
    expect(getTodayDateStr()).toBe(expected);
  });
});

// ─── Stage 3–10 engines unchanged ─────────────────────────────────────────────

describe('Stage 3–10 isolation', () => {
  it('computeDailyCard has no side effects on imported modules', () => {
    // computeDailyCard is pure — calling it multiple times has no side effects
    const r1 = computeDailyCard('2026-06-13', TWO_CARDS, 'remote');
    const r2 = computeDailyCard('2026-06-13', TWO_CARDS, 'remote');
    expect(r1).toEqual(r2);
  });

  it('result object has only the expected fields', () => {
    const r: DailyCardData = computeDailyCard('2026-06-13', TWO_CARDS, 'remote');
    expect(Object.keys(r).sort()).toEqual(['body', 'date', 'source', 'title', 'version'].sort());
  });
});
