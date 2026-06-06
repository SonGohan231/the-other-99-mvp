#!/usr/bin/env node
/**
 * validate-content.mjs
 * Quality gate for The Other 99 content CSVs.
 * Build FAILS if any hard error is found.
 *
 * Hard errors (exit 1):
 *   - missing ID
 *   - duplicate ID (within or across files)
 *   - missing prompt_en or prompt_pl
 *   - missing answer_type (non-open questions)
 *   - missing category
 *   - missing axis_delta_json (non-open questions)
 *   - axis_delta_json not valid JSON
 *   - axis_delta_json not a JSON object with at least one numeric key
 *
 * Warnings (logged, don't fail):
 *   - near-duplicate prompts (first 50 chars match)
 *   - missing answer_options on non-open questions
 *   - behavioral sensitivity fields out of 0-10 range
 *   - invalid card_path (premium)
 *   - invalid rarity_tier
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const VALID_CARD_PATHS = new Set([
  'Social Mirror', 'Shadow Question', 'Control Gate', 'Risk Gate',
  'Future Self', 'Memory Trace', 'Moral Dilemma', 'Pattern Break',
  'Secret Human', 'Object Choice', 'Hidden Contradiction', 'Threshold Card',
]);
const VALID_RARITIES = new Set(['common', 'uncommon', 'rare', 'epic', 'legendary', 'standard']);
const OPEN_TYPES = new Set(['open']);

// ─── CSV parser ───────────────────────────────────────────────────────────────

function parseCsv(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const rawHeader = lines[0];
  const headers = splitRow(rawHeader).map(h => h.trim().replace(/^﻿/, '').replace(/^"(.*)"$/, '$1'));

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = splitRow(line);
    const obj = {};
    headers.forEach((h, idx) => {
      let v = (values[idx] || '').trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1).replace(/""/g, '"');
      obj[h] = v;
    });
    rows.push(obj);
  }
  return rows;
}

function splitRow(line) {
  const result = [];
  let current = '';
  let inQuote = false;
  let fieldStart = true;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (fieldStart) {
        // Opening quote for a CSV-quoted field
        inQuote = true;
        fieldStart = false;
      } else if (inQuote) {
        if (line[i + 1] === '"') { current += '"'; i++; } // escaped ""
        else inQuote = false; // end of quoted field
      } else {
        // Bare " inside an unquoted field (e.g. JSON value) — include literally
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

// ─── JSON axis validator ──────────────────────────────────────────────────────

function validateAxisJson(raw) {
  if (!raw || raw.trim() === '') return { ok: false, reason: 'empty' };
  // Check for plain text (not JSON)
  const trimmed = raw.trim();
  if (!trimmed.startsWith('{')) return { ok: false, reason: `plain text instead of JSON object: ${trimmed.slice(0, 40)}` };
  let parsed;
  try { parsed = JSON.parse(trimmed); } catch (e) { return { ok: false, reason: `invalid JSON: ${e.message}` }; }
  if (typeof parsed !== 'object' || Array.isArray(parsed)) return { ok: false, reason: 'not a JSON object' };
  const keys = Object.keys(parsed);
  if (keys.length === 0) return { ok: false, reason: 'empty JSON object {}' };
  for (const k of keys) {
    if (typeof parsed[k] !== 'number') return { ok: false, reason: `axis "${k}" has non-numeric value: ${parsed[k]}` };
  }
  return { ok: true };
}

// ─── Near-duplicate detector ──────────────────────────────────────────────────

function nearDuplicates(rows, field, prefixLen = 50) {
  const seen = new Map();
  const dups = [];
  for (const row of rows) {
    const text = (row[field] || '').trim();
    if (!text) continue;
    const key = text.slice(0, prefixLen).toLowerCase();
    if (seen.has(key)) {
      dups.push({ id: row.id, field, matchId: seen.get(key), prefix: key });
    } else {
      seen.set(key, row.id);
    }
  }
  return dups;
}

// ─── Per-file validator ───────────────────────────────────────────────────────

function validateFile(filePath, { checkCardPaths = false, requireBilingual = false } = {}) {
  const text = readFileSync(filePath, 'utf-8');
  const rows = parseCsv(text);
  const errors = [];
  const warnings = [];
  const seenIds = new Set();

  rows.forEach((row) => {
    const id = row.id?.trim() || null;

    // ── Hard errors ──────────────────────────────────────────────────────────

    // Missing ID
    if (!id) { errors.push(`[row without id]: missing id field`); return; }

    // Duplicate ID
    if (seenIds.has(id)) errors.push(`${id}: Duplicate ID within file`);
    seenIds.add(id);

    // Missing prompts
    if (!row.prompt_en) errors.push(`${id}: missing prompt_en`);
    if (!row.prompt_pl) errors.push(`${id}: missing prompt_pl`);

    // Missing category
    if (!row.category) errors.push(`${id}: missing category`);

    const atype = (row.answer_type || '').trim();
    const isOpen = OPEN_TYPES.has(atype);

    // Missing answer_type
    if (!atype) errors.push(`${id}: missing answer_type`);

    if (!isOpen) {
      // Missing axis_delta_json for non-open questions
      const axisRaw = row.axis_delta_json || '';
      if (!axisRaw.trim()) {
        errors.push(`${id}: missing axis_delta_json`);
      } else {
        const axisCheck = validateAxisJson(axisRaw);
        if (!axisCheck.ok) {
          errors.push(`${id}: axis_delta_json — ${axisCheck.reason}`);
        }
      }
    }

    // ── Bilingual check (premium) ────────────────────────────────────────────
    if (requireBilingual) {
      if (row.prompt_en && !row.prompt_pl) errors.push(`${id}: prompt_en present but prompt_pl missing`);
      if (row.prompt_pl && !row.prompt_en) errors.push(`${id}: prompt_pl present but prompt_en missing`);
      if (row.answer_options_en && !row.answer_options_pl)
        warnings.push(`${id}: answer_options_en present but answer_options_pl missing`);
      if (row.answer_options_pl && !row.answer_options_en)
        warnings.push(`${id}: answer_options_pl present but answer_options_en missing`);
    }

    // ── Warnings ─────────────────────────────────────────────────────────────

    // Answer options missing on non-open
    if (!isOpen && !row.answer_options_en && !row.answer_options_pl) {
      warnings.push(`${id}: no answer options defined (answer_type: ${atype})`);
    }

    // Rarity tier
    if (row.rarity_tier && !VALID_RARITIES.has(row.rarity_tier)) {
      warnings.push(`${id}: Invalid rarity_tier '${row.rarity_tier}'`);
    }

    // Card path (premium files)
    if (checkCardPaths && row.card_path && !VALID_CARD_PATHS.has(row.card_path)) {
      warnings.push(`${id}: Invalid card_path '${row.card_path}'`);
    }

    // Behavioral sensitivity range
    for (const field of ['darkness_level', 'intimacy_level', 'psychological_intensity']) {
      if (row[field] !== undefined && row[field] !== '') {
        const n = parseInt(row[field], 10);
        if (isNaN(n) || n < 0 || n > 10)
          warnings.push(`${id}: ${field} must be 0–10 (got '${row[field]}')`);
      }
    }

    // ── Canon archetype checks ───────────────────────────────────────────────
    const LEGACY_ARCHETYPE_IDS = new Set(['seeker', 'pathfinder']);
    const DISALLOWED_PUBLIC_ARCHETYPES = new Set(['builder']);
    const DISALLOWED_PL_CATALYST_NAMES = new Set(['katalizator']);

    for (const field of ['axis_target', 'archetype_hint_en', 'card_path']) {
      const val = (row[field] || '').toLowerCase();
      for (const legacy of LEGACY_ARCHETYPE_IDS) {
        if (val === legacy) warnings.push(`${id}: ${field} uses legacy archetype id '${legacy}' — use 'weaver' or 'dreamer'`);
      }
      for (const disallowed of DISALLOWED_PUBLIC_ARCHETYPES) {
        if (val === disallowed) errors.push(`${id}: ${field} references 'builder' which is NOT a public archetype`);
      }
    }

    // PL catalyst name check
    const plFields = ['reward_after_answer_pl', 'sample_reward_screen_pl', 'next_hook_pl'];
    for (const field of plFields) {
      if (row[field] && DISALLOWED_PL_CATALYST_NAMES.has((row[field] || '').toLowerCase())) {
        warnings.push(`${id}: ${field} contains 'Katalizator' — public PL name must be 'Iskra'`);
      }
    }

    // ── Social data status check (user-facing copy only) ─────────────────────
    // community_reveal_type is a content-design field, not a UI label — skip it
    const DISALLOWED_SOCIAL_LABELS = ['How others answered', 'Projected distribution', 'Early community distribution'];

    for (const field of ['reward_after_answer_pl', 'sample_reward_screen_pl', 'reward_en']) {
      for (const label of DISALLOWED_SOCIAL_LABELS) {
        if (row[field] && row[field].includes(label)) {
          warnings.push(`${id}: ${field} contains disallowed social label '${label}'`);
        }
      }
    }
  });

  // Near-duplicate detection (warnings)
  const enDups = nearDuplicates(rows, 'prompt_en');
  const plDups = nearDuplicates(rows, 'prompt_pl');
  for (const d of enDups) warnings.push(`${d.id}: near-duplicate of ${d.matchId} (prompt_en first 50 chars match)`);
  for (const d of plDups) warnings.push(`${d.id}: near-duplicate of ${d.matchId} (prompt_pl first 50 chars match)`);

  return { rows, errors, warnings, seenIds };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const FILES = [
  {
    path: resolve(ROOT, 'public/content.csv'),
    label: 'content.csv',
    opts: {},
  },
  {
    path: resolve(ROOT, 'public/content_en_v2.csv'),
    label: 'content_en_v2.csv',
    opts: {},
  },
  {
    path: resolve(ROOT, 'public/content_premium_en_v1.csv'),
    label: 'content_premium_en_v1.csv',
    opts: { checkCardPaths: true, requireBilingual: true },
  },
];

let totalErrors = 0;
let totalWarnings = 0;
const allIds = new Set();
const report = [];
const allRows = [];  // collected for axis coverage matrix

for (const { path, label, opts } of FILES) {
  let result;
  try {
    result = validateFile(path, opts);
  } catch (e) {
    console.log(`\n⚠  ${label}: Could not read — ${e.message}`);
    totalErrors++;
    continue;
  }

  const { rows, errors, warnings, seenIds } = result;

  // Cross-file duplicate check
  const crossDups = [];
  for (const id of seenIds) {
    if (allIds.has(id)) crossDups.push(id);
    allIds.add(id);
  }

  const fileErrors = errors.length + crossDups.length;
  const status = fileErrors === 0 ? '✓' : '✗';
  const warnStr = warnings.length > 0 ? `, ${warnings.length} warnings` : '';
  console.log(`\n${status} ${label}: ${rows.length} items, ${fileErrors} errors${warnStr}`);

  for (const id of crossDups) console.log(`  ERROR: Cross-file duplicate: ${id}`);
  errors.slice(0, 10).forEach(e => console.log(`  ERROR: ${e}`));
  if (errors.length > 10) console.log(`  ... and ${errors.length - 10} more errors`);
  warnings.slice(0, 5).forEach(w => console.log(`  WARN:  ${w}`));
  if (warnings.length > 5) console.log(`  ... and ${warnings.length - 5} more warnings`);

  totalErrors += fileErrors;
  totalWarnings += warnings.length;
  report.push({ label, rows: rows.length, errors: fileErrors, warnings: warnings.length });
  allRows.push(...rows);
}

// ─── Canon metadata check ────────────────────────────────────────────────────
// Warn if archetypes.ts still references legacy IDs or missing canon marker.
try {
  const archetypesSrc = readFileSync(resolve(ROOT, 'src/utils/archetypes.ts'), 'utf-8');
  if (archetypesSrc.includes("'seeker'") || archetypesSrc.includes('"seeker"')) {
    console.log('\n  WARN:  archetypes.ts still references legacy id "seeker"');
    totalWarnings++;
  }
  if (archetypesSrc.includes("'pathfinder'") || archetypesSrc.includes('"pathfinder"')) {
    console.log('\n  WARN:  archetypes.ts still references legacy id "pathfinder"');
    totalWarnings++;
  }
  if (!archetypesSrc.includes('TO99_ARCHETYPE_CANON_1.0') && !archetypesSrc.includes('canon_version')) {
    console.log('\n  WARN:  archetypes.ts missing canon_version TO99_ARCHETYPE_CANON_1.0 marker');
    totalWarnings++;
  }
  // Check PL catalyst name
  const blendsSrc = readFileSync(resolve(ROOT, 'src/content/archetypeBlends.ts'), 'utf-8');
  if (blendsSrc.includes('Katalizator')) {
    console.log('\n  WARN:  archetypeBlends.ts still uses "Katalizator" — PL public name must be "Iskra"');
    totalWarnings++;
  }
} catch {}

// ─── i18n social label check ────────────────────────────────────────────────
try {
  const i18nSrc = readFileSync(resolve(ROOT, 'src/i18n.ts'), 'utf-8');
  const badLabels = ['Projected distribution', 'Early community distribution'];
  for (const label of badLabels) {
    if (i18nSrc.includes(label)) {
      console.log(`\n  WARN:  i18n.ts contains disallowed social label "${label}"`);
      totalWarnings++;
    }
  }
} catch {}

// ─── MVP-03: Axis coverage matrix ────────────────────────────────────────────
// Groups by PRIMARY axis (first segment when axis_target contains semicolons).
// Warns when any primary axis has fewer than MIN_AXIS_COVERAGE questions.
const MIN_AXIS_COVERAGE = 10;

try {
  const axisCounts = {};
  const axisDeltaSums = {};
  const axisDeltaCount = {};

  for (const row of allRows) {
    const rawAxis = (row.axis_target || '').trim().replace(/^"/, '').replace(/"$/, '');
    if (!rawAxis) continue;
    // Use only the primary axis (first segment before any semicolon), normalized to lowercase
    const axis = rawAxis.split(';')[0].trim().toLowerCase();
    if (!axis) continue;
    axisCounts[axis] = (axisCounts[axis] || 0) + 1;

    const rawDelta = row.axis_delta_json || '';
    if (rawDelta.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(rawDelta.trim());
        const vals = Object.values(parsed).map(Number).filter(v => !isNaN(v));
        if (vals.length > 0) {
          const avgAbs = vals.reduce((s, v) => s + Math.abs(v), 0) / vals.length;
          axisDeltaSums[axis] = (axisDeltaSums[axis] || 0) + avgAbs;
          axisDeltaCount[axis] = (axisDeltaCount[axis] || 0) + 1;
        }
      } catch {}
    }
  }

  const axes = Object.keys(axisCounts).sort((a, b) => axisCounts[b] - axisCounts[a]);
  console.log('\nAxis coverage matrix (by primary axis):');
  console.log(`  ${'Axis'.padEnd(24)} ${'Qs'.padStart(4)} ${'Avg|Δ|'.padStart(7)}`);
  console.log(`  ${'─'.repeat(38)}`);
  for (const ax of axes) {
    const count = axisCounts[ax];
    const avgDelta = axisDeltaCount[ax]
      ? (axisDeltaSums[ax] / axisDeltaCount[ax]).toFixed(2)
      : ' —';
    const flag = count < MIN_AXIS_COVERAGE ? ' ⚠ LOW' : '';
    console.log(`  ${ax.padEnd(24)} ${String(count).padStart(4)} ${String(avgDelta).padStart(7)}${flag}`);
    if (count < MIN_AXIS_COVERAGE) {
      console.log(`  WARN:  Primary axis "${ax}" has only ${count} questions (min: ${MIN_AXIS_COVERAGE})`);
      totalWarnings++;
    }
  }
  console.log(`  Total primary axes: ${axes.length}`);
} catch (e) {
  console.log(`\n  WARN:  Axis coverage matrix failed: ${e.message}`);
  totalWarnings++;
}

// Premium distribution summary
try {
  const rows = parseCsv(readFileSync(resolve(ROOT, 'public/content_premium_en_v1.csv'), 'utf-8'));
  const dist = {};
  for (const row of rows) {
    const p = row.card_path || 'unknown';
    dist[p] = (dist[p] || 0) + 1;
  }
  console.log('\nPremium distribution:');
  Object.entries(dist).sort((a, b) => b[1] - a[1])
    .forEach(([p, n]) => console.log(`  ${p.padEnd(26)} ${n}`));
} catch {}

console.log(`\n${'─'.repeat(50)}`);
console.log(`Total unique IDs: ${allIds.size}`);
if (totalWarnings > 0) console.log(`Total warnings: ${totalWarnings}`);

if (totalErrors > 0) {
  console.log(`Validation FAILED (${totalErrors} errors)`);
  process.exit(1);
} else {
  console.log(`Validation PASSED`);
  process.exit(0);
}
