import { describe, it, expect } from 'vitest';
import { computeHiddenParameters } from '../hiddenParameters';
import { computeEmergingArchetype } from '../emergingArchetype';
import { computeContradiction } from '../contradictionEngine';
import { computeCanonicalHP } from '../canonicalHP';
import type { BehavioralSummary } from '../../utils/behavioralSignals';
import type { Interaction, ReturnToSessionEvent, BehavioralMetadata } from '../../types';
import { emptyCanonicalVector } from '../../utils/canonicalVector';

// ─── Factories ────────────────────────────────────────────────────────────────

function makeMeta(overrides: Partial<BehavioralMetadata> = {}): BehavioralMetadata {
  return {
    first_reaction_time_ms: 800,
    hesitation_time_ms: 200,
    was_answer_changed: false,
    was_undone: false,
    returned_to_question: false,
    confidence_signal: 70,
    avoidance_signal: 20,
    impulsivity_signal: 65,
    deliberation_signal: 20,
    instability_signal: 10,
    emotional_friction_signal: 5,
    contradiction_signal: 5,
    ...overrides,
  };
}

function makeInteraction(overrides: Partial<Interaction> = {}): Interaction {
  return {
    content_id: 'q1',
    selected_answer: 'A',
    response_time_ms: 2000,
    answer_changes_count: 0,
    skipped: false,
    created_at: new Date().toISOString(),
    rarity_tier: 'standard',
    content_type: 'test',
    behavioral_metadata: makeMeta(),
    ...overrides,
  };
}

function makeReturnEvent(overrides: Partial<ReturnToSessionEvent> = {}): ReturnToSessionEvent {
  return {
    event_type: 'return_to_session',
    timestamp: new Date().toISOString(),
    time_away_ms: 60000,
    same_question_restored: true,
    session_depth_at_return: 5,
    ...overrides,
  };
}

// A behavioral summary with decisive, open, consistent profile
function makeSummary(overrides: Partial<BehavioralSummary> = {}): BehavioralSummary {
  return {
    sampleSize: 10,
    avgResponseTimeMs: 2500,
    avgFirstReactionMs: 800,
    avgHesitationMs: 300,
    avgConfidenceSignal: 72,
    avgAvoidanceSignal: 18,
    avgImpulsivitySignal: 65,
    avgDeliberationSignal: 22,
    avgInstabilitySignal: 10,
    avgEmotionalFrictionSignal: 8,
    avgContradictionSignal: 12,
    totalAnswerChanges: 1,
    totalUndos: 0,
    totalSkips: 0,
    totalSwaps: 0,
    totalExits: 0,
    skipRatePercent: 0,
    mostSkippedCategory: null,
    mostSkippedAxis: null,
    decisivenessLabel: 'decisive',
    stabilityLabel: 'stable',
    avoidanceLabel: 'direct',
    ...overrides,
  };
}

// Build N answered interactions
function makeInteractions(n: number, overrides: Partial<Interaction> = {}): Interaction[] {
  return Array.from({ length: n }, (_, i) =>
    makeInteraction({ content_id: `q${i + 1}`, ...overrides })
  );
}

// ─── Version ──────────────────────────────────────────────────────────────────

describe('hiddenParameters', () => {

  it('returns version stage6_hidden_parameters_engine_v1', () => {
    const result = computeHiddenParameters(null, [], [], null);
    expect(result.version).toBe('stage6_hidden_parameters_engine_v1');
  });

  // ── Display thresholds ─────────────────────────────────────────────────────

  it('is_displayable=false and safe_text empty at 0 answers', () => {
    const result = computeHiddenParameters(null, [], [], null);
    expect(result.is_displayable).toBe(false);
    expect(result.safe_text_en).toBe('');
    expect(result.safe_text_pl).toBe('');
  });

  it('is_displayable=false at 4 answered interactions', () => {
    const interactions = makeInteractions(4);
    const result = computeHiddenParameters(makeSummary({ sampleSize: 4 }), interactions, [], null);
    expect(result.is_displayable).toBe(false);
    expect(result.safe_text_en).toBe('');
  });

  it('is_sufficient=false when answerCount < 5', () => {
    const interactions = makeInteractions(4);
    const result = computeHiddenParameters(makeSummary({ sampleSize: 4 }), interactions, [], null);
    expect(result.is_sufficient).toBe(false);
  });

  it('is_sufficient=true at 5+ answers, is_displayable=false (below 12)', () => {
    const interactions = makeInteractions(8);
    const summary = makeSummary({ sampleSize: 8 });
    const result = computeHiddenParameters(summary, interactions, [], null);
    expect(result.is_sufficient).toBe(true);
    expect(result.is_displayable).toBe(false);
    expect(result.safe_text_en).toBe('');
  });

  it('is_displayable=false at 11 answers (one below threshold)', () => {
    const interactions = makeInteractions(11);
    const summary = makeSummary({ sampleSize: 11 });
    const result = computeHiddenParameters(summary, interactions, [], null);
    expect(result.is_displayable).toBe(false);
    expect(result.safe_text_en).toBe('');
  });

  it('is_displayable=true at 12+ answers with sufficient data', () => {
    const interactions = makeInteractions(12);
    const summary = makeSummary({ sampleSize: 12 });
    const result = computeHiddenParameters(summary, interactions, [], null);
    expect(result.is_displayable).toBe(true);
    expect(result.safe_text_en).not.toBe('');
    expect(result.safe_text_pl).not.toBe('');
  });

  it('is_displayable=true at 17 answers', () => {
    const interactions = makeInteractions(17);
    const summary = makeSummary({ sampleSize: 17 });
    const result = computeHiddenParameters(summary, interactions, [], null);
    expect(result.is_displayable).toBe(true);
  });

  // ── Safe copy ──────────────────────────────────────────────────────────────

  it('safe_text_en at 12 answers uses hedged language', () => {
    const interactions = makeInteractions(12);
    const summary = makeSummary({ sampleSize: 12 });
    const result = computeHiddenParameters(summary, interactions, [], null);
    const hedgeWords = ['starting', 'appearing', 'beginning', 'pattern', 'trace'];
    const hasHedge = hedgeWords.some((w) => result.safe_text_en.toLowerCase().includes(w));
    expect(hasHedge).toBe(true);
  });

  it('safe_text_en does not contain "you are" or "you\'re"', () => {
    const interactions = makeInteractions(20);
    const summary = makeSummary({ sampleSize: 20 });
    const result = computeHiddenParameters(summary, interactions, [], null);
    expect(result.safe_text_en.toLowerCase()).not.toMatch(/you are|you're/);
  });

  it('safe_text_en contains no HP dimension names (confidence/openness/consistency/directness/stability)', () => {
    const interactions = makeInteractions(20);
    const summary = makeSummary({ sampleSize: 20 });
    const result = computeHiddenParameters(summary, interactions, [], null);
    const text = result.safe_text_en.toLowerCase();
    // safe_text is intentionally generic — it must not name specific HP dimensions
    expect(text).not.toContain('confidence');
    expect(text).not.toContain('openness');
    expect(text).not.toContain('consistency');
    expect(text).not.toContain('directness');
    expect(text).not.toContain('stability');
  });

  it('safe_text_pl is non-empty at 12+ answers', () => {
    const interactions = makeInteractions(15);
    const summary = makeSummary({ sampleSize: 15 });
    const result = computeHiddenParameters(summary, interactions, [], null);
    expect(result.safe_text_pl).not.toBe('');
  });

  // ── All 5 dimensions present ───────────────────────────────────────────────

  it('result contains all 5 required dimensions', () => {
    const interactions = makeInteractions(12);
    const summary = makeSummary({ sampleSize: 12 });
    const result = computeHiddenParameters(summary, interactions, [], null);
    expect(result.confidence).toBeDefined();
    expect(result.openness).toBeDefined();
    expect(result.consistency).toBeDefined();
    expect(result.directness).toBeDefined();
    expect(result.stability).toBeDefined();
  });

  it('all dimension scores are in 0–100 range', () => {
    const interactions = makeInteractions(12);
    const summary = makeSummary({ sampleSize: 12 });
    const result = computeHiddenParameters(summary, interactions, [], null);
    for (const dim of [result.confidence, result.openness, result.consistency, result.directness, result.stability]) {
      expect(dim.score).toBeGreaterThanOrEqual(0);
      expect(dim.score).toBeLessThanOrEqual(100);
    }
  });

  it('all dimension labels are one of low/mixed/high', () => {
    const interactions = makeInteractions(12);
    const summary = makeSummary({ sampleSize: 12 });
    const result = computeHiddenParameters(summary, interactions, [], null);
    const valid: string[] = ['low', 'mixed', 'high'];
    for (const dim of [result.confidence, result.openness, result.consistency, result.directness, result.stability]) {
      expect(valid).toContain(dim.label);
    }
  });

  it('raw_hp contains HP01–HP05 when data is sufficient', () => {
    const interactions = makeInteractions(12);
    const summary = makeSummary({ sampleSize: 12 });
    const result = computeHiddenParameters(summary, interactions, [], null);
    expect(result.raw_hp).not.toBeNull();
    expect(result.raw_hp?.HP01).toBeDefined();
    expect(result.raw_hp?.HP02).toBeDefined();
    expect(result.raw_hp?.HP03).toBeDefined();
    expect(result.raw_hp?.HP04).toBeDefined();
    expect(result.raw_hp?.HP05).toBeDefined();
  });

  it('raw_hp values are in -100..100 range', () => {
    const interactions = makeInteractions(12);
    const summary = makeSummary({ sampleSize: 12 });
    const result = computeHiddenParameters(summary, interactions, [], null);
    const hp = result.raw_hp!;
    for (const val of [hp.HP01, hp.HP02, hp.HP03, hp.HP04, hp.HP05]) {
      expect(val).toBeGreaterThanOrEqual(-100);
      expect(val).toBeLessThanOrEqual(100);
      expect(Number.isNaN(val)).toBe(false);
    }
  });

  // ── Determinism ────────────────────────────────────────────────────────────

  it('same inputs always produce same output (deterministic)', () => {
    const interactions = makeInteractions(15);
    const summary = makeSummary({ sampleSize: 15 });
    const r1 = computeHiddenParameters(summary, interactions, [], null);
    const r2 = computeHiddenParameters(summary, interactions, [], null);
    expect(r1.confidence.score).toBe(r2.confidence.score);
    expect(r1.openness.score).toBe(r2.openness.score);
    expect(r1.consistency.score).toBe(r2.consistency.score);
    expect(r1.directness.score).toBe(r2.directness.score);
    expect(r1.stability.score).toBe(r2.stability.score);
    expect(r1.raw_hp?.HP01).toBe(r2.raw_hp?.HP01);
    expect(r1.safe_text_en).toBe(r2.safe_text_en);
    expect(r1.is_displayable).toBe(r2.is_displayable);
  });

  // ── Malformed / edge data ──────────────────────────────────────────────────

  it('handles null behavioral summary gracefully', () => {
    const result = computeHiddenParameters(null, [], [], null);
    expect(result).toBeDefined();
    expect(result.version).toBe('stage6_hidden_parameters_engine_v1');
    expect(result.is_sufficient).toBe(false);
    expect(result.is_displayable).toBe(false);
    expect(result.raw_hp).toBeNull();
  });

  it('handles empty interactions with sufficient behavioral summary', () => {
    const summary = makeSummary({ sampleSize: 3 }); // behavioral has data but no answered interactions
    const result = computeHiddenParameters(summary, [], [], null);
    expect(result.answer_count).toBe(0);
    expect(result.is_sufficient).toBe(false);
    expect(result.is_displayable).toBe(false);
  });

  it('skipped interactions do not count toward answer_count', () => {
    const skipped = makeInteractions(10, { skipped: true });
    const answered = makeInteractions(5, { skipped: false });
    const result = computeHiddenParameters(makeSummary(), [...skipped, ...answered], [], null);
    expect(result.answer_count).toBe(5);
  });

  it('handles interactions with no behavioral_metadata', () => {
    const interactions = makeInteractions(12, { behavioral_metadata: null });
    const summary = makeSummary({ sampleSize: 12 });
    const result = computeHiddenParameters(summary, interactions, [], null);
    expect(result).toBeDefined();
    expect(Number.isNaN(result.confidence.score)).toBe(false);
  });

  // ── Latency / answer-change behavior ──────────────────────────────────────

  it('high latency and many changes push confidence toward low (hesitant)', () => {
    const hesitantSummary = makeSummary({
      sampleSize: 12,
      avgConfidenceSignal: 20,
      avgHesitationMs: 8000,
      totalAnswerChanges: 8,
      totalExits: 3,
    });
    const interactions = makeInteractions(12, { answer_changes_count: 2, response_time_ms: 15000 });
    const result = computeHiddenParameters(hesitantSummary, interactions, [], null);
    expect(result.confidence.score).toBeLessThan(50);
    expect(result.raw_hp?.HP01).toBeLessThan(0);
  });

  it('fast responses and few changes push confidence toward high (decisive)', () => {
    const decisiveSummary = makeSummary({
      sampleSize: 12,
      avgConfidenceSignal: 80,
      avgHesitationMs: 100,
      totalAnswerChanges: 0,
      totalExits: 0,
    });
    const interactions = makeInteractions(12, { answer_changes_count: 0, response_time_ms: 1200 });
    const result = computeHiddenParameters(decisiveSummary, interactions, [], null);
    expect(result.confidence.score).toBeGreaterThan(50);
    expect(result.raw_hp?.HP01).toBeGreaterThan(0);
  });

  it('many skips push openness toward low (guarded)', () => {
    const guardedSummary = makeSummary({
      sampleSize: 12,
      avgAvoidanceSignal: 65,
      skipRatePercent: 40,
      totalSkips: 8,
    });
    const interactions = makeInteractions(12, { skipped: false });
    const result = computeHiddenParameters(guardedSummary, interactions, [], null);
    expect(result.openness.score).toBeLessThan(50);
    expect(result.raw_hp?.HP02).toBeLessThan(0);
  });

  it('fast first reactions push directness toward high', () => {
    const directSummary = makeSummary({
      sampleSize: 12,
      avgImpulsivitySignal: 80,
      avgDeliberationSignal: 10,
      avgFirstReactionMs: 500,
    });
    const interactions = makeInteractions(12, {
      behavioral_metadata: makeMeta({ first_reaction_time_ms: 500, impulsivity_signal: 80, deliberation_signal: 10 }),
    });
    const result = computeHiddenParameters(directSummary, interactions, [], null);
    expect(result.directness.score).toBeGreaterThan(50);
    expect(result.raw_hp?.HP04).toBeGreaterThan(0);
  });

  it('slow first reactions and high deliberation push directness toward low (reflective)', () => {
    const reflectiveSummary = makeSummary({
      sampleSize: 12,
      avgImpulsivitySignal: 10,
      avgDeliberationSignal: 80,
      avgFirstReactionMs: 7000,
    });
    const interactions = makeInteractions(12, {
      behavioral_metadata: makeMeta({ first_reaction_time_ms: 7000, impulsivity_signal: 10, deliberation_signal: 80 }),
    });
    const result = computeHiddenParameters(reflectiveSummary, interactions, [], null);
    expect(result.directness.score).toBeLessThan(50);
    expect(result.raw_hp?.HP04).toBeLessThan(0);
  });

  it('many swaps and exits push stability toward low (exploratory)', () => {
    const exploratorySummary = makeSummary({
      sampleSize: 12,
      totalSwaps: 4,
      totalExits: 3,
      avgInstabilitySignal: 45,
      stabilityLabel: 'volatile',
    });
    const interactions = makeInteractions(12);
    const result = computeHiddenParameters(exploratorySummary, interactions, [], null);
    expect(result.stability.score).toBeLessThan(50);
    expect(result.raw_hp?.HP05).toBeLessThan(0);
  });

  it('stable label and return events push stability toward high', () => {
    const stableSummary = makeSummary({
      sampleSize: 12,
      totalSwaps: 0,
      totalExits: 0,
      avgInstabilitySignal: 5,
      stabilityLabel: 'stable',
    });
    const returnEvents = [makeReturnEvent(), makeReturnEvent()];
    const interactions = makeInteractions(12);
    const result = computeHiddenParameters(stableSummary, interactions, returnEvents, null);
    expect(result.stability.score).toBeGreaterThan(50);
    expect(result.raw_hp?.HP05).toBeGreaterThan(0);
  });

  // ── Contradiction engine integration ───────────────────────────────────────

  it('high contradiction score reduces consistency score', () => {
    const summary = makeSummary({ sampleSize: 12, avgContradictionSignal: 60 });
    const interactions = makeInteractions(12);
    const mockContradiction = {
      version: 'stage4_contradiction_engine_v1' as const,
      contradiction_score: 75,
      consistency_score: 25,
      level: 'high' as const,
      primary_axis: 'AX01',
      signals: ['answer_revision' as const, 'opposite_axis_movement' as const] as import('../contradictionEngine').ContradictionSignal[],
      signal_counts: { answer_revision: 3, latency_spike: 0, opposite_axis_movement: 2, skip_sensitive: 0, return_to_question: 0, reverse_pair_mismatch: 0 },
      user_facing_summary: 'test',
      safe_text_en: 'test',
      safe_text_pl: 'test',
      debug_evidence: {} as Record<string, unknown>,
    };
    const result = computeHiddenParameters(summary, interactions, [], mockContradiction);
    expect(result.consistency.score).toBeLessThan(50);
  });

  // ── answer_count in result ─────────────────────────────────────────────────

  it('answer_count reflects only non-skipped interactions', () => {
    const skipped = makeInteractions(3, { skipped: true });
    const answered = makeInteractions(12, { skipped: false });
    const summary = makeSummary({ sampleSize: 12 });
    const result = computeHiddenParameters(summary, [...skipped, ...answered], [], null);
    expect(result.answer_count).toBe(12);
  });

  // ── Stage 3/4/5 regression safety ─────────────────────────────────────────

  it('Stage 3 — computeEmergingArchetype still returns version stage5_emerging_archetype_v1', () => {
    const cv = emptyCanonicalVector();
    const result = computeEmergingArchetype(cv, 0);
    expect(result.version).toBe('stage5_emerging_archetype_v1');
  });

  it('Stage 4 — computeContradiction still returns version stage4_contradiction_engine_v1', () => {
    const cv = emptyCanonicalVector();
    const result = computeContradiction([], [], [], [], cv, []);
    expect(result.version).toBe('stage4_contradiction_engine_v1');
  });

  it('Stage 5 — emergingArchetype is_displayable still false at 11 answers', () => {
    const cv = { ...emptyCanonicalVector(), AX01: 20, AX06: 18 };
    const result = computeEmergingArchetype(cv, 11);
    expect(result.is_displayable).toBe(false);
  });

  it('Stage 5 — emergingArchetype confidence progression unchanged', () => {
    const cv = { ...emptyCanonicalVector(), AX01: 20 };
    expect(computeEmergingArchetype(cv, 10).confidence).toBe('very_low');
    expect(computeEmergingArchetype(cv, 25).confidence).toBe('low');
    expect(computeEmergingArchetype(cv, 40).confidence).toBe('forming');
    expect(computeEmergingArchetype(cv, 75).confidence).toBe('stable');
    expect(computeEmergingArchetype(cv, 110).confidence).toBe('strong');
  });

  // ── canonicalHP.ts — HP04/HP05 direction correctness ─────────────────────

  it('canonicalHP HP04 is positive for highly impulsive profile', () => {
    const summary = makeSummary({
      sampleSize: 10,
      avgImpulsivitySignal: 85,
      avgDeliberationSignal: 5,
      avgFirstReactionMs: 400,
      avgInstabilitySignal: 5,
      totalAnswerChanges: 0,
    });
    const hp = computeCanonicalHP(summary, []);
    expect(hp).not.toBeNull();
    expect(hp!.HP04).toBeGreaterThan(0);
  });

  it('canonicalHP HP04 is negative for highly deliberative profile', () => {
    const summary = makeSummary({
      sampleSize: 10,
      avgImpulsivitySignal: 5,
      avgDeliberationSignal: 85,
      avgFirstReactionMs: 8000,
      avgInstabilitySignal: 5,
      totalAnswerChanges: 0,
    });
    const hp = computeCanonicalHP(summary, []);
    expect(hp).not.toBeNull();
    expect(hp!.HP04).toBeLessThan(0);
  });

  it('canonicalHP HP05 is positive for stable, no-swap profile', () => {
    const summary = makeSummary({
      sampleSize: 10,
      totalSwaps: 0,
      totalExits: 0,
      avgInstabilitySignal: 5,
      stabilityLabel: 'stable',
    });
    const hp = computeCanonicalHP(summary, [makeReturnEvent()]);
    expect(hp).not.toBeNull();
    expect(hp!.HP05).toBeGreaterThan(0);
  });

  it('canonicalHP HP05 is negative for exploratory, high-swap profile', () => {
    const summary = makeSummary({
      sampleSize: 10,
      totalSwaps: 5,
      totalExits: 4,
      avgInstabilitySignal: 55,
      stabilityLabel: 'volatile',
    });
    const hp = computeCanonicalHP(summary, []);
    expect(hp).not.toBeNull();
    expect(hp!.HP05).toBeLessThan(0);
  });

  it('canonicalHP returns null when sampleSize < 3', () => {
    const summary = makeSummary({ sampleSize: 2 });
    const hp = computeCanonicalHP(summary, []);
    expect(hp).toBeNull();
  });

  it('canonicalHP handles null behavioral', () => {
    const hp = computeCanonicalHP(null, []);
    expect(hp).toBeNull();
  });

  it('all HP raw values are finite numbers', () => {
    const summary = makeSummary({ sampleSize: 10 });
    const hp = computeCanonicalHP(summary, []);
    expect(hp).not.toBeNull();
    for (const val of [hp!.HP01, hp!.HP02, hp!.HP03, hp!.HP04, hp!.HP05]) {
      expect(Number.isFinite(val)).toBe(true);
    }
  });

  // ── Evidence tracking ──────────────────────────────────────────────────────

  it('evidence array is present on all dimensions', () => {
    const interactions = makeInteractions(12);
    const summary = makeSummary({ sampleSize: 12 });
    const result = computeHiddenParameters(summary, interactions, [], null);
    for (const dim of [result.confidence, result.openness, result.consistency, result.directness, result.stability]) {
      expect(Array.isArray(dim.evidence)).toBe(true);
    }
  });

  it('return events appear in stability evidence', () => {
    const interactions = makeInteractions(12);
    const summary = makeSummary({ sampleSize: 12 });
    const returnEvents = [makeReturnEvent(), makeReturnEvent()];
    const result = computeHiddenParameters(summary, interactions, returnEvents, null);
    const stabilityEvidence = result.stability.evidence.join(' ');
    expect(stabilityEvidence).toContain('resumed');
  });

  it('many answer revisions appear in confidence evidence', () => {
    const interactions = makeInteractions(12, { answer_changes_count: 2 });
    const summary = makeSummary({ sampleSize: 12, totalAnswerChanges: 8 });
    const result = computeHiddenParameters(summary, interactions, [], null);
    const hasRevisionEvidence = result.confidence.evidence.some((e) => e.includes('revision'));
    expect(hasRevisionEvidence).toBe(true);
  });

});
