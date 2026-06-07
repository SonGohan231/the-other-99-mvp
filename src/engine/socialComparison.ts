import { getCommunityPercentages } from '../utils/communityStats';
import { getAxisDisplayName } from '../utils/microReveals';

// ── Types ──────────────────────────────────────────────────────────────────

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
  rarityHintEn?: string;
  rarityHintPl?: string;
}

export interface PostAnswerPatternInsight {
  insightId: string;
  source: 'axis_delta' | 'hidden_signal' | 'rarity' | 'comparison' | 'content_fallback';
  textEn: string;
  textPl: string;
  relatedAxes?: string[];
  confidence: 'low' | 'medium' | 'high';
}

// ── Axis insight map ───────────────────────────────────────────────────────

interface InsightPair {
  en: string;
  pl: string;
}

const AXIS_INSIGHTS_POSITIVE: Record<string, InsightPair> = {
  AX01: { en: 'This choice often aligns with profiles that lean toward curiosity and exploration.', pl: 'Ten wybór często łączy się z profilami, które skłaniają się ku ciekawości i eksploracji.' },
  AX02: { en: 'This choice is common among profiles with stronger analytical signals.', pl: 'Ten wybór jest częsty wśród profili z silniejszymi sygnałami analitycznymi.' },
  AX03: { en: 'People choosing this path tend to protect autonomy above comfort.', pl: 'Osoby wybierające tę ścieżkę częściej chronią autonomię ponad komfort.' },
  AX04: { en: 'This choice often aligns with profiles that notice details before acting.', pl: 'Ten wybór często łączy się z profilami, które zauważają szczegóły przed działaniem.' },
  AX05: { en: 'Present-moment profiles tend to gravitate toward this answer.', pl: 'Profile skoncentrowane na teraźniejszości częściej wybierają tę odpowiedź.' },
  AX06: { en: 'This answer appears more often in profiles that trust instinct over structure.', pl: 'Ta odpowiedź częściej pojawia się w profilach, które ufają instynktowi zamiast strukturze.' },
  AX07: { en: 'This choice is common in profiles that filter decisions through practical impact.', pl: 'Ten wybór jest częsty w profilach, które oceniają decyzje przez pryzmat praktycznego wpływu.' },
  AX08: { en: 'Stability-oriented profiles tend to select this option.', pl: 'Profile nastawione na stabilność częściej wybierają tę opcję.' },
  AX09: { en: 'Profiles with a stronger connection to natural environments chose this more often.', pl: 'Profile z silniejszym połączeniem ze środowiskiem naturalnym częściej wybierają tę opcję.' },
  AX10: { en: 'Profiles with stronger creative signals tend toward this choice.', pl: 'Profile z silniejszymi sygnałami twórczymi częściej skłaniają się ku temu wyborowi.' },
  // Legacy names
  curiosity:     { en: 'This choice often aligns with profiles that lean toward curiosity and exploration.', pl: 'Ten wybór często łączy się z profilami, które skłaniają się ku ciekawości i eksploracji.' },
  logic:         { en: 'This choice is common among profiles with stronger analytical signals.', pl: 'Ten wybór jest częsty wśród profili z silniejszymi sygnałami analitycznymi.' },
  independence:  { en: 'People choosing this path tend to protect autonomy above comfort.', pl: 'Osoby wybierające tę ścieżkę częściej chronią autonomię ponad komfort.' },
  observation:   { en: 'This choice often aligns with profiles that notice details before acting.', pl: 'Ten wybór często łączy się z profilami, które zauważają szczegóły przed działaniem.' },
  present:       { en: 'Present-moment profiles tend to gravitate toward this answer.', pl: 'Profile skoncentrowane na teraźniejszości częściej wybierają tę odpowiedź.' },
  spontaneity:   { en: 'This answer appears more often in profiles that trust instinct over structure.', pl: 'Ta odpowiedź częściej pojawia się w profilach, które ufają instynktowi zamiast strukturze.' },
  pragmatism:    { en: 'This choice is common in profiles that filter decisions through practical impact.', pl: 'Ten wybór jest częsty w profilach, które oceniają decyzje przez pryzmat praktycznego wpływu.' },
  stability:     { en: 'Stability-oriented profiles tend to select this option.', pl: 'Profile nastawione na stabilność częściej wybierają tę opcję.' },
  nature:        { en: 'Profiles with a stronger connection to natural environments chose this more often.', pl: 'Profile z silniejszym połączeniem ze środowiskiem naturalnym częściej wybierają tę opcję.' },
  creator:       { en: 'Profiles with stronger creative signals tend toward this choice.', pl: 'Profile z silniejszymi sygnałami twórczymi częściej skłaniają się ku temu wyborowi.' },
  idea_creator:  { en: 'Profiles with stronger creative signals tend toward this choice.', pl: 'Profile z silniejszymi sygnałami twórczymi częściej skłaniają się ku temu wyborowi.' },
  action:        { en: 'Action-oriented profiles tend to choose this more often.', pl: 'Profile nastawione na działanie częściej wybierają tę odpowiedź.' },
  control:       { en: 'Profiles that prefer clear frameworks tend to lean here.', pl: 'Profile preferujące jasne struktury częściej skłaniają się w tę stronę.' },
  future:        { en: 'Profiles with stronger future orientation tend to choose this.', pl: 'Profile z silniejszą orientacją na przyszłość częściej wybierają tę odpowiedź.' },
};

const AXIS_INSIGHTS_NEGATIVE: Record<string, InsightPair> = {
  AX01: { en: 'This answer tends to appear in profiles that value familiarity and security.', pl: 'Ta odpowiedź częściej pojawia się w profilach, które cenią znajomość i bezpieczeństwo.' },
  AX02: { en: 'This answer often surfaces in profiles that weight emotional context heavily.', pl: 'Ta odpowiedź częściej pojawia się w profilach, które przywiązują dużą wagę do kontekstu emocjonalnego.' },
  AX03: { en: 'This answer is more common among profiles where connection shapes decisions.', pl: 'Ta odpowiedź jest częstsza wśród profili, w których więź kształtuje decyzje.' },
  AX04: { en: 'Action-oriented profiles tend to choose this more often.', pl: 'Profile nastawione na działanie częściej wybierają tę odpowiedź.' },
  AX05: { en: 'Profiles with stronger future orientation tend to choose this.', pl: 'Profile z silniejszą orientacją na przyszłość częściej wybierają tę odpowiedź.' },
  AX06: { en: 'Profiles that prefer clear frameworks tend to lean here.', pl: 'Profile preferujące jasne struktury częściej skłaniają się w tę stronę.' },
  AX07: { en: 'Ideals-driven profiles tend to choose this answer.', pl: 'Profile kierujące się ideałami częściej wybierają tę odpowiedź.' },
  AX08: { en: 'Profiles open to transformation or change lean toward this answer.', pl: 'Profile otwarte na transformację i zmiany skłaniają się ku tej odpowiedzi.' },
  AX09: { en: 'Profiles that lean toward technology and systems chose this more often.', pl: 'Profile skłaniające się ku technologii i systemom częściej wybierają tę opcję.' },
  AX10: { en: 'Profiles that favor systematic approaches tend to choose this.', pl: 'Profile preferujące podejście systematyczne częściej wybierają tę odpowiedź.' },
  // Legacy names — mapped to nearest negative counterpart
  curiosity:     { en: 'This answer tends to appear in profiles that value familiarity and security.', pl: 'Ta odpowiedź częściej pojawia się w profilach, które cenią znajomość i bezpieczeństwo.' },
  logic:         { en: 'This answer often surfaces in profiles that weight emotional context heavily.', pl: 'Ta odpowiedź częściej pojawia się w profilach, które przywiązują dużą wagę do kontekstu emocjonalnego.' },
  independence:  { en: 'This answer is more common among profiles where connection shapes decisions.', pl: 'Ta odpowiedź jest częstsza wśród profili, w których więź kształtuje decyzje.' },
  observation:   { en: 'Action-oriented profiles tend to choose this more often.', pl: 'Profile nastawione na działanie częściej wybierają tę odpowiedź.' },
  present:       { en: 'Profiles with stronger future orientation tend to choose this.', pl: 'Profile z silniejszą orientacją na przyszłość częściej wybierają tę odpowiedź.' },
  spontaneity:   { en: 'Profiles that prefer clear frameworks tend to lean here.', pl: 'Profile preferujące jasne struktury częściej skłaniają się w tę stronę.' },
  pragmatism:    { en: 'Ideals-driven profiles tend to choose this answer.', pl: 'Profile kierujące się ideałami częściej wybierają tę odpowiedź.' },
  stability:     { en: 'Profiles open to transformation or change lean toward this answer.', pl: 'Profile otwarte na transformację i zmiany skłaniają się ku tej odpowiedzi.' },
  nature:        { en: 'Profiles that lean toward technology and systems chose this more often.', pl: 'Profile skłaniające się ku technologii i systemom częściej wybierają tę opcję.' },
  creator:       { en: 'Profiles that favor systematic approaches tend to choose this.', pl: 'Profile preferujące podejście systematyczne częściej wybierają tę odpowiedź.' },
  idea_creator:  { en: 'Profiles that favor systematic approaches tend to choose this.', pl: 'Profile preferujące podejście systematyczne częściej wybierają tę odpowiedź.' },
};

const FALLBACK_INSIGHTS: InsightPair[] = [
  { en: 'This choice reflects a direction that takes more signals to fully interpret.', pl: 'Ten wybór odzwierciedla kierunek, który wymaga więcej sygnałów do interpretacji.' },
  { en: 'Your choice was common. Your timing may become the more interesting signal.', pl: 'Twój wybór był częsty. Ciekawszym sygnałem może być tempo odpowiedzi.' },
  { en: 'This answer points toward a pattern that is still forming.', pl: 'Ta odpowiedź wskazuje na wzorzec, który wciąż się kształtuje.' },
];

const RARITY_HINTS: Record<string, InsightPair> = {
  rare:      { en: 'This was a rare question. Fewer signals map here — each answer carries more weight.', pl: 'To było rzadkie pytanie. Mniej sygnałów dotyczy tego obszaru — każda odpowiedź niesie większą wagę.' },
  epic:      { en: 'This question reaches a deeper layer. Patterns here take longer to interpret.', pl: 'To pytanie dotyka głębszej warstwy. Wzorce tutaj wymagają dłuższej interpretacji.' },
  legendary: { en: 'Very few questions touch this dimension. This answer will remain significant.', pl: 'Bardzo niewiele pytań dotyka tego wymiaru. Ta odpowiedź pozostanie znacząca.' },
};

// ── Core functions ─────────────────────────────────────────────────────────

export function computeSocialComparison(
  contentId: string,
  selectedAnswer: string,
  options: string[],
): SocialComparisonInsight | null {
  if (options.length === 0) return null;

  const percentages = getCommunityPercentages(contentId, options);
  if (percentages.length === 0) return null;

  const distribution: AnswerDistributionItem[] = percentages.map((p, i) => ({
    answerId: `${contentId}_${i}`,
    label: p.option,
    percent: p.pct,
  }));

  const selected = distribution.find((d) => d.label === selectedAnswer);
  const selectedAnswerPercent = selected?.percent ?? 0;

  return {
    source: 'simulated',
    sourceLabelEn: 'Estimated signal',
    sourceLabelPl: 'Szacowany sygnał',
    distribution,
    selectedAnswerId: selected?.answerId ?? `${contentId}_0`,
    selectedAnswerPercent,
  };
}

export function computePatternInsight(
  axes: { name: string; delta: number }[],
  rarityTier: string,
  totalAnswers: number,
): PostAnswerPatternInsight | null {
  // Find the axis with the largest absolute delta
  let dominant: { name: string; delta: number } | null = null;
  for (const ax of axes) {
    if (!dominant || Math.abs(ax.delta) > Math.abs(dominant.delta)) {
      dominant = ax;
    }
  }

  if (!dominant) {
    // Generic fallback
    const fallback = FALLBACK_INSIGHTS[totalAnswers % FALLBACK_INSIGHTS.length];
    return {
      insightId: `fallback_${totalAnswers}`,
      source: 'content_fallback',
      textEn: fallback.en,
      textPl: fallback.pl,
      confidence: 'low',
    };
  }

  const lookupKey = dominant.name.toUpperCase().startsWith('AX')
    ? dominant.name.toUpperCase()
    : dominant.name.toLowerCase();

  const isPositive = dominant.delta >= 0;
  const insightMap = isPositive ? AXIS_INSIGHTS_POSITIVE : AXIS_INSIGHTS_NEGATIVE;
  const pair = insightMap[lookupKey];

  if (!pair) {
    // Try display name lookup
    const displayName = getAxisDisplayName(dominant.name).toLowerCase();
    const fallback = FALLBACK_INSIGHTS[totalAnswers % FALLBACK_INSIGHTS.length];
    void displayName; // available for future use
    return {
      insightId: `axis_${lookupKey}_${totalAnswers}`,
      source: 'axis_delta',
      textEn: fallback.en,
      textPl: fallback.pl,
      relatedAxes: [dominant.name],
      confidence: 'low',
    };
  }

  const rarityHint = RARITY_HINTS[rarityTier];

  return {
    insightId: `axis_${lookupKey}_${isPositive ? 'pos' : 'neg'}_${totalAnswers}`,
    source: 'axis_delta',
    textEn: pair.en,
    textPl: pair.pl,
    relatedAxes: [dominant.name],
    confidence: axes.length >= 2 ? 'medium' : 'low',
    ...(rarityHint && {
      // rarityHint available as separate field if needed — attach to insight for now
    }),
  };
}

export function getInsightSourceLabel(source: SocialStatSource, lang: 'en' | 'pl' = 'en'): string {
  const labels: Record<SocialStatSource, { en: string; pl: string }> = {
    real_sample:     { en: 'Real sample', pl: 'Prawdziwa próba' },
    current_sample:  { en: 'Current sample', pl: 'Bieżąca próba' },
    estimated:       { en: 'Estimated signal', pl: 'Szacowany sygnał' },
    simulated:       { en: 'Estimated signal', pl: 'Szacowany sygnał' },
  };
  return lang === 'pl' ? labels[source].pl : labels[source].en;
}
