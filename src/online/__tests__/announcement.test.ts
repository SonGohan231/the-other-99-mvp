import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  parseAnnouncement,
  getDismissedAnnouncements,
  isAnnouncementDismissed,
  dismissAnnouncement,
  getActiveAnnouncement,
  DISMISSED_ANNOUNCEMENTS_KEY,
  type RemoteAnnouncement,
} from '../announcement';
import { LOCAL_FALLBACK_CONFIG, REMOTE_CONFIG_VERSION, type RemoteConfig } from '../remoteConfig';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeAnnouncement(overrides: Partial<RemoteAnnouncement> = {}): RemoteAnnouncement {
  return {
    enabled: true,
    id: 'test-ann-v1',
    level: 'info',
    title_en: 'A calm update from The Other 99.',
    title_pl: 'Spokojna aktualizacja.',
    body_en: 'Daily Card content has been refreshed.',
    body_pl: 'Treść Karty Dnia została odświeżona.',
    ...overrides,
  };
}

function makeConfig(announcement?: unknown): RemoteConfig {
  return {
    version: REMOTE_CONFIG_VERSION,
    feature_flags: { daily_card_enabled: true, daily_card_show_on_dashboard: true },
    daily_card: { seed_offset: 0, cards: [{ title: 'T', body: 'B' }] },
    ...(announcement !== undefined ? { announcement: announcement as RemoteConfig['announcement'] } : {}),
  };
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── parseAnnouncement ────────────────────────────────────────────────────────

describe('parseAnnouncement', () => {
  it('returns valid announcement for correct shape', () => {
    const ann = makeAnnouncement();
    expect(parseAnnouncement(ann)).toEqual(ann);
  });

  it('returns null for null', () => {
    expect(parseAnnouncement(null)).toBeNull();
  });

  it('returns null for array', () => {
    expect(parseAnnouncement([])).toBeNull();
  });

  it('returns null for string', () => {
    expect(parseAnnouncement('bad')).toBeNull();
  });

  it('returns null when enabled is missing', () => {
    const { enabled: _, ...rest } = makeAnnouncement();
    expect(parseAnnouncement(rest)).toBeNull();
  });

  it('returns null when id is empty string', () => {
    expect(parseAnnouncement(makeAnnouncement({ id: '' }))).toBeNull();
  });

  it('returns null when level is invalid', () => {
    expect(parseAnnouncement(makeAnnouncement({ level: 'danger' as never }))).toBeNull();
  });

  it('accepts all valid levels', () => {
    for (const level of ['info', 'maintenance', 'update'] as const) {
      expect(parseAnnouncement(makeAnnouncement({ level }))).not.toBeNull();
    }
  });

  it('returns null when title_en is missing', () => {
    const { title_en: _, ...rest } = makeAnnouncement();
    expect(parseAnnouncement(rest)).toBeNull();
  });

  it('returns null when body_pl is missing', () => {
    const { body_pl: _, ...rest } = makeAnnouncement();
    expect(parseAnnouncement(rest)).toBeNull();
  });
});

// ─── Dismissal ────────────────────────────────────────────────────────────────

describe('dismissAnnouncement', () => {
  it('starts with empty dismissed list', () => {
    expect(getDismissedAnnouncements()).toEqual([]);
  });

  it('marks announcement as dismissed', () => {
    dismissAnnouncement('ann-1');
    expect(isAnnouncementDismissed('ann-1')).toBe(true);
  });

  it('different id is not dismissed', () => {
    dismissAnnouncement('ann-1');
    expect(isAnnouncementDismissed('ann-2')).toBe(false);
  });

  it('dismissing same id twice does not duplicate', () => {
    dismissAnnouncement('ann-1');
    dismissAnnouncement('ann-1');
    expect(getDismissedAnnouncements()).toHaveLength(1);
  });

  it('multiple announcements can be dismissed', () => {
    dismissAnnouncement('a1');
    dismissAnnouncement('a2');
    dismissAnnouncement('a3');
    expect(getDismissedAnnouncements()).toHaveLength(3);
  });

  it('persists dismissed ids across reads', () => {
    dismissAnnouncement('ann-persist');
    // Re-read from localStorage
    expect(getDismissedAnnouncements()).toContain('ann-persist');
  });

  it('returns empty array on malformed JSON', () => {
    localStorage.setItem(DISMISSED_ANNOUNCEMENTS_KEY, 'bad{json');
    expect(getDismissedAnnouncements()).toEqual([]);
    expect(() => dismissAnnouncement('any')).not.toThrow();
  });

  it('returns empty array when stored value is not array', () => {
    localStorage.setItem(DISMISSED_ANNOUNCEMENTS_KEY, JSON.stringify({ bad: true }));
    expect(getDismissedAnnouncements()).toEqual([]);
  });
});

// ─── getActiveAnnouncement ────────────────────────────────────────────────────

describe('getActiveAnnouncement', () => {
  it('returns announcement when enabled and not dismissed', () => {
    const config = makeConfig(makeAnnouncement());
    expect(getActiveAnnouncement(config, [])).not.toBeNull();
  });

  it('returns null when announcement is disabled', () => {
    const config = makeConfig(makeAnnouncement({ enabled: false }));
    expect(getActiveAnnouncement(config, [])).toBeNull();
  });

  it('returns null when announcement is dismissed', () => {
    const ann = makeAnnouncement({ id: 'ann-1' });
    const config = makeConfig(ann);
    expect(getActiveAnnouncement(config, ['ann-1'])).toBeNull();
  });

  it('returns announcement when a different id is dismissed', () => {
    const ann = makeAnnouncement({ id: 'ann-new' });
    const config = makeConfig(ann);
    expect(getActiveAnnouncement(config, ['ann-old'])).not.toBeNull();
  });

  it('returns null when config has no announcement', () => {
    const config = makeConfig();
    expect(getActiveAnnouncement(config, [])).toBeNull();
  });

  it('returns null when announcement is malformed', () => {
    const config = makeConfig({ enabled: true }); // missing required fields
    expect(getActiveAnnouncement(config, [])).toBeNull();
  });

  it('returns null when config is LOCAL_FALLBACK_CONFIG (no announcement)', () => {
    expect(getActiveAnnouncement(LOCAL_FALLBACK_CONFIG, [])).toBeNull();
  });

  it('different announcement id appears again after old id dismissed', () => {
    const config = makeConfig(makeAnnouncement({ id: 'v2' }));
    expect(getActiveAnnouncement(config, ['v1'])).not.toBeNull();
  });
});

// ─── Backward compatibility ───────────────────────────────────────────────────

describe('backward compatibility', () => {
  it('B1 config without announcement field still works', () => {
    // B1 config has no announcement field
    const b1Config: RemoteConfig = {
      version: REMOTE_CONFIG_VERSION,
      feature_flags: { daily_card_enabled: true, daily_card_show_on_dashboard: true },
      daily_card: { seed_offset: 0, cards: [{ title: 'T', body: 'B' }] },
    };
    expect(() => getActiveAnnouncement(b1Config, [])).not.toThrow();
    expect(getActiveAnnouncement(b1Config, [])).toBeNull();
  });

  it('offline fallback config works without announcement', () => {
    expect(() => getActiveAnnouncement(LOCAL_FALLBACK_CONFIG, [])).not.toThrow();
  });
});

// ─── No network writes ────────────────────────────────────────────────────────

describe('no network writes', () => {
  it('dismissAnnouncement does not call fetch', () => {
    let fetchCalled = false;
    vi.stubGlobal('fetch', () => { fetchCalled = true; return Promise.resolve({}); });
    dismissAnnouncement('ann-1');
    expect(fetchCalled).toBe(false);
    vi.unstubAllGlobals();
  });
});

// ─── Forbidden copy ───────────────────────────────────────────────────────────

describe('forbidden copy in allowed announcement texts', () => {
  const FORBIDDEN = [
    'act now', 'limited time', 'only today', 'do not lose', 'streak',
    'shame', 'urgency', 'unlock now', 'payment', 'subscribe', 'only one more',
    'casino', 'better than', 'worse than',
  ];

  const ALLOWED_TEXTS = [
    'Small update available.',
    'A calm update from The Other 99.',
    'Daily Card content has been refreshed.',
    'Maintenance notice.',
    'Spokojna aktualizacja od The Other 99.',
    'Treść Karty Dnia została odświeżona.',
    'Dostępna mała aktualizacja.',
    'Powiadomienie o konserwacji.',
  ];

  it('no allowed announcement text contains forbidden phrases', () => {
    for (const text of ALLOWED_TEXTS) {
      const lower = text.toLowerCase();
      for (const phrase of FORBIDDEN) {
        expect(lower).not.toContain(phrase);
      }
    }
  });
});
