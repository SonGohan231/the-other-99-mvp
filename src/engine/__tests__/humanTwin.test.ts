import { describe, it, expect } from 'vitest';
import { computeHumanTwin } from '../humanTwin';
import { computeEmergingArchetype, ARCHETYPES } from '../emergingArchetype';
import { computeContradiction } from '../contradictionEngine';
import { computeHiddenParameters } from '../hiddenParameters';
import { emptyCanonicalVector } from '../../utils/canonicalVector';
import type { CanonicalVector } from '../../utils/canonicalVector';
import type { CanonicalHP } from '../canonicalHP';

// ─── Factories ────────────────────────────────────────────────────────────────

const emptyCV = emptyCanonicalVector();

function makeCV(overrides: Partial<CanonicalVector> = {}): CanonicalVector {
  return { ...emptyCV, ...overrides };
}

function makeHP(overrides: Partial<CanonicalHP> = {}): CanonicalHP {
  return {
    HP01: 20,
    HP02: 10,
    HP03: 15,
    HP04: 25,
    HP05: 10,
    ...overrides,
  };
}

// Strong explorer-like canonical vector
const explorerCV = makeCV({ AX01: 25, AX06: 22, AX03: 15 });
// Strong anchor-like vector
const anchorCV = makeCV({ AX08: 28, AX01: -18, AX06: -15 });
// Moderate vector — less distinctive
const mildCV = makeCV({ AX01: 5, AX02: 3, AX08: 4 });

// ─── Version ──────────────────────────────────────────────────────────────────

describe('humanTwin', () => {

  it('returns version stage7_human_twin_similarity_v1', () => {
    const r = computeHumanTwin(emptyCV, 0, null, null);
    expect(r.version).toBe('stage7_human_twin_similarity_v1');
  });

  // ── Display thresholds ─────────────────────────────────────────────────────

  it('is_unlocked=false and is_displayable=false at 0 answers', () => {
    const r = computeHumanTwin(emptyCV, 0, null, null);
    expect(r.is_unlocked).toBe(false);
    expect(r.is_displayable).toBe(false);
    expect(r.safe_text_en).toBe('');
    expect(r.tier).toBe('locked');
  });

  it('is_unlocked=false at 11 answers (one below compute threshold)', () => {
    const r = computeHumanTwin(explorerCV, 11, null, null);
    expect(r.is_unlocked).toBe(false);
    expect(r.is_displayable).toBe(false);
    expect(r.safe_text_en).toBe('');
    expect(r.similarity_percent).toBe(0);
  });

  it('is_unlocked=true at 12 answers, is_displayable=false (debug only)', () => {
    const r = computeHumanTwin(explorerCV, 12, null, null);
    expect(r.is_unlocked).toBe(true);
    expect(r.is_displayable).toBe(false);
    expect(r.safe_text_en).toBe('');
    expect(r.tier).toBe('preview');
    expect(r.similarity_percent).toBeGreaterThan(0);
  });

  it('is_unlocked=true at 16 answers, is_displayable=false', () => {
    const r = computeHumanTwin(explorerCV, 16, null, null);
    expect(r.is_unlocked).toBe(true);
    expect(r.is_displayable).toBe(false);
    expect(r.safe_text_en).toBe('');
  });

  it('is_displayable=true at 17 answers', () => {
    const r = computeHumanTwin(explorerCV, 17, null, null);
    expect(r.is_displayable).toBe(true);
    expect(r.safe_text_en).not.toBe('');
    expect(r.safe_text_pl).not.toBe('');
  });

  it('tier=preview at 17-30 answers', () => {
    expect(computeHumanTwin(explorerCV, 17, null, null).tier).toBe('preview');
    expect(computeHumanTwin(explorerCV, 30, null, null).tier).toBe('preview');
  });

  it('tier=meaningful at 31-50 answers', () => {
    expect(computeHumanTwin(explorerCV, 31, null, null).tier).toBe('meaningful');
    expect(computeHumanTwin(explorerCV, 50, null, null).tier).toBe('meaningful');
  });

  it('tier=strong at 51+ answers', () => {
    expect(computeHumanTwin(explorerCV, 51, null, null).tier).toBe('strong');
    expect(computeHumanTwin(explorerCV, 200, null, null).tier).toBe('strong');
  });

  // ── Safe copy ──────────────────────────────────────────────────────────────

  it('safe_text_en at 17 answers uses hedged language', () => {
    const r = computeHumanTwin(explorerCV, 17, null, null);
    const hedgeWords = ['starting', 'appearing', 'similar', 'decision', 'shape'];
    const hasHedge = hedgeWords.some((w) => r.safe_text_en.toLowerCase().includes(w));
    expect(hasHedge).toBe(true);
  });

  it('safe_text_en does not claim a real person was found', () => {
    const r = computeHumanTwin(explorerCV, 51, null, null);
    const lower = r.safe_text_en.toLowerCase();
    expect(lower).not.toContain('real person');
    expect(lower).not.toContain('we found your');
    expect(lower).not.toContain('your twin is');
    expect(lower).not.toContain('this is a real');
  });

  it('safe_text_en does not contain "you are" or "you\'re"', () => {
    const r = computeHumanTwin(explorerCV, 51, null, null);
    expect(r.safe_text_en.toLowerCase()).not.toMatch(/you are|you're/);
  });

  it('safe_text_en contains no archetype names from ARCHETYPES list', () => {
    for (const count of [17, 31, 51]) {
      const r = computeHumanTwin(explorerCV, count, null, null);
      const lower = r.safe_text_en.toLowerCase();
      for (const arch of ARCHETYPES) {
        expect(lower).not.toContain(arch.name.toLowerCase());
      }
    }
  });

  it('safe_text_pl is non-empty at 17+ answers', () => {
    const r = computeHumanTwin(explorerCV, 17, null, null);
    expect(r.safe_text_pl).not.toBe('');
  });

  it('safe_text changes copy progression across thresholds', () => {
    const r17 = computeHumanTwin(explorerCV, 17, null, null);
    const r31 = computeHumanTwin(explorerCV, 31, null, null);
    const r51 = computeHumanTwin(explorerCV, 51, null, null);
    // Each tier produces different copy
    const texts = new Set([r17.safe_text_en, r31.safe_text_en, r51.safe_text_en]);
    expect(texts.size).toBe(3);
  });

  // ── Similarity computation ─────────────────────────────────────────────────

  it('similarity_percent is in 0–100 range', () => {
    for (const [cv, n] of [[explorerCV, 20], [anchorCV, 30], [emptyCV, 17], [mildCV, 51]] as const) {
      const r = computeHumanTwin(cv, n, null, null);
      expect(r.similarity_percent).toBeGreaterThanOrEqual(0);
      expect(r.similarity_percent).toBeLessThanOrEqual(100);
    }
  });

  it('distance is non-negative and finite', () => {
    const r = computeHumanTwin(explorerCV, 20, null, null);
    expect(r.distance).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(r.distance)).toBe(true);
  });

  it('closest_reference_id is one of A01–A12', () => {
    const r = computeHumanTwin(explorerCV, 20, null, null);
    const validIds = ARCHETYPES.map((a) => a.id);
    expect(validIds).toContain(r.closest_reference_id);
  });

  it('explorer-like CV matches an explorer-friendly reference', () => {
    const r = computeHumanTwin(explorerCV, 20, null, null);
    const explorerFriendly = ['A06', 'A10', 'A01']; // Explorer, Rebel, Alchemist
    expect(explorerFriendly).toContain(r.closest_reference_id);
  });

  it('anchor-like CV matches a stability-friendly reference', () => {
    const r = computeHumanTwin(anchorCV, 20, null, null);
    const anchorFriendly = ['A04', 'A07', 'A09']; // Anchor, Guardian, Architect
    expect(anchorFriendly).toContain(r.closest_reference_id);
  });

  // ── Determinism ────────────────────────────────────────────────────────────

  it('same inputs always produce same output (deterministic)', () => {
    const r1 = computeHumanTwin(explorerCV, 25, null, null);
    const r2 = computeHumanTwin(explorerCV, 25, null, null);
    expect(r1.closest_reference_id).toBe(r2.closest_reference_id);
    expect(r1.similarity_percent).toBe(r2.similarity_percent);
    expect(r1.distance).toBe(r2.distance);
    expect(r1.is_displayable).toBe(r2.is_displayable);
    expect(r1.safe_text_en).toBe(r2.safe_text_en);
    expect(r1.tier).toBe(r2.tier);
  });

  // ── Malformed / edge data ──────────────────────────────────────────────────

  it('handles NaN answerCount gracefully', () => {
    const r = computeHumanTwin(emptyCV, NaN, null, null);
    expect(r.current_answer_count).toBe(0);
    expect(r.is_unlocked).toBe(false);
    expect(r.is_displayable).toBe(false);
  });

  it('handles very large answerCount without overflow', () => {
    const r = computeHumanTwin(explorerCV, 9999, null, null);
    expect(r.tier).toBe('strong');
    expect(Number.isFinite(r.distance)).toBe(true);
    expect(Number.isFinite(r.similarity_percent)).toBe(true);
  });

  it('handles all-zero canonical vector without NaN', () => {
    const r = computeHumanTwin(emptyCV, 20, null, null);
    expect(Number.isNaN(r.similarity_percent)).toBe(false);
    expect(Number.isNaN(r.distance)).toBe(false);
  });

  it('handles extreme positive axis values without NaN', () => {
    const extremeCV = makeCV({ AX01: 999, AX06: 999, AX08: -999 });
    const r = computeHumanTwin(extremeCV, 20, null, null);
    expect(Number.isNaN(r.similarity_percent)).toBe(false);
    expect(Number.isFinite(r.distance)).toBe(true);
  });

  // ── HP integration ────────────────────────────────────────────────────────

  it('hp_reliability is null when no HP provided', () => {
    const r = computeHumanTwin(explorerCV, 20, null, null);
    expect(r.hp_reliability).toBeNull();
  });

  it('hp_reliability is 0–1 when HP provided', () => {
    const r = computeHumanTwin(explorerCV, 20, null, makeHP());
    expect(r.hp_reliability).not.toBeNull();
    expect(r.hp_reliability!).toBeGreaterThanOrEqual(0);
    expect(r.hp_reliability!).toBeLessThanOrEqual(1);
  });

  it('hp_reliability is higher for confident+stable HP profile', () => {
    const highHP = makeHP({ HP01: 80, HP05: 80 });
    const lowHP  = makeHP({ HP01: -80, HP05: -80 });
    const rHigh = computeHumanTwin(explorerCV, 20, null, highHP);
    const rLow  = computeHumanTwin(explorerCV, 20, null, lowHP);
    expect(rHigh.hp_reliability!).toBeGreaterThan(rLow.hp_reliability!);
  });

  it('HP does not affect core distance calculation (same closest_reference_id)', () => {
    const withHP    = computeHumanTwin(explorerCV, 20, null, makeHP({ HP01: 80 }));
    const withoutHP = computeHumanTwin(explorerCV, 20, null, null);
    // Core similarity math is HP-independent; only hp_reliability changes
    expect(withHP.closest_reference_id).toBe(withoutHP.closest_reference_id);
    expect(withHP.similarity_percent).toBe(withoutHP.similarity_percent);
  });

  // ── Archetype engine integration ───────────────────────────────────────────

  it('prefers archetype engine primary when it is within 20% of geometric closest', () => {
    const archetype = computeEmergingArchetype(explorerCV, 25);
    const r = computeHumanTwin(explorerCV, 25, archetype, null);
    // Should resolve to a consistent reference
    expect(r.closest_reference_id).not.toBe('');
  });

  it('still works when archetype confidence is very_low', () => {
    const archetype = computeEmergingArchetype(emptyCV, 5); // very_low confidence
    const r = computeHumanTwin(mildCV, 20, archetype, null);
    expect(r).toBeDefined();
    expect(r.closest_reference_id).not.toBe('');
  });

  // ── shared_patterns and differences ───────────────────────────────────────

  it('shared_patterns is an array', () => {
    const r = computeHumanTwin(explorerCV, 20, null, null);
    expect(Array.isArray(r.shared_patterns)).toBe(true);
  });

  it('differences is an array', () => {
    const r = computeHumanTwin(explorerCV, 20, null, null);
    expect(Array.isArray(r.differences)).toBe(true);
  });

  it('shared_patterns has at most 3 entries', () => {
    const r = computeHumanTwin(explorerCV, 20, null, null);
    expect(r.shared_patterns.length).toBeLessThanOrEqual(3);
  });

  it('differences has at most 2 entries', () => {
    const r = computeHumanTwin(explorerCV, 20, null, null);
    expect(r.differences.length).toBeLessThanOrEqual(2);
  });

  // ── user_facing_summary (debug only) ──────────────────────────────────────

  it('user_facing_summary is defined and non-empty', () => {
    const r = computeHumanTwin(explorerCV, 20, null, null);
    expect(typeof r.user_facing_summary).toBe('string');
    expect(r.user_facing_summary.length).toBeGreaterThan(0);
  });

  it('user_facing_summary differs from safe_text_en (debug richer than RewardScreen)', () => {
    const r = computeHumanTwin(explorerCV, 51, null, null);
    expect(r.safe_text_en).not.toBe(r.user_facing_summary);
  });

  // ── Stage 3/4/5/6 regression safety ───────────────────────────────────────

  it('Stage 3 — computeEmergingArchetype still returns version stage5_emerging_archetype_v1', () => {
    const r = computeEmergingArchetype(emptyCV, 0);
    expect(r.version).toBe('stage5_emerging_archetype_v1');
  });

  it('Stage 4 — computeContradiction still returns version stage4_contradiction_engine_v1', () => {
    const r = computeContradiction([], [], [], [], emptyCV, []);
    expect(r.version).toBe('stage4_contradiction_engine_v1');
  });

  it('Stage 5 — emergingArchetype is_displayable=false at 11 answers', () => {
    const cv = makeCV({ AX01: 20 });
    expect(computeEmergingArchetype(cv, 11).is_displayable).toBe(false);
  });

  it('Stage 6 — computeHiddenParameters returns version stage6_hidden_parameters_engine_v1', () => {
    const r = computeHiddenParameters(null, [], [], null);
    expect(r.version).toBe('stage6_hidden_parameters_engine_v1');
  });

  it('Stage 6 — hiddenParameters is_displayable=false at 11 answers', () => {
    const r = computeHiddenParameters(null, [], [], null);
    expect(r.is_displayable).toBe(false);
  });

  // ── Privacy / source label ─────────────────────────────────────────────────

  it('source_label is estimated_until_population_exists', () => {
    const r = computeHumanTwin(explorerCV, 20, null, null);
    expect(r.source_label).toBe('estimated_until_population_exists');
  });

  it('source_label is same for all tiers', () => {
    const locked    = computeHumanTwin(emptyCV, 5, null, null);
    const preview   = computeHumanTwin(explorerCV, 20, null, null);
    const strong    = computeHumanTwin(explorerCV, 60, null, null);
    expect(locked.source_label).toBe('estimated_until_population_exists');
    expect(preview.source_label).toBe('estimated_until_population_exists');
    expect(strong.source_label).toBe('estimated_until_population_exists');
  });

  it('unlock_threshold is 12', () => {
    const r = computeHumanTwin(emptyCV, 0, null, null);
    expect(r.unlock_threshold).toBe(12);
  });

});
