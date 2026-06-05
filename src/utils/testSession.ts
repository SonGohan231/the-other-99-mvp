const KEYS = {
  TEST_SESSION: 'to99_test_session',
  DEBUG_MODE: 'to99_debug_mode',
  PREMIUM_UNLOCKED: 'to99_premium_unlocked',
};

export const TEST_USER_ID = 'local-test-user';

export const TEST_USER = {
  id: TEST_USER_ID,
  email: 'test@local.dev',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

export const TEST_PROFILE = {
  id: TEST_USER_ID,
  email: 'test@local.dev',
  display_name: 'Test User',
  free_profile_tests_used: 0,
  premium_status: null as string | null,
  total_answers: 0,
};

export function isLocalTestUser(userId: string | undefined | null): boolean {
  return userId === TEST_USER_ID;
}

export function isTestSessionActive(): boolean {
  try { return localStorage.getItem(KEYS.TEST_SESSION) === 'true'; } catch { return false; }
}

export function isTestModeRequested(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get('test') === '1') return true;
    return localStorage.getItem(KEYS.DEBUG_MODE) === 'true';
  } catch { return false; }
}

export function enableTestSession(): void {
  try {
    localStorage.setItem(KEYS.TEST_SESSION, 'true');
    localStorage.setItem(KEYS.DEBUG_MODE, 'true');
  } catch { /* ignore */ }
}

export function disableTestSession(): void {
  try {
    localStorage.removeItem(KEYS.TEST_SESSION);
  } catch { /* ignore */ }
}

export function getTestSession(): typeof TEST_PROFILE | null {
  if (!isTestSessionActive()) return null;
  return { ...TEST_PROFILE };
}
