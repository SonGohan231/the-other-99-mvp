import Papa from 'papaparse';
import {
  QuestionRowV2,
  AnswerRowV2,
  AnswerOptionV2,
  ContentItemV2,
} from '../types/contentV2';

function parseJson<T>(raw: string, fallback: T): T {
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

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

function parseAnswerRow(row: AnswerRowV2): AnswerOptionV2 {
  return {
    answerId:            row.answer_id,
    order:               parseInt(row.answer_order, 10) || 0,
    labelPl:             row.label_pl,
    labelEn:             row.label_en,
    shortLabelPl:        row.short_label_pl,
    shortLabelEn:        row.short_label_en,
    axisDeltas:          parseJson<Record<string, number>>(row.axis_deltas_json, {}),
    rarityImpact:        parseFloat(row.rarity_impact) || 0,
    answerRevealShortPl: row.answer_reveal_short_pl,
    answerRevealShortEn: row.answer_reveal_short_en,
    patternRevealPl:     row.pattern_reveal_pl,
    patternRevealEn:     row.pattern_reveal_en,
    snapshotRevealPl:    row.snapshot_reveal_pl,
    snapshotRevealEn:    row.snapshot_reveal_en,
    premiumRevealPl:     row.premium_reveal_pl,
    premiumRevealEn:     row.premium_reveal_en,
  };
}

function parseRevealTemplateIds(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as string[];
  } catch { /* fall through */ }
  return raw ? [raw] : [];
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

function isBlockedCategory(categoryEn: string): boolean {
  const lower = (categoryEn || '').toLowerCase();
  return BLOCKED_CATEGORY_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Load and join the v2 question + answer CSVs from public/v2/.
 * Returns fully joined ContentItemV2 array, filtered to items with
 * both PL and EN question text and at least 2 answer options.
 */
export async function loadContentV2(): Promise<ContentItemV2[]> {
  const [questionRows, answerRows] = await Promise.all([
    fetchCsv<QuestionRowV2>('/v2/questions_all_2650.csv'),
    fetchCsv<AnswerRowV2>('/v2/answers_all_5300.csv'),
  ]);

  // Group answers by question_id
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

    if (isBlockedCategory(q.category_en)) continue;

    const rawAnswers = answerMap.get(q.question_id) ?? [];
    if (rawAnswers.length < 2) continue;

    const answers = rawAnswers
      .map(parseAnswerRow)
      .sort((a, b) => a.order - b.order);

    items.push({
      questionId:           q.question_id,
      tier:                 (q.tier === 'premium' ? 'premium' : 'free') as 'free' | 'premium',
      categoryPl:           q.category_pl,
      categoryEn:           q.category_en,
      questionPl:           q.question_pl,
      questionEn:           q.question_en,
      answerType:           q.answer_type,
      primaryAxis:          q.primary_axis,
      sensitivityLevel:     parseInt(q.sensitivity_level, 10) || 0,
      controversyLevel:     parseInt(q.controversy_level, 10) || 0,
      rarityWeight:         parseFloat(q.rarity_weight) || 1,
      safetyLabel:          q.safety_label,
      statisticSourceLabel: q.statistic_source_label,
      revealTemplateIds:    parseRevealTemplateIds(q.reveal_template_ids),
      productionStatus:     q.production_status,
      answers,
    });
  }

  return items;
}
