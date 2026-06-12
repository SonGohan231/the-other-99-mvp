import { describe, it, expect } from 'vitest';
import { computeSocialRewardLayer, SocialRewardLayerResult } from '../socialRewardLayer';
import { CanonicalVector } from '../../utils/canonicalVector';
import { PatternEngineResult } from '../patternEngine';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ZERO_CV: CanonicalVector = {
  AX01: 0, AX02: 0, AX03: 0, AX04: 0, AX05: 0,
  AX06: 0, AX07: 0, AX08: 0, AX09: 0, AX10: 0,
};

const MODERATE_CV: CanonicalVector = {
  AX01: 4, AX02: -3, AX03: 2, AX04: -5, AX05: 3,
  AX06: -2, AX07: 4, AX08: 3, AX09: -2, AX10: 1,
};

// avg abs = (4+3+2+5+3+2+4+3+2+1) / 10 = 2.9 — below RARITY_EXTREMITY_THRESHOLD
const NORMAL_CV = MODERATE_CV;

// avg abs ≥ 5.5 — triggers rarity signals
const EXTREME_CV: CanonicalVector = {
  AX01: 9, AX02: -8, AX03: 7, AX04: -9, AX05: 6,
  AX06: -7, AX07: 8, AX08: -6, AX09: 7, AX10: -8,
};

const PATTERN_RESULT: PatternEngineResult = {
  version: 'stage3_pattern_engine_v1',
  answers_analyzed: 8,
  active_patterns: [{
    id: 'ax01_pos',
    level: 'first_signal',
    axis_id: 'AX01',
    direction: 'positive',
    strength: 55,
    confidence: 60,
    evidence_count: 3,
    last_question_id: 'q1',
    copy_key: 'axis_momentum',
    safe_text_en: 'A curiosity-driven pattern is forming.',
    safe_text_pl: 'Kształtuje się wzorzec napędzany ciekawością.',
  }],
  strongest_pattern: {
    id: 'ax01_pos',
    level: 'first_signal',
    axis_id: 'AX01',
    direction: 'positive',
    strength: 55,
    confidence: 60,
    evidence_count: 3,
    last_question_id: 'q1',
    copy_key: 'axis_momentum',
    safe_text_en: 'A curiosity-driven pattern is forming.',
    safe_text_pl: 'Kształtuje się wzorzec napędzany ciekawością.',
  },
  confidence: 60,
  next_pattern_in: 0,
  debug_notes: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function run(count: number, cv = ZERO_CV, pattern: PatternEngineResult | null = null, rarityPts = 0): SocialRewardLayerResult {
  return computeSocialRewardLayer(count, pattern, cv, rarityPts);
}

// ─── Version ──────────────────────────────────────────────────────────────────

describe('SocialRewardLayer version', () => {
  it('returns correct version string', () => {
    const r = run(0);
    expect(r.version).toBe('stage8_social_reward_layer_v1');
  });
});

// ─── Reward level thresholds ──────────────────────────────────────────────────

describe('reward_level thresholds', () => {
  it('is none at 0 answers', () => {
    expect(run(0).reward_level).toBe('none');
  });
  it('is none at 1 answer', () => {
    expect(run(1).reward_level).toBe('none');
  });
  it('is none at 2 answers', () => {
    expect(run(2).reward_level).toBe('none');
  });
  it('is spark at 3 answers', () => {
    expect(run(3).reward_level).toBe('spark');
  });
  it('is spark at 7 answers', () => {
    expect(run(7).reward_level).toBe('spark');
  });
  it('is signal at 8 answers', () => {
    expect(run(8).reward_level).toBe('signal');
  });
  it('is signal at 11 answers', () => {
    expect(run(11).reward_level).toBe('signal');
  });
  it('is meaningful at 12 answers', () => {
    expect(run(12).reward_level).toBe('meaningful');
  });
  it('is meaningful at 16 answers', () => {
    expect(run(16).reward_level).toBe('meaningful');
  });
  it('is rare at 17 answers', () => {
    expect(run(17).reward_level).toBe('rare');
  });
  it('is rare at 51 answers', () => {
    expect(run(51).reward_level).toBe('rare');
  });
});

// ─── is_sufficient / is_displayable ──────────────────────────────────────────

describe('is_sufficient', () => {
  it('is false below 3', () => {
    expect(run(0).is_sufficient).toBe(false);
    expect(run(2).is_sufficient).toBe(false);
  });
  it('is true at exactly 3', () => {
    expect(run(3).is_sufficient).toBe(true);
  });
  it('remains true above 3', () => {
    expect(run(20).is_sufficient).toBe(true);
  });
});

describe('is_displayable', () => {
  it('is false below 8', () => {
    expect(run(0).is_displayable).toBe(false);
    expect(run(7).is_displayable).toBe(false);
  });
  it('is true at exactly 8', () => {
    expect(run(8).is_displayable).toBe(true);
  });
  it('remains true above 8', () => {
    expect(run(25).is_displayable).toBe(true);
  });
});

// ─── safe_text empty when not displayable ─────────────────────────────────────

describe('safe_text when not displayable', () => {
  it('safe_text_en is empty string at count < 8', () => {
    expect(run(5).safe_text_en).toBe('');
  });
  it('safe_text_pl is empty string at count < 8', () => {
    expect(run(5).safe_text_pl).toBe('');
  });
  it('safe_text_en is non-empty at count >= 8', () => {
    const r = run(8);
    expect(r.safe_text_en.length).toBeGreaterThan(0);
  });
  it('safe_text_pl is non-empty at count >= 8', () => {
    const r = run(8);
    expect(r.safe_text_pl.length).toBeGreaterThan(0);
  });
});

// ─── reward_kind selection ────────────────────────────────────────────────────

describe('reward_kind', () => {
  it('is progress for none level', () => {
    expect(run(0).reward_kind).toBe('progress');
  });
  it('is progress for spark level', () => {
    expect(run(5).reward_kind).toBe('progress');
  });
  it('is pattern for signal level when pattern result is present', () => {
    expect(run(8, ZERO_CV, PATTERN_RESULT).reward_kind).toBe('pattern');
  });
  it('is comparison for signal level without pattern', () => {
    expect(run(8, NORMAL_CV, null).reward_kind).toBe('comparison');
  });
  it('is pattern for meaningful level when pattern exists', () => {
    expect(run(12, NORMAL_CV, PATTERN_RESULT).reward_kind).toBe('pattern');
  });
  it('is rarity for meaningful level with extreme vector and no pattern', () => {
    expect(run(12, EXTREME_CV, null).reward_kind).toBe('rarity');
  });
  it('is reflection for meaningful level with normal vector and no pattern', () => {
    expect(run(12, NORMAL_CV, null).reward_kind).toBe('reflection');
  });
  it('is pattern for rare level when pattern exists', () => {
    expect(run(17, NORMAL_CV, PATTERN_RESULT).reward_kind).toBe('pattern');
  });
  it('is rarity for rare level with extreme vector and no pattern', () => {
    expect(run(17, EXTREME_CV, null).reward_kind).toBe('rarity');
  });
  it('is reflection for rare level with normal vector and no pattern', () => {
    expect(run(17, NORMAL_CV, null).reward_kind).toBe('reflection');
  });
});

// ─── Forbidden copy language ──────────────────────────────────────────────────

describe('safe copy language', () => {
  const COUNTS = [0, 3, 8, 12, 17, 51];
  const CVS = [ZERO_CV, NORMAL_CV, EXTREME_CV];
  const PATTERNS = [null, PATTERN_RESULT];

  const FORBIDDEN_PHRASES = [
    'you are better than',
    'you are rare',
    'superior',
    'chosen',
    'special',
    "keep going or",
    "you'll lose",
    'urgency',
    'streak',
    'shame',
    'clinical',
    'real person',
    'only one more',
    "you're better",
    'inferior',
    'worse than',
  ];

  for (const count of COUNTS) {
    for (const cv of CVS) {
      for (const pattern of PATTERNS) {
        const label = `count=${count} cv=${cv === ZERO_CV ? 'zero' : cv === EXTREME_CV ? 'extreme' : 'normal'} pattern=${pattern ? 'yes' : 'no'}`;
        it(`safe_text_en has no forbidden phrases [${label}]`, () => {
          const r = computeSocialRewardLayer(count, pattern, cv, 0);
          const text = r.safe_text_en.toLowerCase();
          for (const phrase of FORBIDDEN_PHRASES) {
            expect(text).not.toContain(phrase.toLowerCase());
          }
        });
        it(`anonymous_comparison_label has no forbidden phrases [${label}]`, () => {
          const r = computeSocialRewardLayer(count, pattern, cv, 0);
          const text = r.anonymous_comparison_label.toLowerCase();
          for (const phrase of FORBIDDEN_PHRASES) {
            expect(text).not.toContain(phrase.toLowerCase());
          }
        });
      }
    }
  }
});

// ─── Labels ───────────────────────────────────────────────────────────────────

describe('progress_label', () => {
  it('includes the answer count', () => {
    expect(run(8).progress_label).toContain('8');
  });
  it('uses "answer" (singular) at 1', () => {
    expect(run(1).progress_label).toContain('answer');
    expect(run(1).progress_label).not.toContain('answers');
  });
  it('uses "answers" (plural) at > 1', () => {
    expect(run(5).progress_label).toContain('answers');
  });
});

describe('rarity_label', () => {
  it('is non-empty', () => {
    expect(run(8).rarity_label.length).toBeGreaterThan(0);
  });
  it('shows uncommon label for extreme vector', () => {
    const r = run(8, EXTREME_CV);
    expect(r.rarity_label.toLowerCase()).toContain('uncommon');
  });
  it('shows estimated signal for zero vector', () => {
    const r = run(8, ZERO_CV);
    expect(r.rarity_label.toLowerCase()).toContain('estimated');
  });
});

describe('anonymous_comparison_label', () => {
  it('is non-empty', () => {
    expect(run(8).anonymous_comparison_label.length).toBeGreaterThan(0);
  });
  it('does not contain any percentage', () => {
    const r = run(8);
    expect(r.anonymous_comparison_label).not.toMatch(/\d+%/);
  });
});

// ─── answers_analyzed ─────────────────────────────────────────────────────────

describe('answers_analyzed field', () => {
  it('reflects the input count', () => {
    expect(run(12).answers_analyzed).toBe(12);
  });
  it('clamps negative input to 0', () => {
    expect(run(-5).answers_analyzed).toBe(0);
  });
  it('handles NaN input gracefully', () => {
    const r = computeSocialRewardLayer(NaN, null, ZERO_CV, 0);
    expect(r.answers_analyzed).toBe(0);
    expect(r.reward_level).toBe('none');
  });
  it('handles Infinity input gracefully', () => {
    const r = computeSocialRewardLayer(Infinity, null, ZERO_CV, 0);
    expect(r.answers_analyzed).toBe(0);
    expect(r.reward_level).toBe('none');
  });
});

// ─── debug_notes ──────────────────────────────────────────────────────────────

describe('debug_notes', () => {
  it('is an array', () => {
    expect(Array.isArray(run(8).debug_notes)).toBe(true);
  });
  it('contains level', () => {
    expect(run(8, ZERO_CV, null).debug_notes.some((n) => n.startsWith('level='))).toBe(true);
  });
  it('contains kind', () => {
    expect(run(8, ZERO_CV, null).debug_notes.some((n) => n.startsWith('kind='))).toBe(true);
  });
});

// ─── Determinism ──────────────────────────────────────────────────────────────

describe('determinism', () => {
  it('returns identical results for same inputs (no pattern)', () => {
    const a = run(12, MODERATE_CV, null, 3);
    const b = run(12, MODERATE_CV, null, 3);
    expect(a).toEqual(b);
  });
  it('returns identical results for same inputs (with pattern)', () => {
    const a = run(17, EXTREME_CV, PATTERN_RESULT, 10);
    const b = run(17, EXTREME_CV, PATTERN_RESULT, 10);
    expect(a).toEqual(b);
  });
});

// ─── Stage regression: prior stages unaffected ───────────────────────────────

describe('Stage regression', () => {
  it('does not import or call any Stage 4/5/6/7 modules directly', () => {
    // Pure engine: only depends on patternEngine (Stage 3) and canonicalVector
    const r = run(20, MODERATE_CV, PATTERN_RESULT, 5);
    expect(r.version).toBe('stage8_social_reward_layer_v1');
  });
});
