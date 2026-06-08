import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import Papa from 'papaparse';

const ROOT = process.cwd();
const PUBLIC_V3 = path.join(ROOT, 'public', 'v3');
const ZIP_DEFAULT = 'TO99_STAGE2B_IMPORT_MERGE_READY_PACK.zip';

const TARGETS = {
  questions: path.join(PUBLIC_V3, 'TO99_questions_master.csv'),
  answers: path.join(PUBLIC_V3, 'TO99_answers_long.csv'),
  reveals: path.join(PUBLIC_V3, 'TO99_answer_reveals.csv'),
};

const SOURCE_FILES = {
  questions: 'TO99_questions_master.csv',
  answers: 'TO99_answers_long.csv',
  reveals: 'TO99_answer_reveals.csv',
};

function parseArgs(argv) {
  const validateOnly = argv.includes('--validate-only');
  const explicitZip = argv.find((arg) => arg.endsWith('.zip'));
  return { validateOnly, explicitZip };
}

function findZip(explicitZip) {
  if (explicitZip) {
    const resolved = path.resolve(ROOT, explicitZip);
    if (!fs.existsSync(resolved)) throw new Error(`ZIP not found: ${resolved}`);
    return resolved;
  }

  const defaultPath = path.join(ROOT, ZIP_DEFAULT);
  if (fs.existsSync(defaultPath)) return defaultPath;

  const candidates = fs
    .readdirSync(ROOT)
    .filter((name) => /stage2b/i.test(name) && name.toLowerCase().endsWith('.zip'));

  if (candidates.length === 1) return path.join(ROOT, candidates[0]);

  throw new Error(
    `Stage 2B ZIP not found. Put ${ZIP_DEFAULT} in repo root or pass a .zip path as argument.`,
  );
}

function parseCsv(filePath) {
  const text = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().replace(/^\uFEFF/, ''),
    transform: (value) => (typeof value === 'string' ? value.trim() : value),
  });

  if (parsed.errors?.length) {
    const first = parsed.errors[0];
    throw new Error(`CSV parse error in ${filePath}: ${first.message}`);
  }

  return parsed.data;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function importFromZip(zipPath) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'to99-stage2b-'));

  try {
    execFileSync('unzip', ['-o', zipPath, '-d', tempDir], { stdio: 'inherit' });
    fs.mkdirSync(PUBLIC_V3, { recursive: true });

    for (const [key, sourceName] of Object.entries(SOURCE_FILES)) {
      const sourcePath = path.join(tempDir, sourceName);
      assert(fs.existsSync(sourcePath), `Missing ${sourceName} inside Stage 2B ZIP.`);
      fs.copyFileSync(sourcePath, TARGETS[key]);
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function validateTargets() {
  for (const [key, targetPath] of Object.entries(TARGETS)) {
    assert(fs.existsSync(targetPath), `Missing target CSV: ${key} -> ${targetPath}`);
  }

  const questions = parseCsv(TARGETS.questions);
  const answers = parseCsv(TARGETS.answers);
  const reveals = parseCsv(TARGETS.reveals);

  assert(questions.length === 2400, `Expected 2400 questions, got ${questions.length}.`);
  assert(answers.length === 9600, `Expected 9600 answers, got ${answers.length}.`);
  assert(reveals.length === 9600, `Expected 9600 reveal rows, got ${reveals.length}.`);

  const questionIds = new Set();
  const answerIds = new Set();
  const answersByQuestion = new Map();
  const visibleVariantPattern = /\[(?:variant|wariant)\s*\d+\]/i;

  for (const row of questions) {
    assert(row.question_id, 'Question row without question_id.');
    assert(!questionIds.has(row.question_id), `Duplicate question_id: ${row.question_id}`);
    questionIds.add(row.question_id);

    assert(row.question_en && row.question_pl, `Question ${row.question_id} missing EN/PL text.`);
    assert(!visibleVariantPattern.test(row.question_en), `Visible variant label in EN: ${row.question_id}`);
    assert(!visibleVariantPattern.test(row.question_pl), `Visible variant label in PL: ${row.question_id}`);
  }

  for (const row of answers) {
    assert(row.answer_id, 'Answer row without answer_id.');
    assert(!answerIds.has(row.answer_id), `Duplicate answer_id: ${row.answer_id}`);
    answerIds.add(row.answer_id);

    assert(questionIds.has(row.question_id), `Answer ${row.answer_id} points to missing question ${row.question_id}.`);
    assert(row.answer_en && row.answer_pl, `Answer ${row.answer_id} missing EN/PL text.`);

    const list = answersByQuestion.get(row.question_id) ?? [];
    list.push(row);
    answersByQuestion.set(row.question_id, list);
  }

  for (const qid of questionIds) {
    const rows = answersByQuestion.get(qid) ?? [];
    assert(rows.length === 4, `Question ${qid} has ${rows.length} answers instead of 4.`);

    const answerIndexes = rows.map((row) => String(row.answer_index)).sort().join(',');
    assert(answerIndexes === '1,2,3,4', `Question ${qid} answer indexes are ${answerIndexes}, expected 1,2,3,4.`);

    const distributionSum = rows.reduce((sum, row) => sum + Number(row.projected_choice_pct || 0), 0);
    assert(distributionSum === 100, `Question ${qid} projected_choice_pct sum is ${distributionSum}, expected 100.`);
  }

  const revealIds = new Set();
  for (const row of reveals) {
    assert(row.answer_id, 'Reveal row without answer_id.');
    assert(answerIds.has(row.answer_id), `Reveal points to missing answer_id: ${row.answer_id}`);
    assert(!revealIds.has(row.answer_id), `Duplicate reveal answer_id: ${row.answer_id}`);
    revealIds.add(row.answer_id);
  }

  const report = [
    '# Stage 2B local import validation',
    '',
    `questions_loaded = ${questions.length}`,
    `answers_loaded = ${answers.length}`,
    `answer_reveals_loaded = ${reveals.length}`,
    'fallback_answers_used = 0',
    'status = PASS',
    '',
    'Generated by scripts/import-stage2b-content.mjs',
  ].join('\n');

  fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'reports', 'stage2b_content_import_report.md'), report + '\n');

  console.log(report);
}

function main() {
  const { validateOnly, explicitZip } = parseArgs(process.argv.slice(2));

  if (!validateOnly) {
    const zipPath = findZip(explicitZip);
    console.log(`Importing Stage 2B content from ${zipPath}`);
    importFromZip(zipPath);
  }

  validateTargets();
}

try {
  main();
} catch (error) {
  console.error(`Stage 2B import failed: ${error.message}`);
  process.exit(1);
}
