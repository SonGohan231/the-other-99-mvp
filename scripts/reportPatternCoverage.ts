#!/usr/bin/env npx tsx
/**
 * reportPatternCoverage.ts
 *
 * Audits pattern engine metadata coverage across questions and answers.
 *
 * Run: npx tsx scripts/reportPatternCoverage.ts
 *      or: npm run audit:patterns
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function loadCsv(p: string): Record<string, string>[] {
  if (!existsSync(p)) { console.error(`File not found: ${p}`); process.exit(1); }
  const text = readFileSync(p, 'utf-8');
  return Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true }).data;
}

const questions = loadCsv(resolve(ROOT, 'public/v2/questions_all_2650.csv'));
const answers   = loadCsv(resolve(ROOT, 'public/v2/answers_all_5300.csv'));

// ─── pattern_engine_status breakdown ─────────────────────────────────────────

const engineStatusCount = new Map<string, number>();
for (const q of questions) {
  const s = (q['pattern_engine_status'] ?? '').trim() || '(empty)';
  engineStatusCount.set(s, (engineStatusCount.get(s) ?? 0) + 1);
}

// ─── Questions with pattern_ready_v2 and missing fields ──────────────────────

const patternFields = ['pattern_signal_id','pattern_axis_direction','pattern_confidence_weight','pattern_min_occurrences','pattern_tags'];

const readyQuestions = questions.filter(q => (q['pattern_engine_status'] ?? '').trim() === 'pattern_ready_v2');
const missingByField = new Map<string, number>();

for (const q of readyQuestions) {
  for (const field of patternFields) {
    if (!(q[field] ?? '').trim()) {
      missingByField.set(field, (missingByField.get(field) ?? 0) + 1);
    }
  }
}

// ─── pattern_signal_id uniqueness ────────────────────────────────────────────

const signalIdCount = new Map<string, number>();
for (const q of questions) {
  const id = (q['pattern_signal_id'] ?? '').trim();
  if (id) signalIdCount.set(id, (signalIdCount.get(id) ?? 0) + 1);
}
const uniqueSignalIds = signalIdCount.size;
const sharedSignalIds = [...signalIdCount.entries()].filter(([,n]) => n > 1);

// ─── pattern_axis_direction values ───────────────────────────────────────────

const axisDirectionCount = new Map<string, number>();
for (const q of questions) {
  const d = (q['pattern_axis_direction'] ?? '').trim() || '(empty)';
  axisDirectionCount.set(d, (axisDirectionCount.get(d) ?? 0) + 1);
}

// ─── Answer-level pattern fields ─────────────────────────────────────────────

const aPatternFields = ['pattern_signal_id','pattern_axis_direction','pattern_confidence_weight','pattern_min_occurrences'];
const aMissingByField = new Map<string, number>();
for (const a of answers) {
  for (const field of aPatternFields) {
    if (!(a[field] ?? '').trim()) {
      aMissingByField.set(field, (aMissingByField.get(field) ?? 0) + 1);
    }
  }
}

// ─── hidden_signal_deltas_json coverage ──────────────────────────────────────

const hiddenSignalPresent = answers.filter(a => (a['hidden_signal_deltas_json'] ?? '').trim()).length;
const hiddenSignalMissing = answers.length - hiddenSignalPresent;

// ─── Print report ─────────────────────────────────────────────────────────────

console.log('\n══════════════════════════════════════════════════════');
console.log('  THE OTHER 99 — Pattern Engine Coverage Report');
console.log('══════════════════════════════════════════════════════\n');
console.log(`  Total questions : ${questions.length}`);
console.log(`  Total answers   : ${answers.length}\n`);

console.log('  PATTERN ENGINE STATUS (questions):');
for (const [s, n] of [...engineStatusCount.entries()].sort((a,b) => b[1]-a[1])) {
  const pct = (100 * n / questions.length).toFixed(1);
  const icon = s === 'pattern_ready_v2' ? '✓' : '·';
  console.log(`    ${icon} ${s.padEnd(35)} ${String(n).padStart(5)} (${pct}%)`);
}

console.log(`\n  PATTERN_READY_V2 QUESTIONS: ${readyQuestions.length}`);
console.log('  Missing pattern fields in pattern_ready_v2 questions:');
if (patternFields.every(f => (missingByField.get(f) ?? 0) === 0)) {
  console.log('    ✓ All pattern fields complete');
} else {
  for (const f of patternFields) {
    const n = missingByField.get(f) ?? 0;
    if (n > 0) console.log(`    ⚠ ${f.padEnd(35)} ${n} missing`);
  }
}

console.log(`\n  UNIQUE pattern_signal_ids : ${uniqueSignalIds}`);
if (sharedSignalIds.length > 0) {
  console.log(`  Shared signal_ids (used by multiple questions):`);
  for (const [id, n] of sharedSignalIds.slice(0, 10)) {
    console.log(`    ${id} → ${n} questions`);
  }
  if (sharedSignalIds.length > 10) console.log(`    ...and ${sharedSignalIds.length - 10} more`);
}

console.log('\n  PATTERN_AXIS_DIRECTION VALUES:');
for (const [d, n] of [...axisDirectionCount.entries()].sort((a,b) => b[1]-a[1]).slice(0, 15)) {
  console.log(`    ${d.padEnd(30)} ${String(n).padStart(5)}`);
}

console.log('\n  ANSWER-LEVEL PATTERN FIELD COVERAGE:');
for (const f of aPatternFields) {
  const missing = aMissingByField.get(f) ?? 0;
  const present = answers.length - missing;
  const pct = (100 * present / answers.length).toFixed(1);
  const icon = missing === 0 ? '✓' : '·';
  console.log(`    ${icon} ${f.padEnd(35)} ${present}/${answers.length} (${pct}%) present`);
}

console.log('\n  HIDDEN SIGNAL DELTAS COVERAGE:');
const hsPct = (100 * hiddenSignalPresent / answers.length).toFixed(1);
console.log(`    Present : ${hiddenSignalPresent} / ${answers.length} (${hsPct}%)`);
console.log(`    Missing : ${hiddenSignalMissing}  ${hiddenSignalMissing > 0 ? '⚠ WARN (non-blocking)' : '✓'}`);

console.log('\n══════════════════════════════════════════════════════\n');
