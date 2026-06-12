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
  version: 'stage6_hidden_parameters_engine_v1';
  confidence: HiddenParameterDimension;
  openness: HiddenParameterDimension;
  consistency: HiddenParameterDimension;
  directness: HiddenParameterDimension;
  stability: HiddenParameterDimension;
  raw_hp: CanonicalHP | null;
  answer_count: number;
  is_sufficient: boolean;   // true when >= 5 answered questions exist
  is_displayable: boolean;  // true when >= 12 answers AND is_sufficient
  safe_text_en: string;     // for RewardScreen — hedged, no direct labels
  safe_text_pl: string;
}

// ─── Display thresholds ───────────────────────────────────────────────────────

const MIN_ANSWERS_SUFFICIENT = 5;   // debug/export visibility
const MIN_ANSWERS_DISPLAYABLE = 12; // RewardScreen visibility

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

// ─── Confidence dimension (HP01) ──────────────────────────────────────────────

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

// ─── Openness dimension (HP02) ────────────────────────────────────────────────

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

// ─── Consistency dimension (HP03) ─────────────────────────────────────────────

function buildConsistency(
  hp03: number,
  contradiction: ContradictionResult | null,
): HiddenParameterDimension {
  let score = toScore(hp03);
  if (contradiction) {
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

// ─── Directness dimension (HP04) ─────────────────────────────────────────────

function buildDirectness(
  hp04: number,
  interactions: Interaction[],
): HiddenParameterDimension {
  const score = toScore(hp04);
  const label = toLabel(score);
  const evidence: string[] = [];

  const fastFirstReaction = interactions.filter(
    (i) => i.behavioral_metadata?.first_reaction_time_ms !== null &&
            (i.behavioral_metadata?.first_reaction_time_ms ?? Infinity) < 1000
  ).length;
  const slowFirstReaction = interactions.filter(
    (i) => i.behavioral_metadata?.first_reaction_time_ms !== null &&
            (i.behavioral_metadata?.first_reaction_time_ms ?? 0) > 5000
  ).length;

  if (fastFirstReaction > interactions.length * 0.6) evidence.push('Fast initial reactions on most questions');
  if (slowFirstReaction > interactions.length * 0.4) evidence.push('Careful reading before engaging');

  const labels: Record<HPLabel, { ui: string; summary: string }> = {
    low: {
      ui: 'More reflective',
      summary: 'You tend to pause before engaging. Careful reading and consideration before committing is the pattern.',
    },
    mixed: {
      ui: 'Context-dependent',
      summary: 'Your pace varies. Some questions draw immediate responses; others prompt a longer consideration.',
    },
    high: {
      ui: 'More direct',
      summary: 'You engage quickly. Your first instinct tends to be your final answer with minimal deliberation.',
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

// ─── Stability dimension (HP05) ───────────────────────────────────────────────

function buildStability(
  hp05: number,
  returnEvents: ReturnToSessionEvent[],
): HiddenParameterDimension {
  const score = toScore(hp05);
  const label = toLabel(score);
  const evidence: string[] = [];

  if (returnEvents.length > 0) evidence.push(`Session resumed ${returnEvents.length} time${returnEvents.length > 1 ? 's' : ''}`);
  if (returnEvents.some((e) => e.same_question_restored)) evidence.push('Returned to same question after break');

  const labels: Record<HPLabel, { ui: string; summary: string }> = {
    low: {
      ui: 'More exploratory',
      summary: 'Your session shows high navigational variability. You swap, exit, and explore paths rather than committing linearly.',
    },
    mixed: {
      ui: 'Adaptively engaged',
      summary: 'Your engagement is partly stable, partly exploratory. You navigate the session with flexibility.',
    },
    high: {
      ui: 'More stable',
      summary: 'You engage consistently and linearly. Low navigational variability — you follow through and stay on path.',
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

// ─── Safe copy for RewardScreen ───────────────────────────────────────────────

function buildSafeText(
  answerCount: number,
  is_sufficient: boolean,
): { en: string; pl: string } {
  if (answerCount < MIN_ANSWERS_DISPLAYABLE || !is_sufficient) {
    return { en: '', pl: '' };
  }

  if (answerCount < 17) {
    return {
      en: 'A behavioral pattern is starting to appear in how you engage with questions.',
      pl: 'W sposobie, w jaki angażujesz się w pytania, zaczyna pojawiać się wzorzec behawioralny.',
    };
  }
  if (answerCount < 31) {
    return {
      en: 'The way you approach decisions is leaving a consistent trace across your answers.',
      pl: 'Sposób, w jaki podchodzisz do decyzji, zostawia spójny ślad w Twoich odpowiedziach.',
    };
  }
  return {
    en: 'Your response style shows a clear pattern across the questions you have answered.',
    pl: 'Twój styl odpowiedzi wykazuje wyraźny wzorzec w pytaniach, na które odpowiedziałeś.',
  };
}

// ─── Neutral placeholder ──────────────────────────────────────────────────────

function neutralDimension(): HiddenParameterDimension {
  return {
    score: 50,
    label: 'mixed',
    evidence: ['Insufficient data — answer more questions to see this pattern.'],
    user_facing_label: 'Building pattern',
    user_facing_summary: 'Not enough answers yet to detect a behavioral pattern here.',
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function computeHiddenParameters(
  behavioral: BehavioralSummary | null,
  interactions: Interaction[],
  returnEvents: ReturnToSessionEvent[],
  contradiction: ContradictionResult | null,
): HiddenParametersResult {
  const answerCount = interactions.filter((i) => !i.skipped).length;
  const rawHP = computeCanonicalHP(behavioral, returnEvents);
  const is_sufficient = answerCount >= MIN_ANSWERS_SUFFICIENT;
  const is_displayable = answerCount >= MIN_ANSWERS_DISPLAYABLE && is_sufficient;
  const { en: safe_text_en, pl: safe_text_pl } = buildSafeText(answerCount, is_sufficient);

  if (!rawHP || !is_sufficient) {
    const neutral = neutralDimension();
    return {
      version: 'stage6_hidden_parameters_engine_v1',
      confidence: neutral,
      openness: neutral,
      consistency: neutral,
      directness: neutral,
      stability: neutral,
      raw_hp: rawHP,
      answer_count: answerCount,
      is_sufficient: false,
      is_displayable: false,
      safe_text_en: '',
      safe_text_pl: '',
    };
  }

  return {
    version: 'stage6_hidden_parameters_engine_v1',
    confidence: buildConfidence(rawHP.HP01, interactions, behavioral),
    openness: buildOpenness(rawHP.HP02, interactions, behavioral),
    consistency: buildConsistency(rawHP.HP03, contradiction),
    directness: buildDirectness(rawHP.HP04, interactions),
    stability: buildStability(rawHP.HP05, returnEvents),
    raw_hp: rawHP,
    answer_count: answerCount,
    is_sufficient,
    is_displayable,
    safe_text_en,
    safe_text_pl,
  };
}
