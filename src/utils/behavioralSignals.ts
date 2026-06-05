import { Interaction, BehavioralMetadata } from '../types';
import { ProfileVector } from './profileVector';

// Response time thresholds (ms)
const T_VERY_FAST = 1500;
const T_FAST = 3000;
const T_NORMAL = 8000;
const T_SLOW = 20000;

export function computeConfidenceSignal(
  responseTimeMs: number,
  changeCount: number,
  wasSkipped: boolean,
): number {
  if (wasSkipped) return 8;
  const base =
    responseTimeMs < T_VERY_FAST ? 85 :
    responseTimeMs < T_FAST ? 75 :
    responseTimeMs < T_NORMAL ? 60 :
    responseTimeMs < T_SLOW ? 35 : 15;
  const penalty = Math.min(55, changeCount * 22);
  return Math.max(5, Math.round(base - penalty));
}

export function computeAvoidanceSignal(
  wasSkipped: boolean,
  responseTimeMs: number,
  changeCount: number,
  emotionalIntensity: number, // 0-10 content tag
): number {
  if (wasSkipped) return Math.min(95, 70 + emotionalIntensity * 2);
  const timeScore = responseTimeMs > T_SLOW ? 50 : responseTimeMs > T_NORMAL ? 25 : 0;
  const changeScore = changeCount >= 2 ? 20 : 0;
  const intensityBoost = emotionalIntensity > 5 ? emotionalIntensity * 2 : 0;
  return Math.min(90, Math.round(timeScore + changeScore + intensityBoost));
}

export function computeImpulsivitySignal(
  responseTimeMs: number,
  firstReactionMs: number | null,
  changeCount: number,
  wasSkipped: boolean,
): number {
  if (wasSkipped) return 5;
  if (changeCount > 0) return Math.max(5, 40 - changeCount * 15);
  const speed =
    responseTimeMs < T_VERY_FAST ? 90 :
    responseTimeMs < T_FAST ? 65 :
    responseTimeMs < T_NORMAL ? 30 : 5;
  // First-reaction bonus: if they tapped immediately, even more impulsive
  if (firstReactionMs !== null && firstReactionMs < 800) return Math.min(98, speed + 10);
  return speed;
}

export function computeDeliberationSignal(
  responseTimeMs: number,
  firstReactionMs: number | null,
  changeCount: number,
  wasSkipped: boolean,
): number {
  if (wasSkipped) return 0;
  const base =
    responseTimeMs < T_FAST ? 5 :
    responseTimeMs < T_NORMAL ? 35 :
    responseTimeMs < T_SLOW ? 75 : 90;
  // Long first-reaction (read carefully before touching) → more deliberation
  const reactionBonus = firstReactionMs !== null && firstReactionMs > 5000 ? 10 : 0;
  // Stable deliberation: long time + no changes
  const changePenalty = changeCount > 2 ? 20 : 0;
  return Math.min(95, Math.max(0, Math.round(base + reactionBonus - changePenalty)));
}

export function computeInstabilitySignal(
  changeCount: number,
  wasUndone: boolean,
): number {
  const base = Math.min(80, changeCount * 30);
  const undoBonus = wasUndone ? 25 : 0;
  return Math.min(95, base + undoBonus);
}

export function computeEmotionalFrictionSignal(
  hesitationMs: number | null,
  changeCount: number,
  wasSkipped: boolean,
  emotionalIntensity: number, // 0-10 from content tag
  privacyLevel: number,       // 0-10 from content tag
): number {
  if (emotionalIntensity === 0 && privacyLevel === 0) return 0;
  const sensitivity = (emotionalIntensity + privacyLevel) / 2;
  if (sensitivity < 3) return 0;
  const hesBonus = hesitationMs !== null && hesitationMs > 3000 ? Math.min(30, hesitationMs / 400) : 0;
  const skipBonus = wasSkipped ? 40 : 0;
  const changeBonus = Math.min(20, changeCount * 10);
  const base = sensitivity * 5;
  return Math.min(95, Math.round(base + hesBonus + skipBonus + changeBonus));
}

export function computeContradictionSignal(
  axisDeltas: Record<string, number> | null,
  profileVector: ProfileVector,
): number {
  if (!axisDeltas) return 0;
  let contradictions = 0;
  let checks = 0;
  for (const [axis, delta] of Object.entries(axisDeltas)) {
    const current = (profileVector as unknown as Record<string, number>)[axis];
    if (current == null || Math.abs(delta) < 0.5) continue;
    checks++;
    // If delta moves axis in opposite direction of its current value: contradiction
    if (current > 2 && delta < -0.5) contradictions++;
    if (current < -2 && delta > 0.5) contradictions++;
  }
  if (checks === 0) return 0;
  return Math.round((contradictions / checks) * 80);
}

export interface ContentBehavioralProfile {
  emotionalIntensity: number; // 0-10
  privacyLevel: number;       // 0-10
  vulnerabilityLevel: number; // 0-10
}

export function computeBehavioralMetadata(params: {
  responseTimeMs: number;
  firstReactionMs: number | null;
  changeCount: number;
  wasSkipped: boolean;
  wasUndone: boolean;
  axisDeltas: Record<string, number> | null;
  profileVector: ProfileVector;
  contentProfile: ContentBehavioralProfile;
}): BehavioralMetadata {
  const {
    responseTimeMs, firstReactionMs, changeCount, wasSkipped,
    wasUndone, axisDeltas, profileVector, contentProfile,
  } = params;

  const hesitationMs =
    firstReactionMs !== null
      ? Math.max(0, responseTimeMs - firstReactionMs)
      : null;

  const confidence = computeConfidenceSignal(responseTimeMs, changeCount, wasSkipped);
  const avoidance = computeAvoidanceSignal(
    wasSkipped, responseTimeMs, changeCount, contentProfile.emotionalIntensity
  );
  const impulsivity = computeImpulsivitySignal(responseTimeMs, firstReactionMs, changeCount, wasSkipped);
  const deliberation = computeDeliberationSignal(responseTimeMs, firstReactionMs, changeCount, wasSkipped);
  const instability = computeInstabilitySignal(changeCount, wasUndone);
  const emotionalFriction = computeEmotionalFrictionSignal(
    hesitationMs, changeCount, wasSkipped,
    contentProfile.emotionalIntensity, contentProfile.privacyLevel,
  );
  const contradiction = computeContradictionSignal(axisDeltas, profileVector);

  return {
    first_reaction_time_ms: firstReactionMs,
    hesitation_time_ms: hesitationMs,
    was_answer_changed: changeCount > 0,
    was_undone: wasUndone,
    returned_to_question: false,
    confidence_signal: confidence,
    avoidance_signal: avoidance,
    impulsivity_signal: impulsivity,
    deliberation_signal: deliberation,
    instability_signal: instability,
    emotional_friction_signal: emotionalFriction,
    contradiction_signal: contradiction,
  };
}

export type DecisivenessLabel = 'impulsive' | 'decisive' | 'deliberate' | 'hesitant';
export type StabilityLabel = 'stable' | 'uncertain' | 'volatile';
export type AvoidanceLabel = 'direct' | 'selective' | 'avoidant';

export interface BehavioralSummary {
  sampleSize: number;
  avgResponseTimeMs: number;
  avgFirstReactionMs: number | null;
  avgHesitationMs: number | null;
  avgConfidenceSignal: number;
  avgAvoidanceSignal: number;
  avgImpulsivitySignal: number;
  avgDeliberationSignal: number;
  avgInstabilitySignal: number;
  avgEmotionalFrictionSignal: number;
  avgContradictionSignal: number;
  totalAnswerChanges: number;
  totalUndos: number;
  totalSkips: number;
  decisivenessLabel: DecisivenessLabel;
  stabilityLabel: StabilityLabel;
  avoidanceLabel: AvoidanceLabel;
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function avgNullable(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null);
  return valid.length > 0 ? avg(valid) : null;
}

export function summarizeBehavioralProfile(
  interactions: Interaction[],
): BehavioralSummary | null {
  const withMeta = interactions.filter(
    (i) => i.behavioral_metadata != null,
  );
  if (withMeta.length < 3) return null;

  const metas = withMeta.map((i) => i.behavioral_metadata!);

  const avgConf = avg(metas.map((m) => m.confidence_signal));
  const avgImp = avg(metas.map((m) => m.impulsivity_signal));
  const avgDel = avg(metas.map((m) => m.deliberation_signal));
  const avgAvoid = avg(metas.map((m) => m.avoidance_signal));
  const avgInst = avg(metas.map((m) => m.instability_signal));
  const avgFric = avg(metas.map((m) => m.emotional_friction_signal));
  const avgContr = avg(metas.map((m) => m.contradiction_signal));

  const totalChanges = metas.reduce((sum, m) => sum + (m.was_answer_changed ? 1 : 0), 0);
  const totalUndos = metas.reduce((sum, m) => sum + (m.was_undone ? 1 : 0), 0);
  const totalSkips = withMeta.reduce((sum, i) => sum + (i.skipped ? 1 : 0), 0);
  const avgResp = avg(withMeta.map((i) => i.response_time_ms));
  const avgFirst = avgNullable(metas.map((m) => m.first_reaction_time_ms));
  const avgHes = avgNullable(metas.map((m) => m.hesitation_time_ms));

  let decisivenessLabel: DecisivenessLabel;
  if (avgImp > 65) decisivenessLabel = 'impulsive';
  else if (avgConf > 60 && avgDel < 40) decisivenessLabel = 'decisive';
  else if (avgDel > 55) decisivenessLabel = 'deliberate';
  else decisivenessLabel = 'hesitant';

  let stabilityLabel: StabilityLabel;
  if (avgInst > 50) stabilityLabel = 'volatile';
  else if (avgInst > 25) stabilityLabel = 'uncertain';
  else stabilityLabel = 'stable';

  let avoidanceLabel: AvoidanceLabel;
  if (avgAvoid > 50) avoidanceLabel = 'avoidant';
  else if (avgAvoid > 20) avoidanceLabel = 'selective';
  else avoidanceLabel = 'direct';

  return {
    sampleSize: withMeta.length,
    avgResponseTimeMs: Math.round(avgResp),
    avgFirstReactionMs: avgFirst !== null ? Math.round(avgFirst) : null,
    avgHesitationMs: avgHes !== null ? Math.round(avgHes) : null,
    avgConfidenceSignal: Math.round(avgConf),
    avgAvoidanceSignal: Math.round(avgAvoid),
    avgImpulsivitySignal: Math.round(avgImp),
    avgDeliberationSignal: Math.round(avgDel),
    avgInstabilitySignal: Math.round(avgInst),
    avgEmotionalFrictionSignal: Math.round(avgFric),
    avgContradictionSignal: Math.round(avgContr),
    totalAnswerChanges: totalChanges,
    totalUndos,
    totalSkips,
    decisivenessLabel,
    stabilityLabel,
    avoidanceLabel,
  };
}
