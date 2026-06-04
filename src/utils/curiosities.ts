import { ProfileVector } from './profileVector';
import { getTopDimensions } from './profileVector';

export interface Curiosity {
  id: string;
  type: 'community' | 'rarity' | 'archetype' | 'parameter' | 'twin';
  text: string;
}

const COMMUNITY: string[] = [
  "Users who score high in Control often split sharply on questions about trust.",
  "The rarest answer patterns appear in users with both high Curiosity and high Security.",
  "Most users shift their Risk score significantly after question #7.",
  "High Connection scores often correlate with longer answer hesitation on Shadow questions.",
  "Users who score high in Independence show the most varied Moral Dilemma answers.",
];

const RARITY: string[] = [
  "Your rarest answers are not always your darkest ones — they are the ones that don't fit the majority frame.",
  "A rare signal is not always a signal others avoid. Sometimes it is a signal others haven't noticed in themselves.",
  "Rarity in this system means statistical distance — not psychological distance.",
  "Legendary-tier questions reveal less about what you do and more about how you frame what you've done.",
];

const ARCHETYPE: string[] = [
  "No user maps cleanly to one archetype. The mix is always more true than the label.",
  "Architect-pattern users tend to show high structure, but mixed openness when trust is established.",
  "Explorer-pattern users often show low consistency drift — they move, but in a direction.",
  "Rebel-pattern users frequently show the highest Contradiction Density in their parameters.",
];

const PARAMETER: string[] = [
  "Contradiction Density rises when your answers pull in opposite directions — this is not a flaw.",
  "Decision Latency is not slowness. It is the time the system needs to register what you actually think.",
  "Some questions carry timing-sensitive signals. The pause before a choice is part of the data.",
  "Identity Rigidity is not always visible in behavior — it often shows in what you protect from being questioned.",
];

const TWIN: string[] = [
  "Your closest match is not necessarily your most similar answer pattern — it may be your contradiction pattern.",
  "The Human Twin system looks for behavioral resonance, not just answer overlap.",
  "Two profiles can match closely on visible choices and differ entirely on hidden parameters.",
];

export function getCuriosities(vector: ProfileVector, totalAnswers: number): Curiosity[] {
  const top = getTopDimensions(vector, 1)[0] ?? 'curiosity';
  const seed = totalAnswers + top.charCodeAt(0);

  const result: Curiosity[] = [
    { id: 'c1', type: 'community', text: COMMUNITY[seed % COMMUNITY.length] },
    { id: 'c2', type: 'parameter', text: PARAMETER[(seed + 2) % PARAMETER.length] },
    { id: 'c3', type: 'archetype', text: ARCHETYPE[(seed + 1) % ARCHETYPE.length] },
  ];
  if (totalAnswers >= 34) {
    result.push({ id: 'c4', type: 'rarity', text: RARITY[seed % RARITY.length] });
  }
  if (totalAnswers >= 51) {
    result.push({ id: 'c5', type: 'twin', text: TWIN[seed % TWIN.length] });
  }
  return result;
}
