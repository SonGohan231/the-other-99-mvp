// Community votes system with localStorage persistence.
// Seed baseline uses V3 Society-Projected Semantic Baseline (early_app_userbase_projected).
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
  | 'Estimated distribution'
  | 'Early community signal'
  | 'Community distribution'
  | 'Not enough data yet';

export interface VoteResult {
  percs: { option: string; pct: number }[];
  realVotes: number;
  totalVotes: number;
  distributionLabel: DistributionLabel;
  seedSource: 'v3' | 'hash';
  semanticTheme?: string;
  myVote: string | null;
}

export interface VoteDebugInfo {
  contentId: string;
  seedVotes: number;
  realVotes: number;
  totalVotes: number;
  byAnswer: Record<string, { seed: number; real: number; total: number }>;
  distributionLabel: DistributionLabel;
  seedSource: 'v3' | 'hash';
  semanticId?: string;
  semanticTheme?: string;
  scenarioId: string;
  isMapped: boolean;
  myVote: string | null;
}

// ─── V3 Runtime Seed ─────────────────────────────────────────────────────────

interface V3SeedItem {
  sid: string;   // semantic_id
  th: string;    // theme
  n: number;     // n_options
  sv: number;    // seed_total votes
  p: number[];   // normalized pcts per option slot [A, B, C?, D?]
}

interface V3RuntimeSeed {
  version: string;
  generated: string;
  default_scenario: string;
  mapping_status: string;
  total_entries: number;
  items: Record<string, V3SeedItem>;
}

let _v3Cache: V3RuntimeSeed | null = null;
let _v3Loading: Promise<V3RuntimeSeed | null> | null = null;

async function loadV3Seed(): Promise<V3RuntimeSeed | null> {
  if (_v3Cache) return _v3Cache;
  if (_v3Loading) return _v3Loading;

  _v3Loading = fetch('/seed/semantic-v3/runtime_seed.json')
    .then((res) => {
      if (!res.ok) return null;
      return res.json() as Promise<V3RuntimeSeed>;
    })
    .then((data) => {
      _v3Cache = data;
      return data;
    })
    .catch(() => null);

  return _v3Loading;
}

// Pre-fetch on module load (fire-and-forget)
loadV3Seed();

function getV3SeedSync(contentId: string): V3SeedItem | null {
  return _v3Cache?.items[contentId] ?? null;
}

// ─── Seed count computation ───────────────────────────────────────────────────

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function computeSeedCountsHash(contentId: string, options: string[]): Record<string, number> {
  const s = hashCode(contentId);
  const total = 120 + (s % 180);
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

function computeSeedCounts(
  contentId: string,
  options: string[],
): { counts: Record<string, number>; source: 'v3' | 'hash'; item: V3SeedItem | null } {
  const v3Item = getV3SeedSync(contentId);

  if (v3Item && v3Item.p.length >= options.length) {
    const seedTotal = v3Item.sv;
    const counts: Record<string, number> = {};
    let allocated = 0;
    for (let i = 0; i < options.length; i++) {
      const pct = v3Item.p[i] ?? 0;
      counts[options[i]] = Math.max(1, Math.round(seedTotal * pct));
      allocated += counts[options[i]];
    }
    // Adjust first option to ensure total is correct
    const diff = seedTotal - allocated;
    if (options[0]) counts[options[0]] = Math.max(1, (counts[options[0]] ?? 0) + diff);
    return { counts, source: 'v3', item: v3Item };
  }

  return { counts: computeSeedCountsHash(contentId, options), source: 'hash', item: null };
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

// ─── Store load / save ─────────────────────────────────────────────────────

function loadStore(
  contentId: string,
  options: string[],
): { store: VoteStore; source: 'v3' | 'hash'; item: V3SeedItem | null } {
  try {
    const raw = localStorage.getItem(storeKey(contentId));
    if (raw) {
      const parsed = JSON.parse(raw) as VoteStore;
      if (parsed.v === 2) {
        const item = getV3SeedSync(contentId);
        return { store: parsed, source: item ? 'v3' : 'hash', item };
      }
    }
  } catch { /* ignore */ }

  const { counts, source, item } = computeSeedCounts(contentId, options);
  const byAnswer: Record<string, { seed: number; real: number }> = {};
  for (const opt of options) {
    byAnswer[opt] = { seed: counts[opt] ?? 0, real: 0 };
  }
  return { store: { v: 2, byAnswer, realVoteCount: 0, lastUpdated: new Date().toISOString() }, source, item };
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
  if (realVotes === 0) return 'Not enough data yet';
  if (realVotes < 30) return 'Estimated distribution';
  if (realVotes < 100) return 'Early community signal';
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
  const { store, source, item } = loadStore(contentId, options);
  const prevVote = getMyVote(contentId);

  // Ensure all current options exist in the store
  for (const opt of options) {
    if (!store.byAnswer[opt]) {
      store.byAnswer[opt] = { seed: 0, real: 0 };
    }
  }

  if (prevVote && prevVote !== selectedAnswer) {
    if (store.byAnswer[prevVote]) {
      store.byAnswer[prevVote].real = Math.max(0, store.byAnswer[prevVote].real - 1);
      store.realVoteCount = Math.max(0, store.realVoteCount - 1);
    }
  }

  if (!prevVote || prevVote !== selectedAnswer) {
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
    seedSource: source,
    semanticTheme: item?.th,
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
  const { store, source, item } = loadStore(contentId, options);
  const percs = storeToPercs(store, options);
  const seedVotes = Object.values(store.byAnswer).reduce((s, e) => s + e.seed, 0);

  return {
    percs,
    realVotes: store.realVoteCount,
    totalVotes: seedVotes + store.realVoteCount,
    distributionLabel: getDistributionLabel(store.realVoteCount),
    seedSource: source,
    semanticTheme: item?.th,
    myVote: getMyVote(contentId),
  };
}

/**
 * Debug information for a content item.
 */
export function getVoteDebugInfo(contentId: string, options: string[]): VoteDebugInfo {
  const { store, source, item } = loadStore(contentId, options);
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
    seedSource: source,
    semanticId: item?.sid,
    semanticTheme: item?.th,
    scenarioId: 'early_app_userbase_projected',
    isMapped: source === 'v3',
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
