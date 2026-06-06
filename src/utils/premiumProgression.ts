const PREMIUM_PREVIEW_KEY = 'to99_premium_preview';
const PREMIUM_UNLOCK_KEY = 'to99_premium_unlocked';

export const MILESTONES: Array<{ answers: number; label: string; label_pl: string; description: string }> = [
  { answers: 51,  label: 'First Profile Fragment', label_pl: 'Pierwszy Fragment',    description: 'First pattern visible.' },
  { answers: 85,  label: 'Pattern Stabilizing',    label_pl: 'Wzorzec Stabilny',     description: 'Pattern holding.' },
  { answers: 100, label: 'Archetype Direction',    label_pl: 'Kierunek Archetypu',   description: 'Closest archetype visible.' },
  { answers: 150, label: 'Archetype Blend',        label_pl: 'Miks Archetypów',      description: 'Blend forming.' },
  { answers: 250, label: 'Deep Tension',           label_pl: 'Głębokie Napięcie',    description: 'Competing patterns found.' },
  { answers: 500, label: 'Rare Pattern',           label_pl: 'Rzadki Wzorzec',       description: 'Statistically unusual profile.' },
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
