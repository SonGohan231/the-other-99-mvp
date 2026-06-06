import { describe, it, expect } from 'vitest';
import { resolveInsightCopy } from '../insightCopyResolver';

const fallbacks = {
  insightLegendary: 'legendary fallback',
  insightEpic: 'epic fallback',
  insightRare: 'rare fallback',
  insight: 'standard fallback',
};

describe('resolveInsightCopy', () => {
  // ── Priority 1: per-answer reveal (TIER_1) ────────────────────────────────

  it('returns per-answer reveal copy when selected answer has a match', () => {
    const result = resolveInsightCopy({
      selectedAnswer: 'Option A',
      answerRevealShorts: {
        'Option A': { pl: 'PL reveal A', en: 'EN reveal A' },
        'Option B': { pl: 'PL reveal B', en: 'EN reveal B' },
      },
      revealTemplateId: 'reveal_standard',
      rarityTier: 'common',
      lang: 'en',
      fallbacks,
    });
    expect(result).toBe('EN reveal A');
  });

  it('returns Polish per-answer reveal when lang is pl', () => {
    const result = resolveInsightCopy({
      selectedAnswer: 'Option A',
      answerRevealShorts: { 'Option A': { pl: 'Objawienie PL', en: 'EN reveal' } },
      rarityTier: 'common',
      lang: 'pl',
      fallbacks,
    });
    expect(result).toBe('Objawienie PL');
  });

  it('skips per-answer reveal when selectedAnswer has no matching key', () => {
    const result = resolveInsightCopy({
      selectedAnswer: 'Option C',
      answerRevealShorts: { 'Option A': { pl: 'PL', en: 'EN' } },
      revealTemplateId: 'reveal_standard',
      rarityTier: 'common',
      lang: 'en',
      fallbacks,
    });
    // Falls through to template
    expect(result).not.toBe('EN');
  });

  it('skips per-answer reveal when selectedAnswer is null', () => {
    const result = resolveInsightCopy({
      selectedAnswer: null,
      answerRevealShorts: { 'Option A': { pl: 'PL', en: 'EN' } },
      revealTemplateId: 'reveal_standard',
      rarityTier: 'common',
      lang: 'en',
      fallbacks,
    });
    expect(result).not.toBe('EN');
  });

  // ── Priority 2: reveal template ───────────────────────────────────────────

  it('returns reveal template copy when no per-answer reveal matches', () => {
    const result = resolveInsightCopy({
      selectedAnswer: 'Option A',
      answerRevealShorts: undefined,
      revealTemplateId: 'reveal_rare',
      rarityTier: 'standard',
      lang: 'en',
      fallbacks,
    });
    // reveal_rare template in revealTemplates.ts
    expect(result).toContain('most people avoid');
  });

  it('returns Polish template copy when lang is pl', () => {
    const result = resolveInsightCopy({
      selectedAnswer: null,
      revealTemplateId: 'reveal_rare',
      rarityTier: 'standard',
      lang: 'pl',
      fallbacks,
    });
    expect(result).toContain('unika');
  });

  // ── Priority 3: rarity-based fallback ─────────────────────────────────────

  it('falls back to legendary fallback when rarity is legendary and no template', () => {
    const result = resolveInsightCopy({
      selectedAnswer: null,
      revealTemplateId: undefined,
      rarityTier: 'legendary',
      lang: 'en',
      fallbacks,
    });
    expect(result).toBe('legendary fallback');
  });

  it('falls back to epic fallback', () => {
    const result = resolveInsightCopy({
      selectedAnswer: null,
      rarityTier: 'epic',
      lang: 'en',
      fallbacks,
    });
    expect(result).toBe('epic fallback');
  });

  it('falls back to rare fallback', () => {
    const result = resolveInsightCopy({
      selectedAnswer: null,
      rarityTier: 'rare',
      lang: 'en',
      fallbacks,
    });
    expect(result).toBe('rare fallback');
  });

  it('falls back to standard insight for non-rarity tiers', () => {
    const result = resolveInsightCopy({
      selectedAnswer: null,
      rarityTier: 'standard',
      lang: 'en',
      fallbacks,
    });
    expect(result).toBe('standard fallback');
  });

  // ── Per-answer reveal takes priority over template ─────────────────────────

  it('per-answer reveal overrides reveal template', () => {
    const result = resolveInsightCopy({
      selectedAnswer: 'Option A',
      answerRevealShorts: { 'Option A': { pl: 'PL override', en: 'EN override' } },
      revealTemplateId: 'reveal_legendary',
      rarityTier: 'legendary',
      lang: 'en',
      fallbacks,
    });
    expect(result).toBe('EN override');
  });
});
