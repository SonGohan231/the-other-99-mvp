export interface ProfileFragment {
  id: string;
  title: string;
  text: string;
  rarity: 'standard' | 'rare' | 'epic' | 'legendary';
  dimension: string;
  unlockedAtAnswer: number;
  createdAt: string;
}

const STORAGE_KEY = 'to99_fragments';
const UNLOCK_EVERY = 4;

type FragmentEntry = [string, string]; // [title, text]

const FRAGMENT_POOL: Record<string, FragmentEntry[]> = {
  control: [
    ['Certainty Bias', 'You often move toward options that reduce uncertainty.'],
    ['Predictability Drive', 'You prefer predictable paths even when unpredictable ones are shorter.'],
    ['Order Reflex', 'Uncertainty triggers a need for structure in you.'],
    ['Rule Seeker', 'You perform better when boundaries are clearly defined.'],
  ],
  security: [
    ['System Trust', 'You tend to trust patterns and systems more than spontaneous signals.'],
    ['Stability First', 'Stability matters more to you than excitement.'],
    ['Risk Calculus', 'You weigh risks more carefully than the average person.'],
    ['Safe Distance', 'You create buffers between yourself and uncertainty.'],
  ],
  emotion: [
    ['Private Intensity', 'Your answers suggest stronger internal reactions than your visible choices reveal.'],
    ['Emotional Memory', 'Your emotional memory influences your present choices.'],
    ['Delayed Openness', 'You reveal more when the question feels indirect.'],
    ['Feeling Before Fact', 'You process feelings before you process facts.'],
  ],
  connection: [
    ['Belonging Drive', 'Belonging influences your choices more than independence.'],
    ['Mirror Effect', 'You respond differently when others are watching.'],
    ['Social Calibration', 'Social approval affects your risk tolerance.'],
    ['Shared Experience', 'You value shared experience over personal achievement.'],
  ],
  independence: [
    ['Solo Processor', 'You prefer to figure things out alone.'],
    ['Autonomy Core', 'Autonomy matters more to you than consensus.'],
    ['Resistance Pattern', 'You resist external influence more than average.'],
    ['Internal Authority', 'You trust your own judgment even against the majority.'],
  ],
  curiosity: [
    ['Question Bias', 'You are drawn to questions more than answers.'],
    ['Novelty Pull', 'Novelty holds your attention longer than routine.'],
    ['Pattern Seeker', 'Pattern recognition shapes your decision-making.'],
    ['Edge Explorer', 'You explore the edges that others overlook.'],
  ],
  change: [
    ['Adaptive Default', 'You adapt faster than most when circumstances shift.'],
    ['Future Pull', 'Future possibilities motivate you more than past stability.'],
    ['Disruption Comfort', 'You welcome disruption when it brings progress.'],
    ['Transition Ease', 'Transition feels natural where others find it difficult.'],
  ],
  risk: [
    ['Controlled Risk', 'You do not avoid risk completely. You prefer risk when the rules are visible.'],
    ['Calculated Threshold', 'Your threshold for uncertainty is higher than most.'],
    ['Reward Weight', 'Potential reward influences you more than potential loss.'],
    ['First Mover', 'You act before all data is available.'],
  ],
};

const FALLBACK_POOL: FragmentEntry[] = [
  ['Rare Pattern', 'Your behavioral patterns are outside the standard range.'],
  ['Unusual Combination', 'Your responses suggest an unusual combination of traits.'],
  ['Unclassified Signal', 'The system detected an unexpected pattern in your choices.'],
  ['Edge Case', 'Your decision style resists easy classification.'],
  ['Outlier Trace', 'This combination of signals is rare in the dataset.'],
];

const RARITY_SEQUENCE: Array<ProfileFragment['rarity']> = [
  'standard', 'standard', 'standard', 'standard',
  'rare', 'rare', 'epic', 'legendary',
];

export function getFragments(): ProfileFragment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProfileFragment[]) : [];
  } catch {
    return [];
  }
}

export function saveFragments(f: ProfileFragment[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(f));
  } catch { /* ignore */ }
}

export function checkAndUnlockFragment(
  totalAnswers: number,
  topDimension: string,
): ProfileFragment | null {
  const existing = getFragments();
  const expected = Math.floor(totalAnswers / UNLOCK_EVERY);
  if (expected <= existing.length) return null;

  const idx = existing.length;
  const pool = FRAGMENT_POOL[topDimension] ?? FALLBACK_POOL;
  const [title, text] = pool[idx % pool.length];
  const rarity = RARITY_SEQUENCE[idx % RARITY_SEQUENCE.length];

  const fragment: ProfileFragment = {
    id: `frag_${idx}_${Date.now()}`,
    title,
    text,
    rarity,
    dimension: topDimension,
    unlockedAtAnswer: totalAnswers,
    createdAt: new Date().toISOString(),
  };
  saveFragments([...existing, fragment]);
  return fragment;
}
