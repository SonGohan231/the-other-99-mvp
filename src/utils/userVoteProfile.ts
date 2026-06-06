// Compressed user voting profile, updated after every submitted answer.
// Used by Hidden Parameters, Shadow Profile, Human Twin, and premium insights.

import { BehavioralMetadata } from '../types';

const PROFILE_KEY_PREFIX = 'to99_uvp_';
const GLOBAL_KEY = 'to99_uvp_global';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserVoteProfile {
  v: 1;
  totalVotes: number;
  answeredIds: string[];
  answerDistribution: Record<string, number>; // 'A', 'B', 'C', 'D' → count
  skippedCount: number;
  totalResponseTimeMs: number;
  totalHesitationMs: number;
  hesitationSampleCount: number;
  answerChangesTotal: number;
  fastAnswerCount: number;   // responseTime < 3000ms
  slowAnswerCount: number;   // responseTime > 8000ms
  highFrictionCount: number; // emotional_friction_signal > 50
  contradictionCount: number;
  confidenceSum: number;
  avoidanceSum: number;
  impulsivitySum: number;
  deliberationSum: number;
  instabilitySum: number;
  signalSampleCount: number;
  mostCommonAnswer: string;
  lastAnsweredAt: string;
}

export interface UserVoteStats {
  totalVotes: number;
  avgResponseTimeMs: number;
  avgHesitationMs: number | null;
  fastAnswerRatio: number;
  slowAnswerRatio: number;
  highFrictionRatio: number;
  answerChangesCount: number;
  skippedCount: number;
  avgConfidence: number;
  avgAvoidance: number;
  avgImpulsivity: number;
  avgDeliberation: number;
  avgInstability: number;
  mostCommonAnswer: string;
  dominantPattern: string;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

function profileKey(userId?: string | null): string {
  return userId ? `${PROFILE_KEY_PREFIX}${userId}` : GLOBAL_KEY;
}

function emptyProfile(): UserVoteProfile {
  return {
    v: 1,
    totalVotes: 0,
    answeredIds: [],
    answerDistribution: {},
    skippedCount: 0,
    totalResponseTimeMs: 0,
    totalHesitationMs: 0,
    hesitationSampleCount: 0,
    answerChangesTotal: 0,
    fastAnswerCount: 0,
    slowAnswerCount: 0,
    highFrictionCount: 0,
    contradictionCount: 0,
    confidenceSum: 0,
    avoidanceSum: 0,
    impulsivitySum: 0,
    deliberationSum: 0,
    instabilitySum: 0,
    signalSampleCount: 0,
    mostCommonAnswer: '',
    lastAnsweredAt: '',
  };
}

export function getOrCreateUserVoteProfile(userId?: string | null): UserVoteProfile {
  try {
    const raw = localStorage.getItem(profileKey(userId));
    if (raw) {
      const p = JSON.parse(raw) as UserVoteProfile;
      if (p.v === 1) return p;
    }
  } catch { /* ignore */ }
  return emptyProfile();
}

export function saveUserVoteProfile(profile: UserVoteProfile, userId?: string | null): void {
  try {
    localStorage.setItem(profileKey(userId), JSON.stringify(profile));
  } catch { /* ignore */ }
}

// ─── Update after answer ─────────────────────────────────────────────────────

export function updateUserVoteProfile(params: {
  contentId: string;
  selectedAnswer: string;
  responseTimeMs: number;
  skipped: boolean;
  behavioral?: BehavioralMetadata | null;
  userId?: string | null;
  prevAnswer?: string | null;
}): UserVoteProfile {
  const { contentId, selectedAnswer, responseTimeMs, skipped, behavioral, userId, prevAnswer } = params;
  const profile = getOrCreateUserVoteProfile(userId);

  // Track answered IDs (deduplicated)
  if (!profile.answeredIds.includes(contentId)) {
    profile.answeredIds.push(contentId);
    profile.totalVotes += 1;
  }

  // Answer distribution — undo previous if changed
  if (prevAnswer && prevAnswer !== selectedAnswer) {
    profile.answerDistribution[prevAnswer] = Math.max(0, (profile.answerDistribution[prevAnswer] ?? 0) - 1);
  }
  if (!prevAnswer || prevAnswer !== selectedAnswer) {
    profile.answerDistribution[selectedAnswer] = (profile.answerDistribution[selectedAnswer] ?? 0) + 1;
  }

  // Skips
  if (skipped) profile.skippedCount += 1;

  // Response time
  profile.totalResponseTimeMs += responseTimeMs;
  if (responseTimeMs < 3000) profile.fastAnswerCount += 1;
  if (responseTimeMs > 8000) profile.slowAnswerCount += 1;

  // Behavioral signals
  if (behavioral) {
    if (behavioral.hesitation_time_ms !== null) {
      profile.totalHesitationMs += behavioral.hesitation_time_ms;
      profile.hesitationSampleCount += 1;
    }
    if (behavioral.was_answer_changed) profile.answerChangesTotal += 1;
    if (behavioral.emotional_friction_signal > 50) profile.highFrictionCount += 1;
    if (behavioral.contradiction_signal > 30) profile.contradictionCount += 1;

    profile.confidenceSum += behavioral.confidence_signal;
    profile.avoidanceSum += behavioral.avoidance_signal;
    profile.impulsivitySum += behavioral.impulsivity_signal;
    profile.deliberationSum += behavioral.deliberation_signal;
    profile.instabilitySum += behavioral.instability_signal;
    profile.signalSampleCount += 1;
  }

  // Most common answer
  const distEntries = Object.entries(profile.answerDistribution);
  if (distEntries.length > 0) {
    profile.mostCommonAnswer = distEntries.sort((a, b) => b[1] - a[1])[0][0];
  }

  profile.lastAnsweredAt = new Date().toISOString();
  saveUserVoteProfile(profile, userId);
  return profile;
}

// ─── Derive stats from profile ────────────────────────────────────────────────

export function getUserVoteStats(userId?: string | null): UserVoteStats | null {
  const profile = getOrCreateUserVoteProfile(userId);
  if (profile.totalVotes === 0) return null;

  const n = profile.totalVotes;
  const avgResponseTimeMs = n > 0 ? Math.round(profile.totalResponseTimeMs / n) : 0;
  const avgHesitationMs = profile.hesitationSampleCount > 0
    ? Math.round(profile.totalHesitationMs / profile.hesitationSampleCount)
    : null;
  const sn = profile.signalSampleCount;

  const avgConfidence = sn > 0 ? Math.round(profile.confidenceSum / sn) : 0;
  const avgAvoidance = sn > 0 ? Math.round(profile.avoidanceSum / sn) : 0;
  const avgImpulsivity = sn > 0 ? Math.round(profile.impulsivitySum / sn) : 0;
  const avgDeliberation = sn > 0 ? Math.round(profile.deliberationSum / sn) : 0;
  const avgInstability = sn > 0 ? Math.round(profile.instabilitySum / sn) : 0;

  let dominantPattern: string;
  if (avgImpulsivity > 65) dominantPattern = 'impulsive';
  else if (avgConfidence > 60 && avgDeliberation < 40) dominantPattern = 'decisive';
  else if (avgDeliberation > 55) dominantPattern = 'deliberate';
  else dominantPattern = 'hesitant';

  return {
    totalVotes: profile.totalVotes,
    avgResponseTimeMs,
    avgHesitationMs,
    fastAnswerRatio: n > 0 ? profile.fastAnswerCount / n : 0,
    slowAnswerRatio: n > 0 ? profile.slowAnswerCount / n : 0,
    highFrictionRatio: n > 0 ? profile.highFrictionCount / n : 0,
    answerChangesCount: profile.answerChangesTotal,
    skippedCount: profile.skippedCount,
    avgConfidence,
    avgAvoidance,
    avgImpulsivity,
    avgDeliberation,
    avgInstability,
    mostCommonAnswer: profile.mostCommonAnswer,
    dominantPattern,
  };
}

export function resetUserVoteProfile(userId?: string | null): void {
  localStorage.removeItem(profileKey(userId));
}
