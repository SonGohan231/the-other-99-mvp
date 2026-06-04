const PREMIUM_PREVIEW_KEY = 'to99_premium_preview';

export const MILESTONES: Array<{ answers: number; label: string; description: string }> = [
  { answers: 17,  label: 'First Signal',         description: 'Initial pattern detected.' },
  { answers: 34,  label: 'Pattern Forming',       description: 'Your profile is taking shape.' },
  { answers: 51,  label: 'Hidden Profile',        description: 'Hidden profile preview unlocked.' },
  { answers: 68,  label: 'Shadow Pattern',        description: 'A deeper layer is emerging.' },
  { answers: 85,  label: 'Human Twin Candidate',  description: 'Twin search confidence rising.' },
  { answers: 100, label: 'Archetype Mix',         description: 'Your archetype blend is forming.' },
  { answers: 150, label: 'Stable Profile',        description: 'Core pattern confirmed.' },
  { answers: 250, label: 'Deep Map',              description: 'Full profile depth reached.' },
];

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
