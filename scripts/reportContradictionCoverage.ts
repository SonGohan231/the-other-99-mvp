#!/usr/bin/env npx tsx
/**
 * reportContradictionCoverage.ts
 *
 * Audits contradiction pair coverage and integrity in the v2 question dataset.
 *
 * Run: npx tsx scripts/reportContradictionCoverage.ts
 *      or: npm run audit:contradictions
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

// ─── Contradiction pair index ──────────────────────────────────────────────────

const qById = new Map<string, Record<string, string>>();
for (const q of questions) {
  const id = (q['question_id'] ?? '').trim();
  if (id) qById.set(id, q);
}

const contradictionPairs = new Map<string, string[]>();  // pair_id → [qid, ...]
const questionsWithPair: Record<string, string>[] = [];

for (const q of questions) {
  const pairId = (q['contradiction_pair_id'] ?? '').trim();
  if (!pairId) continue;
  questionsWithPair.push(q);
  if (!contradictionPairs.has(pairId)) contradictionPairs.set(pairId, []);
  contradictionPairs.get(pairId)!.push((q['question_id'] ?? '').trim());
}

// ─── Pair validation ───────────────────────────────────────────────────────────

const singletonPairs: [string, string[]][] = [];
const validPairs: [string, string[]][] = [];
const largePairs: [string, string[]][] = [];

for (const [pairId, qids] of contradictionPairs.entries()) {
  if (qids.length === 1) singletonPairs.push([pairId, qids]);
  else if (qids.length === 2) validPairs.push([pairId, qids]);
  else largePairs.push([pairId, qids]);
}

// ─── system_actions contradiction references ──────────────────────────────────

const systemActionsContradiction = questions.filter(q =>
  (q['system_actions'] ?? '').toLowerCase().includes('contradiction')
);
const systemActionsContradictionWithPair = systemActionsContradiction.filter(q =>
  (q['contradiction_pair_id'] ?? '').trim()
);
const systemActionsContradictionMissingPair = systemActionsContradiction.filter(q =>
  !(q['contradiction_pair_id'] ?? '').trim()
);

// ─── Primary axis distribution of contradicting questions ─────────────────────

const pairAxisDist = new Map<string, number>();
for (const q of questionsWithPair) {
  const ax = (q['primary_axis'] ?? '').trim().toUpperCase();
  if (ax) pairAxisDist.set(ax, (pairAxisDist.get(ax) ?? 0) + 1);
}

// ─── Print report ─────────────────────────────────────────────────────────────

console.log('\n══════════════════════════════════════════════════════');
console.log('  THE OTHER 99 — Contradiction Coverage Report');
console.log('══════════════════════════════════════════════════════\n');
console.log(`  Total questions          : ${questions.length}`);
console.log(`  Questions with pair_id   : ${questionsWithPair.length}`);
console.log(`  Unique contradiction pairs: ${contradictionPairs.size}\n`);

console.log('  PAIR INTEGRITY:');
console.log(`    ✓ Valid pairs (exactly 2 questions)  : ${validPairs.length}`);
console.log(`    ⚠ Singleton pairs (only 1 question)  : ${singletonPairs.length}  ${singletonPairs.length > 0 ? '— WARN (dangling pair_id)' : ''}`);
console.log(`    · Large pairs (3+ questions)          : ${largePairs.length}  ${largePairs.length > 0 ? '— INFO' : ''}`);

if (singletonPairs.length > 0) {
  console.log('\n  SINGLETON PAIRS (pair_id with only 1 question):');
  for (const [pairId, qids] of singletonPairs.slice(0, 10)) {
    console.log(`    ${pairId} → ${qids[0]}`);
  }
  if (singletonPairs.length > 10) console.log(`    ...and ${singletonPairs.length - 10} more`);
}

console.log('\n  SYSTEM_ACTIONS CONTRADICTION REFERENCE:');
console.log(`    Questions referencing contradiction in system_actions : ${systemActionsContradiction.length}`);
console.log(`      With contradiction_pair_id    : ${systemActionsContradictionWithPair.length}`);
console.log(`      Missing contradiction_pair_id : ${systemActionsContradictionMissingPair.length}  ${systemActionsContradictionMissingPair.length > 0 ? '⚠ FAIL' : '✓'}`);

if (systemActionsContradictionMissingPair.length > 0) {
  console.log('\n  MISSING PAIR IDs (system_actions has contradiction but no pair_id):');
  for (const q of systemActionsContradictionMissingPair.slice(0, 5)) {
    console.log(`    ${q['question_id']} — ${(q['question_en'] ?? '').slice(0, 60)}`);
  }
}

console.log('\n  PRIMARY AXIS DISTRIBUTION (questions with contradiction_pair_id):');
const CANONICAL_AXES = ['AX01','AX02','AX03','AX04','AX05','AX06','AX07','AX08','AX09','AX10'];
for (const ax of CANONICAL_AXES) {
  const n = pairAxisDist.get(ax) ?? 0;
  const pct = questionsWithPair.length > 0 ? (100 * n / questionsWithPair.length).toFixed(1) : '0.0';
  console.log(`    ${ax.padEnd(8)} ${String(n).padStart(5)} (${pct}%)`);
}

console.log('\n══════════════════════════════════════════════════════\n');
