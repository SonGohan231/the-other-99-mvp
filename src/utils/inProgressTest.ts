const KEY = 'to99_in_progress_test';
const VERSION = 2;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface InProgressTestState {
  version: number;
  testNumber: number;
  testSessionId: string | null;
  testAnswerIndex: number;
  testContentIds: string[];
  currentItemId: string | null;
  pendingAnswer: string;
  selectedCard: string | null;
  canUndoAnswer: boolean;
  nextCardIds: string[];       // IDs of the 3 candidate cards shown at reward screen
  updatedAt: string;
}

// ─── Internal save/load ──────────────────────────────────────────────────────

function _save(state: Omit<InProgressTestState, 'version' | 'updatedAt'>): void {
  try {
    const payload: InProgressTestState = {
      ...state,
      version: VERSION,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch { /* ignore storage errors */ }
}

function _load(): InProgressTestState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as InProgressTestState;
    if (parsed.version !== VERSION) return null;
    if (!parsed.testContentIds?.length) return null;
    // Expire after MAX_AGE_MS
    if (parsed.updatedAt) {
      const age = Date.now() - new Date(parsed.updatedAt).getTime();
      if (age > MAX_AGE_MS) { localStorage.removeItem(KEY); return null; }
    }
    // Guarantee nextCardIds exists (migration from v1 saves)
    if (!parsed.nextCardIds) parsed.nextCardIds = [];
    return parsed;
  } catch { return null; }
}

// ─── Legacy API (used by App.tsx) ────────────────────────────────────────────

export function saveInProgressTest(state: Omit<InProgressTestState, 'version' | 'updatedAt'>): void {
  _save(state);
}

export function loadInProgressTest(): InProgressTestState | null {
  return _load();
}

export function clearInProgressTest(): void {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

export function hasInProgressTest(): boolean {
  return _load() !== null;
}

// ─── Explicit snapshot API (Task 1) ──────────────────────────────────────────

/** Save a full quiz snapshot. Alias for saveInProgressTest with clearer intent. */
export function saveQuizSnapshot(state: Omit<InProgressTestState, 'version' | 'updatedAt'>): void {
  _save(state);
}

/**
 * Restore a quiz snapshot.
 * Returns null if no snapshot exists, it's too old (>7 days), or it's corrupted.
 */
export function restoreQuizSnapshot(): InProgressTestState | null {
  return _load();
}

/** Wipe the snapshot (call when test completes or user explicitly resets). */
export function clearQuizSnapshot(): void {
  clearInProgressTest();
}
