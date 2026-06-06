import { ContentItem } from '../types';

export interface QualityIssue {
  questionId: string;
  question: string;
  issueType:
    | 'blocked_category'
    | 'vague_answers'
    | 'duplicate_answer_template'
    | 'too_few_answers'
    | 'missing_english';
  detail: string;
}

export interface QualityReport {
  total: number;
  passed: number;
  flagged: number;
  issues: QualityIssue[];
}

// Blocked content categories (product research, developer, roadmap, etc.)
const BLOCKED_CATEGORY_PATTERNS = [
  /product research/i,
  /transparent product/i,
  /developer/i,
  /roadmap/i,
  /feature voting/i,
  /app development/i,
  /feedback/i,
];

// Vague, poetic or symbolic answer patterns that lack clear meaning without context
const VAGUE_ANSWER_PATTERNS = [
  /^the (void|echo|silence|shadow|unknown|darkness|light|mirror|ashes|dust|storm|abyss)$/i,
  /^(silence|void|shadows|darkness|chaos|stillness|oblivion|nothingness)$/i,
  /\bstardust\b/i,
  /\bthe universe\b/i,
  /\bsoul of\b/i,
  /^a (crumbling|fading|burning|dying|broken)\b/i,
  /^(burning|fading|crumbling|dissolving) /i,
  /^like (a )?shadow/i,
];

function isVagueAnswer(answer: string): boolean {
  const trimmed = answer.trim();
  if (trimmed.length < 3) return true;
  return VAGUE_ANSWER_PATTERNS.some((rx) => rx.test(trimmed));
}

function isBlockedCategory(category: string): boolean {
  return BLOCKED_CATEGORY_PATTERNS.some((rx) => rx.test(category));
}

function hasDuplicateTemplates(answers: string[]): boolean {
  // Detect answers that are structurally identical templates (same word count, same structure)
  if (answers.length < 2) return false;

  // Check if answers share the same first word (e.g., "I prefer X", "I prefer Y", "I prefer Z" = OK)
  // but flag if all answers follow identical N-word patterns with only a final word changed
  const normalized = answers.map((a) =>
    a.trim().toLowerCase().replace(/[^a-z0-9 ]/g, ''),
  );

  // Flag if 3+ answers have the same word count AND the same first two words
  const firstTwoWords = normalized.map((a) => a.split(' ').slice(0, 2).join(' '));
  const wordCounts = normalized.map((a) => a.split(' ').length);

  const sameStarter = firstTwoWords.every((w) => w === firstTwoWords[0]);
  const sameLength = wordCounts.every((n) => n === wordCounts[0]) && wordCounts[0] <= 5;

  return sameStarter && sameLength && answers.length >= 3;
}

/**
 * Run quality checks on a content pool.
 * Returns a report with flagged items and their issues.
 */
export function validateContentQuality(items: ContentItem[]): QualityReport {
  const issues: QualityIssue[] = [];

  for (const item of items) {
    const category = item.theme_category || item.category || '';
    const questionEn = item.prompt_en || '';
    const id = item.question_id || item.id;

    // 1. Blocked category
    if (isBlockedCategory(category)) {
      issues.push({
        questionId: id,
        question: questionEn,
        issueType: 'blocked_category',
        detail: `Category "${category}" is a blocked product/developer/roadmap category.`,
      });
      continue; // skip further checks for blocked items
    }

    // 2. Missing English question text
    if (!questionEn.trim()) {
      issues.push({
        questionId: id,
        question: item.prompt_pl || '',
        issueType: 'missing_english',
        detail: 'No English question text.',
      });
    }

    // 3. Too few answers
    const answersEn = (item.answer_options_en || '')
      .split('|')
      .map((a) => a.trim())
      .filter(Boolean);

    if (answersEn.length < 2) {
      issues.push({
        questionId: id,
        question: questionEn,
        issueType: 'too_few_answers',
        detail: `Only ${answersEn.length} English answer option(s) found.`,
      });
    }

    // 4. Vague / symbolic answers
    const vagueAnswers = answersEn.filter(isVagueAnswer);
    if (vagueAnswers.length > 0) {
      issues.push({
        questionId: id,
        question: questionEn,
        issueType: 'vague_answers',
        detail: `Vague answers detected: ${vagueAnswers.map((a) => `"${a}"`).join(', ')}`,
      });
    }

    // 5. Duplicate answer templates
    if (hasDuplicateTemplates(answersEn)) {
      issues.push({
        questionId: id,
        question: questionEn,
        issueType: 'duplicate_answer_template',
        detail: `Answers appear structurally identical: ${answersEn.map((a) => `"${a}"`).join(' / ')}`,
      });
    }
  }

  return {
    total: items.length,
    passed: items.length - new Set(issues.map((i) => i.questionId)).size,
    flagged: new Set(issues.map((i) => i.questionId)).size,
    issues,
  };
}
