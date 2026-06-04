const PREMIUM_PREVIEW_KEY = 'to99_premium_preview';
const PREMIUM_UNLOCK_KEY = 'to99_premium_unlocked';

export const MILESTONES: Array<{ answers: number; label: string; description: string }> = [
  { answers: 17,  label: 'First Signal',         description: 'Initial pattern detected.' },
  { answers: 34,  label: 'Pattern Forming',       description: 'Your profile is taking shape.' },
  { answers: 51,  label: 'Profile Snapshot',      description: 'First complete pattern visible.' },
  { answers: 100, label: 'Archetype Mix',         description: 'Your archetype blend is forming.' },
  { answers: 150, label: 'Hidden Parameters',     description: 'Deeper layers unlocking.' },
  { answers: 200, label: 'Human Twin Deep Match', description: 'Twin search confidence rising.' },
  { answers: 250, label: 'Deep Profile v1',       description: 'Full profile depth reached.' },
];

export function isPremiumUnlocked(supabasePremiumStatus?: string | null): boolean {
  return supabasePremiumStatus === 'premium'
    || isPremiumPreviewEnabled()
    || localStorage.getItem(PREMIUM_UNLOCK_KEY) === 'true';
}

export function unlockPremium(): void {
  localStorage.setItem(PREMIUM_UNLOCK_KEY, 'true');
}

export function disablePremiumUnlock(): void {
  localStorage.removeItem(PREMIUM_UNLOCK_KEY);
}

export function isPremiumPreviewEnabled(): boolean {
  return localStorage.getItem(PREMIUM_PREVIEW_KEY) === 'true';
}

export function enablePremiumPreview(): void {
  localStorage.setItem(PREMIUM_PREVIEW_KEY, 'true');
}

export function disablePremiumPreview(): void {
  localStorage.removeItem(PREMIUM_PREVIEW_KEY);
}

export function canContinueTest(freeTestsUsed: number, isPremium: boolean): boolean {
  return isPremium || isPremiumPreviewEnabled() || freeTestsUsed < 3;
}

export function getNextMilestone(
  totalAnswers: number
): (typeof MILESTONES)[0] | null {
  return MILESTONES.find((m) => m.answers > totalAnswers) ?? null;
}

export function getReachedMilestones(
  totalAnswers: number
): (typeof MILESTONES)[0][] {
  return MILESTONES.filter((m) => m.answers <= totalAnswers);
}
