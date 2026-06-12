import { describe, it, expect } from 'vitest';
import { computePremiumExperience, PremiumExperienceResult } from '../premiumExperience';

// ─── Helper ───────────────────────────────────────────────────────────────────

function run(answerCount: number): PremiumExperienceResult {
  return computePremiumExperience(answerCount);
}

// ─── Version ──────────────────────────────────────────────────────────────────

describe('version', () => {
  it('returns correct version at 0 answers', () => {
    expect(run(0).version).toBe('stage10_premium_longterm_experience_v1');
  });
  it('returns correct version at 51 answers', () => {
    expect(run(51).version).toBe('stage10_premium_longterm_experience_v1');
  });
  it('returns correct version at 500 answers', () => {
    expect(run(500).version).toBe('stage10_premium_longterm_experience_v1');
  });
});

// ─── answer_count sanitization ────────────────────────────────────────────────

describe('answer_count sanitization', () => {
  it('reflects integer input', () => {
    expect(run(17).answer_count).toBe(17);
  });
  it('floors fractional input', () => {
    expect(run(51.9).answer_count).toBe(51);
  });
  it('clamps negative input to 0', () => {
    expect(run(-5).answer_count).toBe(0);
  });
  it('handles NaN gracefully', () => {
    const r = computePremiumExperience(NaN);
    expect(r.answer_count).toBe(0);
    expect(r.is_displayable).toBe(false);
  });
  it('handles Infinity gracefully', () => {
    const r = computePremiumExperience(Infinity);
    expect(r.answer_count).toBe(0);
    expect(r.is_displayable).toBe(false);
  });
  it('handles -Infinity gracefully', () => {
    const r = computePremiumExperience(-Infinity);
    expect(r.answer_count).toBe(0);
  });
});

// ─── is_displayable ───────────────────────────────────────────────────────────

describe('is_displayable', () => {
  it('is false at 0 answers', () => expect(run(0).is_displayable).toBe(false));
  it('is true at 1 answer', () => expect(run(1).is_displayable).toBe(true));
  it('is true at 51 answers', () => expect(run(51).is_displayable).toBe(true));
  it('is true at 500 answers', () => expect(run(500).is_displayable).toBe(true));
});

// ─── profile_readiness ────────────────────────────────────────────────────────

describe('profile_readiness', () => {
  it('is 0 at 0 answers', () => expect(run(0).profile_readiness).toBe(0));
  it('is between 0 and 95 at any count', () => {
    for (const n of [1, 5, 17, 51, 100, 250, 500]) {
      const r = run(n).profile_readiness;
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(95);
    }
  });
  it('is 20 at 17 answers (breakpoint)', () => {
    expect(run(17).profile_readiness).toBe(20);
  });
  it('is 45 at 51 answers (breakpoint)', () => {
    expect(run(51).profile_readiness).toBe(45);
  });
  it('is 65 at 85 answers (breakpoint)', () => {
    expect(run(85).profile_readiness).toBe(65);
  });
  it('is 95 at 500 answers (cap)', () => {
    expect(run(500).profile_readiness).toBe(95);
  });
  it('is 95 at 600 answers (capped at 95)', () => {
    expect(run(600).profile_readiness).toBe(95);
  });
  it('never reaches 100', () => {
    expect(run(10000).profile_readiness).toBe(95);
  });
  it('increases monotonically with answer count', () => {
    const counts = [0, 10, 20, 34, 51, 68, 85, 100, 150, 250, 500];
    for (let i = 1; i < counts.length; i++) {
      expect(run(counts[i]).profile_readiness).toBeGreaterThanOrEqual(run(counts[i - 1]).profile_readiness);
    }
  });
});

// ─── readiness_label ──────────────────────────────────────────────────────────

describe('readiness_label', () => {
  it('is beginning at 0 answers', () => expect(run(0).readiness_label).toBe('beginning'));
  it('is beginning at 16 answers', () => expect(run(16).readiness_label).toBe('beginning'));
  it('is developing at 17 answers', () => expect(run(17).readiness_label).toBe('developing'));
  it('is developing at 50 answers', () => expect(run(50).readiness_label).toBe('developing'));
  it('is forming at 51 answers', () => expect(run(51).readiness_label).toBe('forming'));
  it('is forming at 84 answers', () => expect(run(84).readiness_label).toBe('forming'));
  it('is substantial at 85 answers', () => expect(run(85).readiness_label).toBe('substantial'));
  it('is substantial at 149 answers', () => expect(run(149).readiness_label).toBe('substantial'));
  it('is comprehensive at 150 answers', () => expect(run(150).readiness_label).toBe('comprehensive'));
  it('is comprehensive at 500 answers', () => expect(run(500).readiness_label).toBe('comprehensive'));
});

// ─── milestones ───────────────────────────────────────────────────────────────

describe('milestones array', () => {
  it('always has 6 milestones', () => {
    expect(run(0).milestones.length).toBe(6);
    expect(run(500).milestones.length).toBe(6);
  });
  it('no milestones reached at 0 answers', () => {
    expect(run(0).milestones.every((m) => !m.is_reached)).toBe(true);
  });
  it('first milestone reached at 51 answers', () => {
    const r = run(51);
    expect(r.milestones[0].is_reached).toBe(true);
    expect(r.milestones[1].is_reached).toBe(false);
  });
  it('first two milestones reached at 85 answers', () => {
    const r = run(85);
    expect(r.milestones[0].is_reached).toBe(true); // 51
    expect(r.milestones[1].is_reached).toBe(true); // 85
    expect(r.milestones[2].is_reached).toBe(false); // 100
  });
  it('all 6 milestones reached at 500 answers', () => {
    expect(run(500).milestones.every((m) => m.is_reached)).toBe(true);
  });
  it('milestone at 50 answers is not reached', () => {
    expect(run(50).milestones[0].is_reached).toBe(false); // 51 threshold not met
  });
});

// ─── next_milestone ───────────────────────────────────────────────────────────

describe('next_milestone_label and answers_to_next_milestone', () => {
  it('next milestone is Snapshot 51 at 0 answers', () => {
    const r = run(0);
    expect(r.next_milestone_label).toContain('51');
    expect(r.answers_to_next_milestone).toBe(51);
  });
  it('answers_to_next_milestone decreases as count grows', () => {
    const r10 = run(10).answers_to_next_milestone;
    const r30 = run(30).answers_to_next_milestone;
    expect(r30).toBeLessThan(r10);
  });
  it('next milestone is null when all milestones reached', () => {
    expect(run(500).next_milestone_label).toBeNull();
    expect(run(500).answers_to_next_milestone).toBe(0);
  });
  it('next milestone at 51 answers points to Human Twin milestone', () => {
    const r = run(51);
    expect(r.next_milestone_label).toContain('Human Twin');
    expect(r.answers_to_next_milestone).toBe(34);
  });
});

// ─── module_status ────────────────────────────────────────────────────────────

describe('module_status', () => {
  it('always has 8 entries', () => {
    expect(run(0).module_status.length).toBe(8);
    expect(run(100).module_status.length).toBe(8);
  });
  it('modules_total is always 8', () => {
    expect(run(0).modules_total).toBe(8);
    expect(run(500).modules_total).toBe(8);
  });
  it('0 modules accessible at 0 answers', () => {
    expect(run(0).modules_available).toBe(0);
  });
  it('2 modules accessible at 34 answers', () => {
    expect(run(34).modules_available).toBe(2); // shadowProfile + maskVsCore
  });
  it('5 modules accessible at 51 answers', () => {
    expect(run(51).modules_available).toBe(5); // +contradictions, futureSelf, hiddenParameters
  });
  it('7 modules accessible at 68 answers', () => {
    expect(run(68).modules_available).toBe(7); // +relationshipMode, profileEvolution
  });
  it('all 8 modules accessible at 85 answers', () => {
    expect(run(85).modules_available).toBe(8);
  });
  it('all 8 modules accessible at 500 answers', () => {
    expect(run(500).modules_available).toBe(8);
  });
  it('each module has required fields', () => {
    for (const m of run(51).module_status) {
      expect(m).toHaveProperty('id');
      expect(m).toHaveProperty('label_en');
      expect(m).toHaveProperty('min_answers');
      expect(m).toHaveProperty('is_accessible');
      expect(typeof m.is_accessible).toBe('boolean');
    }
  });
  it('modules with min_answers <= count are accessible', () => {
    const r = run(51);
    for (const m of r.module_status) {
      expect(m.is_accessible).toBe(m.min_answers <= 51);
    }
  });
});

// ─── discovered_signals ───────────────────────────────────────────────────────

describe('discovered_signals', () => {
  it('is empty array at 0 answers', () => {
    expect(run(0).discovered_signals).toEqual([]);
  });
  it('has at least one signal at 3 answers', () => {
    expect(run(3).discovered_signals.length).toBeGreaterThanOrEqual(1);
  });
  it('grows with answer count', () => {
    expect(run(51).discovered_signals.length).toBeGreaterThan(run(10).discovered_signals.length);
  });
  it('is an array of strings', () => {
    const signals = run(51).discovered_signals;
    expect(Array.isArray(signals)).toBe(true);
    signals.forEach((s) => expect(typeof s).toBe('string'));
  });
  it('includes pattern signal at 3 answers', () => {
    const signals = run(3).discovered_signals.join(' ').toLowerCase();
    expect(signals).toContain('pattern');
  });
  it('includes snapshot signal at 51 answers', () => {
    const signals = run(51).discovered_signals.join(' ').toLowerCase();
    expect(signals).toContain('snapshot');
  });
});

// ─── safe_text ────────────────────────────────────────────────────────────────

describe('safe_text', () => {
  it('safe_text_en is empty at 0 answers', () => {
    expect(run(0).safe_text_en).toBe('');
  });
  it('safe_text_pl is empty at 0 answers', () => {
    expect(run(0).safe_text_pl).toBe('');
  });
  it('safe_text_en is non-empty at 1 answer', () => {
    expect(run(1).safe_text_en.length).toBeGreaterThan(0);
  });
  it('safe_text_pl is non-empty at 1 answer', () => {
    expect(run(1).safe_text_pl.length).toBeGreaterThan(0);
  });
  it('safe_text_en differs by readiness_label', () => {
    const beginning = run(5).safe_text_en;
    const forming   = run(51).safe_text_en;
    const comprehensive = run(200).safe_text_en;
    expect(beginning).not.toBe(forming);
    expect(forming).not.toBe(comprehensive);
  });
});

// ─── Forbidden copy language ──────────────────────────────────────────────────

describe('forbidden copy in safe_text', () => {
  const COUNTS = [0, 1, 17, 34, 51, 85, 100, 150, 250, 500];
  const FORBIDDEN = [
    'this is who you are',
    'your final type is',
    'you are',
    'diagnosis',
    'disorder',
    'trauma',
    'mental illness',
    'superior',
    'inferior',
    'shame',
    'urgency',
    'unlock now',
    'only one more',
    'casino',
    'better than',
    'worse than',
    'real person',
    'clinical',
    'streak',
    'subscription',
    'purchase',
    'buy',
    'payment',
  ];

  for (const count of COUNTS) {
    it(`safe_text_en has no forbidden phrases at count=${count}`, () => {
      const text = run(count).safe_text_en.toLowerCase();
      for (const phrase of FORBIDDEN) {
        expect(text).not.toContain(phrase);
      }
    });
    it(`safe_text_pl has no forbidden phrases at count=${count}`, () => {
      const text = run(count).safe_text_pl.toLowerCase();
      for (const phrase of FORBIDDEN) {
        expect(text).not.toContain(phrase);
      }
    });
  }
});

// ─── debug_notes ──────────────────────────────────────────────────────────────

describe('debug_notes', () => {
  it('is a non-empty array', () => {
    const notes = run(51).debug_notes;
    expect(Array.isArray(notes)).toBe(true);
    expect(notes.length).toBeGreaterThan(0);
  });
  it('contains readiness value', () => {
    expect(run(51).debug_notes.some((n) => n.startsWith('readiness='))).toBe(true);
  });
  it('contains label', () => {
    expect(run(51).debug_notes.some((n) => n.startsWith('label='))).toBe(true);
  });
  it('contains modules count', () => {
    expect(run(51).debug_notes.some((n) => n.startsWith('modules='))).toBe(true);
  });
});

// ─── Determinism ──────────────────────────────────────────────────────────────

describe('determinism', () => {
  it('returns identical results for same input at 0', () => {
    expect(run(0)).toEqual(run(0));
  });
  it('returns identical results for same input at 51', () => {
    expect(run(51)).toEqual(run(51));
  });
  it('returns identical results for same input at 500', () => {
    expect(run(500)).toEqual(run(500));
  });
});

// ─── Stage regression ─────────────────────────────────────────────────────────

describe('Stage regression', () => {
  it('does not break stages 3-9 (engine is standalone)', () => {
    const r = run(51);
    expect(r.version).toBe('stage10_premium_longterm_experience_v1');
    expect(r.answer_count).toBe(51);
    expect(r.modules_total).toBe(8);
  });
  it('is stable at typical cumulative answer counts', () => {
    for (const n of [0, 5, 17, 34, 51, 85, 100]) {
      const r = run(n);
      expect(r.version).toBe('stage10_premium_longterm_experience_v1');
      expect(r.profile_readiness).toBeGreaterThanOrEqual(0);
      expect(r.profile_readiness).toBeLessThanOrEqual(95);
    }
  });
});
