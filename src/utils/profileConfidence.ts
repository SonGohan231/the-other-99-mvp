export type ProfileConfidenceTier =
  | 'early_signal'
  | 'forming_pattern'
  | 'stronger_signal'
  | 'snapshot_ready'
  | 'high_confidence';

export interface ProfileConfidenceInfo {
  tier: ProfileConfidenceTier;
  label: string;
  description: string;
  minAnswers: number;
  nextThreshold: number | null;
  progress: number; // 0–100 within tier
}

export function getProfileConfidence(totalAnswers: number): ProfileConfidenceInfo {
  if (totalAnswers <= 10) return {
    tier: 'early_signal',
    label: 'Early Signal',
    description: 'Your first answers are being collected.',
    minAnswers: 0,
    nextThreshold: 11,
    progress: Math.round((totalAnswers / 10) * 100),
  };
  if (totalAnswers <= 30) return {
    tier: 'forming_pattern',
    label: 'Forming Pattern',
    description: 'A direction is beginning to emerge.',
    minAnswers: 11,
    nextThreshold: 31,
    progress: Math.round(((totalAnswers - 10) / 20) * 100),
  };
  if (totalAnswers <= 50) return {
    tier: 'stronger_signal',
    label: 'Stronger Signal',
    description: 'Your profile is taking shape.',
    minAnswers: 31,
    nextThreshold: 51,
    progress: Math.round(((totalAnswers - 30) / 20) * 100),
  };
  if (totalAnswers < 100) return {
    tier: 'snapshot_ready',
    label: 'Snapshot Ready',
    description: 'Enough signal to generate a full profile snapshot.',
    minAnswers: 51,
    nextThreshold: 100,
    progress: Math.round(((totalAnswers - 51) / 49) * 100),
  };
  return {
    tier: 'high_confidence',
    label: 'High Confidence',
    description: 'Your profile has a strong, consistent signal.',
    minAnswers: 100,
    nextThreshold: null,
    progress: 100,
  };
}

export const TIER_COLOR: Record<ProfileConfidenceTier, string> = {
  early_signal: 'rgba(255,255,255,0.35)',
  forming_pattern: 'var(--accent-light)',
  stronger_signal: 'var(--teal-light)',
  snapshot_ready: 'var(--gold-light)',
  high_confidence: 'var(--gold)',
};
