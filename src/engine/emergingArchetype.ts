import { CanonicalVector } from '../utils/canonicalVector';

// ─── Canonical Archetype Definitions ──────────────────────────────────────────

export const ARCHETYPES = [
  { id: 'A01', name: 'The Alchemist' },
  { id: 'A02', name: 'The Observer' },
  { id: 'A03', name: 'The Mirror' },
  { id: 'A04', name: 'The Anchor' },
  { id: 'A05', name: 'The Strategist' },
  { id: 'A06', name: 'The Explorer' },
  { id: 'A07', name: 'The Guardian' },
  { id: 'A08', name: 'The Catalyst' },
  { id: 'A09', name: 'The Architect' },
  { id: 'A10', name: 'The Rebel' },
  { id: 'A11', name: 'The Dreamer' },
  { id: 'A12', name: 'The Weaver' },
] as const;

// Axis semantics (from canonicalVector.ts POLE_MAP):
// AX01: Curiosity (+) ↔ Security (-)
// AX02: Logic (+) ↔ Emotion (-)
// AX03: Independence (+) ↔ Belonging/Connection (-)
// AX04: Observation (+) ↔ Action (-)
// AX05: Present (+) ↔ Future/Change (-)
// AX06: Spontaneity/Risk (+) ↔ Control (-)
// AX07: Pragmatism (+) ↔ Idealism (-)
// AX08: Stability (+) ↔ Transformation (-)
// AX09: Nature (+) ↔ Technology (-)
// AX10: Idea Creator (+) ↔ Builder (-)

type AxisKey = keyof CanonicalVector;
type ArchetypeWeights = Partial<Record<AxisKey, number>>;

// Projection matrix: each archetype has a characteristic pattern across the 10 axes.
// Values: -3 to +3. The raw scores will be normalized before use.
const ARCHETYPE_WEIGHTS: Record<string, ArchetypeWeights> = {
  A01: { AX01:  2, AX08: -3, AX06:  1, AX07: -2 }, // Alchemist: curious, transformative, idealistic
  A02: { AX02:  3, AX04:  2, AX07:  2, AX01:  1 }, // Observer: logic, observation, pragmatic
  A03: { AX02: -3, AX03: -2, AX07: -1, AX04:  1 }, // Mirror: emotion, connection, observant
  A04: { AX08:  3, AX01: -2, AX06: -2, AX05:  1 }, // Anchor: stability, security, control, present
  A05: { AX06: -3, AX02:  2, AX05: -2, AX10: -2 }, // Strategist: control, logic, future, builder
  A06: { AX01:  3, AX06:  3, AX03:  2, AX08: -1 }, // Explorer: curious, spontaneous, independent
  A07: { AX01: -2, AX08:  2, AX03: -2, AX06: -1 }, // Guardian: security, stable, connection, control
  A08: { AX04: -3, AX08: -2, AX06:  2, AX01:  1 }, // Catalyst: action, transformation, spontaneous
  A09: { AX02:  2, AX10: -3, AX06: -2, AX08:  2 }, // Architect: logic, builder, control, stable
  A10: { AX03:  3, AX06:  3, AX08: -3, AX01:  2 }, // Rebel: independent, spontaneous, transformative
  A11: { AX02: -3, AX05: -3, AX07: -2, AX10:  2 }, // Dreamer: emotion, future, idealistic, creator
  A12: { AX03: -3, AX10:  2, AX04:  1, AX07: -1 }, // Weaver: connection, creator, observant, idealistic
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type ArchetypeConfidence = 'very_low' | 'low' | 'forming' | 'stable' | 'strong';

export interface ArchetypeScore {
  id: string;
  name: string;
  score: number;      // raw weighted dot-product (post-normalization)
  percentage: number; // 0–100, relative to all archetypes
}

export interface EmergingArchetypeResult {
  primary: ArchetypeScore;
  secondary: ArchetypeScore;
  blend_label: string;
  confidence: ArchetypeConfidence;
  confidence_reason: string;
  distance: number;        // gap between primary and secondary percentage (0–100)
  answer_count: number;
  is_emerging: boolean;    // true when enough signal to show direction but not stable
  user_facing_summary: string;
  all_scores: ArchetypeScore[];
}

// ─── Normalization ────────────────────────────────────────────────────────────

// Soft-clip canonical axis values to [-1, 1] range.
// Scale factor 15 gives gentle compression across typical 50-answer ranges.
function softNorm(v: number, scale = 15): number {
  return Math.tanh(v / scale);
}

// ─── Core calculation ─────────────────────────────────────────────────────────

function scoreArchetype(cv: CanonicalVector, weights: ArchetypeWeights): number {
  let score = 0;
  for (const [axis, w] of Object.entries(weights)) {
    if (w !== undefined) score += w * softNorm((cv as Record<string, number>)[axis] ?? 0);
  }
  return score;
}

function confidenceLevel(answerCount: number): { level: ArchetypeConfidence; reason: string } {
  if (answerCount <= 10) return {
    level: 'very_low',
    reason: 'Too early to read a clear direction. A few more answers will reveal a pattern.',
  };
  if (answerCount <= 30) return {
    level: 'low',
    reason: 'A direction is beginning to form. Your answers are starting to suggest something.',
  };
  if (answerCount <= 50) return {
    level: 'forming',
    reason: 'A pattern is becoming visible. This is still early, but one direction is clearer now.',
  };
  if (answerCount <= 100) return {
    level: 'stable',
    reason: 'Your current answers lean clearly in this direction.',
  };
  return {
    level: 'strong',
    reason: 'This pattern has been consistent across many answers.',
  };
}

function blendLabel(primary: string, secondary: string): string {
  const short = (name: string) => name.replace('The ', '');
  return `${short(primary)} / ${short(secondary)}`;
}

function buildSummary(
  primary: ArchetypeScore,
  secondary: ArchetypeScore,
  confidence: ArchetypeConfidence,
  distance: number,
): string {
  const short = (name: string) => name.replace('The ', '');

  if (confidence === 'very_low') {
    return 'Not enough answers yet to see a clear direction. Keep going.';
  }
  if (confidence === 'low') {
    return `A pattern is beginning to form. Your current answers lean toward ${primary.name}, though it's still early.`;
  }
  if (distance < 10) {
    return `Your profile sits between ${short(primary.name)} and ${short(secondary.name)}. The two patterns are close — more answers will clarify the direction.`;
  }
  if (confidence === 'forming') {
    return `This is still early, but one direction is becoming visible: ${primary.name}. Your secondary signal shows ${short(secondary.name)}.`;
  }
  return `Your current answers lean toward ${primary.name}, with a secondary pull toward ${short(secondary.name)}.`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function computeEmergingArchetype(
  canonicalVector: CanonicalVector,
  answerCount: number,
): EmergingArchetypeResult {
  // Calculate raw score for every archetype
  const rawScores = ARCHETYPES.map((arch) => ({
    id: arch.id,
    name: arch.name,
    raw: scoreArchetype(canonicalVector, ARCHETYPE_WEIGHTS[arch.id] ?? {}),
  }));

  // Shift all scores to be non-negative (min → 0)
  const minRaw = Math.min(...rawScores.map((s) => s.raw));
  const shiftedScores = rawScores.map((s) => ({ ...s, shifted: s.raw - minRaw }));

  const totalShifted = shiftedScores.reduce((sum, s) => sum + s.shifted, 0);

  const allScores: ArchetypeScore[] = shiftedScores
    .map((s) => ({
      id: s.id,
      name: s.name,
      score: s.raw,
      percentage: totalShifted > 0 ? Math.round((s.shifted / totalShifted) * 100) : Math.round(100 / ARCHETYPES.length),
    }))
    .sort((a, b) => b.score - a.score);

  const primary = allScores[0];
  const secondary = allScores[1];
  const distance = primary.percentage - secondary.percentage;

  const { level, reason } = confidenceLevel(answerCount);
  const is_emerging = level === 'forming' || level === 'low';

  return {
    primary,
    secondary,
    blend_label: blendLabel(primary.name, secondary.name),
    confidence: level,
    confidence_reason: reason,
    distance,
    answer_count: answerCount,
    is_emerging,
    user_facing_summary: buildSummary(primary, secondary, level, distance),
    all_scores: allScores,
  };
}
