import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  fetchRemoteConfig,
  getCachedRemoteConfig,
  getEffectiveRemoteConfig,
  LOCAL_FALLBACK_CONFIG,
  REMOTE_CONFIG_CACHE_KEY,
  REMOTE_CONFIG_VERSION,
  type RemoteConfig,
} from '../remoteConfig';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeValidConfig(overrides: Partial<RemoteConfig> = {}): RemoteConfig {
  return {
    version: REMOTE_CONFIG_VERSION,
    feature_flags: { daily_card_enabled: true, daily_card_show_on_dashboard: true },
    daily_card: {
      seed_offset: 0,
      cards: [
        { title: 'A small question for today.', body: 'What have you been meaning to notice?' },
        { title: "Today's reflection is ready.", body: 'What kind of decision was easier than expected?' },
      ],
    },
    ...overrides,
  };
}

function mockFetchSuccess(body: unknown, status = 200) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }));
}

function mockFetchAbort() {
  vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, options: { signal?: AbortSignal }) => {
    return new Promise((_resolve, reject) => {
      if (options?.signal) {
        options.signal.addEventListener('abort', () => {
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        });
      }
    });
  }));
}

function mockFetchNetworkError() {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ─── Version ──────────────────────────────────────────────────────────────────

describe('REMOTE_CONFIG_VERSION', () => {
  it('is online_b1_remote_config_v1', () => {
    expect(REMOTE_CONFIG_VERSION).toBe('online_b1_remote_config_v1');
  });
});

// ─── LOCAL_FALLBACK_CONFIG ────────────────────────────────────────────────────

describe('LOCAL_FALLBACK_CONFIG', () => {
  it('has the correct version', () => {
    expect(LOCAL_FALLBACK_CONFIG.version).toBe('online_b1_remote_config_v1');
  });
  it('has feature_flags', () => {
    expect(typeof LOCAL_FALLBACK_CONFIG.feature_flags.daily_card_enabled).toBe('boolean');
    expect(typeof LOCAL_FALLBACK_CONFIG.feature_flags.daily_card_show_on_dashboard).toBe('boolean');
  });
  it('has a non-empty cards array', () => {
    expect(Array.isArray(LOCAL_FALLBACK_CONFIG.daily_card.cards)).toBe(true);
    expect(LOCAL_FALLBACK_CONFIG.daily_card.cards.length).toBeGreaterThan(0);
  });
  it('every card has a title and body string', () => {
    for (const card of LOCAL_FALLBACK_CONFIG.daily_card.cards) {
      expect(typeof card.title).toBe('string');
      expect(typeof card.body).toBe('string');
      expect(card.title.length).toBeGreaterThan(0);
      expect(card.body.length).toBeGreaterThan(0);
    }
  });
  it('seed_offset is a number', () => {
    expect(typeof LOCAL_FALLBACK_CONFIG.daily_card.seed_offset).toBe('number');
  });
});

// ─── fetchRemoteConfig — success ─────────────────────────────────────────────

describe('fetchRemoteConfig — success', () => {
  it('returns remote config on success', async () => {
    const valid = makeValidConfig();
    mockFetchSuccess(valid);
    const result = await fetchRemoteConfig('https://example.com/config.json');
    expect(result.source).toBe('remote');
    expect(result.config.version).toBe(REMOTE_CONFIG_VERSION);
  });

  it('caches result in localStorage on success', async () => {
    const valid = makeValidConfig();
    mockFetchSuccess(valid);
    await fetchRemoteConfig('https://example.com/config.json');
    const cached = localStorage.getItem(REMOTE_CONFIG_CACHE_KEY);
    expect(cached).not.toBeNull();
    const parsed = JSON.parse(cached!);
    expect(parsed.version).toBe(REMOTE_CONFIG_VERSION);
    expect(typeof parsed._cached_at).toBe('string');
  });

  it('returns config cards matching the fetched data', async () => {
    const valid = makeValidConfig();
    mockFetchSuccess(valid);
    const result = await fetchRemoteConfig('https://example.com/config.json');
    expect(result.config.daily_card.cards.length).toBe(valid.daily_card.cards.length);
  });
});

// ─── fetchRemoteConfig — HTTP error ──────────────────────────────────────────

describe('fetchRemoteConfig — HTTP error', () => {
  it('falls back to cache on HTTP 404', async () => {
    const cached = makeValidConfig({ daily_card: { seed_offset: 1, cards: [{ title: 'cached', body: 'cached body' }] } });
    localStorage.setItem(REMOTE_CONFIG_CACHE_KEY, JSON.stringify({ ...cached, _cached_at: new Date().toISOString() }));
    mockFetchSuccess({}, 404);
    const result = await fetchRemoteConfig('https://example.com/config.json');
    expect(result.source).toBe('cache');
  });

  it('falls back to local fallback on HTTP 500 with no cache', async () => {
    mockFetchSuccess({}, 500);
    const result = await fetchRemoteConfig('https://example.com/config.json');
    expect(result.source).toBe('local_fallback');
    expect(result.config).toEqual(LOCAL_FALLBACK_CONFIG);
  });
});

// ─── fetchRemoteConfig — network error ───────────────────────────────────────

describe('fetchRemoteConfig — network failure', () => {
  it('falls back to cache when network fails', async () => {
    const cached = makeValidConfig();
    localStorage.setItem(REMOTE_CONFIG_CACHE_KEY, JSON.stringify({ ...cached, _cached_at: new Date().toISOString() }));
    mockFetchNetworkError();
    const result = await fetchRemoteConfig('https://example.com/config.json');
    expect(result.source).toBe('cache');
  });

  it('falls back to local fallback when network fails and no cache', async () => {
    mockFetchNetworkError();
    const result = await fetchRemoteConfig('https://example.com/config.json');
    expect(result.source).toBe('local_fallback');
    expect(result.config.version).toBe(REMOTE_CONFIG_VERSION);
  });
});

// ─── fetchRemoteConfig — timeout ─────────────────────────────────────────────

describe('fetchRemoteConfig — timeout', () => {
  it('falls back to cache on timeout with cache available', async () => {
    const cached = makeValidConfig();
    localStorage.setItem(REMOTE_CONFIG_CACHE_KEY, JSON.stringify({ ...cached, _cached_at: new Date().toISOString() }));
    mockFetchAbort();
    // Use 1ms timeout so AbortController fires immediately
    const result = await fetchRemoteConfig('https://example.com/config.json', 1);
    expect(result.source).toBe('cache');
  });

  it('falls back to local fallback on timeout with no cache', async () => {
    mockFetchAbort();
    const result = await fetchRemoteConfig('https://example.com/config.json', 1);
    expect(result.source).toBe('local_fallback');
  });
});

// ─── fetchRemoteConfig — malformed config ────────────────────────────────────

describe('fetchRemoteConfig — malformed response', () => {
  it('falls back when version is wrong', async () => {
    mockFetchSuccess({ version: 'wrong_version', feature_flags: {}, daily_card: { seed_offset: 0, cards: [{ title: 'x', body: 'y' }] } });
    const result = await fetchRemoteConfig('https://example.com/config.json');
    expect(result.source).not.toBe('remote');
  });

  it('falls back when cards array is empty', async () => {
    mockFetchSuccess({ version: REMOTE_CONFIG_VERSION, feature_flags: {}, daily_card: { seed_offset: 0, cards: [] } });
    const result = await fetchRemoteConfig('https://example.com/config.json');
    expect(result.source).not.toBe('remote');
  });

  it('falls back when daily_card is missing', async () => {
    mockFetchSuccess({ version: REMOTE_CONFIG_VERSION, feature_flags: {} });
    const result = await fetchRemoteConfig('https://example.com/config.json');
    expect(result.source).not.toBe('remote');
  });

  it('falls back when response is null', async () => {
    mockFetchSuccess(null);
    const result = await fetchRemoteConfig('https://example.com/config.json');
    expect(result.source).not.toBe('remote');
  });

  it('falls back when response is an array', async () => {
    mockFetchSuccess([]);
    const result = await fetchRemoteConfig('https://example.com/config.json');
    expect(result.source).not.toBe('remote');
  });
});

// ─── No personal data ─────────────────────────────────────────────────────────

describe('fetchRemoteConfig — no personal data', () => {
  it('does not include user ID in request', async () => {
    mockFetchSuccess(makeValidConfig());
    await fetchRemoteConfig('https://example.com/config.json');
    const fetchCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const url = fetchCall[0] as string;
    const opts = fetchCall[1] as RequestInit;
    expect(url).not.toContain('user_id');
    expect(url).not.toContain('device_id');
    expect(JSON.stringify(opts.headers ?? {})).not.toContain('user_id');
    expect(JSON.stringify(opts.headers ?? {})).not.toContain('device_id');
  });

  it('uses credentials: omit', async () => {
    mockFetchSuccess(makeValidConfig());
    await fetchRemoteConfig('https://example.com/config.json');
    const opts = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit;
    expect(opts.credentials).toBe('omit');
  });
});

// ─── getCachedRemoteConfig ────────────────────────────────────────────────────

describe('getCachedRemoteConfig', () => {
  it('returns null when no cache exists', () => {
    expect(getCachedRemoteConfig()).toBeNull();
  });

  it('returns valid config from cache', () => {
    const config = makeValidConfig();
    localStorage.setItem(REMOTE_CONFIG_CACHE_KEY, JSON.stringify({ ...config, _cached_at: new Date().toISOString() }));
    const result = getCachedRemoteConfig();
    expect(result).not.toBeNull();
    expect(result!.version).toBe(REMOTE_CONFIG_VERSION);
  });

  it('returns null when cache is malformed JSON', () => {
    localStorage.setItem(REMOTE_CONFIG_CACHE_KEY, 'not-json{{{');
    expect(getCachedRemoteConfig()).toBeNull();
  });

  it('returns null when cached config fails validation', () => {
    localStorage.setItem(REMOTE_CONFIG_CACHE_KEY, JSON.stringify({ version: 'old_version', feature_flags: {} }));
    expect(getCachedRemoteConfig()).toBeNull();
  });
});

// ─── getEffectiveRemoteConfig ─────────────────────────────────────────────────

describe('getEffectiveRemoteConfig', () => {
  it('returns local_fallback when nothing cached', () => {
    const result = getEffectiveRemoteConfig();
    expect(result.source).toBe('local_fallback');
    expect(result.config).toEqual(LOCAL_FALLBACK_CONFIG);
  });

  it('returns cache when cache exists', () => {
    const config = makeValidConfig();
    localStorage.setItem(REMOTE_CONFIG_CACHE_KEY, JSON.stringify({ ...config, _cached_at: new Date().toISOString() }));
    const result = getEffectiveRemoteConfig();
    expect(result.source).toBe('cache');
  });
});
