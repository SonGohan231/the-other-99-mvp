import { Capacitor } from '@capacitor/core';

export function isAndroidNative(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  } catch {
    return false;
  }
}

export const ANDROID_AUTH_SCHEME = 'app.theother99.mvp';
export const ANDROID_AUTH_REDIRECT_URL = `${ANDROID_AUTH_SCHEME}://auth-callback`;
export const ANDROID_AUTH_TIMEOUT_MS = 30_000;

// Auth state machine phases for Android OAuth flow
export type AndroidAuthPhase =
  | 'idle'
  | 'opening_browser'
  | 'waiting_for_callback'
  | 'exchanging_code'
  | 'authenticated'
  | 'cancelled'
  | 'failed'
  | 'timeout';
