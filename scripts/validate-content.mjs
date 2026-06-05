#!/usr/bin/env node
/**
 * validate-content.mjs
 * Validates content CSV files for The Other 99.
 * Run: node scripts/validate-content.mjs
 */

import { readFileSync } from 'fs';
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

/** Simple semicolon-split CSV parser that respects double-quoted fields. */
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
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { current += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ';' && !inQuote) {
      result.push(current); current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function validateFile(filePath, { checkCardPaths = false, strict = false, requireBilingual = false } = {}) {
  const text = readFileSync(filePath, 'utf-8');
  const rows = parseCsv(text);
  const errors = [];
  const warnings = [];
  const seenIds = new Set();

  rows.forEach((row) => {
    const id = row.id || '[no-id]';

    // ID required
    if (!row.id) { errors.push(`Missing id`); return; }

    // Duplicate ID
    if (seenIds.has(row.id)) errors.push(`${id}: Duplicate ID`);
    seenIds.add(row.id);

    // Must have some prompt
    if (!row.prompt_en && !row.prompt_pl) errors.push(`${id}: No prompt (prompt_en or prompt_pl required)`);

    // Bilingual check for premium content
    if (requireBilingual) {
      if (row.prompt_en && !row.prompt_pl) warnings.push(`${id}: prompt_en present but prompt_pl missing`);
      if (row.prompt_pl && !row.prompt_en) warnings.push(`${id}: prompt_pl present but prompt_en missing`);
      if (row.answer_options_en && !row.answer_options_pl) warnings.push(`${id}: answer_options_en present but answer_options_pl missing`);
      if (row.answer_options_pl && !row.answer_options_en) warnings.push(`${id}: answer_options_pl present but answer_options_en missing`);
    }

    // Rarity tier (strict mode only)
    if (strict && row.rarity_tier && !VALID_RARITIES.has(row.rarity_tier)) {
      errors.push(`${id}: Invalid rarity_tier '${row.rarity_tier}'`);
    }

    // Card path (premium files)
    if (checkCardPaths && row.card_path && !VALID_CARD_PATHS.has(row.card_path)) {
      errors.push(`${id}: Invalid card_path '${row.card_path}'`);
    }

    // Answer options warning
    if (strict && row.answer_options_en) {
      const opts = row.answer_options_en.split('|').filter(Boolean);
      if (opts.length < 2) warnings.push(`${id}: Only ${opts.length} answer option(s)`);
    }

    // Axis delta JSON (strict mode)
    if (strict && row.axis_delta_json) {
      try { JSON.parse(row.axis_delta_json); }
      catch { warnings.push(`${id}: Invalid JSON in axis_delta_json`); }
    }
  });

  return { rows, errors, warnings, seenIds };
}

const FILES = [
  { path: resolve(ROOT, 'public/content.csv'), label: 'content.csv', opts: {} },
  { path: resolve(ROOT, 'public/content_en_v2.csv'), label: 'content_en_v2.csv', opts: {} },
  { path: resolve(ROOT, 'public/content_premium_en_v1.csv'), label: 'content_premium_en_v1.csv',
    opts: { checkCardPaths: true, strict: true, requireBilingual: true } },
];

let totalErrors = 0;
const allIds = new Set();

for (const { path, label, opts } of FILES) {
  let result;
  try {
    result = validateFile(path, opts);
  } catch (e) {
    console.log(`\n⚠  ${label}: Could not read — ${e.message}`);
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

  if (crossDups.length > 0) crossDups.forEach(id => console.log(`  ERROR: Cross-file duplicate: ${id}`));
  if (errors.length > 0) {
    errors.slice(0, 5).forEach(e => console.log(`  ERROR: ${e}`));
    if (errors.length > 5) console.log(`  ... and ${errors.length - 5} more errors`);
  }

  totalErrors += fileErrors;
}

// Distribution summary for premium
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

if (totalErrors > 0) {
  console.log(`Validation FAILED (${totalErrors} errors)`);
  process.exit(1);
} else {
  console.log(`Validation PASSED`);
  process.exit(0);
}
