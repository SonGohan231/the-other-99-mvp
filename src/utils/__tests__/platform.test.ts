import { describe, it, expect, vi } from 'vitest';
import { Capacitor } from '@capacitor/core';
import { ANDROID_AUTH_SCHEME, ANDROID_AUTH_REDIRECT_URL, isAndroidNative } from '../platform';

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
    getPlatform: vi.fn(() => 'web'),
  },
}));

// ─── Constants ────────────────────────────────────────────────────────────────

describe('ANDROID_AUTH_SCHEME', () => {
  it('matches the Capacitor app ID', () => {
    expect(ANDROID_AUTH_SCHEME).toBe('app.theother99.mvp');
  });

  it('is a valid URI scheme (lowercase letters, digits, dots)', () => {
    expect(/^[a-z][a-z0-9.]*$/.test(ANDROID_AUTH_SCHEME)).toBe(true);
  });
});

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
