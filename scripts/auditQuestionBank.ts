#!/usr/bin/env npx tsx
/**
 * auditQuestionBank.ts
 *
 * Detailed per-question quality audit. Reports production_status breakdown,
 * sensitivity/controversy distribution, and PL/EN completeness.
 *
 * Run: npx tsx scripts/auditQuestionBank.ts
 *      or: npm run audit:questions
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const Q_PATH = resolve(ROOT, 'public/v2/questions_all_2650.csv');
const A_PATH = resolve(ROOT, 'public/v2/answers_all_5300.csv');

function loadCsv(p: string): Record<string, string>[] {
  if (!existsSync(p)) { console.error(`File not found: ${p}`); process.exit(1); }
  const text = readFileSync(p, 'utf-8');
  return Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true }).data;
}

const questions = loadCsv(Q_PATH);
const answers   = loadCsv(A_PATH);

// Build answer index
const answersByQuestion = new Map<string, Record<string, string>[]>();
for (const a of answers) {
  const qid = (a['question_id'] ?? '').trim();
  if (!qid) continue;
  if (!answersByQuestion.has(qid)) answersByQuestion.set(qid, []);
  answersByQuestion.get(qid)!.push(a);
}

// ─── Production status breakdown ──────────────────────────────────────────────

const prodStatusCount = new Map<string, number>();
for (const q of questions) {
  const s = (q['production_status'] ?? 'unknown').trim();
  prodStatusCount.set(s, (prodStatusCount.get(s) ?? 0) + 1);
}

// ─── Tier breakdown ────────────────────────────────────────────────────────────

const tierCount = new Map<string, number>();
for (const q of questions) {
  const t = (q['tier'] ?? 'unknown').trim();
  tierCount.set(t, (tierCount.get(t) ?? 0) + 1);
}

// ─── Category breakdown ────────────────────────────────────────────────────────

const catCount = new Map<string, number>();
for (const q of questions) {
  const c = (q['category_en'] ?? 'unknown').trim();
  catCount.set(c, (catCount.get(c) ?? 0) + 1);
}

// ─── Sensitivity / controversy distribution ────────────────────────────────────

const sensitivityBuckets = { low: 0, mid: 0, high: 0, unknown: 0 };
const controversyBuckets = { low: 0, mid: 0, high: 0, unknown: 0 };

for (const q of questions) {
  const sens = parseFloat(q['sensitivity_level'] ?? '');
  const cont = parseFloat(q['controversy_level'] ?? '');

  if (isNaN(sens)) sensitivityBuckets.unknown++;
  else if (sens <= 3) sensitivityBuckets.low++;
  else if (sens <= 7) sensitivityBuckets.mid++;
  else sensitivityBuckets.high++;

  if (isNaN(cont)) controversyBuckets.unknown++;
  else if (cont <= 3) controversyBuckets.low++;
  else if (cont <= 7) controversyBuckets.mid++;
  else controversyBuckets.high++;
}

// ─── Answer count distribution ────────────────────────────────────────────────

const answerCountDist = new Map<number, number>();
for (const q of questions) {
  const qid = (q['question_id'] ?? '').trim();
  const n = (answersByQuestion.get(qid) ?? []).length;
  answerCountDist.set(n, (answerCountDist.get(n) ?? 0) + 1);
}

// ─── Pattern engine status ────────────────────────────────────────────────────

const patternStatusCount = new Map<string, number>();
for (const q of questions) {
  const s = (q['pattern_engine_status'] ?? 'unknown').trim();
  patternStatusCount.set(s, (patternStatusCount.get(s) ?? 0) + 1);
}

// ─── PL / EN completeness ─────────────────────────────────────────────────────

const missingPl = questions.filter(q => !(q['question_pl'] ?? '').trim()).length;
const missingEn = questions.filter(q => !(q['question_en'] ?? '').trim()).length;

// ─── Print report ─────────────────────────────────────────────────────────────

console.log('\n══════════════════════════════════════════════════════');
console.log('  THE OTHER 99 — Question Bank Audit');
console.log('══════════════════════════════════════════════════════\n');
console.log(`  Total questions : ${questions.length}`);
console.log(`  Total answers   : ${answers.length}\n`);

console.log('  PRODUCTION STATUS:');
for (const [s, n] of [...prodStatusCount.entries()].sort((a,b) => b[1]-a[1])) {
  console.log(`    ${s.padEnd(40)} ${String(n).padStart(5)}`);
}

console.log('\n  TIER BREAKDOWN:');
for (const [t, n] of [...tierCount.entries()].sort((a,b) => b[1]-a[1])) {
  console.log(`    ${t.padEnd(20)} ${String(n).padStart(5)}`);
}

console.log('\n  TOP CATEGORIES (EN):');
for (const [c, n] of [...catCount.entries()].sort((a,b) => b[1]-a[1]).slice(0,15)) {
  console.log(`    ${c.padEnd(40)} ${String(n).padStart(5)}`);
}

console.log('\n  SENSITIVITY DISTRIBUTION (1–10 scale):');
console.log(`    Low  (1–3)  : ${sensitivityBuckets.low}`);
console.log(`    Mid  (4–7)  : ${sensitivityBuckets.mid}`);
console.log(`    High (8–10) : ${sensitivityBuckets.high}`);
console.log(`    Unknown     : ${sensitivityBuckets.unknown}`);

console.log('\n  CONTROVERSY DISTRIBUTION (1–10 scale):');
console.log(`    Low  (1–3)  : ${controversyBuckets.low}`);
console.log(`    Mid  (4–7)  : ${controversyBuckets.mid}`);
console.log(`    High (8–10) : ${controversyBuckets.high}`);
console.log(`    Unknown     : ${controversyBuckets.unknown}`);

console.log('\n  ANSWERS PER QUESTION:');
for (const [n, count] of [...answerCountDist.entries()].sort((a,b) => a[0]-b[0])) {
  console.log(`    ${String(n).padStart(2)} answers : ${count} questions`);
}

console.log('\n  PATTERN ENGINE STATUS:');
for (const [s, n] of [...patternStatusCount.entries()].sort((a,b) => b[1]-a[1])) {
  console.log(`    ${s.padEnd(30)} ${String(n).padStart(5)}`);
}

console.log('\n  PL / EN COMPLETENESS:');
console.log(`    Missing question_pl : ${missingPl}`);
console.log(`    Missing question_en : ${missingEn}`);

console.log('\n══════════════════════════════════════════════════════\n');
