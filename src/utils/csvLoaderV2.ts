import Papa from 'papaparse';
import {
  QuestionRowV2,
  AnswerRowV2,
  AnswerOptionV2,
  ContentItemV2,
} from '../types/contentV2';

async function fetchCsv<T>(path: string): Promise<T[]> {
  const resp = await fetch(path);
  if (!resp.ok) throw new Error(`csvLoaderV2: failed to fetch ${path} (${resp.status})`);
  const text = await resp.text();
  const result = Papa.parse<T>(text, {
    delimiter: ',',
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().replace(/^﻿/, ''),
    transform: (v) => v.trim(),
  });
  return result.data;
}

function num(raw: string | number | null | undefined, fallback = 0): number {
  const parsed = Number(raw ?? '');
  return Number.isFinite(parsed) ? parsed : fallback;
}

function levelToNumber(raw: string | number | null | undefined): number {
  const value = String(raw ?? '').trim().toLowerCase();
  if (!value) return 0;
  if (/^-?\d+(\.\d+)?$/.test(value)) return num(value, 0);
  if (value === 'low') return 1;
  if (value === 'medium' || value === 'moderate') return 2;
  if (value === 'high') return 3;
  if (value === 'sensitive_review') return 2;
  return 1;
}

function normalizeTier(raw: string): 'free' | 'premium' {
  return String(raw || '').toLowerCase() === 'premium' ? 'premium' : 'free';
}

function normalizeSafety(raw: string): string {
  const value = String(raw || '').toLowerCase();
  if (value.includes('sensitive')) return 'sensitive';
  if (value.includes('taboo')) return 'taboo';
  if (value.includes('intimate')) return 'intimate';
  return 'safe';
}

function mapAxisDeltas(row: AnswerRowV2, question: QuestionRowV2): Record<string, number> {
  const deltas: Record<string, number> = {};
  const primary = question.axis_primary;
  const secondary = question.axis_secondary;

  if (primary) deltas[primary] = (deltas[primary] ?? 0) + num(row.axis_primary_delta, 0);
  if (secondary) deltas[secondary] = (deltas[secondary] ?? 0) + num(row.axis_secondary_delta, 0);

  return Object.fromEntries(
    Object.entries(deltas).filter(([, value]) => Number.isFinite(value) && value !== 0),
  );
}

function parseAnswerRow(row: AnswerRowV2, question: QuestionRowV2): AnswerOptionV2 {
  return {
    answerId:            row.answer_id,
    order:               parseInt(row.answer_index, 10) || 0,
    labelPl:             row.answer_pl,
    labelEn:             row.answer_en,
    shortLabelPl:        row.answer_style,
    shortLabelEn:        row.answer_style,
    axisDeltas:          mapAxisDeltas(row, question),
    rarityImpact:        num(row.rarity_weight, 1),
    answerRevealShortPl: row.comparison_insight_pl,
    answerRevealShortEn: row.comparison_insight_en,
    patternRevealPl:     row.comparison_insight_pl,
    patternRevealEn:     row.comparison_insight_en,
    snapshotRevealPl:    row.comparison_insight_pl,
    snapshotRevealEn:    row.comparison_insight_en,
    premiumRevealPl:     row.comparison_insight_pl,
    premiumRevealEn:     row.comparison_insight_en,
  };
}

// Categories that are not psychological discovery content — excluded from runtime pool.
const BLOCKED_CATEGORY_KEYWORDS = [
  'product research',
  'transparent product',
  'developer',
  'roadmap',
  'feature voting',
  'app development',
  'feedback',
];

function isBlockedCategory(row: QuestionRowV2): boolean {
  const haystack = [row.internal_category, row.content_type, row.source_construct].join(' ').toLowerCase();
  return BLOCKED_CATEGORY_KEYWORDS.some((kw) => haystack.includes(kw));
}

/**
 * Load and join the v3 question + answer CSVs from public/v3/.
 * Returns fully joined ContentItemV2 array, filtered to items with
 * PL/EN question text and exactly four answer options.
 */
export async function loadContentV2(): Promise<ContentItemV2[]> {
  const [questionRows, answerRows] = await Promise.all([
    fetchCsv<QuestionRowV2>('/v3/TO99_questions_master.csv'),
    fetchCsv<AnswerRowV2>('/v3/TO99_answers_long.csv'),
  ]);

  const answerMap = new Map<string, AnswerRowV2[]>();
  for (const row of answerRows) {
    if (!row.question_id) continue;
    const arr = answerMap.get(row.question_id) ?? [];
    arr.push(row);
    answerMap.set(row.question_id, arr);
  }

  const items: ContentItemV2[] = [];

  for (const q of questionRows) {
    if (!q.question_id || !q.question_pl || !q.question_en) continue;
    if (q.language_status && q.language_status !== 'pl_en_complete') continue;
    if (isBlockedCategory(q)) continue;

    const rawAnswers = answerMap.get(q.question_id) ?? [];
    if (rawAnswers.length !== 4) continue;

    const answers = rawAnswers
      .map((answer) => parseAnswerRow(answer, q))
      .sort((a, b) => a.order - b.order);

    items.push({
      questionId:           q.question_id,
      tier:                 normalizeTier(q.tier),
      categoryPl:           q.internal_category || q.content_type,
      categoryEn:           q.content_type || q.internal_category,
      questionPl:           q.question_pl,
      questionEn:           q.question_en,
      answerType:           q.answer_type || 'four_choice',
      primaryAxis:          q.axis_primary,
      sensitivityLevel:     levelToNumber(q.sensitivity_level),
      controversyLevel:     q.content_type === 'controversy' ? 2 : levelToNumber(q.sensitivity_level),
      rarityWeight:         num(q.rarity_weight, 1),
      safetyLabel:          normalizeSafety(q.safety_label),
      statisticSourceLabel: q.social_label_default || 'estimated',
      revealTemplateIds:    ['reveal_standard'],
      productionStatus:     q.import_status || 'candidate_ready',
      answers,
    });
  }

  return items;
}
