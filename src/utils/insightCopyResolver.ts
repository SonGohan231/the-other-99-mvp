import { getRevealTemplate } from '../content/revealTemplates';

export interface InsightCopyParams {
  selectedAnswer: string | null;
  answerRevealShorts?: Record<string, { pl: string; en: string }>;
  revealTemplateId?: string | null | undefined;
  rarityTier: string;
  lang: string;
  fallbacks: {
    insightLegendary: string;
    insightEpic: string;
    insightRare: string;
    insight: string;
  };
}

/**
 * Resolve insight copy for the reveal phase.
 * Priority: TIER_1 per-answer reveal → reveal template → rarity fallback.
 */
export function resolveInsightCopy(params: InsightCopyParams): string {
  const { selectedAnswer, answerRevealShorts, revealTemplateId, rarityTier, lang, fallbacks } = params;

  // TIER_1: per-answer reveal from v2 content
  if (selectedAnswer && answerRevealShorts?.[selectedAnswer]) {
    const rev = answerRevealShorts[selectedAnswer];
    return lang === 'pl' ? rev.pl : rev.en;
  }

  // Reveal template lookup
  const template = getRevealTemplate(revealTemplateId ?? undefined);
  if (template) return lang === 'pl' ? template.insightCopy.pl : template.insightCopy.en;

  // Fallback: rarity-based copy from i18n
  if (rarityTier === 'legendary') return fallbacks.insightLegendary;
  if (rarityTier === 'epic') return fallbacks.insightEpic;
  if (rarityTier === 'rare') return fallbacks.insightRare;
  return fallbacks.insight;
}
