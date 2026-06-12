import { describe, it, expect } from 'vitest';
import { computeSnapshot51, Snapshot51Result } from '../snapshot51';
import { CanonicalVector } from '../../utils/canonicalVector';
import { EmergingArchetypeResult } from '../emergingArchetype';
import { ContradictionResult } from '../contradictionEngine';
import { HumanTwinResult } from '../humanTwin';
import { HiddenParametersResult, HiddenParameterDimension } from '../hiddenParameters';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ZERO_CV: CanonicalVector = {
  AX01: 0, AX02: 0, AX03: 0, AX04: 0, AX05: 0,
  AX06: 0, AX07: 0, AX08: 0, AX09: 0, AX10: 0,
};

const MOCK_ARCHETYPE: EmergingArchetypeResult = {
  version: 'stage5_emerging_archetype_v1',
  primary: { id: 'A01', name: 'The Alchemist', percentage: 45, score: 0.45 },
  secondary: { id: 'A02', name: 'The Observer', percentage: 30, score: 0.30 },
  blend_label: 'Emerging Alchemist',
  confidence: 'forming',
  confidence_reason: 'test',
  distance: 15,
  answer_count: 10,
  is_emerging: true,
  is_displayable: true,
  safe_text_en: 'A direction is forming.',
  safe_text_pl: 'Kierunek się kształtuje.',
  user_facing_summary: 'Your profile is forming.',
  all_scores: [],
};

const LOW_CONF_ARCHETYPE: EmergingArchetypeResult = {
  ...MOCK_ARCHETYPE,
  confidence: 'very_low',
};

const MOCK_CONTRADICTION: ContradictionResult = {
  version: 'stage4_contradiction_engine_v1',
  contradiction_score: 10,
  consistency_score: 90,
  level: 'none',
  primary_axis: null,
  signals: [],
  signal_counts: {
    answer_revision: 0,
    latency_spike: 0,
    opposite_axis_movement: 0,
    skip_sensitive: 0,
    return_to_question: 0,
    reverse_pair_mismatch: 0,
  },
  safe_text_en: '',
  safe_text_pl: '',
  user_facing_summary: 'No contradictions detected.',
  debug_evidence: {},
};

const DIM: HiddenParameterDimension = {
  score: 50,
  label: 'mixed',
  evidence: [],
  user_facing_label: 'Balanced',
  user_facing_summary: 'A balanced signal.',
};

const MOCK_HIDDEN: HiddenParametersResult = {
  version: 'stage6_hidden_parameters_engine_v1',
  confidence: DIM,
  openness: DIM,
  consistency: DIM,
  directness: DIM,
  stability: DIM,
  raw_hp: null,
  answer_count: 20,
  is_sufficient: true,
  is_displayable: true,
  safe_text_en: 'A hidden signal has been detected.',
  safe_text_pl: 'Wykryto ukryty sygnał.',
};

const MOCK_HUMAN_TWIN: HumanTwinResult = {
  version: 'stage7_human_twin_similarity_v1',
  enabled: true,
  source_label: 'simulated_local_reference',
  similarity_percent: 72,
  distance: 2.5,
  closest_reference_id: 'A01',
  closest_reference_name: 'The Alchemist',
  shared_patterns: [],
  differences: [],
  unlock_threshold: 17,
  current_answer_count: 20,
  is_unlocked: true,
  is_displayable: true,
  tier: 'meaningful',
  safe_text_en: 'A behavioral similarity has been detected.',
  safe_text_pl: 'Wykryto podobieństwo behawioralne.',
  user_facing_summary: 'Your profile is similar to The Alchemist.',
  hp_reliability: null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function run(
  answerCount: number,
  debugForced = false,
  archetype: EmergingArchetypeResult = MOCK_ARCHETYPE,
): Snapshot51Result {
  return computeSnapshot51(
    ZERO_CV,
    answerCount,
    archetype,
    MOCK_CONTRADICTION,
    MOCK_HUMAN_TWIN,
    MOCK_HIDDEN,
    debugForced,
  );
}

// ─── Version ──────────────────────────────────────────────────────────────────

describe('version', () => {
  it('returns correct version string when locked', () => {
    expect(run(0).version).toBe('stage9_snapshot51_final_reveal_v1');
  });
  it('returns correct version string when available', () => {
    expect(run(51).version).toBe('stage9_snapshot51_final_reveal_v1');
  });
  it('returns correct version string when debug forced', () => {
    expect(run(5, true).version).toBe('stage9_snapshot51_final_reveal_v1');
  });
});

// ─── is_available / is_displayable ────────────────────────────────────────────

describe('is_available', () => {
  it('is false at 0 answers', () => expect(run(0).is_available).toBe(false));
  it('is false at 50 answers', () => expect(run(50).is_available).toBe(false));
  it('is true at exactly 51 answers', () => expect(run(51).is_available).toBe(true));
  it('is true at 100 answers', () => expect(run(100).is_available).toBe(true));
  it('is true when debug forced regardless of count', () => {
    expect(run(0, true).is_available).toBe(true);
    expect(run(17, true).is_available).toBe(true);
  });
});

describe('is_displayable', () => {
  it('is false when not available', () => expect(run(30).is_displayable).toBe(false));
  it('is true when available', () => expect(run(51).is_displayable).toBe(true));
  it('mirrors is_available', () => {
    const r51 = run(51);
    expect(r51.is_displayable).toBe(r51.is_available);
    const r10 = run(10);
    expect(r10.is_displayable).toBe(r10.is_available);
  });
  it('is true when debug forced', () => expect(run(5, true).is_displayable).toBe(true));
});

// ─── snapshot_level ───────────────────────────────────────────────────────────

describe('snapshot_level', () => {
  it('is locked at 0 answers', () => expect(run(0).snapshot_level).toBe('locked'));
  it('is locked at 16 answers', () => expect(run(16).snapshot_level).toBe('locked'));
  it('is preview at 17 answers', () => expect(run(17).snapshot_level).toBe('preview'));
  it('is preview at 50 answers', () => expect(run(50).snapshot_level).toBe('preview'));
  it('is first at 51 answers', () => expect(run(51).snapshot_level).toBe('first'));
  it('is first at 74 answers', () => expect(run(74).snapshot_level).toBe('first'));
  it('is deeper at 75 answers', () => expect(run(75).snapshot_level).toBe('deeper'));
  it('is deeper at 98 answers', () => expect(run(98).snapshot_level).toBe('deeper'));
  it('is stable at 99 answers', () => expect(run(99).snapshot_level).toBe('stable'));
  it('is stable at 200 answers', () => expect(run(200).snapshot_level).toBe('stable'));
});

describe('snapshot_level with debug_forced', () => {
  it('is first when debugForced and count < 75', () => {
    expect(run(5, true).snapshot_level).toBe('first');
  });
  it('is deeper when debugForced and count >= 75', () => {
    expect(run(75, true).snapshot_level).toBe('deeper');
  });
  it('is stable when debugForced and count >= 99', () => {
    expect(run(99, true).snapshot_level).toBe('stable');
  });
});

// ─── progress_to_snapshot ─────────────────────────────────────────────────────

describe('progress_to_snapshot', () => {
  it('is 0 at 0 answers', () => expect(run(0).progress_to_snapshot).toBe(0));
  it('is 100 at 51 answers', () => expect(run(51).progress_to_snapshot).toBe(100));
  it('is 100 at 100 answers (capped)', () => expect(run(100).progress_to_snapshot).toBe(100));
  it('is between 0 and 100 at intermediate counts', () => {
    const p = run(25).progress_to_snapshot;
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThan(100);
  });
  it('increases monotonically with count (below 51)', () => {
    const a = run(10).progress_to_snapshot;
    const b = run(20).progress_to_snapshot;
    const c = run(40).progress_to_snapshot;
    expect(b).toBeGreaterThanOrEqual(a);
    expect(c).toBeGreaterThanOrEqual(b);
  });
  it('is capped at 100 beyond 51', () => {
    expect(run(200).progress_to_snapshot).toBe(100);
  });
});

// ─── safe_text ────────────────────────────────────────────────────────────────

describe('safe_text when locked (not available)', () => {
  it('safe_text_en is empty when locked', () => expect(run(0).safe_text_en).toBe(''));
  it('safe_text_pl is empty when locked', () => expect(run(0).safe_text_pl).toBe(''));
  it('safe_text_en is empty when preview (count=30)', () => expect(run(30).safe_text_en).toBe(''));
  it('safe_text_pl is empty when preview (count=30)', () => expect(run(30).safe_text_pl).toBe(''));
});

describe('safe_text when available', () => {
  it('safe_text_en is non-empty at count=51 (first)', () => {
    expect(run(51).safe_text_en.length).toBeGreaterThan(0);
  });
  it('safe_text_pl is non-empty at count=51 (first)', () => {
    expect(run(51).safe_text_pl.length).toBeGreaterThan(0);
  });
  it('safe_text_en is non-empty at count=75 (deeper)', () => {
    expect(run(75).safe_text_en.length).toBeGreaterThan(0);
  });
  it('safe_text_en is non-empty at count=99 (stable)', () => {
    expect(run(99).safe_text_en.length).toBeGreaterThan(0);
  });
  it('safe_text_en is non-empty when debugForced', () => {
    expect(run(5, true).safe_text_en.length).toBeGreaterThan(0);
  });
});

// ─── Forbidden copy language ──────────────────────────────────────────────────

describe('forbidden copy in safe_text', () => {
  const COUNTS = [0, 17, 51, 75, 99];
  const FORBIDDEN = [
    'this is who you are',
    'your final type is',
    'you are',
    'diagnosis',
    'disorder',
    'trauma profile',
    'mental illness',
    'superior',
    'inferior',
    'shame',
    'urgency',
    'only one more',
    'unlock now',
    'casino',
    'better than',
    'worse than',
    'real person',
  ];

  for (const count of COUNTS) {
    it(`safe_text_en has no forbidden phrases at count=${count}`, () => {
      const r = run(count);
      const text = r.safe_text_en.toLowerCase();
      for (const phrase of FORBIDDEN) {
        expect(text).not.toContain(phrase);
      }
    });
    it(`safe_text_pl has no forbidden phrases at count=${count}`, () => {
      const r = run(count);
      const text = r.safe_text_pl.toLowerCase();
      for (const phrase of FORBIDDEN) {
        expect(text).not.toContain(phrase);
      }
    });
  }
});

// ─── human_twin_preview ───────────────────────────────────────────────────────

describe('human_twin_preview when locked', () => {
  it('similarity_percent is 0', () => expect(run(0).human_twin_preview.similarity_percent).toBe(0));
  it('closest_reference_name is empty', () => expect(run(0).human_twin_preview.closest_reference_name).toBe(''));
  it('is_unlocked is false', () => expect(run(0).human_twin_preview.is_unlocked).toBe(false));
  it('tier is locked', () => expect(run(0).human_twin_preview.tier).toBe('locked'));
  it('summary includes remaining count', () => {
    const r = run(10);
    expect(r.human_twin_preview.summary).toContain('41');
  });
  it('summary includes 0 remaining when answerCount=51', () => {
    const r = run(51);
    expect(r.human_twin_preview.summary).not.toContain('more');
  });
});

describe('human_twin_preview when available', () => {
  it('uses humanTwin.similarity_percent', () => {
    expect(run(51).human_twin_preview.similarity_percent).toBe(MOCK_HUMAN_TWIN.similarity_percent);
  });
  it('uses humanTwin.closest_reference_name', () => {
    expect(run(51).human_twin_preview.closest_reference_name).toBe(MOCK_HUMAN_TWIN.closest_reference_name);
  });
  it('uses humanTwin.is_unlocked', () => {
    expect(run(51).human_twin_preview.is_unlocked).toBe(MOCK_HUMAN_TWIN.is_unlocked);
  });
  it('uses humanTwin.tier', () => {
    expect(run(51).human_twin_preview.tier).toBe(MOCK_HUMAN_TWIN.tier);
  });
});

// ─── contradiction_summary ────────────────────────────────────────────────────

describe('contradiction_summary', () => {
  it('reflects contradiction.level', () => {
    expect(run(0).contradiction_summary.level).toBe(MOCK_CONTRADICTION.level);
  });
  it('reflects contradiction.contradiction_score', () => {
    expect(run(0).contradiction_summary.score).toBe(MOCK_CONTRADICTION.contradiction_score);
  });
  it('reflects contradiction.consistency_score', () => {
    expect(run(51).contradiction_summary.consistency_score).toBe(MOCK_CONTRADICTION.consistency_score);
  });
  it('reflects contradiction.user_facing_summary', () => {
    expect(run(51).contradiction_summary.summary).toBe(MOCK_CONTRADICTION.user_facing_summary);
  });
});

// ─── profile_confidence ───────────────────────────────────────────────────────

describe('profile_confidence', () => {
  it('is too_early at 0 answers', () => expect(run(0).profile_confidence).toBe('too_early'));
  it('is first_signal at 10 answers', () => expect(run(10).profile_confidence).toBe('first_signal'));
  it('is pattern_forming at 25 answers', () => expect(run(25).profile_confidence).toBe('pattern_forming'));
  it('is readable at 51 answers', () => expect(run(51).profile_confidence).toBe('readable'));
  it('is strong at 100 answers', () => expect(run(100).profile_confidence).toBe('strong'));
});

// ─── answer_count sanitization ────────────────────────────────────────────────

describe('answer_count sanitization', () => {
  it('reflects the input count', () => expect(run(15).answer_count).toBe(15));
  it('clamps negative input to 0', () => {
    const r = computeSnapshot51(ZERO_CV, -5, MOCK_ARCHETYPE, MOCK_CONTRADICTION, MOCK_HUMAN_TWIN, MOCK_HIDDEN);
    expect(r.answer_count).toBe(0);
  });
  it('handles NaN input gracefully', () => {
    const r = computeSnapshot51(ZERO_CV, NaN, MOCK_ARCHETYPE, MOCK_CONTRADICTION, MOCK_HUMAN_TWIN, MOCK_HIDDEN);
    expect(r.answer_count).toBe(0);
    expect(r.is_available).toBe(false);
  });
  it('handles Infinity input gracefully', () => {
    const r = computeSnapshot51(ZERO_CV, Infinity, MOCK_ARCHETYPE, MOCK_CONTRADICTION, MOCK_HUMAN_TWIN, MOCK_HIDDEN);
    expect(r.answer_count).toBe(0);
    expect(r.is_available).toBe(false);
  });
  it('floors fractional input', () => {
    const r = computeSnapshot51(ZERO_CV, 51.9, MOCK_ARCHETYPE, MOCK_CONTRADICTION, MOCK_HUMAN_TWIN, MOCK_HIDDEN);
    expect(r.answer_count).toBe(51);
    expect(r.is_available).toBe(true);
  });
});

// ─── debug_forced ─────────────────────────────────────────────────────────────

describe('debug_forced flag', () => {
  it('is false in normal locked result', () => expect(run(0).debug_forced).toBe(false));
  it('is true in debug forced available result', () => expect(run(5, true).debug_forced).toBe(true));
  it('is false in normal available result', () => expect(run(51).debug_forced).toBe(false));
});

// ─── next_best_questions_hint ─────────────────────────────────────────────────

describe('next_best_questions_hint', () => {
  it('is non-empty for any input', () => {
    expect(run(0).next_best_questions_hint.length).toBeGreaterThan(0);
    expect(run(51).next_best_questions_hint.length).toBeGreaterThan(0);
  });
  it('references archetype name when confidence is forming', () => {
    const hint = run(5, true, MOCK_ARCHETYPE).next_best_questions_hint;
    expect(hint).toContain('Alchemist');
  });
  it('gives generic hint when confidence is very_low', () => {
    const hint = run(5, true, LOW_CONF_ARCHETYPE).next_best_questions_hint;
    expect(hint).toContain('More answers');
  });
});

// ─── premium_modules_preview ──────────────────────────────────────────────────

describe('premium_modules_preview', () => {
  it('is non-empty array', () => {
    const modules = run(0).premium_modules_preview;
    expect(Array.isArray(modules)).toBe(true);
    expect(modules.length).toBeGreaterThan(0);
  });
  it('is same in locked and available states', () => {
    expect(run(0).premium_modules_preview).toEqual(run(51).premium_modules_preview);
  });
});

// ─── strongest_axes / uncertain_axes ──────────────────────────────────────────

describe('axis signals', () => {
  it('strongest_axes has 3 entries', () => expect(run(51).strongest_axes.length).toBe(3));
  it('uncertain_axes has 3 entries', () => expect(run(51).uncertain_axes.length).toBe(3));
  it('each axis signal has required fields', () => {
    const { strongest_axes } = run(51);
    for (const ax of strongest_axes) {
      expect(ax).toHaveProperty('axis');
      expect(ax).toHaveProperty('value');
      expect(ax).toHaveProperty('normalized_value');
      expect(ax).toHaveProperty('label');
    }
  });
});

// ─── generated_at ─────────────────────────────────────────────────────────────

describe('generated_at', () => {
  it('is a valid ISO date string', () => {
    const r = run(0);
    expect(() => new Date(r.generated_at)).not.toThrow();
    expect(r.generated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

// ─── Determinism (excluding generated_at) ────────────────────────────────────

describe('determinism', () => {
  it('returns identical results for same locked inputs (excluding generated_at)', () => {
    const a = run(30);
    const b = run(30);
    const { generated_at: _ga, ...ra } = a;
    const { generated_at: _gb, ...rb } = b;
    expect(ra).toEqual(rb);
  });
  it('returns identical results for same debug-forced inputs (excluding generated_at)', () => {
    const a = run(10, true);
    const b = run(10, true);
    const { generated_at: _ga, ...ra } = a;
    const { generated_at: _gb, ...rb } = b;
    expect(ra).toEqual(rb);
  });
});

// ─── Stage regression ─────────────────────────────────────────────────────────

describe('Stage regression', () => {
  it('does not break when called with 51+ answers (stages 3-8 unaffected)', () => {
    const r = run(51);
    expect(r.version).toBe('stage9_snapshot51_final_reveal_v1');
    expect(r.is_available).toBe(true);
    expect(r.emerging_archetype).toBeDefined();
    expect(r.hidden_parameters).toBeDefined();
    expect(r.contradiction_summary).toBeDefined();
  });
});
