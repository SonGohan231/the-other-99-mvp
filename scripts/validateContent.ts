#!/usr/bin/env npx tsx
/**
 * validateContent.ts
 *
 * Comprehensive v2 content validator. Hard-fails on any critical data
 * integrity issue so the issue surfaces in CI before reaching production.
 *
 * Run: npx tsx scripts/validateContent.ts
 *      or: npm run validate:full
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─── Canonical constants ───────────────────────────────────────────────────────

const VALID_AXIS_KEYS = new Set([
  'AX01','AX02','AX03','AX04','AX05','AX06','AX07','AX08','AX09','AX10',
]);

const VALID_REVEAL_TIERS = new Set(['TIER_1','TIER_2','TIER_3','TIER_5']);
const TIER1_REVEAL_MAX_CHARS = 200;

const TECHNICAL_LABEL_PATTERNS = [
  /AX\d{2}/,
  /HP0[123]/,
  /TIER_\d/,
  /pattern_ready/i,
  /mvp.ready/i,
  /beta.required/i,
  /question_id/i,
  /answer_id/i,
  /axis_delta/i,
];

// Files that may not exist yet — validators skip gracefully
const OPTIONAL_FILES = new Set([
  'v5_questions_1450.csv',
  'v5_answers_2900.csv',
  'remaining_mode_items_800.csv',
  'remaining_mode_answers_2100.csv',
  'micro_games_300.csv',
  'challenges_300.csv',
  'secrets_300.csv',
  'hidden_events.csv',
  'pattern_rules.csv',
  'contradiction_rules.csv',
  'emerging_archetype_templates.csv',
  'reveal_dosing_templates.csv',
]);

// ─── Result tracking ──────────────────────────────────────────────────────────

type Severity = 'FAIL' | 'WARN' | 'INFO';

interface Finding {
  severity: Severity;
  rule: string;
  message: string;
  context?: string;
}

const findings: Finding[] = [];
let failCount = 0;
let warnCount = 0;

function fail(rule: string, message: string, context?: string): void {
  findings.push({ severity: 'FAIL', rule, message, context });
  failCount++;
}

function warn(rule: string, message: string, context?: string): void {
  findings.push({ severity: 'WARN', rule, message, context });
  warnCount++;
}

function info(rule: string, message: string): void {
  findings.push({ severity: 'INFO', rule, message });
}

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function loadCsv(filePath: string): { data: Record<string, string>[]; fields: string[] } | null {
  if (!existsSync(filePath)) return null;
  const text = readFileSync(filePath, 'utf-8');
  const result = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  return { data: result.data, fields: result.meta.fields ?? [] };
}

function containsTechnicalLabel(text: string): boolean {
  return TECHNICAL_LABEL_PATTERNS.some(p => p.test(text));
}

// ─── Load required CSVs ───────────────────────────────────────────────────────

const Q_PATH = resolve(ROOT, 'public/v2/questions_all_2650.csv');
const A_PATH = resolve(ROOT, 'public/v2/answers_all_5300.csv');

console.log('\n══════════════════════════════════════════════════════');
console.log('  THE OTHER 99 — v2 Content Validator');
console.log('══════════════════════════════════════════════════════\n');

if (!existsSync(Q_PATH)) {
  fail('FILE_EXISTS', `Required questions CSV not found: ${Q_PATH}`);
  console.error(`FATAL: ${Q_PATH} missing. Cannot continue.`);
  process.exit(1);
}
if (!existsSync(A_PATH)) {
  fail('FILE_EXISTS', `Required answers CSV not found: ${A_PATH}`);
  console.error(`FATAL: ${A_PATH} missing. Cannot continue.`);
  process.exit(1);
}

const qCsv = loadCsv(Q_PATH)!;
const aCsv = loadCsv(A_PATH)!;

const questions = qCsv.data;
const answers = aCsv.data;

console.log(`  Questions loaded : ${questions.length}`);
console.log(`  Answers loaded   : ${answers.length}\n`);

// ─── RULE: Row counts ─────────────────────────────────────────────────────────

if (questions.length < 2650) {
  fail('ROW_COUNT_Q', `Expected ≥2650 questions, got ${questions.length}`);
} else {
  info('ROW_COUNT_Q', `${questions.length} questions ≥ 2650`);
}

if (answers.length < 5300) {
  fail('ROW_COUNT_A', `Expected ≥5300 answers, got ${answers.length}`);
} else {
  info('ROW_COUNT_A', `${answers.length} answers ≥ 5300`);
}

// ─── RULE: Duplicate IDs ──────────────────────────────────────────────────────

const qIds = questions.map(r => (r['question_id'] ?? '').trim());
const qIdSet = new Set<string>();
const dupQIds: string[] = [];
for (const id of qIds) {
  if (qIdSet.has(id)) dupQIds.push(id);
  else qIdSet.add(id);
}
if (dupQIds.length > 0) {
  fail('DUPLICATE_IDS', `${dupQIds.length} duplicate question_id(s): ${dupQIds.slice(0,5).join(', ')}${dupQIds.length > 5 ? ' ...' : ''}`);
} else {
  info('DUPLICATE_IDS', 'No duplicate question_ids');
}

const aIds = answers.map(r => (r['answer_id'] ?? '').trim());
const aIdSet = new Set<string>();
const dupAIds: string[] = [];
for (const id of aIds) {
  if (id && aIdSet.has(id)) dupAIds.push(id);
  else if (id) aIdSet.add(id);
}
if (dupAIds.length > 0) {
  fail('DUPLICATE_IDS', `${dupAIds.length} duplicate answer_id(s): ${dupAIds.slice(0,5).join(', ')}${dupAIds.length > 5 ? ' ...' : ''}`);
} else {
  info('DUPLICATE_IDS', 'No duplicate answer_ids');
}

// ─── Build answer index ────────────────────────────────────────────────────────

const answersByQuestion = new Map<string, Record<string, string>[]>();
for (const row of answers) {
  const qid = (row['question_id'] ?? '').trim();
  if (!qid) continue;
  if (!answersByQuestion.has(qid)) answersByQuestion.set(qid, []);
  answersByQuestion.get(qid)!.push(row);
}

// ─── Per-question rules ────────────────────────────────────────────────────────

let missingPlEn = 0;
let missingAnswers = 0;
let missingAxisAnyAnswer = 0;
let missingSafetyLabel = 0;
let missingStatSource = 0;
let missingSystemActions = 0;
let patternEnabledMissingMeta = 0;
let contradictionMissingMeta = 0;
let technicalLabelInUserText = 0;

for (const q of questions) {
  const qid = (q['question_id'] ?? '').trim();
  if (!qid) { fail('MISSING_PL_EN', 'Row has no question_id'); continue; }

  // RULE: PL / EN missing
  const qPl = (q['question_pl'] ?? '').trim();
  const qEn = (q['question_en'] ?? '').trim();
  if (!qPl || !qEn) {
    missingPlEn++;
    if (missingPlEn <= 5) fail('MISSING_PL_EN', `question_pl or question_en missing`, qid);
  }

  // RULE: safety_label missing
  const safetyLabel = (q['safety_label'] ?? '').trim();
  if (!safetyLabel) {
    missingSafetyLabel++;
    if (missingSafetyLabel <= 5) fail('MISSING_SAFETY_LABEL', 'safety_label is empty', qid);
  }

  // RULE: statistic_source_label missing
  const statSource = (q['statistic_source_label'] ?? '').trim();
  if (!statSource) {
    missingStatSource++;
    if (missingStatSource <= 5) fail('MISSING_STAT_SOURCE', 'statistic_source_label is empty', qid);
  }

  // RULE: system_actions (allowed_actions) missing
  const sysActions = (q['system_actions'] ?? '').trim();
  if (!sysActions) {
    missingSystemActions++;
    if (missingSystemActions <= 5) fail('MISSING_SYSTEM_ACTIONS', 'system_actions (allowed_actions) is empty', qid);
  }

  // RULE: pattern-enabled questions must have full pattern metadata
  const patternStatus = (q['pattern_engine_status'] ?? '').trim();
  if (patternStatus === 'pattern_ready_v2') {
    const missingFields: string[] = [];
    if (!(q['pattern_signal_id'] ?? '').trim()) missingFields.push('pattern_signal_id');
    if (!(q['pattern_axis_direction'] ?? '').trim()) missingFields.push('pattern_axis_direction');
    if (!(q['pattern_confidence_weight'] ?? '').trim()) missingFields.push('pattern_confidence_weight');
    if (!(q['pattern_min_occurrences'] ?? '').trim()) missingFields.push('pattern_min_occurrences');
    if (missingFields.length > 0) {
      patternEnabledMissingMeta++;
      if (patternEnabledMissingMeta <= 5)
        fail('PATTERN_META_MISSING', `pattern_ready_v2 question missing: ${missingFields.join(', ')}`, qid);
    }
  }

  // RULE: contradiction-enabled questions must have contradiction_pair_id
  const contPairId = (q['contradiction_pair_id'] ?? '').trim();
  const sysActionsLower = sysActions.toLowerCase();
  if (sysActionsLower.includes('contradiction') && !contPairId) {
    contradictionMissingMeta++;
    if (contradictionMissingMeta <= 5)
      fail('CONTRADICTION_META_MISSING', 'system_actions references contradiction but contradiction_pair_id is empty', qid);
  }

  // RULE: user-facing text must not contain technical labels
  if (qPl && containsTechnicalLabel(qPl)) {
    technicalLabelInUserText++;
    if (technicalLabelInUserText <= 5)
      fail('TECHNICAL_LABEL_IN_TEXT', `question_pl contains technical label`, qid);
  }
  if (qEn && containsTechnicalLabel(qEn)) {
    technicalLabelInUserText++;
    if (technicalLabelInUserText <= 5)
      fail('TECHNICAL_LABEL_IN_TEXT', `question_en contains technical label`, qid);
  }

  // RULE: answer options present
  const qAnswers = answersByQuestion.get(qid) ?? [];
  if (qAnswers.length < 2) {
    missingAnswers++;
    if (missingAnswers <= 5)
      fail('MISSING_ANSWERS', `question has ${qAnswers.length} answer(s), need ≥2`, qid);
  }

  // RULE: at least one answer has non-empty axis_deltas_json (scoring not empty)
  const hasAxisScoring = qAnswers.some(a => (a['axis_deltas_json'] ?? '').trim().length > 2);
  if (!hasAxisScoring && qAnswers.length > 0) {
    missingAxisAnyAnswer++;
    if (missingAxisAnyAnswer <= 5)
      warn('SCORING_EMPTY', `no answers have axis_deltas_json for this question`, qid);
  }
}

// Bulk summary for rules with many violations
if (missingPlEn > 5) fail('MISSING_PL_EN', `...and ${missingPlEn - 5} more questions missing PL/EN text (${missingPlEn} total)`);
if (missingAnswers > 5) fail('MISSING_ANSWERS', `...and ${missingAnswers - 5} more questions with <2 answers (${missingAnswers} total)`);
if (missingSafetyLabel > 5) fail('MISSING_SAFETY_LABEL', `...and ${missingSafetyLabel - 5} more missing safety_label (${missingSafetyLabel} total)`);
if (missingStatSource > 5) fail('MISSING_STAT_SOURCE', `...and ${missingStatSource - 5} more missing statistic_source_label (${missingStatSource} total)`);
if (missingSystemActions > 5) fail('MISSING_SYSTEM_ACTIONS', `...and ${missingSystemActions - 5} more missing system_actions (${missingSystemActions} total)`);
if (patternEnabledMissingMeta > 5) fail('PATTERN_META_MISSING', `...and ${patternEnabledMissingMeta - 5} more pattern_ready_v2 questions missing metadata (${patternEnabledMissingMeta} total)`);
if (contradictionMissingMeta > 5) fail('CONTRADICTION_META_MISSING', `...and ${contradictionMissingMeta - 5} more contradiction questions missing pair_id (${contradictionMissingMeta} total)`);
if (technicalLabelInUserText > 5) fail('TECHNICAL_LABEL_IN_TEXT', `...and ${technicalLabelInUserText - 5} more instances of technical labels in user text (${technicalLabelInUserText} total)`);
if (missingAxisAnyAnswer > 0) warn('SCORING_EMPTY', `${missingAxisAnyAnswer} questions have no axis scoring on any answer`);

// ─── Per-answer rules ──────────────────────────────────────────────────────────

let answerMissingPlEn = 0;
let invalidRevealTier = 0;
let tier1RevealTooLong = 0;
let axisParseErrors = 0;
let unknownAxisKeys = 0;
let answerTechnicalLabel = 0;

for (const a of answers) {
  const aid = (a['answer_id'] ?? '').trim();
  const qid = (a['question_id'] ?? '').trim();
  const ctx = `answer ${aid || '(no id)'} / question ${qid}`;

  // RULE: PL / EN label missing on answer
  const labelPl = (a['label_pl'] ?? '').trim();
  const labelEn = (a['label_en'] ?? '').trim();
  if (!labelPl || !labelEn) {
    answerMissingPlEn++;
    if (answerMissingPlEn <= 5) fail('MISSING_PL_EN', `answer label_pl or label_en missing`, ctx);
  }

  // RULE: reveal_tier must be in valid set
  const revealTier = (a['reveal_tier'] ?? '').trim();
  if (revealTier && !VALID_REVEAL_TIERS.has(revealTier)) {
    invalidRevealTier++;
    if (invalidRevealTier <= 5) fail('INVALID_REVEAL_TIER', `reveal_tier "${revealTier}" not in ${[...VALID_REVEAL_TIERS].join('|')}`, ctx);
  }

  // RULE: TIER_1 reveal must not exceed max chars
  const revShortPl = (a['answer_reveal_short_pl'] ?? '').trim();
  const revShortEn = (a['answer_reveal_short_en'] ?? '').trim();
  if (revShortPl.length > TIER1_REVEAL_MAX_CHARS) {
    tier1RevealTooLong++;
    if (tier1RevealTooLong <= 5)
      fail('TIER1_REVEAL_TOO_LONG', `answer_reveal_short_pl is ${revShortPl.length} chars (max ${TIER1_REVEAL_MAX_CHARS})`, ctx);
  }
  if (revShortEn.length > TIER1_REVEAL_MAX_CHARS) {
    tier1RevealTooLong++;
    if (tier1RevealTooLong <= 5)
      fail('TIER1_REVEAL_TOO_LONG', `answer_reveal_short_en is ${revShortEn.length} chars (max ${TIER1_REVEAL_MAX_CHARS})`, ctx);
  }

  // RULE: axis_deltas_json must be valid JSON with only canonical axis keys
  const rawDeltas = (a['axis_deltas_json'] ?? '').trim();
  if (rawDeltas && rawDeltas !== '{}') {
    try {
      const parsed = JSON.parse(rawDeltas) as Record<string, unknown>;
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v !== 'number') {
          axisParseErrors++;
          if (axisParseErrors <= 5) fail('AXIS_INVALID_VALUE', `axis key "${k}" has non-numeric value: ${JSON.stringify(v)}`, ctx);
        }
        if (!VALID_AXIS_KEYS.has(k)) {
          unknownAxisKeys++;
          if (unknownAxisKeys <= 5) fail('UNKNOWN_AXIS_KEY', `unknown axis key "${k}"`, ctx);
        }
      }
    } catch (e) {
      axisParseErrors++;
      if (axisParseErrors <= 5) fail('AXIS_INVALID_JSON', `axis_deltas_json parse error: ${(e as Error).message}`, ctx);
    }
  }

  // RULE: user-facing reveal text must not contain technical labels
  if (revShortPl && containsTechnicalLabel(revShortPl)) {
    answerTechnicalLabel++;
    if (answerTechnicalLabel <= 5) fail('TECHNICAL_LABEL_IN_TEXT', `answer_reveal_short_pl contains technical label`, ctx);
  }
  if (revShortEn && containsTechnicalLabel(revShortEn)) {
    answerTechnicalLabel++;
    if (answerTechnicalLabel <= 5) fail('TECHNICAL_LABEL_IN_TEXT', `answer_reveal_short_en contains technical label`, ctx);
  }
}

if (answerMissingPlEn > 5) fail('MISSING_PL_EN', `...and ${answerMissingPlEn - 5} more answers missing PL/EN labels (${answerMissingPlEn} total)`);
if (invalidRevealTier > 5) fail('INVALID_REVEAL_TIER', `...and ${invalidRevealTier - 5} more invalid reveal_tier values (${invalidRevealTier} total)`);
if (tier1RevealTooLong > 5) fail('TIER1_REVEAL_TOO_LONG', `...and ${tier1RevealTooLong - 5} more reveals exceeding ${TIER1_REVEAL_MAX_CHARS} chars (${tier1RevealTooLong} total)`);
if (axisParseErrors > 5) fail('AXIS_INVALID_JSON', `...and ${axisParseErrors - 5} more axis_deltas_json errors (${axisParseErrors} total)`);
if (unknownAxisKeys > 5) fail('UNKNOWN_AXIS_KEY', `...and ${unknownAxisKeys - 5} more unknown axis keys (${unknownAxisKeys} total)`);
if (answerTechnicalLabel > 5) fail('TECHNICAL_LABEL_IN_TEXT', `...and ${answerTechnicalLabel - 5} more answer reveals with technical labels (${answerTechnicalLabel} total)`);

// ─── Warnings: missing hidden_signal_deltas_json ──────────────────────────────

const missingHiddenSignal = answers.filter(a => !(a['hidden_signal_deltas_json'] ?? '').trim()).length;
if (missingHiddenSignal > 0) {
  warn('MISSING_HIDDEN_SIGNAL', `${missingHiddenSignal}/${answers.length} answers (${Math.round(100*missingHiddenSignal/answers.length)}%) missing hidden_signal_deltas_json`);
}

// ─── Warnings: cross-question duplicate reveals ──────────────────────────────

const revealsSeen = new Map<string, string>();
let crossQuestionDuplicates = 0;
for (const a of answers) {
  const rev = (a['answer_reveal_short_en'] ?? '').trim();
  const qid = (a['question_id'] ?? '').trim();
  if (!rev) continue;
  const seenQid = revealsSeen.get(rev);
  if (seenQid && seenQid !== qid) {
    crossQuestionDuplicates++;
  } else if (!seenQid) {
    revealsSeen.set(rev, qid);
  }
}
if (crossQuestionDuplicates > 0) {
  warn('DUPLICATE_REVEALS', `${crossQuestionDuplicates} cross-question duplicate answer_reveal_short_en values (systemic template reveals — acceptable)`);
}

// ─── Print findings ────────────────────────────────────────────────────────────

console.log('  FINDINGS:\n');
for (const f of findings) {
  const icon = f.severity === 'FAIL' ? '✗' : f.severity === 'WARN' ? '⚠' : '✓';
  const ctx = f.context ? ` [${f.context}]` : '';
  console.log(`  ${icon} [${f.rule}] ${f.message}${ctx}`);
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log('\n══════════════════════════════════════════════════════');
if (failCount > 0) {
  console.log(`  FAILED — ${failCount} error(s), ${warnCount} warning(s)`);
  console.log('══════════════════════════════════════════════════════\n');
  process.exit(1);
} else {
  console.log(`  PASSED — 0 errors, ${warnCount} warning(s)`);
  console.log('══════════════════════════════════════════════════════\n');
  process.exit(0);
}
