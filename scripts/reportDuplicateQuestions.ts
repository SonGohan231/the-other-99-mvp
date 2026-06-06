#!/usr/bin/env npx tsx
/**
 * reportDuplicateQuestions.ts
 *
 * Finds duplicate question text and duplicate answer reveal copy across the v2 dataset.
 * Cross-question duplicate reveals are expected (systemic template pattern) — flagged WARN.
 *
 * Run: npx tsx scripts/reportDuplicateQuestions.ts
 *      or: npm run audit:duplicates
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

// ─── Duplicate question IDs ────────────────────────────────────────────────────

const qIdCount = new Map<string, number>();
for (const q of questions) {
  const id = (q['question_id'] ?? '').trim();
  qIdCount.set(id, (qIdCount.get(id) ?? 0) + 1);
}
const dupQIds = [...qIdCount.entries()].filter(([, n]) => n > 1);

// ─── Duplicate question text (EN) ────────────────────────────────────────────

const qTextMap = new Map<string, string[]>();
for (const q of questions) {
  const text = (q['question_en'] ?? '').trim().toLowerCase();
  const id   = (q['question_id'] ?? '').trim();
  if (!text) continue;
  if (!qTextMap.has(text)) qTextMap.set(text, []);
  qTextMap.get(text)!.push(id);
}
const dupQTexts = [...qTextMap.entries()].filter(([, ids]) => ids.length > 1);

// ─── Duplicate answer labels (EN) ────────────────────────────────────────────

const aLabelMap = new Map<string, string[]>();
for (const a of answers) {
  const label = (a['label_en'] ?? '').trim().toLowerCase();
  const aid   = (a['answer_id'] ?? '').trim();
  if (!label) continue;
  if (!aLabelMap.has(label)) aLabelMap.set(label, []);
  aLabelMap.get(label)!.push(aid);
}
const dupALabels = [...aLabelMap.entries()].filter(([, ids]) => ids.length > 1);

// ─── Duplicate TIER_1 reveals (EN) — cross-question ──────────────────────────

const revealMap = new Map<string, string[]>();  // reveal → question_ids
for (const a of answers) {
  const rev = (a['answer_reveal_short_en'] ?? '').trim();
  const qid = (a['question_id'] ?? '').trim();
  if (!rev) continue;
  if (!revealMap.has(rev)) revealMap.set(rev, []);
  const existing = revealMap.get(rev)!;
  if (!existing.includes(qid)) existing.push(qid);
}
const crossQRevealDups = [...revealMap.entries()].filter(([, qids]) => qids.length > 1);
const sameQRevealDups  = [...revealMap.entries()].filter(([, qids]) => qids.length === 1 && answers.filter(a => (a['answer_reveal_short_en'] ?? '').trim() === qids[0]).length > 1);

// ─── Print report ─────────────────────────────────────────────────────────────

console.log('\n══════════════════════════════════════════════════════');
console.log('  THE OTHER 99 — Duplicate Content Report');
console.log('══════════════════════════════════════════════════════\n');
console.log(`  Total questions : ${questions.length}`);
console.log(`  Total answers   : ${answers.length}\n`);

console.log('  DUPLICATE QUESTION IDs:');
if (dupQIds.length === 0) {
  console.log('    ✓ None found');
} else {
  for (const [id, n] of dupQIds) {
    console.log(`    ✗ ${id} appears ${n}× — FAIL`);
  }
}

console.log('\n  DUPLICATE QUESTION TEXT (EN, exact match):');
if (dupQTexts.length === 0) {
  console.log('    ✓ None found');
} else {
  for (const [text, ids] of dupQTexts.slice(0, 10)) {
    console.log(`    ✗ "${text.slice(0, 60)}..." → ${ids.join(', ')}`);
  }
  if (dupQTexts.length > 10) console.log(`    ... and ${dupQTexts.length - 10} more`);
}

console.log('\n  DUPLICATE ANSWER LABELS (EN, exact match):');
if (dupALabels.length === 0) {
  console.log('    ✓ None — (common labels like "Yes"/"No" expected)');
} else {
  console.log(`    ${dupALabels.length} duplicate label strings (expected — shared option text is normal)`);
  const top = dupALabels.sort((a,b) => b[1].length - a[1].length).slice(0, 5);
  for (const [label, ids] of top) {
    console.log(`      "${label}" → ${ids.length} answers`);
  }
}

console.log(`\n  CROSS-QUESTION DUPLICATE TIER_1 REVEALS (EN):`);
console.log(`    ${crossQRevealDups.length} reveal strings shared across multiple questions`);
console.log(`    Status: WARN (systemic template-style reveals — acceptable)\n`);
if (crossQRevealDups.length > 0) {
  const sample = crossQRevealDups.slice(0, 3);
  console.log('    Sample:');
  for (const [rev, qids] of sample) {
    console.log(`      "${rev.slice(0, 80)}"`);
    console.log(`      → ${qids.length} questions: ${qids.slice(0,3).join(', ')}${qids.length > 3 ? ' ...' : ''}`);
  }
}

console.log('\n══════════════════════════════════════════════════════\n');
