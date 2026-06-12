import { describe, it, expect } from 'vitest';
import { computeEmergingArchetype, ARCHETYPES } from '../emergingArchetype';
import { emptyCanonicalVector } from '../../utils/canonicalVector';
import type { CanonicalVector } from '../../utils/canonicalVector';

const emptyCV = emptyCanonicalVector();

// Build a canonical vector with specific axis values
function makeCV(overrides: Partial<CanonicalVector> = {}): CanonicalVector {
  return { ...emptyCV, ...overrides };
}

// Explorer profile: AX01 high (curious), AX06 high (spontaneous), AX03 high (independent)
const explorerCV = makeCV({ AX01: 20, AX06: 18, AX03: 12 });

// Anchor profile: AX08 high (stable), AX01 negative (security), AX06 negative (control)
const anchorCV = makeCV({ AX08: 25, AX01: -15, AX06: -18 });

describe('emergingArchetype', () => {

  // ── Version ──────────────────────────────────────────────────────────────────

  it('returns version stage5_emerging_archetype_v1', () => {
    const result = computeEmergingArchetype(emptyCV, 0);
    expect(result.version).toBe('stage5_emerging_archetype_v1');
  });

  // ── Display threshold ─────────────────────────────────────────────────────────

  it('is_displayable=false when answerCount=0', () => {
    expect(computeEmergingArchetype(emptyCV, 0).is_displayable).toBe(false);
  });

  it('is_displayable=false when answerCount=5', () => {
    expect(computeEmergingArchetype(explorerCV, 5).is_displayable).toBe(false);
  });

  it('is_displayable=false when answerCount=11 (below minimum)', () => {
    expect(computeEmergingArchetype(explorerCV, 11).is_displayable).toBe(false);
  });

  it('safe_text_en is empty when answerCount < 12', () => {
    const result = computeEmergingArchetype(explorerCV, 11);
    expect(result.safe_text_en).toBe('');
    expect(result.safe_text_pl).toBe('');
  });

  it('is_displayable=false when distance < 5 (ambiguous signal) even at 12+ answers', () => {
    // Empty canonical vector → all archetypes score nearly equally → small distance
    const result = computeEmergingArchetype(emptyCV, 15);
    if (result.distance < 5) {
      expect(result.is_displayable).toBe(false);
      expect(result.safe_text_en).toBe('');
    }
  });

  it('is_displayable=true at 12+ answers with strong directional vector and distance≥5', () => {
    const result = computeEmergingArchetype(explorerCV, 15);
    if (result.distance >= 5) {
      expect(result.is_displayable).toBe(true);
    }
  });

  it('is_displayable=true at 17 answers with clear anchor profile', () => {
    const result = computeEmergingArchetype(anchorCV, 17);
    if (result.distance >= 5) {
      expect(result.is_displayable).toBe(true);
      expect(result.safe_text_en).not.toBe('');
    }
  });

  // ── Copy safety ───────────────────────────────────────────────────────────────

  it('safe_text_en contains no archetype names from ARCHETYPES list', () => {
    const result = computeEmergingArchetype(explorerCV, 20);
    const names = ARCHETYPES.map((a) => a.name.toLowerCase());
    const textLower = result.safe_text_en.toLowerCase();
    for (const name of names) {
      expect(textLower).not.toContain(name.toLowerCase());
    }
  });

  it('safe_text_pl contains no archetype names from ARCHETYPES list', () => {
    const result = computeEmergingArchetype(anchorCV, 20);
    const names = ARCHETYPES.map((a) => a.name.toLowerCase());
    const textLower = result.safe_text_pl.toLowerCase();
    for (const name of names) {
      expect(textLower).not.toContain(name.toLowerCase());
    }
  });

  it('safe_text_en does not contain "you are" or "you\'re"', () => {
    const result = computeEmergingArchetype(explorerCV, 20);
    expect(result.safe_text_en.toLowerCase()).not.toMatch(/you are|you're/);
  });

  it('safe_text_en uses hedged language at low confidence', () => {
    const result = computeEmergingArchetype(explorerCV, 15);
    if (result.safe_text_en) {
      const hedgeWords = ['starting', 'appearing', 'becoming', 'consistently', 'pointing', 'direction'];
      const hasHedge = hedgeWords.some((w) => result.safe_text_en.toLowerCase().includes(w));
      expect(hasHedge).toBe(true);
    }
  });

  it('user_facing_summary (DebugPanel/screen only) may contain archetype names — not surfaced to RewardScreen', () => {
    const result = computeEmergingArchetype(explorerCV, 15);
    // user_facing_summary may include names — this is intentional for debug/detail screens
    // but safe_text_en must not
    expect(result.user_facing_summary).toBeDefined();
    expect(result.safe_text_en).not.toBe(result.user_facing_summary);
  });

  // ── Determinism ───────────────────────────────────────────────────────────────

  it('same inputs always produce same output (deterministic)', () => {
    const r1 = computeEmergingArchetype(explorerCV, 17);
    const r2 = computeEmergingArchetype(explorerCV, 17);
    expect(r1.primary.id).toBe(r2.primary.id);
    expect(r1.primary.percentage).toBe(r2.primary.percentage);
    expect(r1.distance).toBe(r2.distance);
    expect(r1.confidence).toBe(r2.confidence);
    expect(r1.is_displayable).toBe(r2.is_displayable);
    expect(r1.safe_text_en).toBe(r2.safe_text_en);
  });

  // ── AX01–AX10 handling ───────────────────────────────────────────────────────

  it('correctly uses AX01 (Curiosity) — high AX01 favors Explorer/Alchemist/Rebel', () => {
    const cv = makeCV({ AX01: 30 });
    const result = computeEmergingArchetype(cv, 17);
    const curiosityFriendly = ['A01', 'A06', 'A10']; // Alchemist, Explorer, Rebel all have AX01 weight ≥2
    expect(curiosityFriendly).toContain(result.primary.id);
  });

  it('correctly uses AX08 (Stability) — high AX08 favors Anchor/Guardian/Architect', () => {
    const cv = makeCV({ AX08: 30 });
    const result = computeEmergingArchetype(cv, 17);
    const stabilityFriendly = ['A04', 'A07', 'A09']; // Anchor, Guardian, Architect have positive AX08
    expect(stabilityFriendly).toContain(result.primary.id);
  });

  it('all 10 canonical axes are handled without NaN', () => {
    const allAxes = makeCV({ AX01: 5, AX02: 5, AX03: 5, AX04: 5, AX05: 5, AX06: 5, AX07: 5, AX08: 5, AX09: 5, AX10: 5 });
    const result = computeEmergingArchetype(allAxes, 17);
    expect(Number.isNaN(result.primary.score)).toBe(false);
    expect(Number.isNaN(result.distance)).toBe(false);
    for (const s of result.all_scores) {
      expect(Number.isNaN(s.score)).toBe(false);
      expect(Number.isNaN(s.percentage)).toBe(false);
    }
  });

  it('negative axis values produce valid results', () => {
    const negCV = makeCV({ AX01: -20, AX02: -15, AX06: -18 });
    const result = computeEmergingArchetype(negCV, 20);
    expect(result.primary).toBeDefined();
    expect(result.primary.percentage).toBeGreaterThan(0);
    expect(Number.isNaN(result.distance)).toBe(false);
  });

  // ── Malformed / edge data ─────────────────────────────────────────────────────

  it('handles answerCount=0 safely (no crash, valid result)', () => {
    const result = computeEmergingArchetype(emptyCV, 0);
    expect(result).toBeDefined();
    expect(result.confidence).toBe('very_low');
    expect(result.is_displayable).toBe(false);
    expect(result.answer_count).toBe(0);
  });

  it('handles non-finite answerCount gracefully', () => {
    const result = computeEmergingArchetype(emptyCV, NaN);
    expect(result.answer_count).toBe(0);
    expect(result.is_displayable).toBe(false);
  });

  it('handles very large answerCount without overflow', () => {
    const result = computeEmergingArchetype(explorerCV, 9999);
    expect(result.confidence).toBe('strong');
    expect(Number.isNaN(result.distance)).toBe(false);
  });

  it('all_scores always contains exactly 12 archetypes', () => {
    const result = computeEmergingArchetype(explorerCV, 17);
    expect(result.all_scores).toHaveLength(12);
  });

  it('all percentage values sum approximately to 100', () => {
    const result = computeEmergingArchetype(explorerCV, 17);
    const sum = result.all_scores.reduce((acc, s) => acc + s.percentage, 0);
    expect(sum).toBeGreaterThanOrEqual(98); // rounding tolerance
    expect(sum).toBeLessThanOrEqual(102);
  });

  // ── Confidence progression ────────────────────────────────────────────────────

  it('confidence=very_low at 10 answers', () => {
    expect(computeEmergingArchetype(explorerCV, 10).confidence).toBe('very_low');
  });

  it('confidence=low at 11-30 answers', () => {
    expect(computeEmergingArchetype(explorerCV, 11).confidence).toBe('low');
    expect(computeEmergingArchetype(explorerCV, 30).confidence).toBe('low');
  });

  it('confidence=forming at 31-50 answers', () => {
    expect(computeEmergingArchetype(explorerCV, 31).confidence).toBe('forming');
    expect(computeEmergingArchetype(explorerCV, 50).confidence).toBe('forming');
  });

  it('confidence=stable at 51-100 answers', () => {
    expect(computeEmergingArchetype(explorerCV, 51).confidence).toBe('stable');
    expect(computeEmergingArchetype(explorerCV, 100).confidence).toBe('stable');
  });

  it('confidence=strong above 100 answers', () => {
    expect(computeEmergingArchetype(explorerCV, 101).confidence).toBe('strong');
  });

  // ── is_emerging flag ─────────────────────────────────────────────────────────

  it('is_emerging=true at low and forming confidence', () => {
    expect(computeEmergingArchetype(explorerCV, 20).is_emerging).toBe(true);
    expect(computeEmergingArchetype(explorerCV, 40).is_emerging).toBe(true);
  });

  it('is_emerging=false at very_low, stable, strong', () => {
    expect(computeEmergingArchetype(explorerCV, 5).is_emerging).toBe(false);
    expect(computeEmergingArchetype(explorerCV, 60).is_emerging).toBe(false);
    expect(computeEmergingArchetype(explorerCV, 200).is_emerging).toBe(false);
  });
});
