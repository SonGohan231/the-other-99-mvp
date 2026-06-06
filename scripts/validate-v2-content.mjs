#!/usr/bin/env node
/**
 * validate-v2-content.mjs
 * Full validation of the v2 database CSV files (public/v2/).
 * Uses PapaParse for correct handling of complex quoted CSV fields.
 *
 * Hard errors (exit 1):
 *   - Missing v2 CSV files
 *   - Fewer than 2650 questions or 5300 answers
 *   - Missing required columns (question_id, question_pl, question_en, axis_deltas_json,
 *     answer_reveal_short_pl, answer_reveal_short_en)
 *   - Questions with < 2 answers after join
 *   - axis_deltas_json containing unknown keys (not in AX01–AX10)
 *   - axis_deltas_json with non-numeric values or invalid JSON
 *
 * Warnings:
 *   - Answers with empty reveal copy
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─── Valid axis keys — must stay in sync with src/utils/axisKeyValidation.ts ──
const VALID_AXIS_KEYS = new Set([
  'AX01', 'AX02', 'AX03', 'AX04', 'AX05', 'AX06', 'AX07', 'AX08', 'AX09', 'AX10',
  'curiosity', 'openness', 'security', 'guardedness',
  'logic', 'observation', 'pattern', 'emotion', 'authenticity', 'present',
  'independence', 'connection', 'belonging', 'social',
  'action', 'courage',
  'future', 'change',
  'risk', 'thrill', 'adventure', 'danger', 'spontaneity', 'control',
  'pragmatism', 'idealism', 'contradiction',
  'stability', 'consistency', 'hesitation', 'resilience', 'transformation',
  'nature', 'technology',
  'creator', 'idea_creator', 'builder',
]);

const Q_PATH = resolve(ROOT, 'public/v2/questions_all_2650.csv');
const A_PATH = resolve(ROOT, 'public/v2/answers_all_5300.csv');

let errors = 0;
let warnings = 0;

function fail(msg) { console.error(`  ERROR: ${msg}`); errors++; }
function warn(msg) { console.warn(`  WARN:  ${msg}`); warnings++; }
function ok(msg)   { console.log(`  ✓ ${msg}`); }

// ─── Load CSVs ────────────────────────────────────────────────────────────────

let qText, aText;
try {
  qText = readFileSync(Q_PATH, 'utf-8');
} catch {
  fail(`Cannot read questions CSV: ${Q_PATH}`);
  console.log(`\nValidation FAILED (${errors} errors)`);
  process.exit(1);
}
try {
  aText = readFileSync(A_PATH, 'utf-8');
} catch {
  fail(`Cannot read answers CSV: ${A_PATH}`);
  console.log(`\nValidation FAILED (${errors} errors)`);
  process.exit(1);
}

const qResult = Papa.parse(qText, { header: true, skipEmptyLines: true });
const aResult = Papa.parse(aText, { header: true, skipEmptyLines: true });

const questions = qResult.data;
const answers   = aResult.data;

console.log(`\nv2 database validation:`);
console.log(`  questions loaded: ${questions.length}`);
console.log(`  answers loaded:   ${answers.length}`);

// ─── Row counts ───────────────────────────────────────────────────────────────

if (questions.length < 2650) {
  fail(`Expected ≥2650 questions, got ${questions.length}`);
} else {
  ok(`${questions.length} questions (≥2650)`);
}

if (answers.length < 5300) {
  fail(`Expected ≥5300 answers, got ${answers.length}`);
} else {
  ok(`${answers.length} answers (≥5300)`);
}

// ─── Required column presence ─────────────────────────────────────────────────

const qHeaders = qResult.meta.fields ?? [];
const aHeaders = aResult.meta.fields ?? [];

const requiredQCols = ['question_id', 'question_pl', 'question_en'];
const requiredACols = ['question_id', 'axis_deltas_json', 'answer_reveal_short_pl', 'answer_reveal_short_en'];

for (const col of requiredQCols) {
  if (!qHeaders.includes(col)) fail(`questions CSV missing required column: ${col}`);
  else ok(`questions has column "${col}"`);
}

for (const col of requiredACols) {
  if (!aHeaders.includes(col)) fail(`answers CSV missing required column: ${col}`);
  else ok(`answers has column "${col}"`);
}

// If critical columns missing, stop early to avoid noisy errors below
if (errors > 0) {
  console.log(`\nValidation FAILED (${errors} errors, ${warnings} warnings)`);
  process.exit(1);
}

// ─── Build answer index by question_id ────────────────────────────────────────

/** @type {Map<string, Array<Record<string, string>>>} */
const answersByQuestion = new Map();
for (const row of answers) {
  const qid = (row['question_id'] ?? '').trim();
  if (!qid) continue;
  if (!answersByQuestion.has(qid)) answersByQuestion.set(qid, []);
  answersByQuestion.get(qid).push(row);
}

// ─── Per-question validation ──────────────────────────────────────────────────

let questionsWithoutAnswers = 0;
let questionsWithOneAnswer = 0;
let axisKeyErrors = 0;
let revealMissingCount = 0;
let axisDeltaErrors = 0;

for (const q of questions) {
  const qid = (q['question_id'] ?? '').trim();
  if (!qid) { fail(`question row missing question_id`); continue; }

  const qAnswers = answersByQuestion.get(qid) ?? [];

  if (qAnswers.length === 0) {
    questionsWithoutAnswers++;
    if (questionsWithoutAnswers <= 5) fail(`question ${qid} has no answers`);
  } else if (qAnswers.length === 1) {
    questionsWithOneAnswer++;
    if (questionsWithOneAnswer <= 5) fail(`question ${qid} has only 1 answer (minimum is 2)`);
  }

  // Validate axis_deltas_json on each answer
  for (const ans of qAnswers) {
    const raw = (ans['axis_deltas_json'] ?? '').trim();
    if (!raw) continue; // open-type questions may have no deltas

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      axisDeltaErrors++;
      if (axisDeltaErrors <= 10) fail(`question ${qid}: axis_deltas_json invalid JSON: ${e.message}`);
      continue;
    }

    if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
      axisDeltaErrors++;
      if (axisDeltaErrors <= 10) fail(`question ${qid}: axis_deltas_json not a JSON object`);
      continue;
    }

    for (const k of Object.keys(parsed)) {
      if (typeof parsed[k] !== 'number') {
        axisDeltaErrors++;
        if (axisDeltaErrors <= 10) fail(`question ${qid}: axis key "${k}" has non-numeric value`);
      }
      if (!VALID_AXIS_KEYS.has(k)) {
        axisKeyErrors++;
        if (axisKeyErrors <= 10) fail(`question ${qid}: unknown axis key "${k}" — not in AX01–AX10 or POLE_MAP`);
      }
    }

    // Check TIER_1 reveal copy
    const revPl = (ans['answer_reveal_short_pl'] ?? '').trim();
    const revEn = (ans['answer_reveal_short_en'] ?? '').trim();
    if (!revPl || !revEn) {
      revealMissingCount++;
      if (revealMissingCount <= 5) warn(`question ${qid}: answer missing reveal copy (pl=${!!revPl}, en=${!!revEn})`);
    }
  }
}

if (questionsWithoutAnswers > 5) fail(`... and ${questionsWithoutAnswers - 5} more questions with no answers (${questionsWithoutAnswers} total)`);
if (questionsWithOneAnswer > 5) fail(`... and ${questionsWithOneAnswer - 5} more questions with only 1 answer (${questionsWithOneAnswer} total)`);
if (axisKeyErrors > 10) fail(`... and ${axisKeyErrors - 10} more unknown axis key errors (${axisKeyErrors} total)`);
if (axisDeltaErrors > 10) fail(`... and ${axisDeltaErrors - 10} more axis_deltas_json parse errors (${axisDeltaErrors} total)`);
if (revealMissingCount > 5) warn(`... and ${revealMissingCount - 5} more answers with missing reveal copy (${revealMissingCount} total)`);

// ─── Summary ──────────────────────────────────────────────────────────────────

if (questionsWithoutAnswers === 0 && questionsWithOneAnswer === 0) {
  ok(`All ${questions.length} questions have ≥2 answers`);
}
if (axisKeyErrors === 0 && axisDeltaErrors === 0) {
  ok(`All axis_deltas_json keys are valid (AX01–AX10 or recognized legacy poles)`);
}
if (revealMissingCount === 0) {
  ok(`All answers have TIER_1 reveal copy (answer_reveal_short_pl/en)`);
} else {
  warn(`${revealMissingCount} answers missing reveal copy (non-blocking)`);
}

// Count questions that have axis_deltas_json coverage on answers
const axisCoverage = new Map();
for (const [, ans] of answersByQuestion) {
  for (const a of ans) {
    const raw = (a['axis_deltas_json'] ?? '').trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      for (const k of Object.keys(parsed)) {
        if (VALID_AXIS_KEYS.has(k)) {
          axisCoverage.set(k, (axisCoverage.get(k) ?? 0) + 1);
        }
      }
    } catch { /* already reported */ }
  }
}

const canonicalCoverage = ['AX01','AX02','AX03','AX04','AX05','AX06','AX07','AX08','AX09','AX10'];
console.log(`\n  Canonical axis coverage (answer-level):`);
for (const ax of canonicalCoverage) {
  const n = axisCoverage.get(ax) ?? 0;
  const flag = n === 0 ? ' ⚠ ZERO' : '';
  console.log(`    ${ax.padEnd(5)} ${String(n).padStart(5)} answers${flag}`);
  if (n === 0) warn(`${ax} has zero answer-level coverage in v2 content`);
}

console.log(`\n${'─'.repeat(50)}`);
if (errors > 0) {
  console.log(`v2 Validation FAILED (${errors} errors, ${warnings} warnings)`);
  process.exit(1);
} else {
  console.log(`v2 Validation PASSED (${warnings} warnings)`);
  process.exit(0);
}
