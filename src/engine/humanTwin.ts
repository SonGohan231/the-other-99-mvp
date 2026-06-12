import { CanonicalVector } from '../utils/canonicalVector';
import { EmergingArchetypeResult } from './emergingArchetype';
import { CanonicalHP } from './canonicalHP';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HumanTwinResult {
  version: 'stage7_human_twin_similarity_v1';
  enabled: boolean;
  source_label: 'simulated_local_reference' | 'estimated_until_population_exists';
  similarity_percent: number;    // 0–100
  distance: number;              // Euclidean distance in normalized space (lower = closer)
  closest_reference_id: string;  // archetype reference ID (A01–A12)
  closest_reference_name: string;
  shared_patterns: string[];
  differences: string[];
  unlock_threshold: number;      // answers needed for debug/export visibility
  current_answer_count: number;
  is_unlocked: boolean;          // true when >= COMPUTE_THRESHOLD (debug/export visible)
  is_displayable: boolean;       // true when >= DISPLAY_THRESHOLD (RewardScreen visible)
  tier: 'locked' | 'preview' | 'meaningful' | 'strong';
  safe_text_en: string;          // for RewardScreen — hedged, no names, no "real person"
  safe_text_pl: string;
  user_facing_summary: string;   // debug/detail screens only — may contain reference names
  hp_reliability: number | null; // 0–1 derived from HP01 + HP05 signals; null if no HP data
}

// ─── Reference anchors (12 archetypal synthetic patterns) ─────────────────────
// Each is a canonical vector representing a "pure archetype" profile.
// These are estimated reference anchors — not derived from real user data.

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

// ─── Display thresholds ───────────────────────────────────────────────────────

const COMPUTE_THRESHOLD = 12;    // data computed; visible in debug/export
const DISPLAY_THRESHOLD = 17;    // RewardScreen "Similarity signal" appears
const MEANINGFUL_THRESHOLD = 31; // stronger signal
const STRONG_THRESHOLD = 51;     // stable signal

// ─── Helpers ──────────────────────────────────────────────────────────────────

function softNorm(v: number, scale = 15): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.tanh(n / scale) : 0;
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

// Max Euclidean distance in [-1, 1]^10 space
const MAX_DIST = Math.sqrt(10) * 2;

function distanceToSimilarity(dist: number): number {
  return Math.round(Math.max(0, Math.min(100, (1 - dist / MAX_DIST) * 100)));
}

// HP01 (Confidence) + HP05 (Stability) → reliability factor 0–1
function computeHPReliability(hp: CanonicalHP | null): number | null {
  if (!hp) return null;
  const confidenceFactor = (hp.HP01 + 100) / 200; // 0..1
  const stabilityFactor  = (hp.HP05 + 100) / 200; // 0..1
  return Math.round(((confidenceFactor + stabilityFactor) / 2) * 100) / 100;
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
    if (Math.sign(cv) === Math.sign(ref) && Math.abs(cv) > 0.25 && Math.abs(ref) > 0.25) {
      patterns.push(cv > 0 ? labels.pos : labels.neg);
    }
    if (patterns.length >= 3) break;
  }

  return patterns;
}

function buildDifferences(
  cvNorm: Record<string, number>,
  refNorm: Record<string, number>,
): string[] {
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

  const dists = Object.keys(AXIS_LABELS).map((ax) => ({
    ax,
    diff: Math.abs((cvNorm[ax] ?? 0) - (refNorm[ax] ?? 0)),
  }));
  dists.sort((a, b) => b.diff - a.diff);

  return dists
    .slice(0, 2)
    .filter(({ diff }) => diff > 0.3)
    .map(({ ax }) => AXIS_LABELS[ax]);
}

// ─── Copy builders ────────────────────────────────────────────────────────────

// safe_text_en — for RewardScreen only. No reference/archetype names. No "real person" claim.
function buildSafeText(answerCount: number, is_displayable: boolean): { en: string; pl: string } {
  if (!is_displayable) return { en: '', pl: '' };

  if (answerCount < MEANINGFUL_THRESHOLD) {
    return {
      en: 'A similar decision shape is starting to appear.',
      pl: 'Zaczyna pojawiać się podobny kształt decyzji.',
    };
  }
  if (answerCount < STRONG_THRESHOLD) {
    return {
      en: 'Your profile is close to one anonymous reference pattern.',
      pl: 'Twój profil jest bliski jednemu anonimowemu wzorcowi referencyjnemu.',
    };
  }
  return {
    en: 'A nearby profile pattern has become more consistent across your answers.',
    pl: 'Pobliski wzorzec profilu stał się bardziej spójny na przestrzeni Twoich odpowiedzi.',
  };
}

// user_facing_summary — for debug/detail screens. May contain reference names.
function buildDebugSummary(
  tier: string,
  closestName: string,
  similarity: number,
  shared: string[],
  answerCount: number,
): string {
  if (tier === 'locked') {
    return `Answer ${COMPUTE_THRESHOLD} questions to see similarity data in debug.`;
  }
  if (answerCount < DISPLAY_THRESHOLD) {
    return `Early reference pattern computing. Similarity data visible in debug/export at ${answerCount} answers.`;
  }
  if (similarity < 40) {
    return `Weak reference match so far. Closest pattern: ${closestName}. More answers needed for signal clarity.`;
  }
  const sharedNote = shared.length > 0 ? ` Shared: ${shared.slice(0,2).join(' and ')}.` : '';
  return `Closest reference pattern: ${closestName} (~${similarity}% similarity).${sharedNote} Source: synthetic reference anchors only.`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function computeHumanTwin(
  canonicalVector: CanonicalVector,
  answerCount: number,
  archetype: EmergingArchetypeResult | null,
  hp: CanonicalHP | null,
): HumanTwinResult {
  const safeCount = Math.max(0, Math.floor(Number.isFinite(answerCount) ? answerCount : 0));

  const tier: HumanTwinResult['tier'] =
    safeCount >= STRONG_THRESHOLD     ? 'strong' :
    safeCount >= MEANINGFUL_THRESHOLD ? 'meaningful' :
    safeCount >= COMPUTE_THRESHOLD    ? 'preview' : 'locked';

  const is_unlocked    = safeCount >= COMPUTE_THRESHOLD;
  const is_displayable = safeCount >= DISPLAY_THRESHOLD;
  const hp_reliability = computeHPReliability(hp);

  if (!is_unlocked) {
    return {
      version: 'stage7_human_twin_similarity_v1',
      enabled: true,
      source_label: 'estimated_until_population_exists',
      similarity_percent: 0,
      distance: 0,
      closest_reference_id: '',
      closest_reference_name: '',
      shared_patterns: [],
      differences: [],
      unlock_threshold: COMPUTE_THRESHOLD,
      current_answer_count: safeCount,
      is_unlocked: false,
      is_displayable: false,
      tier: 'locked',
      safe_text_en: '',
      safe_text_pl: '',
      user_facing_summary: buildDebugSummary('locked', '', 0, [], safeCount),
      hp_reliability,
    };
  }

  const cvNorm = normalizeCV(canonicalVector);

  // Find closest reference pattern by Euclidean distance in normalized space
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

  // If the archetype engine's primary pick is within 20% of the geometric closest,
  // prefer it (consistent signal across engines).
  if (archetype && archetype.confidence !== 'very_low') {
    const primaryRef = REFERENCE_PATTERNS.find((r) => r.id === archetype.primary.id);
    if (primaryRef) {
      const primaryDist = euclideanDistance(cvNorm, normalizeRef(primaryRef.vector));
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
  const { en: safe_text_en, pl: safe_text_pl } = buildSafeText(safeCount, is_displayable);

  return {
    version: 'stage7_human_twin_similarity_v1',
    enabled: true,
    source_label: 'estimated_until_population_exists',
    similarity_percent,
    distance: Math.round(minDist * 100) / 100,
    closest_reference_id: closestRef.id,
    closest_reference_name: closestRef.name,
    shared_patterns: shared,
    differences,
    unlock_threshold: COMPUTE_THRESHOLD,
    current_answer_count: safeCount,
    is_unlocked: true,
    is_displayable,
    tier,
    safe_text_en,
    safe_text_pl,
    user_facing_summary: buildDebugSummary(tier, closestRef.name, similarity_percent, shared, safeCount),
    hp_reliability,
  };
}
