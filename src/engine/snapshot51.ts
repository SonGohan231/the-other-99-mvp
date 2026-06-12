import { CanonicalVector, CANONICAL_AXES } from '../utils/canonicalVector';
import { EmergingArchetypeResult, computeEmergingArchetype } from './emergingArchetype';
import { ContradictionResult } from './contradictionEngine';
import { HumanTwinResult } from './humanTwin';
import { HiddenParametersResult } from './hiddenParameters';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProfileConfidenceLabel =
  | 'too_early'
  | 'first_signal'
  | 'pattern_forming'
  | 'readable'
  | 'strong';

// Depth tier driven by cumulative answer count
export type SnapshotLevel = 'locked' | 'preview' | 'first' | 'deeper' | 'stable';

export interface AxisSignal {
  axis: string;
  value: number;
  normalized_value: number; // -1 to +1
  label: string;
}

export interface Snapshot51Result {
  version: 'stage9_snapshot51_final_reveal_v1';
  answer_count: number;
  is_available: boolean;        // true when answer_count >= 51 OR debug_forced
  is_displayable: boolean;      // alias of is_available, for consistency with other engines
  snapshot_level: SnapshotLevel;
  progress_to_snapshot: number; // 0–100, progress toward first unlock (capped at 100)
  safe_text_en: string;         // user-facing hedged copy; empty when not displayable
  safe_text_pl: string;
  debug_forced: boolean;
  profile_confidence: ProfileConfidenceLabel;
  profile_confidence_label: string;
  emerging_archetype: EmergingArchetypeResult;
  strongest_axes: AxisSignal[];
  uncertain_axes: AxisSignal[];
  hidden_parameters: HiddenParametersResult;
  contradiction_summary: {
    level: string;
    score: number;
    consistency_score: number;
    summary: string;
  };
  human_twin_preview: {
    similarity_percent: number;
    closest_reference_name: string;
    is_unlocked: boolean;
    tier: string;
    summary: string;
  };
  premium_modules_preview: string[];
  next_best_questions_hint: string;
  generated_at: string;
}

// ─── Axis labels (from canonicalVector.ts) ────────────────────────────────────

const AXIS_NAMES: Record<string, { pos: string; neg: string; label: string }> = {
  AX01: { pos: 'Curiosity', neg: 'Security', label: 'Curiosity ↔ Security' },
  AX02: { pos: 'Logic', neg: 'Emotion', label: 'Logic ↔ Emotion' },
  AX03: { pos: 'Independence', neg: 'Belonging', label: 'Independence ↔ Belonging' },
  AX04: { pos: 'Observation', neg: 'Action', label: 'Observation ↔ Action' },
  AX05: { pos: 'Present', neg: 'Future', label: 'Present ↔ Future' },
  AX06: { pos: 'Spontaneity', neg: 'Control', label: 'Spontaneity ↔ Control' },
  AX07: { pos: 'Pragmatism', neg: 'Idealism', label: 'Pragmatism ↔ Idealism' },
  AX08: { pos: 'Stability', neg: 'Transformation', label: 'Stability ↔ Transformation' },
  AX09: { pos: 'Nature', neg: 'Technology', label: 'Nature ↔ Technology' },
  AX10: { pos: 'Creator', neg: 'Builder', label: 'Idea Creator ↔ Builder' },
};

function softNorm(v: number, scale = 15): number {
  return Math.tanh(v / scale);
}

function confidenceFromCount(answerCount: number): {
  label: ProfileConfidenceLabel;
  text: string;
} {
  if (answerCount < 10) return { label: 'too_early', text: 'Not enough data yet.' };
  if (answerCount < 25) return { label: 'first_signal', text: 'A first signal is detectable.' };
  if (answerCount < 51) return { label: 'pattern_forming', text: 'A pattern is forming.' };
  if (answerCount < 100) return { label: 'readable', text: 'Your profile is readable.' };
  return { label: 'strong', text: 'Your profile has a strong signal.' };
}

function buildAxisSignals(canonicalVector: CanonicalVector): {
  strongest: AxisSignal[];
  uncertain: AxisSignal[];
} {
  const signals: AxisSignal[] = CANONICAL_AXES.map((ax) => {
    const raw = canonicalVector[ax];
    const norm = softNorm(raw);
    const info = AXIS_NAMES[ax] ?? { pos: ax, neg: ax, label: ax };
    const direction = norm >= 0 ? info.pos : info.neg;
    return {
      axis: ax,
      value: raw,
      normalized_value: norm,
      label: direction,
    };
  });

  const sorted = [...signals].sort((a, b) => Math.abs(b.normalized_value) - Math.abs(a.normalized_value));

  return {
    strongest: sorted.slice(0, 3),
    uncertain: sorted.slice(-3).reverse(), // smallest absolute values = most uncertain
  };
}

const PREMIUM_MODULES = [
  'Shadow Profile — the patterns you don\'t show publicly',
  'Mask vs Core — the gap between presentation and reality',
  'Contradiction Map — where your signals oppose each other',
  'Future Self — the direction your profile is pulling toward',
  'Relationship Mode — how you show up in social bonds',
  'Human Twin — your closest behavioral match',
];

function buildNextQuestionsHint(archetype: EmergingArchetypeResult): string {
  if (archetype.confidence === 'very_low' || archetype.confidence === 'low') {
    return 'More answers will reveal your direction more clearly.';
  }
  const primaryName = archetype.primary.name.replace('The ', '');
  return `Your profile leans ${primaryName}. Questions around values, social patterns, and risk will sharpen this signal.`;
}

function toSnapshotLevel(count: number, isAvailable: boolean): SnapshotLevel {
  if (!isAvailable) return count >= 17 ? 'preview' : 'locked';
  if (count >= 99) return 'stable';
  if (count >= 75) return 'deeper';
  return 'first';
}

function computeProgressToSnapshot(count: number): number {
  return Math.min(100, Math.round((Math.min(count, 51) / 51) * 100));
}

interface SafeCopy { en: string; pl: string }

function buildSafeText(level: SnapshotLevel): SafeCopy {
  switch (level) {
    case 'first':
      return {
        en: 'Your first behavioral snapshot is now available. It reflects the patterns your answers have traced so far.',
        pl: 'Twój pierwszy behawioralny migawka jest teraz dostępna. Odzwierciedla wzorce, które Twoje odpowiedzi dotychczas nakreśliły.',
      };
    case 'deeper':
      return {
        en: 'Your profile has developed further. A more detailed view of your behavioral patterns is now visible.',
        pl: 'Twój profil rozwinął się dalej. Bardziej szczegółowy obraz Twoich wzorców behawioralnych jest teraz widoczny.',
      };
    case 'stable':
      return {
        en: 'A consistent pattern has emerged across your answers. This snapshot reflects a stable signal in your behavioral profile.',
        pl: 'Spójny wzorzec wyłonił się z Twoich odpowiedzi. Ta migawka odzwierciedla stabilny sygnał w Twoim profilu behawioralnym.',
      };
    default:
      return { en: '', pl: '' };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function computeSnapshot51(
  canonicalVector: CanonicalVector,
  answerCount: number,
  emergingArchetype: EmergingArchetypeResult,
  contradiction: ContradictionResult,
  humanTwin: HumanTwinResult,
  hiddenParameters: HiddenParametersResult,
  debugForced = false,
): Snapshot51Result {
  const safeCount = Math.max(0, Number.isFinite(answerCount) ? Math.floor(answerCount) : 0);
  const is_available = safeCount >= 51 || debugForced;
  const snapshot_level = toSnapshotLevel(safeCount, is_available);
  const progress_to_snapshot = computeProgressToSnapshot(safeCount);
  const { en: safe_text_en, pl: safe_text_pl } = buildSafeText(snapshot_level);
  const { label: profile_confidence, text: profile_confidence_label } = confidenceFromCount(safeCount);
  const { strongest: strongest_axes, uncertain: uncertain_axes } = buildAxisSignals(canonicalVector);

  // If not yet available, return a minimal locked result
  if (!is_available) {
    const remaining = Math.max(0, 51 - safeCount);
    return {
      version: 'stage9_snapshot51_final_reveal_v1',
      answer_count: safeCount,
      is_available: false,
      is_displayable: false,
      snapshot_level,
      progress_to_snapshot,
      safe_text_en: '',
      safe_text_pl: '',
      debug_forced: false,
      profile_confidence,
      profile_confidence_label,
      emerging_archetype: emergingArchetype,
      strongest_axes,
      uncertain_axes,
      hidden_parameters: hiddenParameters,
      contradiction_summary: {
        level: contradiction.level,
        score: contradiction.contradiction_score,
        consistency_score: contradiction.consistency_score,
        summary: contradiction.user_facing_summary,
      },
      human_twin_preview: {
        similarity_percent: 0,
        closest_reference_name: '',
        is_unlocked: false,
        tier: 'locked',
        summary: `Answer ${remaining} more questions to unlock Snapshot 51.`,
      },
      premium_modules_preview: PREMIUM_MODULES,
      next_best_questions_hint: buildNextQuestionsHint(emergingArchetype),
      generated_at: new Date().toISOString(),
    };
  }

  // Use a stable archetype result at exactly 51+ answers
  const snapshotArchetype = safeCount >= 51
    ? computeEmergingArchetype(canonicalVector, safeCount)
    : emergingArchetype;

  return {
    version: 'stage9_snapshot51_final_reveal_v1',
    answer_count: safeCount,
    is_available: true,
    is_displayable: true,
    snapshot_level,
    progress_to_snapshot,
    safe_text_en,
    safe_text_pl,
    debug_forced: debugForced,
    profile_confidence,
    profile_confidence_label,
    emerging_archetype: snapshotArchetype,
    strongest_axes,
    uncertain_axes,
    hidden_parameters: hiddenParameters,
    contradiction_summary: {
      level: contradiction.level,
      score: contradiction.contradiction_score,
      consistency_score: contradiction.consistency_score,
      summary: contradiction.user_facing_summary,
    },
    human_twin_preview: {
      similarity_percent: humanTwin.similarity_percent,
      closest_reference_name: humanTwin.closest_reference_name,
      is_unlocked: humanTwin.is_unlocked,
      tier: humanTwin.tier,
      summary: humanTwin.user_facing_summary,
    },
    premium_modules_preview: PREMIUM_MODULES,
    next_best_questions_hint: buildNextQuestionsHint(snapshotArchetype),
    generated_at: new Date().toISOString(),
  };
}
