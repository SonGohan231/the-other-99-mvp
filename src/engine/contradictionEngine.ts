import { Interaction, SkipEvent, SwapEvent, ExitToMenuEvent } from '../types';
import { CanonicalVector } from '../utils/canonicalVector';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ContradictionLevel = 'none' | 'low' | 'medium' | 'high';

export type ContradictionSignal =
  | 'answer_revision'
  | 'latency_spike'
  | 'opposite_axis_movement'
  | 'skip_sensitive'
  | 'return_to_question'
  | 'reverse_pair_mismatch';

export interface ContradictionResult {
  contradiction_score: number;  // 0–100
  consistency_score: number;    // 0–100
  level: ContradictionLevel;
  primary_axis: string | null;
  signals: ContradictionSignal[];
  signal_counts: Record<ContradictionSignal, number>;
  user_facing_summary: string;
  debug_evidence: Record<string, unknown>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// ─── Signal detectors ─────────────────────────────────────────────────────────

function detectAnswerRevisions(interactions: Interaction[]): number {
  return interactions.reduce((count, i) => count + (i.answer_changes_count ?? 0), 0);
}

function detectLatencySpikes(interactions: Interaction[]): number {
  const times = interactions
    .filter((i) => !i.skipped && i.response_time_ms > 0)
    .map((i) => i.response_time_ms);
  if (times.length < 3) return 0;

  const mean = avg(times);
  const std = Math.sqrt(avg(times.map((t) => (t - mean) ** 2)));
  const spikes = times.filter((t) => t > mean + 2 * std).length;
  return spikes;
}

function detectOppositeAxisMovement(interactions: Interaction[], canonicalVector: CanonicalVector): {
  count: number;
  primaryAxis: string | null;
} {
  // Find axes that have received both positive and negative deltas across answers.
  const axisHistory: Record<string, number[]> = {};

  for (const interaction of interactions) {
    const meta = interaction.behavioral_metadata;
    if (!meta) continue;
    // We use contradiction_signal as a proxy for axis-level contradiction
    // (the engine doesn't have per-answer axis deltas in interaction history)
    if (meta.contradiction_signal > 30) {
      const axis = 'AX_mixed'; // placeholder — real per-answer axis data would improve this
      axisHistory[axis] = [...(axisHistory[axis] ?? []), meta.contradiction_signal];
    }
  }

  // Count axes with oscillation in canonicalVector relative to its expected direction
  // Proxy: look at axes with |value| < 5 after many answers (suggests back-and-forth)
  let oppositeCount = 0;
  let primaryAxis: string | null = null;
  let smallestAbs = Infinity;

  const answeredCount = interactions.filter((i) => !i.skipped).length;
  if (answeredCount >= 10) {
    for (const [axis, val] of Object.entries(canonicalVector)) {
      const absVal = Math.abs(val);
      if (absVal < 3 && absVal < smallestAbs) {
        smallestAbs = absVal;
        primaryAxis = axis;
        oppositeCount++;
      }
    }
  }

  return { count: oppositeCount, primaryAxis };
}

function detectSkipSensitive(skipEvents: SkipEvent[]): number {
  // Skips on rare/epic/legendary questions suggest avoidance of sensitive content
  return skipEvents.filter((e) => {
    const ctx = e.question_context;
    return ctx && (
      ctx.rarity_tier === 'rare' ||
      ctx.rarity_tier === 'epic' ||
      ctx.rarity_tier === 'legendary'
    );
  }).length;
}

function detectReturnToQuestion(interactions: Interaction[]): number {
  return interactions.filter((i) => i.behavioral_metadata?.returned_to_question).length;
}

// ─── Summary text ─────────────────────────────────────────────────────────────

function buildSummary(level: ContradictionLevel, primaryAxis: string | null, signals: ContradictionSignal[]): string {
  if (level === 'none') return 'Your answers show a consistent pattern with no visible internal tension.';

  const axisNote = primaryAxis ? ` around ${primaryAxis}` : '';

  if (level === 'low') {
    return `Your profile shows minor tension${axisNote}. Your answers and timing mostly align, with occasional variation.`;
  }
  if (level === 'medium') {
    const revisions = signals.includes('answer_revision');
    if (revisions) {
      return `Your profile shows tension${axisNote}. You revised several answers, and your timing suggests some uncertainty in those areas.`;
    }
    return `Your profile shows tension${axisNote}. Your answers and timing do not always point in the same direction.`;
  }
  return `Your profile contains significant tension${axisNote}. Strong opposing signals are present — your answers pull in different directions on related topics.`;
}

// ─── Core computation ─────────────────────────────────────────────────────────

export function computeContradiction(
  interactions: Interaction[],
  skipEvents: SkipEvent[],
  swapEvents: SwapEvent[],
  _exitEvents: ExitToMenuEvent[],
  canonicalVector: CanonicalVector,
): ContradictionResult {
  const answered = interactions.filter((i) => !i.skipped);

  const revisions = detectAnswerRevisions(answered);
  const latencySpikes = detectLatencySpikes(answered);
  const { count: oppositeMovement, primaryAxis } = detectOppositeAxisMovement(answered, canonicalVector);
  const sensitiveSkips = detectSkipSensitive(skipEvents);
  const returnToQ = detectReturnToQuestion(answered);
  const swapCount = swapEvents.length;

  // Build raw contradiction score (0–100)
  // Each source contributes proportionally, capped to prevent dominance
  const revisionContrib = clamp(revisions * 6, 0, 25);
  const latencyContrib = clamp(latencySpikes * 5, 0, 20);
  const axisContrib = clamp(oppositeMovement * 4, 0, 20);
  const skipContrib = clamp(sensitiveSkips * 5, 0, 15);
  const returnContrib = clamp(returnToQ * 8, 0, 15);
  const swapContrib = clamp(swapCount * 3, 0, 10);

  // Scale down if sample is very small
  const sampleScale = Math.min(1, answered.length / 10);
  const raw = (revisionContrib + latencyContrib + axisContrib + skipContrib + returnContrib + swapContrib) * sampleScale;
  const contradiction_score = Math.round(clamp(raw, 0, 100));
  const consistency_score = 100 - contradiction_score;

  const level: ContradictionLevel =
    contradiction_score >= 60 ? 'high' :
    contradiction_score >= 35 ? 'medium' :
    contradiction_score >= 15 ? 'low' : 'none';

  const signals: ContradictionSignal[] = [];
  if (revisions > 0) signals.push('answer_revision');
  if (latencySpikes > 1) signals.push('latency_spike');
  if (oppositeMovement > 2) signals.push('opposite_axis_movement');
  if (sensitiveSkips > 1) signals.push('skip_sensitive');
  if (returnToQ > 0) signals.push('return_to_question');

  const signal_counts: Record<ContradictionSignal, number> = {
    answer_revision: revisions,
    latency_spike: latencySpikes,
    opposite_axis_movement: oppositeMovement,
    skip_sensitive: sensitiveSkips,
    return_to_question: returnToQ,
    reverse_pair_mismatch: 0, // requires content-level pair data
  };

  return {
    contradiction_score,
    consistency_score,
    level,
    primary_axis: primaryAxis,
    signals,
    signal_counts,
    user_facing_summary: buildSummary(level, primaryAxis, signals),
    debug_evidence: {
      answered_count: answered.length,
      skipped_count: interactions.length - answered.length,
      revisions,
      latency_spikes: latencySpikes,
      opposite_axis_movement: oppositeMovement,
      sensitive_skips: sensitiveSkips,
      return_to_question: returnToQ,
      swaps: swapCount,
    },
  };
}
