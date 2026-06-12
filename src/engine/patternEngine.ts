import { TestAnswer } from '../types';
import { CanonicalVector } from '../utils/canonicalVector';
import { BehavioralSummary } from '../utils/behavioralSignals';

// ─── Public types ──────────────────────────────────────────────────────────────

export type PatternLevel = 'first_signal' | 'stabilizing' | 'repeating_vector' | 'strong_pattern';
export type PatternDirection = 'positive' | 'negative' | 'mixed';
export type PatternCopyKey = 'axis_momentum' | 'cross_axis_pairing' | 'consistency' | 'exploration_hesitation';

export interface PatternSignal {
  id: string;
  level: PatternLevel;
  axis_id: string;
  direction: PatternDirection;
  strength: number;         // 0–100
  confidence: number;       // 0–100
  evidence_count: number;
  last_question_id: string;
  copy_key: PatternCopyKey;
  safe_text_en: string;
  safe_text_pl: string;
}

export interface PatternEngineResult {
  version: 'stage3_pattern_engine_v1';
  answers_analyzed: number;
  active_patterns: PatternSignal[];
  strongest_pattern: PatternSignal | null;
  confidence: number;       // 0–100
  next_pattern_in: number;  // answers until next threshold
  debug_notes: string[];
}

// ─── Thresholds ────────────────────────────────────────────────────────────────

// minAnswers: total profile answers required before this level can appear
// minEvidence: occurrences of the specific signal required
const THRESHOLDS: Record<PatternLevel, { minAnswers: number; minEvidence: number }> = {
  first_signal:     { minAnswers: 3,  minEvidence: 2 },
  stabilizing:      { minAnswers: 5,  minEvidence: 3 },
  repeating_vector: { minAnswers: 8,  minEvidence: 4 },
  strong_pattern:   { minAnswers: 12, minEvidence: 5 },
};

const LEVELS_DESC: PatternLevel[] = [
  'strong_pattern', 'repeating_vector', 'stabilizing', 'first_signal',
];

function getLevel(evidenceCount: number, totalAnswers: number): PatternLevel | null {
  for (const level of LEVELS_DESC) {
    const { minAnswers, minEvidence } = THRESHOLDS[level];
    if (totalAnswers >= minAnswers && evidenceCount >= minEvidence) return level;
  }
  return null;
}

function nextThreshold(totalAnswers: number): number {
  const ordered: PatternLevel[] = [
    'first_signal', 'stabilizing', 'repeating_vector', 'strong_pattern',
  ];
  for (const level of ordered) {
    if (totalAnswers < THRESHOLDS[level].minAnswers) {
      return THRESHOLDS[level].minAnswers - totalAnswers;
    }
  }
  return 0;
}

// ─── Safe copy — no diagnostic labels, no archetype names ─────────────────────

const COPY: Record<PatternCopyKey, Record<PatternLevel, { en: string; pl: string }>> = {
  axis_momentum: {
    first_signal:     {
      en: 'A repeated decision direction is starting to appear.',
      pl: 'Zaczyna pojawiać się powtarzalny kierunek decyzji.',
    },
    stabilizing:      {
      en: 'One direction in your decision style is beginning to stabilize.',
      pl: 'Jeden kierunek w Twoim stylu decydowania zaczyna się stabilizować.',
    },
    repeating_vector: {
      en: 'A consistent direction is emerging across your answers.',
      pl: 'W Twoich odpowiedziach wyłania się spójny kierunek.',
    },
    strong_pattern:   {
      en: 'This direction has become a defining part of how you decide.',
      pl: 'Ten kierunek stał się określającą częścią Twojego sposobu decydowania.',
    },
  },
  cross_axis_pairing: {
    first_signal:     {
      en: 'Two parts of your decision profile may be moving together.',
      pl: 'Dwie części Twojego profilu decyzji mogą poruszać się razem.',
    },
    stabilizing:      {
      en: 'Two parts of your decision style are starting to move together.',
      pl: 'Dwie części Twojego sposobu decydowania zaczynają poruszać się razem.',
    },
    repeating_vector: {
      en: 'A recurring pairing in your choices is becoming visible.',
      pl: 'Powtarzające się powiązanie w Twoich wyborach staje się widoczne.',
    },
    strong_pattern:   {
      en: 'Two dimensions of your profile consistently appear together.',
      pl: 'Dwa wymiary Twojego profilu konsekwentnie pojawiają się razem.',
    },
  },
  consistency: {
    first_signal:     {
      en: 'Your last answers are not random; they are beginning to form a line.',
      pl: 'Ostatnie odpowiedzi nie wyglądają losowo; zaczynają układać się w linię.',
    },
    stabilizing:      {
      en: 'A pattern of consistency is beginning to form.',
      pl: 'Zaczyna kształtować się wzorzec spójności.',
    },
    repeating_vector: {
      en: 'Your decision style is showing a clear internal logic.',
      pl: 'Twój styl decydowania ujawnia wyraźną wewnętrzną logikę.',
    },
    strong_pattern:   {
      en: 'Your answers are revealing a strong, consistent signal.',
      pl: 'Twoje odpowiedzi ujawniają silny, spójny sygnał.',
    },
  },
  exploration_hesitation: {
    first_signal:     {
      en: 'The pause before choosing may be part of the signal.',
      pl: 'Pauza przed wyborem może być częścią sygnału.',
    },
    stabilizing:      {
      en: 'Your decision timing suggests something worth noticing.',
      pl: 'Twój czas decyzji sugeruje coś wartego uwagi.',
    },
    repeating_vector: {
      en: 'How you approach a choice appears to be as consistent as the choice itself.',
      pl: 'Sposób, w jaki podchodzisz do wyboru, wydaje się tak spójny jak sam wybór.',
    },
    strong_pattern:   {
      en: 'Your decision rhythm may be revealing a pattern of its own.',
      pl: 'Twój rytm podejmowania decyzji może ujawniać własny wzorzec.',
    },
  },
};

// ─── Pattern A: Axis momentum ──────────────────────────────────────────────────

function detectAxisMomentum(answers: TestAnswer[], totalAnswers: number): PatternSignal[] {
  const axisCounts: Record<string, { pos: number; neg: number; lastQid: string }> = {};

  for (const answer of answers) {
    if (!answer.axis_delta_json) continue;
    for (const [axisId, delta] of Object.entries(answer.axis_delta_json)) {
      if (!Number.isFinite(delta) || delta === 0) continue;
      if (!axisCounts[axisId]) {
        axisCounts[axisId] = { pos: 0, neg: 0, lastQid: answer.content_id };
      }
      if (delta > 0) axisCounts[axisId].pos++;
      else axisCounts[axisId].neg++;
      axisCounts[axisId].lastQid = answer.content_id;
    }
  }

  const signals: PatternSignal[] = [];
  for (const [axisId, counts] of Object.entries(axisCounts)) {
    const direction: PatternDirection = counts.pos >= counts.neg ? 'positive' : 'negative';
    const evidenceCount = direction === 'positive' ? counts.pos : counts.neg;
    const level = getLevel(evidenceCount, totalAnswers);
    if (!level) continue;

    const copy = COPY.axis_momentum[level];
    signals.push({
      id: `axis_momentum_${axisId}_${direction}`,
      level,
      axis_id: axisId,
      direction,
      strength: Math.min(100, evidenceCount * 15),
      confidence: Math.min(100, evidenceCount * 12),
      evidence_count: evidenceCount,
      last_question_id: counts.lastQid,
      copy_key: 'axis_momentum',
      safe_text_en: copy.en,
      safe_text_pl: copy.pl,
    });
  }
  return signals;
}

// ─── Pattern B: Cross-axis pairing ────────────────────────────────────────────

function detectCrossAxisPairing(answers: TestAnswer[], totalAnswers: number): PatternSignal[] {
  const pairCounts: Record<string, { count: number; axes: [string, string]; lastQid: string }> = {};

  for (const answer of answers) {
    if (!answer.axis_delta_json) continue;
    const activeAxes = Object.entries(answer.axis_delta_json)
      .filter(([, d]) => Number.isFinite(d) && d !== 0)
      .map(([ax]) => ax)
      .sort();

    for (let i = 0; i < activeAxes.length; i++) {
      for (let j = i + 1; j < activeAxes.length; j++) {
        const a1 = activeAxes[i];
        const a2 = activeAxes[j];
        const key = `${a1}|${a2}`;
        if (!pairCounts[key]) {
          pairCounts[key] = { count: 0, axes: [a1, a2], lastQid: answer.content_id };
        }
        pairCounts[key].count++;
        pairCounts[key].lastQid = answer.content_id;
      }
    }
  }

  const signals: PatternSignal[] = [];
  for (const [, data] of Object.entries(pairCounts)) {
    const level = getLevel(data.count, totalAnswers);
    if (!level) continue;

    const copy = COPY.cross_axis_pairing[level];
    signals.push({
      id: `cross_axis_${data.axes.join('_')}`,
      level,
      axis_id: data.axes.join('+'),
      direction: 'mixed',
      strength: Math.min(100, data.count * 20),
      confidence: Math.min(100, data.count * 15),
      evidence_count: data.count,
      last_question_id: data.lastQid,
      copy_key: 'cross_axis_pairing',
      safe_text_en: copy.en,
      safe_text_pl: copy.pl,
    });
  }
  return signals;
}

// ─── Pattern C: Consistency streak ────────────────────────────────────────────

function detectConsistency(answers: TestAnswer[], totalAnswers: number): PatternSignal[] {
  const recent = answers.slice(-8);
  const axisStreaks: Record<string, { streak: number; direction: PatternDirection; lastQid: string }> = {};

  for (const answer of recent) {
    if (!answer.axis_delta_json) continue;
    for (const [axisId, delta] of Object.entries(answer.axis_delta_json)) {
      if (!Number.isFinite(delta) || delta === 0) continue;
      const dir: PatternDirection = delta > 0 ? 'positive' : 'negative';
      if (!axisStreaks[axisId]) {
        axisStreaks[axisId] = { streak: 1, direction: dir, lastQid: answer.content_id };
      } else if (axisStreaks[axisId].direction === dir) {
        axisStreaks[axisId].streak++;
        axisStreaks[axisId].lastQid = answer.content_id;
      } else {
        // direction reversed — start fresh
        axisStreaks[axisId] = { streak: 1, direction: dir, lastQid: answer.content_id };
      }
    }
  }

  const signals: PatternSignal[] = [];
  for (const [axisId, data] of Object.entries(axisStreaks)) {
    if (data.streak < 2) continue;
    const level = getLevel(data.streak, totalAnswers);
    if (!level) continue;

    const copy = COPY.consistency[level];
    signals.push({
      id: `consistency_${axisId}_${data.direction}`,
      level,
      axis_id: axisId,
      direction: data.direction,
      strength: Math.min(100, data.streak * 18),
      confidence: Math.min(100, data.streak * 14),
      evidence_count: data.streak,
      last_question_id: data.lastQid,
      copy_key: 'consistency',
      safe_text_en: copy.en,
      safe_text_pl: copy.pl,
    });
  }
  return signals;
}

// ─── Pattern D: Exploration / hesitation ──────────────────────────────────────

function detectExplorationHesitation(
  summary: BehavioralSummary | null,
  totalAnswers: number,
  lastQid: string,
): PatternSignal | null {
  if (!summary || summary.sampleSize < 3) return null;

  const hesitationMs = summary.avgHesitationMs ?? 0;
  const instability  = summary.avgInstabilitySignal;
  const changes      = summary.totalAnswerChanges;

  const isExploration =
    hesitationMs > 4000 ||
    changes >= 3 ||
    instability > 50;

  if (!isExploration) return null;

  const evidenceCount =
    1 +
    (hesitationMs > 4000 ? 1 : 0) +
    Math.min(3, changes) +
    (instability > 50 ? 1 : 0);

  const level = getLevel(evidenceCount, totalAnswers);
  if (!level) return null;

  const copy = COPY.exploration_hesitation[level];
  return {
    id: `exploration_hesitation_${level}`,
    level,
    axis_id: 'behavioral',
    direction: 'mixed',
    strength: Math.min(100, Math.round(instability * 0.7)),
    confidence: Math.min(100, summary.sampleSize * 8),
    evidence_count: evidenceCount,
    last_question_id: lastQid,
    copy_key: 'exploration_hesitation',
    safe_text_en: copy.en,
    safe_text_pl: copy.pl,
  };
}

// ─── Select strongest signal ───────────────────────────────────────────────────

const LEVEL_RANK: Record<PatternLevel, number> = {
  first_signal: 1,
  stabilizing: 2,
  repeating_vector: 3,
  strong_pattern: 4,
};

function selectStrongest(signals: PatternSignal[]): PatternSignal | null {
  if (!signals.length) return null;
  return signals.reduce((best, s) => {
    const bScore = LEVEL_RANK[best.level] * 100 + best.strength;
    const sScore = LEVEL_RANK[s.level] * 100 + s.strength;
    return sScore > bScore ? s : best;
  });
}

// ─── Main export ───────────────────────────────────────────────────────────────

export function computePatternEngine(
  testAnswers: TestAnswer[],
  totalAnswers: number,
  behavioralSummary: BehavioralSummary | null,
  _canonicalVector: CanonicalVector | null,
): PatternEngineResult {
  const notes: string[] = [];

  if (totalAnswers < 3) {
    return {
      version: 'stage3_pattern_engine_v1',
      answers_analyzed: testAnswers.length,
      active_patterns: [],
      strongest_pattern: null,
      confidence: 0,
      next_pattern_in: 3 - totalAnswers,
      debug_notes: [`Waiting: ${totalAnswers}/3 answers minimum.`],
    };
  }

  const lastQid = testAnswers[testAnswers.length - 1]?.content_id ?? '';

  const momentumSignals    = detectAxisMomentum(testAnswers, totalAnswers);
  const pairingSignals     = detectCrossAxisPairing(testAnswers, totalAnswers);
  const consistencySignals = detectConsistency(testAnswers, totalAnswers);
  const behavioralSignal   = detectExplorationHesitation(behavioralSummary, totalAnswers, lastQid);

  notes.push(
    `axis_momentum: ${momentumSignals.length}`,
    `cross_axis_pairing: ${pairingSignals.length}`,
    `consistency: ${consistencySignals.length}`,
    `exploration_hesitation: ${behavioralSignal ? 1 : 0}`,
    `session_answers: ${testAnswers.length}`,
    `total_answers: ${totalAnswers}`,
  );

  const allSignals: PatternSignal[] = [
    ...momentumSignals,
    ...pairingSignals,
    ...consistencySignals,
    ...(behavioralSignal ? [behavioralSignal] : []),
  ];

  const strongest = selectStrongest(allSignals);
  const confidence = strongest
    ? Math.round((LEVEL_RANK[strongest.level] / 4) * strongest.confidence)
    : 0;

  return {
    version: 'stage3_pattern_engine_v1',
    answers_analyzed: testAnswers.length,
    active_patterns: allSignals,
    strongest_pattern: strongest,
    confidence,
    next_pattern_in: nextThreshold(totalAnswers),
    debug_notes: notes,
  };
}
