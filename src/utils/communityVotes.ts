// Community votes system with localStorage persistence.
// Seed baseline uses deterministic hash (no CSV seed data maps to real content IDs).
// Real votes are tracked separately with user_id / anonymous_id.
// Supabase migration: supabase/migrations/community_votes.sql

import { BehavioralMetadata } from '../types';

// ─── Anonymous ID ────────────────────────────────────────────────────────────

const ANON_ID_KEY = 'to99_anon_id';

export function getOrCreateAnonId(): string {
  let id = localStorage.getItem(ANON_ID_KEY);
  if (!id) {
    id = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(ANON_ID_KEY, id);
  }
  return id;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface VoteStore {
  v: 2;
  byAnswer: Record<string, { seed: number; real: number }>;
  realVoteCount: number;
  lastUpdated: string;
}

export type DistributionLabel =
  | 'Projected distribution'
  | 'Early community distribution'
  | 'Community distribution';

export interface VoteResult {
  percs: { option: string; pct: number }[];
  realVotes: number;
  totalVotes: number;
  distributionLabel: DistributionLabel;
  myVote: string | null;
}

export interface VoteDebugInfo {
  contentId: string;
  seedVotes: number;
  realVotes: number;
  totalVotes: number;
  byAnswer: Record<string, { seed: number; real: number; total: number }>;
  distributionLabel: DistributionLabel;
  myVote: string | null;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const STORE_PREFIX = 'to99_votes_v2_';
const MY_VOTE_PREFIX = 'to99_myvote_';

function storeKey(contentId: string): string {
  return `${STORE_PREFIX}${contentId}`;
}

function myVoteKey(contentId: string): string {
  return `${MY_VOTE_PREFIX}${contentId}`;
}

// ─── Seed baseline (deterministic hash, no CSV seed data available) ────────

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function computeSeedCounts(contentId: string, options: string[]): Record<string, number> {
  const s = hashCode(contentId);
  const total = 120 + (s % 180); // 120–299 seed votes
  const n = options.length;
  const votes: Record<string, number> = {};

  if (n === 2) {
    const r = 0.38 + (s % 31) / 100;
    votes[options[0]] = Math.round(total * r);
    votes[options[1]] = Math.max(1, total - votes[options[0]]);
  } else if (n === 3) {
    const r1 = 0.35 + (s % 27) / 100;
    const r2 = 0.24 + ((s >>> 4) % 18) / 100;
    votes[options[0]] = Math.round(total * r1);
    votes[options[1]] = Math.round(total * r2);
    votes[options[2]] = Math.max(1, total - votes[options[0]] - votes[options[1]]);
  } else {
    const base = Math.floor(total / n);
    for (let i = 0; i < n; i++) {
      const variance = ((s >>> i) % 13) - 6;
      votes[options[i]] = Math.max(1, base + variance);
    }
    const sum = Object.values(votes).reduce((a, b) => a + b, 0);
    votes[options[0]] = Math.max(1, (votes[options[0]] ?? 0) + (total - sum));
  }
  return votes;
}

// ─── Store load / save ─────────────────────────────────────────────────────

function loadStore(contentId: string, options: string[]): VoteStore {
  try {
    const raw = localStorage.getItem(storeKey(contentId));
    if (raw) {
      const parsed = JSON.parse(raw) as VoteStore;
      if (parsed.v === 2) return parsed;
    }
  } catch { /* ignore */ }

  // Initialize with seed baseline
  const seed = computeSeedCounts(contentId, options);
  const byAnswer: Record<string, { seed: number; real: number }> = {};
  for (const opt of options) {
    byAnswer[opt] = { seed: seed[opt] ?? 0, real: 0 };
  }
  return { v: 2, byAnswer, realVoteCount: 0, lastUpdated: new Date().toISOString() };
}

function saveStore(contentId: string, store: VoteStore): void {
  try {
    localStorage.setItem(storeKey(contentId), JSON.stringify(store));
  } catch { /* ignore */ }
}

// ─── My vote ─────────────────────────────────────────────────────────────────

function getMyVote(contentId: string): string | null {
  return localStorage.getItem(myVoteKey(contentId));
}

function setMyVote(contentId: string, answer: string): void {
  localStorage.setItem(myVoteKey(contentId), answer);
}

// ─── Distribution label ───────────────────────────────────────────────────

export function getDistributionLabel(realVotes: number): DistributionLabel {
  if (realVotes < 30) return 'Projected distribution';
  if (realVotes < 100) return 'Early community distribution';
  return 'Community distribution';
}

// ─── Compute percentages from store ────────────────────────────────────────

function storeToPercs(store: VoteStore, options: string[]): { option: string; pct: number }[] {
  const totals: Record<string, number> = {};
  let grand = 0;
  for (const opt of options) {
    const entry = store.byAnswer[opt] ?? { seed: 0, real: 0 };
    totals[opt] = entry.seed + entry.real;
    grand += totals[opt];
  }
  const safeTotal = Math.max(1, grand);
  return options.map((opt) => ({
    option: opt,
    pct: Math.round(((totals[opt] ?? 0) / safeTotal) * 100),
  }));
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Submit a vote for a content item. Prevents duplicates — if the user
 * already voted, the previous vote is removed from the store and the new
 * answer is recorded instead.
 */
export function submitVote(
  contentId: string,
  selectedAnswer: string,
  options: string[],
  _userId?: string | null,
  _behavioral?: BehavioralMetadata | null,
): VoteResult {
  const store = loadStore(contentId, options);
  const prevVote = getMyVote(contentId);

  // Ensure all current options exist in the store
  for (const opt of options) {
    if (!store.byAnswer[opt]) {
      store.byAnswer[opt] = { seed: 0, real: 0 };
    }
  }

  if (prevVote && prevVote !== selectedAnswer) {
    // Undo previous real vote
    if (store.byAnswer[prevVote]) {
      store.byAnswer[prevVote].real = Math.max(0, store.byAnswer[prevVote].real - 1);
      store.realVoteCount = Math.max(0, store.realVoteCount - 1);
    }
  }

  if (!prevVote || prevVote !== selectedAnswer) {
    // Add new real vote
    store.byAnswer[selectedAnswer].real += 1;
    store.realVoteCount += 1;
  }

  store.lastUpdated = new Date().toISOString();
  saveStore(contentId, store);
  setMyVote(contentId, selectedAnswer);

  const percs = storeToPercs(store, options);
  const seedVotes = Object.values(store.byAnswer).reduce((s, e) => s + e.seed, 0);

  return {
    percs,
    realVotes: store.realVoteCount,
    totalVotes: seedVotes + store.realVoteCount,
    distributionLabel: getDistributionLabel(store.realVoteCount),
    myVote: selectedAnswer,
  };
}

/**
 * Get current distribution without submitting a vote.
 */
export function getDistribution(
  contentId: string,
  options: string[],
): VoteResult {
  const store = loadStore(contentId, options);
  const percs = storeToPercs(store, options);
  const seedVotes = Object.values(store.byAnswer).reduce((s, e) => s + e.seed, 0);

  return {
    percs,
    realVotes: store.realVoteCount,
    totalVotes: seedVotes + store.realVoteCount,
    distributionLabel: getDistributionLabel(store.realVoteCount),
    myVote: getMyVote(contentId),
  };
}

/**
 * Debug information for a content item.
 */
export function getVoteDebugInfo(contentId: string, options: string[]): VoteDebugInfo {
  const store = loadStore(contentId, options);
  const seedVotes = Object.values(store.byAnswer).reduce((s, e) => s + e.seed, 0);
  const byAnswerDebug: Record<string, { seed: number; real: number; total: number }> = {};
  for (const opt of options) {
    const entry = store.byAnswer[opt] ?? { seed: 0, real: 0 };
    byAnswerDebug[opt] = { seed: entry.seed, real: entry.real, total: entry.seed + entry.real };
  }
  return {
    contentId,
    seedVotes,
    realVotes: store.realVoteCount,
    totalVotes: seedVotes + store.realVoteCount,
    byAnswer: byAnswerDebug,
    distributionLabel: getDistributionLabel(store.realVoteCount),
    myVote: getMyVote(contentId),
  };
}

/**
 * Reset all local community votes (for debug/guest reset).
 */
export function resetLocalVotes(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith(STORE_PREFIX) || key.startsWith(MY_VOTE_PREFIX))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}

/**
 * Export all vote data for a session (for debug export).
 */
export function exportVoteState(): Record<string, VoteDebugInfo> {
  const result: Record<string, VoteDebugInfo> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORE_PREFIX)) {
      const contentId = key.slice(STORE_PREFIX.length);
      try {
        const store = JSON.parse(localStorage.getItem(key) ?? '') as VoteStore;
        const options = Object.keys(store.byAnswer);
        result[contentId] = getVoteDebugInfo(contentId, options);
      } catch { /* skip */ }
    }
  }
  return result;
}
