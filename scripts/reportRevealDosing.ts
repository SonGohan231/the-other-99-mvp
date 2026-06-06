#!/usr/bin/env npx tsx
/**
 * reportRevealDosing.ts
 *
 * Audits reveal copy length, tier distribution, and dosing policy values
 * across the v2 answer dataset.
 *
 * Run: npx tsx scripts/reportRevealDosing.ts
 *      or: npm run audit:reveals
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const TIER1_MAX_CHARS = 200;

function loadCsv(p: string): Record<string, string>[] {
  if (!existsSync(p)) { console.error(`File not found: ${p}`); process.exit(1); }
  const text = readFileSync(p, 'utf-8');
  return Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true }).data;
}

const questions = loadCsv(resolve(ROOT, 'public/v2/questions_all_2650.csv'));
const answers   = loadCsv(resolve(ROOT, 'public/v2/answers_all_5300.csv'));

// ─── TIER_1 reveal length stats ───────────────────────────────────────────────

const revealLengthsPl: number[] = [];
const revealLengthsEn: number[] = [];
let missingRevealPl = 0;
let missingRevealEn = 0;
let tooLongPl = 0;
let tooLongEn = 0;
const lengthBuckets = { '0': 0, '1–80': 0, '81–120': 0, '121–160': 0, '161–200': 0, '>200': 0 };

for (const a of answers) {
  const pl = (a['answer_reveal_short_pl'] ?? '').trim();
  const en = (a['answer_reveal_short_en'] ?? '').trim();

  if (!pl) missingRevealPl++;
  else revealLengthsPl.push(pl.length);

  if (!en) missingRevealEn++;
  else {
    revealLengthsEn.push(en.length);
    if (en.length === 0) lengthBuckets['0']++;
    else if (en.length <= 80) lengthBuckets['1–80']++;
    else if (en.length <= 120) lengthBuckets['81–120']++;
    else if (en.length <= 160) lengthBuckets['121–160']++;
    else if (en.length <= 200) lengthBuckets['161–200']++;
    else { lengthBuckets['>200']++; tooLongEn++; }
  }

  if (pl.length > TIER1_MAX_CHARS) tooLongPl++;
}

function stats(arr: number[]): { min: number; max: number; avg: number } {
  if (arr.length === 0) return { min: 0, max: 0, avg: 0 };
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
  return { min, max, avg };
}

const plStats = stats(revealLengthsPl);
const enStats = stats(revealLengthsEn);

// ─── Reveal tier distribution ─────────────────────────────────────────────────

const revealTierCount = new Map<string, number>();
for (const a of answers) {
  const t = (a['reveal_tier'] ?? '').trim() || '(empty)';
  revealTierCount.set(t, (revealTierCount.get(t) ?? 0) + 1);
}

// ─── Reveal depth distribution ────────────────────────────────────────────────

const revealDepthCount = new Map<string, number>();
for (const a of answers) {
  const d = (a['reveal_depth'] ?? '').trim() || '(empty)';
  revealDepthCount.set(d, (revealDepthCount.get(d) ?? 0) + 1);
}

// ─── Dosing policy distribution (questions) ───────────────────────────────────

const dosingCount = new Map<string, number>();
for (const q of questions) {
  const p = (q['reveal_dosing_policy'] ?? '').trim() || '(empty)';
  dosingCount.set(p, (dosingCount.get(p) ?? 0) + 1);
}

// ─── Wow refinement status ────────────────────────────────────────────────────

const wowStatusCount = new Map<string, number>();
for (const a of answers) {
  const s = (a['wow_refinement_status'] ?? '').trim() || '(empty)';
  wowStatusCount.set(s, (wowStatusCount.get(s) ?? 0) + 1);
}

// ─── Print report ─────────────────────────────────────────────────────────────

console.log('\n══════════════════════════════════════════════════════');
console.log('  THE OTHER 99 — Reveal Dosing & Quality Report');
console.log('══════════════════════════════════════════════════════\n');
console.log(`  Total answers : ${answers.length}\n`);

console.log('  TIER_1 REVEAL LENGTH — POLISH (answer_reveal_short_pl):');
console.log(`    Min     : ${plStats.min} chars`);
console.log(`    Max     : ${plStats.max} chars`);
console.log(`    Avg     : ${plStats.avg.toFixed(1)} chars`);
console.log(`    Missing : ${missingRevealPl}`);
console.log(`    > ${TIER1_MAX_CHARS} chars : ${tooLongPl}  ${tooLongPl > 0 ? '⚠ FAIL' : '✓'}`);

console.log('\n  TIER_1 REVEAL LENGTH — ENGLISH (answer_reveal_short_en):');
console.log(`    Min     : ${enStats.min} chars`);
console.log(`    Max     : ${enStats.max} chars`);
console.log(`    Avg     : ${enStats.avg.toFixed(1)} chars`);
console.log(`    Missing : ${missingRevealEn}`);
console.log(`    > ${TIER1_MAX_CHARS} chars : ${tooLongEn}  ${tooLongEn > 0 ? '⚠ FAIL' : '✓'}`);

console.log('\n  TIER_1 REVEAL LENGTH BUCKETS (EN):');
for (const [bucket, n] of Object.entries(lengthBuckets)) {
  const pct = (100 * n / answers.length).toFixed(1);
  console.log(`    ${bucket.padEnd(12)} : ${String(n).padStart(5)} answers (${pct}%)`);
}

console.log('\n  REVEAL TIER DISTRIBUTION:');
for (const [t, n] of [...revealTierCount.entries()].sort((a,b) => b[1]-a[1])) {
  const pct = (100 * n / answers.length).toFixed(1);
  console.log(`    ${t.padEnd(20)} ${String(n).padStart(6)} (${pct}%)`);
}

console.log('\n  REVEAL DEPTH DISTRIBUTION:');
for (const [d, n] of [...revealDepthCount.entries()].sort((a,b) => b[1]-a[1])) {
  console.log(`    ${d.padEnd(20)} ${String(n).padStart(6)}`);
}

console.log('\n  REVEAL DOSING POLICY (questions):');
for (const [p, n] of [...dosingCount.entries()].sort((a,b) => b[1]-a[1])) {
  console.log(`    ${p.padEnd(30)} ${String(n).padStart(6)}`);
}

console.log('\n  WOW REFINEMENT STATUS:');
for (const [s, n] of [...wowStatusCount.entries()].sort((a,b) => b[1]-a[1])) {
  const pct = (100 * n / answers.length).toFixed(1);
  console.log(`    ${s.padEnd(45)} ${String(n).padStart(6)} (${pct}%)`);
}

console.log('\n══════════════════════════════════════════════════════\n');
