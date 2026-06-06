#!/usr/bin/env npx tsx
/**
 * reportAxisCoverage.ts
 *
 * Reports how many questions and answers touch each canonical axis (AX01–AX10).
 *
 * Run: npx tsx scripts/reportAxisCoverage.ts
 *      or: npm run audit:axes
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const CANONICAL_AXES = ['AX01','AX02','AX03','AX04','AX05','AX06','AX07','AX08','AX09','AX10'] as const;

function loadCsv(p: string): Record<string, string>[] {
  if (!existsSync(p)) { console.error(`File not found: ${p}`); process.exit(1); }
  const text = readFileSync(p, 'utf-8');
  return Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true }).data;
}

const questions = loadCsv(resolve(ROOT, 'public/v2/questions_all_2650.csv'));
const answers   = loadCsv(resolve(ROOT, 'public/v2/answers_all_5300.csv'));

// ─── Primary axis coverage from questions CSV ─────────────────────────────────

const primaryAxisCount = new Map<string, number>();
for (const q of questions) {
  const ax = (q['primary_axis'] ?? '').trim().toUpperCase();
  if (ax) primaryAxisCount.set(ax, (primaryAxisCount.get(ax) ?? 0) + 1);
}

// ─── Axis delta coverage from answers CSV ────────────────────────────────────

const axisDeltaCount   = new Map<string, number>();    // how many answers touch this axis
const axisDeltaSum     = new Map<string, number>();    // cumulative delta values
const axisDeltaAbsSum  = new Map<string, number>();    // cumulative |delta| for avg strength

for (const a of answers) {
  const raw = (a['axis_deltas_json'] ?? '').trim();
  if (!raw || raw === '{}') continue;
  try {
    const parsed = JSON.parse(raw) as Record<string, number>;
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'number') {
        axisDeltaCount.set(k, (axisDeltaCount.get(k) ?? 0) + 1);
        axisDeltaSum.set(k, (axisDeltaSum.get(k) ?? 0) + v);
        axisDeltaAbsSum.set(k, (axisDeltaAbsSum.get(k) ?? 0) + Math.abs(v));
      }
    }
  } catch { /* malformed — already reported by validateContent */ }
}

// ─── Print report ─────────────────────────────────────────────────────────────

console.log('\n══════════════════════════════════════════════════════');
console.log('  THE OTHER 99 — Axis Coverage Report');
console.log('══════════════════════════════════════════════════════\n');
console.log(`  Questions : ${questions.length}   Answers : ${answers.length}\n`);

console.log('  PRIMARY AXIS (from questions.primary_axis):');
console.log(`  ${'Axis'.padEnd(8)} ${'Count'.padStart(6)} ${'% of Qs'.padStart(10)}`);
console.log('  ' + '─'.repeat(26));
for (const ax of CANONICAL_AXES) {
  const n = primaryAxisCount.get(ax) ?? 0;
  const pct = (100 * n / questions.length).toFixed(1);
  const flag = n === 0 ? '  ⚠ ZERO' : '';
  console.log(`  ${ax.padEnd(8)} ${String(n).padStart(6)} ${(pct + '%').padStart(10)}${flag}`);
}

console.log('\n  AXIS DELTA COVERAGE (from answers.axis_deltas_json):');
console.log(`  ${'Axis'.padEnd(8)} ${'Answers'.padStart(8)} ${'% of As'.padStart(10)} ${'Avg |Δ|'.padStart(10)}`);
console.log('  ' + '─'.repeat(42));
for (const ax of CANONICAL_AXES) {
  const n    = axisDeltaCount.get(ax) ?? 0;
  const pct  = (100 * n / answers.length).toFixed(1);
  const abs  = axisDeltaAbsSum.get(ax) ?? 0;
  const avg  = n > 0 ? (abs / n).toFixed(2) : '—';
  const flag = n === 0 ? '  ⚠ ZERO' : '';
  console.log(`  ${ax.padEnd(8)} ${String(n).padStart(8)} ${(pct + '%').padStart(10)} ${avg.padStart(10)}${flag}`);
}

// Unknown axes
const unknownAxes = [...axisDeltaCount.keys()].filter(k => !CANONICAL_AXES.includes(k as typeof CANONICAL_AXES[number]));
if (unknownAxes.length > 0) {
  console.log('\n  ⚠ UNKNOWN AXIS KEYS FOUND IN axis_deltas_json:');
  for (const k of unknownAxes) {
    console.log(`    ${k} (${axisDeltaCount.get(k)} occurrences)`);
  }
}

console.log('\n══════════════════════════════════════════════════════\n');
