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

function cleanQuestionText(text: string): string {
  return String(text || '')
    .replace(/\s*\[(?:variant|wariant)\s*\d+\]\s*$/i, '')
    .trim();
}

function normalizeSafety(raw: string): string {
  const value = String(raw || '').toLowerCase();
  if (value.includes('sensitive')) return 'sensitive';
  if (value.includes('taboo')) return 'taboo';
  if (value.includes('intimate')) return 'intimate';
  return 'safe';
}

function isLanguageComplete(languageStatus: string): boolean {
  if (!languageStatus) return true; // no status = allow through
  const ls = languageStatus.toLowerCase();
  return ls.includes('pl') && ls.includes('en');
}

const CANONICAL_AXES = ['AX01','AX02','AX03','AX04','AX05','AX06','AX07','AX08','AX09','AX10'] as const;

function mapAxisDeltas(row: AnswerRowV2): Record<string, number> {
  const deltas: Record<string, number> = {};
  for (const ax of CANONICAL_AXES) {
    const key = `axis_delta_${ax}` as keyof AnswerRowV2;
    const val = num(row[key], 0);
    if (val !== 0) deltas[ax] = val;
  }
  return deltas;
}

function optionKeyToOrder(key: string): number {
  const map: Record<string, number> = { A: 1, B: 2, C: 3, D: 4 };
  return map[String(key || '').toUpperCase()] ?? 0;
}

function parseAnswerRow(row: AnswerRowV2): AnswerOptionV2 {
  return {
    answerId:            row.answer_id,
    order:               optionKeyToOrder(row.option_key),
    labelPl:             row.answer_pl,
    labelEn:             row.answer_en,
    shortLabelPl:        row.answer_pl,
    shortLabelEn:        row.answer_en,
    axisDeltas:          mapAxisDeltas(row),
    rarityImpact:        num(row.rarity_weight, 1),
    answerRevealShortPl: row.short_reveal_pl || row.comparison_insight_pl,
    answerRevealShortEn: row.short_reveal_en || row.comparison_insight_en,
    patternRevealPl:     row.pattern_signal_pl || row.comparison_insight_pl,
    patternRevealEn:     row.pattern_signal_en || row.comparison_insight_en,
    snapshotRevealPl:    row.comparison_insight_pl,
    snapshotRevealEn:    row.comparison_insight_en,
    premiumRevealPl:     row.micro_reward_pl || row.comparison_insight_pl,
    premiumRevealEn:     row.micro_reward_en || row.comparison_insight_en,
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
  const haystack = [row.mode, row.category, row.subcategory].join(' ').toLowerCase();
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
    if (!isLanguageComplete(q.language_status)) continue;
    if (isBlockedCategory(q)) continue;

    const rawAnswers = answerMap.get(q.question_id) ?? [];
    if (rawAnswers.length !== 4) continue;

    const answers = rawAnswers
      .map((answer) => parseAnswerRow(answer))
      .sort((a, b) => a.order - b.order);

    const rarityWeight = answers.reduce((sum, a) => sum + a.rarityImpact, 0) / answers.length;

    items.push({
      questionId:           q.question_id,
      tier:                 normalizeTier(q.tier),
      mode:                 q.mode || 'question',
      categoryPl:           q.category || q.subcategory || 'general',
      categoryEn:           q.category || q.subcategory || 'general',
      questionPl:           cleanQuestionText(q.question_pl),
      questionEn:           cleanQuestionText(q.question_en),
      answerType:           q.question_type || 'four_choice',
      primaryAxis:          q.primary_axis || '',
      sensitivityLevel:     levelToNumber(q.sensitivity_level),
      controversyLevel:     q.controversy_level
        ? levelToNumber(q.controversy_level)
        : (q.mode === 'controversy' ? 2 : levelToNumber(q.sensitivity_level)),
      rarityWeight,
      safetyLabel:          normalizeSafety(q.safety_label),
      statisticSourceLabel: 'estimated',
      revealTemplateIds:    ['reveal_standard'],
      productionStatus:     q.content_status || 'candidate_ready',
      answers,
    });
  }

  return items;
}
