const VOTES_PREFIX = 'to99_votes_';

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function seedVotes(contentId: string, options: string[]): Record<string, number> {
  const s = hashCode(contentId);
  const total = 300 + (s % 500);
  const n = options.length;
  const votes: Record<string, number> = {};

  if (n === 2) {
    const r = 0.41 + (s % 29) / 100;
    votes[options[0]] = Math.round(total * r);
    votes[options[1]] = total - votes[options[0]];
  } else if (n === 3) {
    const r1 = 0.36 + (s % 28) / 100;
    const r2 = 0.22 + ((s >>> 4) % 20) / 100;
    votes[options[0]] = Math.round(total * r1);
    votes[options[1]] = Math.round(total * r2);
    votes[options[2]] = Math.max(1, total - votes[options[0]] - votes[options[1]]);
  } else {
    const base = Math.floor(total / n);
    const extras = total % n;
    for (let i = 0; i < n; i++) {
      const bump = i < extras ? 1 : 0;
      const variance = ((s >>> i) % 15) - 7;
      votes[options[i]] = Math.max(1, base + bump + variance);
    }
    // normalize to total
    const sum = Object.values(votes).reduce((a, b) => a + b, 0);
    const diff = total - sum;
    votes[options[0]] = Math.max(1, (votes[options[0]] ?? 0) + diff);
  }

  return votes;
}

function storageKey(contentId: string): string {
  return `${VOTES_PREFIX}${contentId}`;
}

function loadStored(contentId: string): Record<string, number> | null {
  try {
    const raw = localStorage.getItem(storageKey(contentId));
    return raw ? (JSON.parse(raw) as Record<string, number>) : null;
  } catch {
    return null;
  }
}

function saveStored(contentId: string, votes: Record<string, number>): void {
  try {
    localStorage.setItem(storageKey(contentId), JSON.stringify(votes));
  } catch { /* ignore */ }
}

// Get seeded vote baseline (does not mutate storage)
export function getSeededVotes(contentId: string, options: string[]): Record<string, number> {
  return seedVotes(contentId, options);
}

// Get stored votes (seeded + any recorded real answers)
export function getStoredVotes(contentId: string, options: string[]): Record<string, number> {
  const stored = loadStored(contentId);
  if (stored) return stored;
  const seeded = seedVotes(contentId, options);
  saveStored(contentId, seeded);
  return seeded;
}

// Register the user's vote and return updated counts
export function registerVote(contentId: string, selectedAnswer: string, options: string[]): Record<string, number> {
  const current = getStoredVotes(contentId, options);
  const updated = { ...current, [selectedAnswer]: (current[selectedAnswer] ?? 0) + 1 };
  saveStored(contentId, updated);
  return updated;
}

// Get percentage breakdown
export function getCommunityPercentages(contentId: string, options: string[]): { option: string; pct: number }[] {
  const votes = getStoredVotes(contentId, options);
  const total = Math.max(1, Object.values(votes).reduce((a, b) => a + b, 0));
  return options.map((o) => ({ option: o, pct: Math.round(((votes[o] ?? 0) / total) * 100) }));
}
