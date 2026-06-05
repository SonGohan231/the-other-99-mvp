const GUEST_KEY = 'to99_guest_mode';
const GUEST_TESTS_KEY = 'to99_guest_tests_used';

export const GUEST_USER_ID = 'guest-user';

export function isGuestModeActive(): boolean {
  try { return localStorage.getItem(GUEST_KEY) === 'true'; } catch { return false; }
}

export function enableGuestMode(): void {
  try { localStorage.setItem(GUEST_KEY, 'true'); } catch { /* ignore */ }
}

export function disableGuestMode(): void {
  try {
    localStorage.removeItem(GUEST_KEY);
    localStorage.removeItem(GUEST_TESTS_KEY);
  } catch { /* ignore */ }
}

export function getGuestTestsUsed(): number {
  try { return parseInt(localStorage.getItem(GUEST_TESTS_KEY) || '0', 10); } catch { return 0; }
}

export function incrementGuestTestsUsed(): void {
  try { localStorage.setItem(GUEST_TESTS_KEY, String(getGuestTestsUsed() + 1)); } catch { /* ignore */ }
}
