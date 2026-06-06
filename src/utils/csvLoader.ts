import { ContentItem, RarityTier } from '../types';
import { loadContentV2 } from './csvLoaderV2';
import { ContentItemV2 } from '../types/contentV2';

type ContentItemWithDiagnostics = ContentItem & {
  content_source?: 'legacy' | 'v2' | 'special_mode' | 'fallback';
  content_version?: string;
  source_file?: string;
  question_id?: string;
  answer_ids_json?: string;
  answer_axis_deltas_json?: string;
  answer_reveal_shorts_json?: string;
  source_mode?: string;
  source_tier?: string;
};

function rarityFromWeight(weight: number): RarityTier {
  if (weight >= 2.2) return 'legendary';
  if (weight >= 1.6) return 'epic';
  if (weight >= 1.2) return 'rare';
  return 'standard';
}

function mapV2ModeToCardPath(mode: string): string {
  const normalized = (mode || '').toLowerCase();

  if (normalized.includes('secret')) return 'Secret Human';
  if (normalized.includes('memory')) return 'Memory Trace';
  if (normalized.includes('contradiction')) return 'Hidden Contradiction';
  if (normalized.includes('shadow')) return 'Shadow Question';
  if (normalized.includes('relationship')) return 'Social Mirror';
  if (normalized.includes('pressure')) return 'Control Gate';
  if (normalized.includes('risk')) return 'Risk Gate';
  if (normalized.includes('future')) return 'Future Self';
  if (normalized.includes('moral') || normalized.includes('controversial')) return 'Moral Dilemma';
  if (normalized.includes('object')) return 'Object Choice';
  if (normalized.includes('archetype') || normalized.includes('threshold')) return 'Threshold Card';

  return 'Pattern Break';
}

function safeString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function mapV2ToContentItem(item: ContentItemV2): ContentItemWithDiagnostics {
  const answerLabelsPl = item.answers
    .map((answer) => safeString(answer.labelPl || answer.shortLabelPl))
    .filter(Boolean);

  const answerLabelsEn = item.answers
    .map((answer) => safeString(answer.labelEn || answer.shortLabelEn))
    .filter(Boolean);

  const answerIds: string[] = [];
  const axisDeltasByAnswerLabel: Record<string, Record<string, number>> = {};
  const revealByAnswerLabel: Record<string, { pl: string; en: string }> = {};

  for (const answer of item.answers) {
    const answerId = safeString(answer.answerId);
    if (answerId) answerIds.push(answerId);

    const possibleLabels = [
      answer.labelPl,
      answer.labelEn,
      answer.shortLabelPl,
      answer.shortLabelEn,
    ]
      .map(safeString)
      .filter(Boolean);

    const reveal = {
      pl: safeString(answer.answerRevealShortPl || answer.patternRevealPl),
      en: safeString(answer.answerRevealShortEn || answer.patternRevealEn),
    };

    for (const label of possibleLabels) {
      axisDeltasByAnswerLabel[label] = answer.axisDeltas || {};
      revealByAnswerLabel[label] = reveal;
    }
  }

  const rarityTier = rarityFromWeight(item.rarityWeight || 1);
  const cardPath = mapV2ModeToCardPath(item.mode || '');

  return {
    id: item.questionId,
    version: 'v2',
    content_type: 'question',
    rarity_tier: rarityTier,
    rarity_score: String(item.rarityWeight || 1),
    category: item.categoryPl || item.categoryEn || 'v2',
    darkness_level: String(item.controversyLevel ?? 0),
    intimacy_level: String(item.sensitivityLevel ?? 0),
    psychological_intensity: String(
      Math.max(item.sensitivityLevel ?? 0, item.controversyLevel ?? 0),
    ),

    prompt_pl: item.questionPl,
    prompt_en: item.questionEn,

    answer_type: item.answerType || 'forced_choice',
    answer_options_pl: answerLabelsPl.join('|'),
    answer_options_en: answerLabelsEn.join('|'),

    axis_target: item.primaryAxis || '',
    axis_delta_json: '{}',

    hidden_signal: '',
    reward_after_answer_pl: '',
    verification_type: '',
    moderation_level: '',
    paywall_weight: item.tier === 'premium' ? '1' : '0',
    notes: '',

    reward_type: 'insight',
    reward_intensity: String(item.rarityWeight || 1),
    community_reveal_type: 'estimated',
    profile_reveal_type: 'standard',
    unlock_type: '',

    next_hook_pl: '',
    next_hook_en: '',

    card_path: cardPath,
    theme_category: item.categoryEn || item.categoryPl || 'v2',
    access_tier: item.tier === 'premium' ? 'premium' : 'free',

    community_stat_seed_json: '{}',
    reward_sequence_json: '{}',
    sample_reward_screen_pl: '',

    canon_version: 'TO99_ARCHETYPE_CANON_1.0',
    safety_label: (item.safetyLabel as ContentItem['safety_label']) || 'safe',
    statistic_source_label:
      (item.statisticSourceLabel as ContentItem['statistic_source_label']) || 'estimated',
    allowed_actions: '',
    reveal_template_id: item.revealTemplateIds?.[0] || 'reveal_standard',
    sensitivity_level: String(item.sensitivityLevel ?? 0),
    controversy_level: String(item.controversyLevel ?? 0),
    content_contract_status:
      item.productionStatus === 'approved' ? 'approved' : 'reviewed',

    content_source: 'v2',
    content_version: '2.0.0',
    source_file: 'public/v2/questions_all_2650.csv+answers_all_5300.csv',
    question_id: item.questionId,
    answer_ids_json: JSON.stringify(answerIds),
    answer_axis_deltas_json: JSON.stringify(axisDeltasByAnswerLabel),
    answer_reveal_shorts_json: JSON.stringify(revealByAnswerLabel),
    source_mode: item.mode,
    source_tier: item.tier,
  };
}

export async function loadContent(): Promise<ContentItem[]> {
  const v2Items = await loadContentV2();

  if (!Array.isArray(v2Items) || v2Items.length === 0) {
    throw new Error(
      'V2 content database failed to load: loadContentV2() returned no items.',
    );
  }

  const mappedItems = v2Items.map(mapV2ToContentItem);

  const seen = new Set<string>();

  return mappedItems.filter((item) => {
    if (!item.id) return false;
    if (seen.has(item.id)) return false;
    if (!item.prompt_pl && !item.prompt_en) return false;
    if (!item.answer_options_pl && !item.answer_options_en) return false;

    seen.add(item.id);
    return true;
  });
}
