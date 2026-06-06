import type { EmergingArchetypeResult } from '../engine/emergingArchetype';
import type { ContradictionResult } from '../engine/contradictionEngine';
import type { CanonicalVector } from './canonicalVector';
import { getAxisDisplayName } from './microReveals';

export type RevealType =
  | 'signal_captured'
  | 'axis_shifted'
  | 'hidden_layer'
  | 'archetype_signal'
  | 'contradiction_update'
  | 'twin_refined'
  | 'snapshot_progress'
  | 'milestone';

export type RevealIntensity = 'tiny' | 'micro' | 'milestone';

export interface RevealResult {
  reveal_type: RevealType;
  title: string;
  body: string;
  intensity: RevealIntensity;
  should_show: boolean;
  next_tease: string;
}

// ── Tiny feedback (every answer, shown during analyzing phase) ──────────────
const MICRO_FEEDBACKS = [
  'Signal captured.',
  'Profile shifted.',
  'New pattern detected.',
  'Your map moved slightly.',
  'One layer became clearer.',
  'Something registered.',
  'The pattern updated.',
  'A signal was recorded.',
];

export function getMicroFeedback(totalAnswers: number): string {
  return MICRO_FEEDBACKS[(totalAnswers - 1) % MICRO_FEEDBACKS.length];
}

// ── Next-layer milestones ───────────────────────────────────────────────────
const MILESTONE_THRESHOLDS = [5, 10, 25, 51, 99] as const;

const MILESTONE_LABELS: Record<number, string> = {
  5: 'first pattern',
  10: 'hidden profile',
  25: 'archetype signal',
  51: 'Snapshot 51',
  99: 'full confidence',
};

const MILESTONE_DATA: Record<number, { title: string; body: string }> = {
  5:  { title: 'New layer forming.',         body: 'Your first pattern is taking shape.' },
  10: { title: 'Hidden Profile beginning.',  body: 'Deeper parameters are starting to register.' },
  25: { title: 'Archetype approaching.',     body: 'Your profile has enough signal to form a direction.' },
  51: { title: 'Snapshot 51 reached.',       body: 'Your full profile map is now available.' },
  99: { title: 'Full confidence reached.',   body: 'The profile has reached maximum resolution.' },
};

export function getNextLayerInfo(totalAnswers: number): { threshold: number; label: string; answersLeft: number } | null {
  const next = MILESTONE_THRESHOLDS.find((t) => t > totalAnswers);
  if (!next) return null;
  return {
    threshold: next,
    label: MILESTONE_LABELS[next] ?? 'next layer',
    answersLeft: next - totalAnswers,
  };
}

// ── Next tease ─────────────────────────────────────────────────────────────
const GENERIC_TEASES = [
  'Next: a pressure signal.',
  'Next: your consistency pattern.',
  'Next: something may shift.',
  'Next: one answer closer.',
  'Next: a hidden layer check.',
  'Next: your direction becomes clearer.',
  'Next: the pattern continues.',
  'Next: a deeper dimension.',
];

export function getNextTease(nextQuestion: { axis_target?: string } | null, totalAnswers: number): string {
  const nextLayer = getNextLayerInfo(totalAnswers);
  if (nextLayer && nextLayer.answersLeft <= 1) {
    return `Next: unlocks ${nextLayer.label}.`;
  }
  if (nextQuestion?.axis_target) {
    const axes = nextQuestion.axis_target.split(';').map((a) => a.trim()).filter(Boolean);
    if (axes.length > 0) {
      const axisName = getAxisDisplayName(axes[0]).toLowerCase();
      return `Next: your ${axisName} pattern.`;
    }
  }
  return GENERIC_TEASES[totalAnswers % GENERIC_TEASES.length];
}

// ── Reveal result (main function) ──────────────────────────────────────────
function getStrongestAxis(cv: CanonicalVector | null): string {
  if (!cv) return 'AX01';
  let best = 'AX01';
  let max = 0;
  for (const [key, val] of Object.entries(cv)) {
    if (Math.abs(val) > max) { max = Math.abs(val); best = key; }
  }
  return best;
}

export function getRevealResult(
  totalAnswers: number,
  archetype: EmergingArchetypeResult,
  contradiction: ContradictionResult,
  canonicalVector: CanonicalVector | null,
  nextQuestion: { axis_target?: string } | null = null,
): RevealResult {
  const nextTease = getNextTease(nextQuestion, totalAnswers);
  const strongestAxis = getStrongestAxis(canonicalVector);
  const axisName = getAxisDisplayName(strongestAxis).toLowerCase();
  const archName = archetype.confidence === 'very_low' ? 'a direction' : archetype.primary.name;

  // Milestone reveals take priority
  if ((MILESTONE_THRESHOLDS as readonly number[]).includes(totalAnswers)) {
    const data = MILESTONE_DATA[totalAnswers] ?? { title: 'Profile milestone.', body: 'A new layer has been reached.' };
    return { reveal_type: 'milestone', ...data, intensity: 'milestone', should_show: true, next_tease: nextTease };
  }

  // Meaningful micro reveal every 3rd answer
  if (totalAnswers >= 3 && totalAnswers % 3 === 0) {
    const idx = Math.floor(totalAnswers / 3) % 7;
    const reveals: Array<{ reveal_type: RevealType; title: string; body: string }> = [
      { reveal_type: 'axis_shifted',       title: 'New signal detected.',   body: `Your profile shifted toward ${axisName}.` },
      { reveal_type: 'hidden_layer',       title: 'Hidden layer forming.',  body: 'Your answers are aligning in a consistent direction.' },
      { reveal_type: 'archetype_signal',   title: 'Archetype signal.',      body: archetype.confidence === 'very_low' ? 'No clear direction yet — still gathering signal.' : `${archName} direction strengthening.` },
      { reveal_type: 'contradiction_update', title: 'Consistency signal.',  body: contradiction.level === 'none' || contradiction.level === 'low' ? 'Your answers are building a clear, consistent pattern.' : 'Some internal complexity is forming — not a flaw, just depth.' },
      { reveal_type: 'axis_shifted',       title: 'Axis movement.',         body: `${getAxisDisplayName(strongestAxis)} is actively updating.` },
      { reveal_type: 'hidden_layer',       title: 'Signal deepening.',      body: 'Each answer adds weight to the same underlying structure.' },
      { reveal_type: 'signal_captured',    title: 'Something shifted.',     body: 'This answer moved at least one hidden dimension.' },
    ];
    return { ...reveals[idx], intensity: 'micro', should_show: true, next_tease: nextTease };
  }

  // Tiny feedback — used as the analyzing-phase message only, not shown as a card
  return {
    reveal_type: 'signal_captured',
    title: 'Signal captured.',
    body: getMicroFeedback(totalAnswers),
    intensity: 'tiny',
    should_show: false,
    next_tease: nextTease,
  };
}

// ── Auto-advance ────────────────────────────────────────────────────────────
const AUTO_ADVANCE_KEY = 'to99_auto_advance';

export function isAutoAdvanceEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(AUTO_ADVANCE_KEY) === 'true';
}

export function setAutoAdvanceEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTO_ADVANCE_KEY, enabled ? 'true' : 'false');
}
