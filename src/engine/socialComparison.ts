import { getCommunityPercentages } from '../utils/communityStats';

export type SocialStatSource = 'real_sample' | 'current_sample' | 'estimated' | 'simulated';

export interface AnswerDistributionItem {
  answerId: string;
  label: string;
  percent: number;
}

export interface SocialComparisonInsight {
  source: SocialStatSource;
  sourceLabelEn: string;
  sourceLabelPl: string;
  distribution: AnswerDistributionItem[];
  selectedAnswerId: string;
  selectedAnswerPercent: number;
}

export interface PostAnswerPatternInsight {
  insightId: string;
  source: 'axis_delta' | 'hidden_signal' | 'rarity' | 'comparison' | 'content_fallback';
  textEn: string;
  textPl: string;
  relatedAxes?: string[];
  confidence: 'low' | 'medium' | 'high';
}

interface AxisInsight {
  positive: string;
  negative: string;
}

const AXIS_INSIGHTS: Record<string, AxisInsight> = {
  AX01: { positive: 'This choice often aligns with profiles that lean toward curiosity and exploration.', negative: 'This answer tends to appear in profiles that value familiarity and security.' },
  AX02: { positive: 'This choice is common among profiles with stronger analytical signals.', negative: 'This answer often surfaces in profiles that weight emotional context heavily.' },
  AX03: { positive: 'People choosing this path tend to protect autonomy above comfort.', negative: 'This answer is more common among profiles where connection shapes decisions.' },
  AX04: { positive: 'This choice often aligns with profiles that notice details before acting.', negative: 'Action-oriented profiles tend to choose this more often.' },
  AX05: { positive: 'Present-moment profiles tend to gravitate toward this answer.', negative: 'Profiles with stronger future orientation tend to choose this.' },
  AX06: { positive: 'This answer appears more often in profiles that trust instinct over structure.', negative: 'Profiles that prefer clear frameworks tend to lean here.' },
  AX07: { positive: 'This choice is common in profiles that filter decisions through practical impact.', negative: 'Ideals-driven profiles tend to choose this answer.' },
  AX08: { positive: 'Stability-oriented profiles tend to select this option.', negative: 'Profiles open to transformation or change lean toward this answer.' },
  AX09: { positive: 'Profiles with a stronger connection to natural environments chose this more often.', negative: 'Profiles that lean toward technology and systems chose this more often.' },
  AX10: { positive: 'Profiles with stronger creative signals tend toward this choice.', negative: 'Profiles that favor systematic approaches tend to choose this.' },
};

const FALLBACK = [
  'This choice reflects a direction that takes more signals to fully interpret.',
  'Your choice was common. Your timing may become the more interesting signal.',
  'This answer points toward a pattern that is still forming.',
];

export function computeSocialComparison(contentId: string, selectedAnswer: string, options: string[]): SocialComparisonInsight | null {
  if (!options.length) return null;
  const percentages = getCommunityPercentages(contentId, options);
  if (!percentages.length) return null;

  const distribution = percentages.map((p, i) => ({
    answerId: `${contentId}_${i}`,
    label: p.option,
    percent: p.pct,
  }));
  const selected = distribution.find((d) => d.label === selectedAnswer) ?? distribution[0];

  return {
    source: 'simulated',
    sourceLabelEn: 'Estimated signal',
    sourceLabelPl: 'Estimated signal',
    distribution,
    selectedAnswerId: selected.answerId,
    selectedAnswerPercent: selected.percent,
  };
}

export function computePatternInsight(
  axes: { name: string; delta: number }[],
  rarityTier: string,
  totalAnswers: number,
): PostAnswerPatternInsight | null {
  void rarityTier;
  let dominant: { name: string; delta: number } | null = null;
  for (const axis of axes) {
    if (!dominant || Math.abs(axis.delta) > Math.abs(dominant.delta)) dominant = axis;
  }

  if (!dominant) {
    const text = FALLBACK[totalAnswers % FALLBACK.length];
    return { insightId: `fallback_${totalAnswers}`, source: 'content_fallback', textEn: text, textPl: text, confidence: 'low' };
  }

  const key = dominant.name.toUpperCase().startsWith('AX') ? dominant.name.toUpperCase() : dominant.name;
  const text = AXIS_INSIGHTS[key]
    ? (dominant.delta >= 0 ? AXIS_INSIGHTS[key].positive : AXIS_INSIGHTS[key].negative)
    : FALLBACK[totalAnswers % FALLBACK.length];

  return {
    insightId: `axis_${key}_${dominant.delta >= 0 ? 'pos' : 'neg'}_${totalAnswers}`,
    source: 'axis_delta',
    textEn: text,
    textPl: text,
    relatedAxes: [dominant.name],
    confidence: axes.length >= 2 ? 'medium' : 'low',
  };
}

export function getInsightSourceLabel(source: SocialStatSource): string {
  void source;
  return 'Estimated signal';
}
