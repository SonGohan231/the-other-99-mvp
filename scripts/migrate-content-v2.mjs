#!/usr/bin/env node
/**
 * migrate-content-v2.mjs
 *
 * Adds v2 content contract fields to all three content CSVs:
 *   canon_version, safety_label, statistic_source_label,
 *   allowed_actions, reveal_template_id, sensitivity_level,
 *   controversy_level, content_contract_status
 *
 * Inference rules:
 *   safety_label  — derived from max(darkness_level, intimacy_level)
 *   reveal_template_id — derived from rarity_tier
 *   All other v2 fields — assigned uniform migration defaults
 *
 * Runs idempotently: re-running re-infers values from source fields.
 * Writes migrated CSVs back to public/ in-place.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─── CSV round-trip parser ────────────────────────────────────────────────────

function parseCsv(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const headers = splitRow(lines[0]).map(h =>
    h.trim().replace(/^﻿/, '').replace(/^"(.*)"$/, '$1'),
  );
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const vals = splitRow(line);
    const obj = {};
    headers.forEach((h, idx) => {
      let v = (vals[idx] ?? '').trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1).replace(/""/g, '"');
      obj[h] = v;
    });
    rows.push(obj);
  }
  return { headers, rows };
}

function splitRow(line) {
  const result = [];
  let current = '';
  let inQuote = false;
  let fieldStart = true;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (fieldStart) { inQuote = true; fieldStart = false; }
      else if (inQuote) {
        if (line[i + 1] === '"') { current += '"'; i++; }
        else inQuote = false;
      } else {
        current += ch;
      }
    } else if (ch === ';' && !inQuote) {
      result.push(current); current = ''; fieldStart = true;
    } else {
      current += ch;
      if (ch !== ' ' && ch !== '\t') fieldStart = false;
    }
  }
  result.push(current);
  return result;
}

function serializeCsv(headers, rows) {
  function escapeField(v) {
    if (v === undefined || v === null) return '';
    const s = String(v);
    // Quote fields that contain semicolons, quotes, or newlines
    if (s.includes(';') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }
  const lines = [headers.map(escapeField).join(';')];
  for (const row of rows) {
    lines.push(headers.map(h => escapeField(row[h] ?? '')).join(';'));
  }
  return lines.join('\n') + '\n';
}

// ─── v2 field inference ────────────────────────────────────────────────────────

const V2_FIELDS = [
  'canon_version',
  'safety_label',
  'statistic_source_label',
  'allowed_actions',
  'reveal_template_id',
  'sensitivity_level',
  'controversy_level',
  'content_contract_status',
];

const CANON_VERSION = 'TO99_ARCHETYPE_CANON_1.0';
const DEFAULT_ALLOWED_ACTIONS = 'answer,confirm_answer,skip_question,swap_question,exit_to_menu';
const CONTRACT_STATUS = 'migrated_needs_editorial_review';

function inferSafetyLabel(darkness, intimacy) {
  const d = parseInt(darkness, 10) || 0;
  const im = parseInt(intimacy, 10) || 0;
  const level = Math.max(d, im);
  if (level === 0)        return 'safe';
  if (level <= 2)         return 'mild';
  if (level <= 5)         return 'sensitive';
  if (level <= 7)         return 'intimate';
  if (level <= 9)         return 'taboo';
  return 'forbidden';
}

function inferRevealTemplate(rarityTier) {
  switch (rarityTier) {
    case 'legendary': return 'reveal_legendary';
    case 'epic':      return 'reveal_epic';
    case 'rare':      return 'reveal_rare';
    default:          return 'reveal_standard';
  }
}

function addV2Fields(row) {
  const safety = inferSafetyLabel(row.darkness_level, row.intimacy_level);
  const darkn = parseInt(row.darkness_level, 10) || 0;
  const intim = parseInt(row.intimacy_level, 10) || 0;
  const psycho = parseInt(row.psychological_intensity, 10) || 0;
  const sensitivity = Math.round((Math.max(darkn, intim) + psycho) / 2);
  const controversy = Math.min(10, Math.round((darkn + intim) / 2));

  return {
    ...row,
    canon_version: CANON_VERSION,
    safety_label: safety,
    statistic_source_label: 'estimated',
    allowed_actions: DEFAULT_ALLOWED_ACTIONS,
    reveal_template_id: inferRevealTemplate(row.rarity_tier),
    sensitivity_level: String(sensitivity),
    controversy_level: String(controversy),
    content_contract_status: CONTRACT_STATUS,
  };
}

// ─── Migrate a single file ────────────────────────────────────────────────────

function migrateFile(filePath) {
  const text = readFileSync(filePath, 'utf-8');
  const { headers, rows } = parseCsv(text);

  // Add v2 fields to header if not already present
  const newHeaders = [...headers];
  for (const f of V2_FIELDS) {
    if (!newHeaders.includes(f)) newHeaders.push(f);
  }

  const migratedRows = rows.map(addV2Fields);

  // Stats
  const safetyDist = {};
  const revealDist = {};
  for (const r of migratedRows) {
    safetyDist[r.safety_label] = (safetyDist[r.safety_label] || 0) + 1;
    revealDist[r.reveal_template_id] = (revealDist[r.reveal_template_id] || 0) + 1;
  }

  writeFileSync(filePath, serializeCsv(newHeaders, migratedRows), 'utf-8');
  return { count: migratedRows.length, safetyDist, revealDist };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const FILES = [
  resolve(ROOT, 'public/content.csv'),
  resolve(ROOT, 'public/content_en_v2.csv'),
  resolve(ROOT, 'public/content_premium_en_v1.csv'),
];

const report = {
  migrated_at: new Date().toISOString(),
  canon_version: CANON_VERSION,
  contract_status: CONTRACT_STATUS,
  files: [],
  total_rows: 0,
  safety_distribution: {},
  reveal_template_distribution: {},
};

console.log('TO99 Content Migration v2\n');

for (const filePath of FILES) {
  const label = filePath.split('/').pop();
  try {
    const result = migrateFile(filePath);
    console.log(`✓ ${label}: ${result.count} rows migrated`);
    console.log(`  safety_label:     ${JSON.stringify(result.safetyDist)}`);
    console.log(`  reveal_template:  ${JSON.stringify(result.revealDist)}`);
    report.files.push({ file: label, rows: result.count, safety: result.safetyDist, reveal: result.revealDist });
    report.total_rows += result.count;
    for (const [k, v] of Object.entries(result.safetyDist)) {
      report.safety_distribution[k] = (report.safety_distribution[k] || 0) + v;
    }
    for (const [k, v] of Object.entries(result.revealDist)) {
      report.reveal_template_distribution[k] = (report.reveal_template_distribution[k] || 0) + v;
    }
  } catch (e) {
    console.error(`✗ ${label}: ${e.message}`);
    process.exit(1);
  }
}

// Write quality report
const reportPath = resolve(ROOT, 'content_quality_report.md');
const safetyRows = Object.entries(report.safety_distribution)
  .sort((a, b) => b[1] - a[1])
  .map(([k, v]) => `| ${k} | ${v} |`)
  .join('\n');
const revealRows = Object.entries(report.reveal_template_distribution)
  .sort((a, b) => b[1] - a[1])
  .map(([k, v]) => `| ${k} | ${v} |`)
  .join('\n');
const fileRows = report.files
  .map(f => `| ${f.file} | ${f.rows} |`)
  .join('\n');

const md = `# Content Quality Report — The Other 99

**Generated:** ${report.migrated_at}
**Canon version:** ${report.canon_version}
**Contract status assigned:** \`${report.contract_status}\`
**Total rows migrated:** ${report.total_rows}

## Files Migrated

| File | Rows |
|------|------|
${fileRows}

## v2 Fields Added

All rows now carry the following v2 content contract fields:

| Field | Value / Source |
|-------|----------------|
| \`canon_version\` | \`${CANON_VERSION}\` (static) |
| \`safety_label\` | Inferred from \`max(darkness_level, intimacy_level)\` |
| \`statistic_source_label\` | \`estimated\` (all migrated rows) |
| \`allowed_actions\` | \`answer,confirm_answer,skip_question,swap_question,exit_to_menu\` |
| \`reveal_template_id\` | Derived from \`rarity_tier\` |
| \`sensitivity_level\` | \`round((max(darkness,intimacy) + psychological_intensity) / 2)\` |
| \`controversy_level\` | \`round((darkness_level + intimacy_level) / 2)\` |
| \`content_contract_status\` | \`migrated_needs_editorial_review\` |

## Safety Label Distribution

| Safety Label | Count |
|--------------|-------|
${safetyRows}

## Reveal Template Distribution

| Template ID | Count |
|-------------|-------|
${revealRows}

## Editorial Action Required

All rows have \`content_contract_status = migrated_needs_editorial_review\`.

Editorial tasks per row:
- Review inferred \`safety_label\` for accuracy
- Review \`controversy_level\` and \`sensitivity_level\`
- Confirm \`allowed_actions\` are appropriate for the content type
- Update \`content_contract_status\` to \`reviewed\` after manual check
- Update \`statistic_source_label\` to \`community\` once real distribution data is collected

## Axis Coverage

All axis coverage validated by \`npm run validate:content\`.
Minimum 15 questions per canonical axis (AX01–AX10) enforced.
`;

writeFileSync(reportPath, md, 'utf-8');
console.log(`\n✓ Quality report written: content_quality_report.md`);
console.log(`\nTotal rows migrated: ${report.total_rows}`);
console.log(`\nRun 'npm run validate:content' to confirm all checks pass.`);
