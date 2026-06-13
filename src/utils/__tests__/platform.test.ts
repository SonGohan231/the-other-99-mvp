import { describe, it, expect, vi } from 'vitest';
import { Capacitor } from '@capacitor/core';
import {
  ANDROID_AUTH_SCHEME, ANDROID_AUTH_REDIRECT_URL, ANDROID_AUTH_TIMEOUT_MS,
  isAndroidNative, type AndroidAuthPhase,
} from '../platform';

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
    getPlatform: vi.fn(() => 'web'),
  },
}));

// ─── ANDROID_AUTH_SCHEME ──────────────────────────────────────────────────────

describe('ANDROID_AUTH_SCHEME', () => {
  it('matches the Capacitor app ID', () => {
    expect(ANDROID_AUTH_SCHEME).toBe('app.theother99.mvp');
  });

  it('is a valid URI scheme (lowercase letters, digits, dots)', () => {
    expect(/^[a-z][a-z0-9.]*$/.test(ANDROID_AUTH_SCHEME)).toBe(true);
  });
});

// ─── ANDROID_AUTH_REDIRECT_URL ────────────────────────────────────────────────

describe('ANDROID_AUTH_REDIRECT_URL', () => {
  it('starts with the custom scheme', () => {
    expect(ANDROID_AUTH_REDIRECT_URL.startsWith(ANDROID_AUTH_SCHEME + '://')).toBe(true);
  });

  it('includes an auth-callback path for disambiguation', () => {
    expect(ANDROID_AUTH_REDIRECT_URL).toContain('auth-callback');
  });

  it('matches expected exact value', () => {
    expect(ANDROID_AUTH_REDIRECT_URL).toBe('app.theother99.mvp://auth-callback');
  });
});

// ─── ANDROID_AUTH_TIMEOUT_MS ──────────────────────────────────────────────────

describe('ANDROID_AUTH_TIMEOUT_MS', () => {
  it('is a positive number', () => {
    expect(typeof ANDROID_AUTH_TIMEOUT_MS).toBe('number');
    expect(ANDROID_AUTH_TIMEOUT_MS).toBeGreaterThan(0);
  });

  it('is at least 25 seconds (enough for slow auth flows)', () => {
    expect(ANDROID_AUTH_TIMEOUT_MS).toBeGreaterThanOrEqual(25_000);
  });

  it('is at most 60 seconds (not so long that UX degrades)', () => {
    expect(ANDROID_AUTH_TIMEOUT_MS).toBeLessThanOrEqual(60_000);
  });
});

// ─── isAndroidNative ──────────────────────────────────────────────────────────

describe('isAndroidNative', () => {
  it('returns false when Capacitor reports web platform', () => {
    expect(isAndroidNative()).toBe(false);
  });

  it('returns true only when native AND android', () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValueOnce(true);
    vi.mocked(Capacitor.getPlatform).mockReturnValueOnce('android');
    expect(isAndroidNative()).toBe(true);
  });

  it('returns false when native but platform is ios', () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValueOnce(true);
    vi.mocked(Capacitor.getPlatform).mockReturnValueOnce('ios');
    expect(isAndroidNative()).toBe(false);
  });

  it('returns false when not native even if getPlatform returns android', () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValueOnce(false);
    vi.mocked(Capacitor.getPlatform).mockReturnValueOnce('android');
    expect(isAndroidNative()).toBe(false);
  });

  it('returns false and does not throw when Capacitor.isNativePlatform throws', () => {
    vi.mocked(Capacitor.isNativePlatform).mockImplementationOnce(() => {
      throw new Error('native check unavailable');
    });
    expect(() => isAndroidNative()).not.toThrow();
    expect(isAndroidNative()).toBe(false);
  });
});

// ─── AndroidAuthPhase type ────────────────────────────────────────────────────

describe('AndroidAuthPhase type values', () => {
  const VALID_PHASES: AndroidAuthPhase[] = [
    'idle', 'opening_browser', 'waiting_for_callback', 'exchanging_code',
    'authenticated', 'cancelled', 'failed', 'timeout',
  ];

  it('has 8 distinct phases covering the full auth lifecycle', () => {
    expect(VALID_PHASES).toHaveLength(8);
  });

  it('includes a terminal success phase', () => {
    expect(VALID_PHASES).toContain('authenticated');
  });

  it('includes recovery phases (failed, timeout, cancelled)', () => {
    expect(VALID_PHASES).toContain('failed');
    expect(VALID_PHASES).toContain('timeout');
    expect(VALID_PHASES).toContain('cancelled');
  });

  it('includes idle phase (safe reset state)', () => {
    expect(VALID_PHASES).toContain('idle');
  });

  it('includes in-progress phases (opening_browser, waiting_for_callback, exchanging_code)', () => {
    expect(VALID_PHASES).toContain('opening_browser');
    expect(VALID_PHASES).toContain('waiting_for_callback');
    expect(VALID_PHASES).toContain('exchanging_code');
  });
});

// ─── Deep-link URL matching ───────────────────────────────────────────────────

describe('Android deep-link URL matching', () => {
  it('callback URL with PKCE code param matches the scheme', () => {
    const callbackUrl = `${ANDROID_AUTH_REDIRECT_URL}?code=abc123&state=xyz`;
    expect(callbackUrl.startsWith(ANDROID_AUTH_SCHEME + '://')).toBe(true);
  });

  it('callback URL with hash fragment matches the scheme', () => {
    const callbackUrl = `${ANDROID_AUTH_REDIRECT_URL}#access_token=tok&refresh_token=ref`;
    expect(callbackUrl.startsWith(ANDROID_AUTH_SCHEME + '://')).toBe(true);
  });

  it('https URL does not match the custom scheme', () => {
    const httpsUrl = 'https://example.com/callback?code=abc';
    expect(httpsUrl.startsWith(ANDROID_AUTH_SCHEME + '://')).toBe(false);
  });

  it('different custom scheme does not match', () => {
    const otherUrl = 'myapp://auth-callback';
    expect(otherUrl.startsWith(ANDROID_AUTH_SCHEME + '://')).toBe(false);
  });

  it('localhost WebView origin does not match (web path is separate)', () => {
    expect('https://localhost'.startsWith(ANDROID_AUTH_SCHEME + '://')).toBe(false);
  });

  it('Vercel production URL does not match', () => {
    expect('https://the-other-99-mvp.vercel.app'.startsWith(ANDROID_AUTH_SCHEME + '://')).toBe(false);
  });
});
