import { SkipEvent, SwapEvent, ExitToMenuEvent, ReturnToSessionEvent } from '../types';
import { CanonicalVector } from './canonicalVector';

const KEY = 'to99_in_progress_test';
const VERSION = 4;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface PremiumStateSnapshot {
  unlocked: boolean;
  source: 'supabase' | 'guest' | 'test' | null;
}

export interface InProgressTestState {
  version: number;
  testNumber: number;
  testSessionId: string | null;
  testAnswerIndex: number;
  testContentIds: string[];
  currentItemId: string | null;
  pendingAnswer: string;
  pendingSelection: string | null;  // pre-confirmation selection within current question
  selectedCard: string | null;
  canUndoAnswer: boolean;
  nextCardIds: string[];
  skipEvents: SkipEvent[];
  swapEvents: SwapEvent[];
  exitEvents: ExitToMenuEvent[];
  returnEvents: ReturnToSessionEvent[];
  updatedAt: string;
  // v4 session context fields
  userId: string | null;
  lang: string;
  startedAt: string;
  premiumState: PremiumStateSnapshot | null;
  // Canonical 10D vector snapshot — persisted so resume restores the exact vector state
  canonicalVector?: CanonicalVector;
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

function _migrate(parsed: InProgressTestState): InProgressTestState {
  // v2 → add event queues
  if (parsed.version === 2) {
    parsed.skipEvents = parsed.skipEvents ?? [];
    parsed.swapEvents = parsed.swapEvents ?? [];
    parsed.exitEvents = parsed.exitEvents ?? [];
    parsed.returnEvents = parsed.returnEvents ?? [];
  }
  // v2/v3 → add v4 session context fields with safe defaults
  if (parsed.version <= 3) {
    if (parsed.userId === undefined) parsed.userId = null;
    if (!parsed.lang) parsed.lang = 'en';
    if (!parsed.startedAt) parsed.startedAt = parsed.updatedAt ?? new Date().toISOString();
    if (parsed.premiumState === undefined) parsed.premiumState = null;
  }
  // Defensive defaults for optional fields
  if (!parsed.nextCardIds) parsed.nextCardIds = [];
  if (parsed.pendingSelection === undefined) parsed.pendingSelection = null;
  if (!parsed.skipEvents) parsed.skipEvents = [];
  if (!parsed.swapEvents) parsed.swapEvents = [];
  if (!parsed.exitEvents) parsed.exitEvents = [];
  if (!parsed.returnEvents) parsed.returnEvents = [];
  return parsed;
}

function _load(): InProgressTestState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as InProgressTestState;
    // Accept v2, v3, v4; reject anything else
    if (parsed.version !== 4 && parsed.version !== 3 && parsed.version !== 2) return null;
    if (!parsed.testContentIds?.length) return null;
    // Expire after MAX_AGE_MS
    if (parsed.updatedAt) {
      const age = Date.now() - new Date(parsed.updatedAt).getTime();
      if (age > MAX_AGE_MS) { localStorage.removeItem(KEY); return null; }
    }
    return _migrate(parsed);
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

/** Return just the behavioral event queues from the persisted snapshot (or empty arrays). */
export function getInProgressEventQueues(): {
  skipEvents: SkipEvent[];
  swapEvents: SwapEvent[];
  exitEvents: ExitToMenuEvent[];
  returnEvents: ReturnToSessionEvent[];
} {
  const s = _load();
  return {
    skipEvents: s?.skipEvents ?? [],
    swapEvents: s?.swapEvents ?? [],
    exitEvents: s?.exitEvents ?? [],
    returnEvents: s?.returnEvents ?? [],
  };
}
