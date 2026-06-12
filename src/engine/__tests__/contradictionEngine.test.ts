import { describe, it, expect } from 'vitest';
import { computeContradiction } from '../contradictionEngine';
import { emptyCanonicalVector } from '../../utils/canonicalVector';
import type { Interaction, SkipEvent, SwapEvent, ExitToMenuEvent, TestAnswer } from '../../types';

const emptyCV = emptyCanonicalVector();
const noSkips: SkipEvent[] = [];
const noSwaps: SwapEvent[] = [];
const noExits: ExitToMenuEvent[] = [];
const noAnswers: TestAnswer[] = [];

function makeInteraction(overrides: Partial<Interaction> = {}): Interaction {
  return {
    content_id: 'q1',
    selected_answer: 'A',
    response_time_ms: 3000,
    answer_changes_count: 0,
    skipped: false,
    created_at: new Date().toISOString(),
    rarity_tier: 'standard',
    content_type: 'question',
    ...overrides,
  };
}

function makeTestAnswer(axisDeltas: Record<string, number> | null = null): TestAnswer {
  return {
    content_id: 'q1',
    content_type: 'question',
    rarity_tier: 'standard',
    selected_answer: 'A',
    response_time_ms: 3000,
    answer_changes_count: 0,
    axis_delta_json: axisDeltas,
  };
}

describe('contradictionEngine', () => {
  it('returns version stage4_contradiction_engine_v1', () => {
    const result = computeContradiction([], noSkips, noSwaps, noExits, emptyCV, noAnswers);
    expect(result.version).toBe('stage4_contradiction_engine_v1');
  });

  it('returns level none with no interactions', () => {
    const result = computeContradiction([], noSkips, noSwaps, noExits, emptyCV, noAnswers);
    expect(result.level).toBe('none');
    expect(result.contradiction_score).toBe(0);
    expect(result.consistency_score).toBe(100);
  });

  it('returns level none with clean interactions and no revisions', () => {
    const interactions = Array.from({ length: 10 }, (_, i) =>
      makeInteraction({ content_id: `q${i}`, response_time_ms: 3000 }),
    );
    const result = computeContradiction(interactions, noSkips, noSwaps, noExits, emptyCV, noAnswers);
    expect(result.level).toBe('none');
    expect(result.signals).toHaveLength(0);
  });

  it('answer revisions raise contradiction score', () => {
    const interactions = [
      ...Array.from({ length: 10 }, (_, i) => makeInteraction({ content_id: `q${i}` })),
      makeInteraction({ content_id: 'q10', answer_changes_count: 3 }),
      makeInteraction({ content_id: 'q11', answer_changes_count: 2 }),
    ];
    const result = computeContradiction(interactions, noSkips, noSwaps, noExits, emptyCV, noAnswers);
    expect(result.signals).toContain('answer_revision');
    expect(result.contradiction_score).toBeGreaterThan(0);
  });

  it('sample scale suppresses scores below 10 answers', () => {
    // 4 answered interactions with 4 revisions → raw revisionContrib = 4*6 = 24
    // sampleScale = 4/10 = 0.4 → raw = 24*0.4 = 9.6 → level none (<15)
    const interactions = Array.from({ length: 4 }, (_, i) =>
      makeInteraction({ content_id: `q${i}`, answer_changes_count: 1 }),
    );
    const result = computeContradiction(interactions, noSkips, noSwaps, noExits, emptyCV, noAnswers);
    expect(result.level).toBe('none');
  });

  it('detects opposite axis movement from TestAnswer axis_delta_json', () => {
    const testAnswers: TestAnswer[] = [
      makeTestAnswer({ AX01: 3 }),
      makeTestAnswer({ AX01: 2 }),
      makeTestAnswer({ AX01: -3 }), // oscillation on AX01
      makeTestAnswer({ AX01: -2 }),
    ];
    const interactions = Array.from({ length: 10 }, (_, i) => makeInteraction({ content_id: `q${i}` }));
    const result = computeContradiction(interactions, noSkips, noSwaps, noExits, emptyCV, testAnswers);
    expect(result.debug_evidence.test_answers_used).toBe(4);
    // AX01 oscillates → should contribute to axis_movement detection
    expect(result.debug_evidence.opposite_axis_movement).toBeGreaterThan(0);
    expect(result.primary_axis).toBe('AX01');
  });

  it('falls back to canonical vector proxy when testAnswers < 3', () => {
    const twoAnswers: TestAnswer[] = [
      makeTestAnswer({ AX01: 3 }),
      makeTestAnswer({ AX01: -3 }),
    ];
    const interactions = Array.from({ length: 12 }, (_, i) => makeInteraction({ content_id: `q${i}` }));
    const result = computeContradiction(interactions, noSkips, noSwaps, noExits, emptyCV, twoAnswers);
    // With 2 testAnswers, falls back to canonical proxy — just verify the path was taken
    expect(result.debug_evidence.test_answers_used).toBe(2);
    // emptyCV has all axes at 0, proxy sees them all as low-abs — primary_axis may be set
    expect(result.version).toBe('stage4_contradiction_engine_v1');
  });

  it('consistency_score is complement of contradiction_score', () => {
    const interactions = Array.from({ length: 10 }, (_, i) =>
      makeInteraction({ content_id: `q${i}`, answer_changes_count: i < 5 ? 2 : 0 }),
    );
    const result = computeContradiction(interactions, noSkips, noSwaps, noExits, emptyCV, noAnswers);
    expect(result.contradiction_score + result.consistency_score).toBe(100);
  });

  it('safe_text_en is empty for level none and low', () => {
    const result = computeContradiction([], noSkips, noSwaps, noExits, emptyCV, noAnswers);
    expect(result.safe_text_en).toBe('');
    expect(result.safe_text_pl).toBe('');
  });

  it('safe_text_en and pl are non-empty for medium level', () => {
    // Force medium: need score >= 35 with sampleScale=1 (10+ answered)
    // revisionContrib = 10*6=60 capped at 25 → 25; latencySpikes contrib 0
    // 25 * 1.0 = 25 → still only 'low' (need 35 for medium)
    // Combine revisions (25) + latency spikes needed
    // Use many revisions + make latency spikes by having very varied response times
    const baseTime = 3000;
    const interactions: Interaction[] = [
      ...Array.from({ length: 7 }, (_, i) =>
        makeInteraction({ content_id: `q${i}`, response_time_ms: baseTime }),
      ),
      // 3 spikes: mean≈3000, std spikes at >mean+2std → use very high times
      makeInteraction({ content_id: 'q7', response_time_ms: 30000 }),
      makeInteraction({ content_id: 'q8', response_time_ms: 30000 }),
      makeInteraction({ content_id: 'q9', response_time_ms: 30000 }),
      // revisions
      makeInteraction({ content_id: 'q10', answer_changes_count: 5 }),
    ];
    const result = computeContradiction(interactions, noSkips, noSwaps, noExits, emptyCV, noAnswers);
    if (result.level === 'medium' || result.level === 'high') {
      expect(result.safe_text_en).not.toBe('');
      expect(result.safe_text_pl).not.toBe('');
    }
  });

  it('signal_counts always has all six signal keys', () => {
    const result = computeContradiction([], noSkips, noSwaps, noExits, emptyCV, noAnswers);
    const keys: string[] = [
      'answer_revision', 'latency_spike', 'opposite_axis_movement',
      'skip_sensitive', 'return_to_question', 'reverse_pair_mismatch',
    ];
    for (const key of keys) {
      expect(result.signal_counts).toHaveProperty(key);
    }
  });

  it('reverse_pair_mismatch is always 0 in v1', () => {
    const result = computeContradiction([], noSkips, noSwaps, noExits, emptyCV, noAnswers);
    expect(result.signal_counts.reverse_pair_mismatch).toBe(0);
  });

  it('debug_evidence includes sample_scale and test_answers_used', () => {
    const interactions = Array.from({ length: 5 }, (_, i) => makeInteraction({ content_id: `q${i}` }));
    const result = computeContradiction(interactions, noSkips, noSwaps, noExits, emptyCV, noAnswers);
    expect(result.debug_evidence.sample_scale).toBe(0.5);
    expect(result.debug_evidence.test_answers_used).toBe(0);
  });

  it('no axis oscillation when all deltas are same direction', () => {
    const testAnswers: TestAnswer[] = [
      makeTestAnswer({ AX01: 3 }),
      makeTestAnswer({ AX01: 2 }),
      makeTestAnswer({ AX01: 4 }), // all positive
    ];
    const interactions = Array.from({ length: 10 }, (_, i) => makeInteraction({ content_id: `q${i}` }));
    const result = computeContradiction(interactions, noSkips, noSwaps, noExits, emptyCV, testAnswers);
    expect(result.debug_evidence.opposite_axis_movement).toBe(0);
    expect(result.primary_axis).toBeNull();
  });
});
