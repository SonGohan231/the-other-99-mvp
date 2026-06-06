import { BehavioralSummary } from '../utils/behavioralSignals';
import { Interaction, ReturnToSessionEvent } from '../types';
import { computeCanonicalHP, CanonicalHP } from './canonicalHP';
import { ContradictionResult } from './contradictionEngine';

// ─── Types ────────────────────────────────────────────────────────────────────

export type HPLabel = 'low' | 'mixed' | 'high';

export interface HiddenParameterDimension {
  score: number;          // 0–100
  label: HPLabel;
  evidence: string[];
  user_facing_label: string;
  user_facing_summary: string;
}

export interface HiddenParametersResult {
  confidence: HiddenParameterDimension;
  openness: HiddenParameterDimension;
  consistency: HiddenParameterDimension;
  raw_hp: CanonicalHP | null;
  answer_count: number;
  is_sufficient: boolean;   // true when >= 5 behavioral data points exist
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toScore(hpValue: number): number {
  // HP range is -100 to +100; map to 0–100 where 50 = neutral
  return Math.round(Math.max(0, Math.min(100, (hpValue + 100) / 2)));
}

function toLabel(score: number): HPLabel {
  if (score >= 70) return 'high';
  if (score >= 30) return 'mixed';
  return 'low';
}

// ─── Confidence dimension ─────────────────────────────────────────────────────

function buildConfidence(
  hp01: number,
  interactions: Interaction[],
  _behavioral: BehavioralSummary | null,
): HiddenParameterDimension {
  const score = toScore(hp01);
  const label = toLabel(score);
  const evidence: string[] = [];

  const totalChanges = interactions.reduce((s, i) => s + (i.answer_changes_count ?? 0), 0);
  const undones = interactions.filter((i) => i.behavioral_metadata?.was_undone).length;
  const fastAnswers = interactions.filter((i) => i.response_time_ms > 0 && i.response_time_ms < 3000).length;

  if (totalChanges > 3) evidence.push(`${totalChanges} answer revisions detected`);
  if (undones > 0) evidence.push(`${undones} answers undone`);
  if (fastAnswers > interactions.length * 0.7) evidence.push('Most answers decided quickly');

  const labels: Record<HPLabel, { ui: string; summary: string }> = {
    low: {
      ui: 'More hesitant',
      summary: 'Your answers show a filtering process before committing. You tend to pause, revise, or reconsider.',
    },
    mixed: {
      ui: 'Variable decisiveness',
      summary: 'You decide quickly on some topics and take longer on others. The pattern shifts depending on the question.',
    },
    high: {
      ui: 'More decisive',
      summary: 'You tend to commit quickly with few revisions. Your answers move in a consistent direction.',
    },
  };

  return {
    score,
    label,
    evidence,
    user_facing_label: labels[label].ui,
    user_facing_summary: labels[label].summary,
  };
}

// ─── Openness dimension ───────────────────────────────────────────────────────

function buildOpenness(
  hp02: number,
  interactions: Interaction[],
  _behavioral: BehavioralSummary | null,
): HiddenParameterDimension {
  const score = toScore(hp02);
  const label = toLabel(score);
  const evidence: string[] = [];

  const skippedCount = interactions.filter((i) => i.skipped).length;
  const sensitiveAnswered = interactions.filter((i) =>
    !i.skipped && (i.rarity_tier === 'rare' || i.rarity_tier === 'epic' || i.rarity_tier === 'legendary')
  ).length;

  if (skippedCount > 2) evidence.push(`${skippedCount} questions skipped`);
  if (sensitiveAnswered > 3) evidence.push(`${sensitiveAnswered} rare/sensitive questions engaged`);

  const labels: Record<HPLabel, { ui: string; summary: string }> = {
    low: {
      ui: 'More guarded',
      summary: 'Your pattern shows selective engagement. You tend to hold back on certain types of questions.',
    },
    mixed: {
      ui: 'Selectively open',
      summary: 'You engage openly with some topics while maintaining more distance on others.',
    },
    high: {
      ui: 'More open',
      summary: 'You engage directly with most questions without visible avoidance. High transparency signal.',
    },
  };

  return {
    score,
    label,
    evidence,
    user_facing_label: labels[label].ui,
    user_facing_summary: labels[label].summary,
  };
}

// ─── Consistency dimension ────────────────────────────────────────────────────

function buildConsistency(
  hp03: number,
  contradiction: ContradictionResult | null,
): HiddenParameterDimension {
  // Blend HP03 signal with contradiction engine result if available
  let score = toScore(hp03);
  if (contradiction) {
    // Contradiction score is 0–100 where higher = more contradiction
    // Invert it and blend 50/50 with HP03-derived score
    const contradictionAdjusted = 100 - contradiction.contradiction_score;
    score = Math.round((score + contradictionAdjusted) / 2);
  }

  const label = toLabel(score);
  const evidence: string[] = [];

  if (contradiction) {
    if (contradiction.signals.includes('answer_revision')) evidence.push('Multiple answer revisions');
    if (contradiction.signals.includes('latency_spike')) evidence.push('Response time inconsistencies');
    if (contradiction.signals.includes('opposite_axis_movement')) evidence.push('Opposing signals on the same axis');
    if (contradiction.signals.includes('return_to_question')) evidence.push('Returned to previous questions');
  }

  const labels: Record<HPLabel, { ui: string; summary: string }> = {
    low: {
      ui: 'More layered',
      summary: 'Your profile shows internal tension. Your answers and timing do not always point in the same direction.',
    },
    mixed: {
      ui: 'Somewhat consistent',
      summary: 'Your pattern has a clear direction but contains some tension. A few threads pull in different ways.',
    },
    high: {
      ui: 'More consistent',
      summary: 'Your answers build a coherent pattern. Your choices mostly align with each other.',
    },
  };

  return {
    score,
    label,
    evidence,
    user_facing_label: labels[label].ui,
    user_facing_summary: labels[label].summary,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function computeHiddenParameters(
  behavioral: BehavioralSummary | null,
  interactions: Interaction[],
  returnEvents: ReturnToSessionEvent[],
  contradiction: ContradictionResult | null,
): HiddenParametersResult {
  const rawHP = computeCanonicalHP(behavioral, returnEvents);
  const answerCount = interactions.filter((i) => !i.skipped).length;
  const is_sufficient = answerCount >= 5;

  if (!rawHP || !is_sufficient) {
    const neutral: HiddenParameterDimension = {
      score: 50,
      label: 'mixed',
      evidence: ['Insufficient data — answer more questions to see this pattern.'],
      user_facing_label: 'Building pattern',
      user_facing_summary: 'Not enough answers yet to detect a behavioral pattern here.',
    };
    return {
      confidence: neutral,
      openness: neutral,
      consistency: neutral,
      raw_hp: rawHP,
      answer_count: answerCount,
      is_sufficient: false,
    };
  }

  return {
    confidence: buildConfidence(rawHP.HP01, interactions, behavioral),
    openness: buildOpenness(rawHP.HP02, interactions, behavioral),
    consistency: buildConsistency(rawHP.HP03, contradiction),
    raw_hp: rawHP,
    answer_count: answerCount,
    is_sufficient: true,
  };
}
