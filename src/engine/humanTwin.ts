import { CanonicalVector } from '../utils/canonicalVector';
import { EmergingArchetypeResult } from './emergingArchetype';
import { CanonicalHP } from './canonicalHP';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HumanTwinResult {
  enabled: boolean;
  source_label: 'simulated_local_reference' | 'estimated_until_population_exists';
  similarity_percent: number;    // 0–100
  distance: number;              // Euclidean distance in normalized space (lower = closer)
  closest_reference_id: string;  // archetype reference ID (A01–A12)
  closest_reference_name: string;
  shared_patterns: string[];
  differences: string[];
  unlock_threshold: number;      // answers needed for this tier
  current_answer_count: number;
  is_unlocked: boolean;
  tier: 'locked' | 'preview' | 'meaningful' | 'strong';
  user_facing_summary: string;
}

// ─── Reference population (12 archetypal reference points) ────────────────────
// Each reference pattern is a canonical vector representing a "pure archetype" profile.
// These are estimated reference points — not derived from real user data.

type AxisKey = keyof CanonicalVector;

type RefVector = Partial<Record<AxisKey, number>>;

const REFERENCE_PATTERNS: Array<{ id: string; name: string; vector: RefVector }> = [
  { id: 'A01', name: 'The Alchemist',  vector: { AX01:  8, AX08: -10, AX06:  4, AX07: -6 } },
  { id: 'A02', name: 'The Observer',   vector: { AX02: 10, AX04:  8,  AX07:  6, AX01:  3 } },
  { id: 'A03', name: 'The Mirror',     vector: { AX02: -9, AX03: -8,  AX07: -4, AX04:  3 } },
  { id: 'A04', name: 'The Anchor',     vector: { AX08: 10, AX01: -7,  AX06: -6, AX05:  4 } },
  { id: 'A05', name: 'The Strategist', vector: { AX06: -10, AX02:  7, AX05: -6, AX10: -7 } },
  { id: 'A06', name: 'The Explorer',   vector: { AX01: 10, AX06:  10, AX03:  7, AX08: -4 } },
  { id: 'A07', name: 'The Guardian',   vector: { AX01: -7, AX08:  8,  AX03: -7, AX06: -4 } },
  { id: 'A08', name: 'The Catalyst',   vector: { AX04: -10, AX08: -7, AX06:  7, AX01:  4 } },
  { id: 'A09', name: 'The Architect',  vector: { AX02:  7, AX10: -10, AX06: -7, AX08:  7 } },
  { id: 'A10', name: 'The Rebel',      vector: { AX03: 10, AX06:  10, AX08: -10, AX01:  7 } },
  { id: 'A11', name: 'The Dreamer',    vector: { AX02: -10, AX05: -10, AX07: -7, AX10:  7 } },
  { id: 'A12', name: 'The Weaver',     vector: { AX03: -10, AX10:  7,  AX04:  4, AX07: -4 } },
];

const PREVIEW_THRESHOLD = 25;
const MEANINGFUL_THRESHOLD = 51;
const STRONG_THRESHOLD = 100;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function softNorm(v: number, scale = 15): number {
  return Math.tanh(v / scale);
}

function euclideanDistance(a: Record<string, number>, b: Record<string, number>): number {
  const axes = ['AX01','AX02','AX03','AX04','AX05','AX06','AX07','AX08','AX09','AX10'];
  return Math.sqrt(
    axes.reduce((sum, ax) => sum + ((a[ax] ?? 0) - (b[ax] ?? 0)) ** 2, 0)
  );
}

function normalizeCV(cv: CanonicalVector): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(cv)) out[k] = softNorm(v);
  return out;
}

function normalizeRef(ref: RefVector): Record<string, number> {
  const out: Record<string, number> = {};
  const axes = ['AX01','AX02','AX03','AX04','AX05','AX06','AX07','AX08','AX09','AX10'];
  for (const ax of axes) {
    out[ax] = softNorm((ref as Record<string,number>)[ax] ?? 0);
  }
  return out;
}

// Convert distance in normalized space (0–√10 ≈ 3.16) to similarity percent (0–100)
function distanceToSimilarity(dist: number): number {
  const maxDist = Math.sqrt(10) * 2; // max possible distance in [-1,1]^10 space
  return Math.round(Math.max(0, Math.min(100, (1 - dist / maxDist) * 100)));
}

function buildSharedPatterns(
  cvNorm: Record<string, number>,
  refNorm: Record<string, number>,
): string[] {
  const patterns: string[] = [];
  const AXIS_LABELS: Record<string, { pos: string; neg: string }> = {
    AX01: { pos: 'curiosity-driven', neg: 'security-oriented' },
    AX02: { pos: 'analytically grounded', neg: 'emotionally guided' },
    AX03: { pos: 'strongly independent', neg: 'community-oriented' },
    AX04: { pos: 'observational', neg: 'action-first' },
    AX05: { pos: 'present-focused', neg: 'future-oriented' },
    AX06: { pos: 'spontaneous', neg: 'deliberate and controlled' },
    AX07: { pos: 'pragmatic', neg: 'idealistic' },
    AX08: { pos: 'stable', neg: 'drawn to transformation' },
    AX09: { pos: 'nature-connected', neg: 'technology-oriented' },
    AX10: { pos: 'idea-generating', neg: 'execution-focused' },
  };

  for (const [ax, labels] of Object.entries(AXIS_LABELS)) {
    const cv = cvNorm[ax] ?? 0;
    const ref = refNorm[ax] ?? 0;
    // Same direction and both moderately loaded
    if (Math.sign(cv) === Math.sign(ref) && Math.abs(cv) > 0.25 && Math.abs(ref) > 0.25) {
      const label = cv > 0 ? labels.pos : labels.neg;
      patterns.push(label);
    }
    if (patterns.length >= 3) break;
  }

  return patterns;
}

function buildDifferences(
  cvNorm: Record<string, number>,
  refNorm: Record<string, number>,
): string[] {
  const diffs: string[] = [];
  const AXIS_LABELS: Record<string, string> = {
    AX01: 'curiosity vs. security balance',
    AX02: 'logic vs. emotion balance',
    AX03: 'independence vs. connection',
    AX04: 'observation vs. action tendency',
    AX05: 'present vs. future focus',
    AX06: 'spontaneity vs. control',
    AX07: 'pragmatism vs. idealism',
    AX08: 'stability vs. transformation drive',
    AX09: 'nature vs. technology orientation',
    AX10: 'idea creation vs. execution preference',
  };

  const axes = Object.keys(AXIS_LABELS);
  const dists = axes.map((ax) => ({
    ax,
    diff: Math.abs((cvNorm[ax] ?? 0) - (refNorm[ax] ?? 0)),
  }));
  dists.sort((a, b) => b.diff - a.diff);

  for (const { ax, diff } of dists.slice(0, 2)) {
    if (diff > 0.3) diffs.push(AXIS_LABELS[ax]);
  }

  return diffs;
}

function buildSummary(tier: string, closestName: string, similarity: number, shared: string[]): string {
  if (tier === 'locked') {
    return `Answer ${PREVIEW_THRESHOLD} questions to unlock your first Human Twin preview.`;
  }
  if (tier === 'preview') {
    return `An early estimated match is forming. Your profile most resembles ${closestName} patterns. This is an estimate — real population data does not yet exist.`;
  }
  const sharedNote = shared.length > 0 ? ` You overlap most in being ${shared.slice(0,2).join(' and ')}.` : '';
  return `Your closest estimated match is the ${closestName} pattern at ~${similarity}% similarity.${sharedNote} This is simulated until real population data exists.`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function computeHumanTwin(
  canonicalVector: CanonicalVector,
  answerCount: number,
  archetype: EmergingArchetypeResult | null,
  _hp: CanonicalHP | null,
): HumanTwinResult {
  const tier =
    answerCount >= STRONG_THRESHOLD ? 'strong' :
    answerCount >= MEANINGFUL_THRESHOLD ? 'meaningful' :
    answerCount >= PREVIEW_THRESHOLD ? 'preview' : 'locked';

  const is_unlocked = tier !== 'locked';

  if (!is_unlocked) {
    return {
      enabled: true,
      source_label: 'estimated_until_population_exists',
      similarity_percent: 0,
      distance: 0,
      closest_reference_id: '',
      closest_reference_name: '',
      shared_patterns: [],
      differences: [],
      unlock_threshold: PREVIEW_THRESHOLD,
      current_answer_count: answerCount,
      is_unlocked: false,
      tier: 'locked',
      user_facing_summary: buildSummary('locked', '', 0, []),
    };
  }

  const cvNorm = normalizeCV(canonicalVector);

  // Find closest reference pattern
  let closestRef = REFERENCE_PATTERNS[0];
  let minDist = Infinity;

  for (const ref of REFERENCE_PATTERNS) {
    const refNorm = normalizeRef(ref.vector);
    const dist = euclideanDistance(cvNorm, refNorm);
    if (dist < minDist) {
      minDist = dist;
      closestRef = ref;
    }
  }

  // Prefer the archetype engine's primary if it strongly agrees
  if (archetype && archetype.confidence !== 'very_low') {
    const primaryRef = REFERENCE_PATTERNS.find((r) => r.id === archetype.primary.id);
    if (primaryRef) {
      const primaryRefNorm = normalizeRef(primaryRef.vector);
      const primaryDist = euclideanDistance(cvNorm, primaryRefNorm);
      // Use archetype engine's pick if it's within 20% of the closest geometric match
      if (primaryDist <= minDist * 1.2) {
        closestRef = primaryRef;
        minDist = primaryDist;
      }
    }
  }

  const closestRefNorm = normalizeRef(closestRef.vector);
  const similarity_percent = distanceToSimilarity(minDist);
  const shared = buildSharedPatterns(cvNorm, closestRefNorm);
  const differences = buildDifferences(cvNorm, closestRefNorm);

  return {
    enabled: true,
    source_label: 'estimated_until_population_exists',
    similarity_percent,
    distance: Math.round(minDist * 100) / 100,
    closest_reference_id: closestRef.id,
    closest_reference_name: closestRef.name,
    shared_patterns: shared,
    differences,
    unlock_threshold: MEANINGFUL_THRESHOLD,
    current_answer_count: answerCount,
    is_unlocked: true,
    tier,
    user_facing_summary: buildSummary(tier, closestRef.name, similarity_percent, shared),
  };
}
