// Backward-compatible thin wrapper over communityVotes.ts.
// New code should import directly from communityVotes.ts.

import { submitVote, getDistribution } from './communityVotes';

export { getOrCreateAnonId } from './communityVotes';

// Get seeded vote counts (legacy — returns combined seed+real totals)
export function getSeededVotes(contentId: string, options: string[]): Record<string, number> {
  const result = getDistribution(contentId, options);
  const totals: Record<string, number> = {};
  for (const { option, pct } of result.percs) {
    totals[option] = Math.round((pct / 100) * Math.max(1, result.totalVotes));
  }
  return totals;
}

// Get stored votes (same as seeded in this compat layer)
export function getStoredVotes(contentId: string, options: string[]): Record<string, number> {
  return getSeededVotes(contentId, options);
}

// Register vote and return updated counts
export function registerVote(contentId: string, selectedAnswer: string, options: string[]): Record<string, number> {
  const result = submitVote(contentId, selectedAnswer, options);
  const totals: Record<string, number> = {};
  for (const { option, pct } of result.percs) {
    totals[option] = Math.round((pct / 100) * Math.max(1, result.totalVotes));
  }
  return totals;
}

// Get percentage breakdown (legacy)
export function getCommunityPercentages(contentId: string, options: string[]): { option: string; pct: number }[] {
  return getDistribution(contentId, options).percs;
}
