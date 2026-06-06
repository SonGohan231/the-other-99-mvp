#!/usr/bin/env node
/**
 * Content quality audit script for The Other 99 v2 content bank.
 * Reads public/v2/questions_all_2650.csv and public/v2/answers_all_5300.csv,
 * runs quality checks, and writes reports to reports/.
 *
 * Usage: node scripts/audit-content-quality.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─── CSV Parser ───────────────────────────────────────────────────────────────

function parseCsv(text) {
  const lines = text.split('\n');
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().replace(/^﻿/, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = splitCsvLine(line);
    const row = {};
    headers.forEach((h, idx) => { row[h] = (values[idx] ?? '').trim(); });
    rows.push(row);
  }
  return rows;
}

function splitCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ─── Load CSVs ────────────────────────────────────────────────────────────────

const Q_PATH = resolve(ROOT, 'public/v2/questions_all_2650.csv');
const A_PATH = resolve(ROOT, 'public/v2/answers_all_5300.csv');

console.log('Loading questions CSV…');
const questionRows = parseCsv(readFileSync(Q_PATH, 'utf8'));
console.log(`  → ${questionRows.length} rows`);

console.log('Loading answers CSV…');
const answerRows = parseCsv(readFileSync(A_PATH, 'utf8'));
console.log(`  → ${answerRows.length} rows`);

// ─── Config ───────────────────────────────────────────────────────────────────

const CANONICAL_AXES = ['AX01','AX02','AX03','AX04','AX05','AX06','AX07','AX08','AX09','AX10'];

const BLOCKED_CATEGORY_KEYWORDS = [
  'product research', 'transparent product', 'developer',
  'roadmap', 'feature voting', 'app development', 'feedback',
];

const VAGUE_ANSWER_PATTERNS = [
  /^the (void|echo|silence|shadow|unknown|darkness|light|mirror|ashes|dust|abyss|nothing|everything)$/i,
  /^(yes|no|maybe|perhaps|sometimes|always|never|idk|i don't know)$/i,
  /^[a-z]{1,4}$/i,
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isBlockedCategory(cat) {
  const lower = (cat || '').toLowerCase();
  return BLOCKED_CATEGORY_KEYWORDS.some((kw) => lower.includes(kw));
}

function isVagueAnswer(label) {
  const t = (label || '').trim();
  if (!t || t.length < 2) return true;
  return VAGUE_ANSWER_PATTERNS.some((re) => re.test(t));
}

function parseAxisDeltas(raw) {
  try { return JSON.parse(raw); } catch { return null; }
}

// ─── Group answers by question ────────────────────────────────────────────────

const answersByQuestion = {};
for (const row of answerRows) {
  const qid = row.question_id;
  if (!qid) continue;
  if (!answersByQuestion[qid]) answersByQuestion[qid] = [];
  answersByQuestion[qid].push(row);
}

// ─── Question-level checks ────────────────────────────────────────────────────

const issues = {
  blocked_category: [],
  missing_english_question: [],
  missing_primary_axis: [],
  invalid_primary_axis: [],
  too_few_answers: [],
  vague_answers: [],
  no_axis_deltas: [],
  duplicate_answer_templates: [],
  unclear_questions: [],
};

const categoryDistribution = {};
const axisDistribution = {};
const rarityDistribution = {};
let totalAnswers = 0;
let answersWithDeltas = 0;
let answersWithoutDeltas = 0;

for (const q of questionRows) {
  const qid = q.question_id;
  const catEn = q.category_en || '';
  const qEn = q.question_en || '';
  const primaryAxis = q.primary_axis || '';
  const answers = answersByQuestion[qid] || [];

  // Category distribution
  const catKey = catEn || '(empty)';
  categoryDistribution[catKey] = (categoryDistribution[catKey] || 0) + 1;

  // Axis distribution
  if (primaryAxis) {
    axisDistribution[primaryAxis] = (axisDistribution[primaryAxis] || 0) + 1;
  }

  // Rarity distribution (from rarity_weight)
  const rw = parseFloat(q.rarity_weight) || 0;
  const rarityBucket = rw >= 0.8 ? 'legendary' : rw >= 0.6 ? 'epic' : rw >= 0.4 ? 'rare' : 'standard';
  rarityDistribution[rarityBucket] = (rarityDistribution[rarityBucket] || 0) + 1;

  // Check blocked category
  if (isBlockedCategory(catEn)) {
    issues.blocked_category.push({ question_id: qid, category_en: catEn });
  }

  // Check missing English question text
  if (!qEn || qEn.length < 5) {
    issues.missing_english_question.push({ question_id: qid });
  }

  // Check missing primary axis
  if (!primaryAxis) {
    issues.missing_primary_axis.push({ question_id: qid, question_en: qEn.slice(0, 60) });
  } else if (!CANONICAL_AXES.includes(primaryAxis)) {
    issues.invalid_primary_axis.push({ question_id: qid, primary_axis: primaryAxis });
  }

  // Check answer count
  if (answers.length < 2) {
    issues.too_few_answers.push({ question_id: qid, answer_count: answers.length, question_en: qEn.slice(0, 60) });
  }

  // Per-answer checks
  const labelEnFirstWords = {};
  let hasAnyDelta = false;
  let vagueCount = 0;

  for (const ans of answers) {
    totalAnswers++;
    const labelEn = ans.label_en || '';
    const deltas = parseAxisDeltas(ans.axis_deltas_json);

    if (deltas && Object.keys(deltas).length > 0) {
      answersWithDeltas++;
      hasAnyDelta = true;
    } else {
      answersWithoutDeltas++;
    }

    if (isVagueAnswer(labelEn)) {
      vagueCount++;
    }

    // Duplicate template detection: same first two words + same word count (≤5)
    const words = labelEn.trim().split(/\s+/);
    if (words.length <= 5) {
      const key = words.slice(0, 2).join(' ').toLowerCase();
      labelEnFirstWords[key] = (labelEnFirstWords[key] || 0) + 1;
    }
  }

  if (vagueCount >= 2) {
    issues.vague_answers.push({ question_id: qid, vague_count: vagueCount, question_en: qEn.slice(0, 60) });
  }

  if (!hasAnyDelta && answers.length > 0) {
    issues.no_axis_deltas.push({ question_id: qid, question_en: qEn.slice(0, 60) });
  }

  // Flag questions where 3+ answers share the same two-word prefix (template collision)
  const templateCollisions = Object.entries(labelEnFirstWords).filter(([, count]) => count >= 3);
  if (templateCollisions.length > 0) {
    issues.duplicate_answer_templates.push({
      question_id: qid,
      question_en: qEn.slice(0, 60),
      collisions: templateCollisions.map(([k, c]) => ({ prefix: k, count: c })),
    });
  }

  // Unclear question heuristic: very short (<10 chars) or very long (>300 chars) English text
  if (qEn.length > 5 && (qEn.length < 10 || qEn.length > 300)) {
    issues.unclear_questions.push({ question_id: qid, length: qEn.length, question_en: qEn.slice(0, 80) });
  }
}

// ─── Axis delta coverage per answer option ────────────────────────────────────

const axisHitCount = {};
for (const ax of CANONICAL_AXES) axisHitCount[ax] = 0;

for (const ans of answerRows) {
  const deltas = parseAxisDeltas(ans.axis_deltas_json);
  if (!deltas) continue;
  for (const ax of CANONICAL_AXES) {
    if (deltas[ax] !== undefined && deltas[ax] !== 0) {
      axisHitCount[ax] = (axisHitCount[ax] || 0) + 1;
    }
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────

const summary = {
  generated_at: new Date().toISOString(),
  totals: {
    questions: questionRows.length,
    answers: totalAnswers,
    answers_with_deltas: answersWithDeltas,
    answers_without_deltas: answersWithoutDeltas,
    delta_coverage_pct: totalAnswers > 0 ? Math.round((answersWithDeltas / totalAnswers) * 100) : 0,
  },
  issue_counts: {
    blocked_category: issues.blocked_category.length,
    missing_english_question: issues.missing_english_question.length,
    missing_primary_axis: issues.missing_primary_axis.length,
    invalid_primary_axis: issues.invalid_primary_axis.length,
    too_few_answers: issues.too_few_answers.length,
    vague_answers: issues.vague_answers.length,
    no_axis_deltas: issues.no_axis_deltas.length,
    duplicate_answer_templates: issues.duplicate_answer_templates.length,
    unclear_questions: issues.unclear_questions.length,
  },
  category_distribution: Object.fromEntries(
    Object.entries(categoryDistribution).sort((a, b) => b[1] - a[1])
  ),
  axis_distribution: axisDistribution,
  axis_answer_hit_count: axisHitCount,
  rarity_distribution: rarityDistribution,
  issues,
};

// ─── Write JSON report ────────────────────────────────────────────────────────

const reportsDir = resolve(ROOT, 'reports');
mkdirSync(reportsDir, { recursive: true });

const jsonPath = resolve(reportsDir, 'content_quality_report.json');
writeFileSync(jsonPath, JSON.stringify(summary, null, 2), 'utf8');
console.log(`\nJSON report → ${jsonPath}`);

// ─── Write Markdown report ────────────────────────────────────────────────────

function row(label, value) {
  return `| ${label} | ${value} |`;
}

const md = `# Content Quality Report
Generated: ${summary.generated_at}

## Totals
| Metric | Value |
|--------|-------|
${row('Questions', summary.totals.questions)}
${row('Answers', summary.totals.answers)}
${row('Answers with axis deltas', summary.totals.answers_with_deltas)}
${row('Answers without deltas', summary.totals.answers_without_deltas)}
${row('Delta coverage', `${summary.totals.delta_coverage_pct}%`)}

## Issue Summary
| Issue | Count |
|-------|-------|
${Object.entries(summary.issue_counts).map(([k, v]) => row(k.replace(/_/g, ' '), v)).join('\n')}

## Category Distribution (top 20)
| Category | Questions |
|----------|-----------|
${Object.entries(summary.category_distribution).slice(0, 20).map(([k, v]) => row(k, v)).join('\n')}

## Axis Distribution (primary_axis on questions)
| Axis | Questions |
|------|-----------|
${CANONICAL_AXES.map((ax) => row(ax, axisDistribution[ax] || 0)).join('\n')}

## Axis Answer Hit Count (answers with non-zero delta on this axis)
| Axis | Answer options |
|------|---------------|
${CANONICAL_AXES.map((ax) => row(ax, axisHitCount[ax] || 0)).join('\n')}

## Rarity Distribution
| Tier | Questions |
|------|-----------|
${Object.entries(summary.rarity_distribution).map(([k, v]) => row(k, v)).join('\n')}

## Issues Detail

### Blocked Categories (${issues.blocked_category.length})
${issues.blocked_category.length === 0 ? '_None_' : issues.blocked_category.slice(0, 10).map((i) => `- ${i.question_id}: ${i.category_en}`).join('\n')}

### Missing Primary Axis (${issues.missing_primary_axis.length})
${issues.missing_primary_axis.length === 0 ? '_None_' : issues.missing_primary_axis.slice(0, 10).map((i) => `- ${i.question_id}: ${i.question_en}`).join('\n')}

### Invalid Primary Axis (${issues.invalid_primary_axis.length})
${issues.invalid_primary_axis.length === 0 ? '_None_' : issues.invalid_primary_axis.slice(0, 10).map((i) => `- ${i.question_id}: "${i.primary_axis}"`).join('\n')}

### Too Few Answers (${issues.too_few_answers.length})
${issues.too_few_answers.length === 0 ? '_None_' : issues.too_few_answers.slice(0, 10).map((i) => `- ${i.question_id} (${i.answer_count} answers): ${i.question_en}`).join('\n')}

### Vague Answers (${issues.vague_answers.length})
${issues.vague_answers.length === 0 ? '_None_' : issues.vague_answers.slice(0, 10).map((i) => `- ${i.question_id} (${i.vague_count} vague): ${i.question_en}`).join('\n')}

### No Axis Deltas (${issues.no_axis_deltas.length})
${issues.no_axis_deltas.length === 0 ? '_None_' : issues.no_axis_deltas.slice(0, 10).map((i) => `- ${i.question_id}: ${i.question_en}`).join('\n')}

### Duplicate Answer Templates (${issues.duplicate_answer_templates.length})
${issues.duplicate_answer_templates.length === 0 ? '_None_' : issues.duplicate_answer_templates.slice(0, 10).map((i) => `- ${i.question_id}: ${i.question_en} (${i.collisions.map((c) => `"${c.prefix}" ×${c.count}`).join(', ')})`).join('\n')}

### Unclear Questions (${issues.unclear_questions.length})
${issues.unclear_questions.length === 0 ? '_None_' : issues.unclear_questions.slice(0, 10).map((i) => `- ${i.question_id} (len=${i.length}): ${i.question_en}`).join('\n')}
`;

const mdPath = resolve(reportsDir, 'content_quality_report.md');
writeFileSync(mdPath, md, 'utf8');
console.log(`Markdown report → ${mdPath}`);

// ─── Console summary ──────────────────────────────────────────────────────────

console.log('\n=== AUDIT SUMMARY ===');
console.log(`Questions: ${summary.totals.questions} | Answers: ${summary.totals.answers}`);
console.log(`Delta coverage: ${summary.totals.delta_coverage_pct}%`);
console.log('Issues:');
for (const [k, v] of Object.entries(summary.issue_counts)) {
  if (v > 0) console.log(`  ${k.replace(/_/g, ' ')}: ${v}`);
}
console.log('Done.');
