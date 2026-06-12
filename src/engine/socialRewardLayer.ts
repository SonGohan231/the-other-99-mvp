import { CanonicalVector } from '../utils/canonicalVector';
import { PatternEngineResult } from './patternEngine';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RewardLevel = 'none' | 'spark' | 'signal' | 'meaningful' | 'rare';
export type RewardKind  = 'progress' | 'rarity' | 'comparison' | 'pattern' | 'reflection';

export interface SocialRewardLayerResult {
  version: 'stage8_social_reward_layer_v1';
  answers_analyzed: number;
  is_sufficient: boolean;             // true when >= SUFFICIENT_THRESHOLD
  is_displayable: boolean;            // true when >= DISPLAY_THRESHOLD
  reward_level: RewardLevel;
  reward_kind: RewardKind;
  safe_text_en: string;               // shown in RewardScreen when is_displayable
  safe_text_pl: string;
  progress_label: string;             // e.g. "8 answers analyzed"
  rarity_label: string;               // e.g. "Uncommon response pattern"
  anonymous_comparison_label: string; // hedged, no percentiles, no "you are X%"
  debug_notes: string[];
}

// ─── Thresholds ───────────────────────────────────────────────────────────────

const SUFFICIENT_THRESHOLD = 3;
const DISPLAY_THRESHOLD    = 8;
const MEANINGFUL_THRESHOLD = 12;
const RARE_THRESHOLD       = 17;

// Axis extremity: avg |value| above this → rarity kind eligible
const RARITY_EXTREMITY_THRESHOLD = 5.5;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toLevel(count: number): RewardLevel {
  if (count >= RARE_THRESHOLD)       return 'rare';
  if (count >= MEANINGFUL_THRESHOLD) return 'meaningful';
  if (count >= DISPLAY_THRESHOLD)    return 'signal';
  if (count >= SUFFICIENT_THRESHOLD) return 'spark';
  return 'none';
}

function vectorExtremity(cv: CanonicalVector): number {
  const vals = Object.values(cv).filter(Number.isFinite);
  if (vals.length === 0) return 0;
  return vals.reduce((s, v) => s + Math.abs(v as number), 0) / vals.length;
}

function toKind(
  level: RewardLevel,
  patternResult: PatternEngineResult | null,
  extremity: number,
): RewardKind {
  if (level === 'none' || level === 'spark') return 'progress';
  const hasPattern = Boolean(patternResult?.strongest_pattern);
  const isRare     = extremity >= RARITY_EXTREMITY_THRESHOLD;

  switch (level) {
    case 'signal':
      return hasPattern ? 'pattern' : 'comparison';
    case 'meaningful':
      if (hasPattern) return 'pattern';
      if (isRare)     return 'rarity';
      return 'reflection';
    case 'rare':
      if (hasPattern) return 'pattern';
      if (isRare)     return 'rarity';
      return 'reflection';
  }
}

// ─── Copy builders ────────────────────────────────────────────────────────────

interface Copy { en: string; pl: string }

function buildSafeText(level: RewardLevel, kind: RewardKind): Copy {
  if (level === 'none' || level === 'spark') {
    return {
      en: 'A few patterns are starting to form in your answers.',
      pl: 'Kilka wzorców zaczyna się kształtować w Twoich odpowiedziach.',
    };
  }
  if (level === 'signal') {
    if (kind === 'pattern') {
      return {
        en: 'Your answers are forming a consistent direction.',
        pl: 'Twoje odpowiedzi tworzą spójny kierunek.',
      };
    }
    return {
      en: 'This combination of answers stands out at this stage of the profile.',
      pl: 'Ta kombinacja odpowiedzi wyróżnia się na tym etapie profilu.',
    };
  }
  if (level === 'meaningful') {
    if (kind === 'pattern') {
      return {
        en: 'A recurring pattern has emerged across your answers.',
        pl: 'Powtarzający się wzorzec pojawił się w Twoich odpowiedziach.',
      };
    }
    if (kind === 'rarity') {
      return {
        en: 'Your profile contains an uncommon combination of response signals.',
        pl: 'Twój profil zawiera niecodzienną kombinację sygnałów odpowiedzi.',
      };
    }
    return {
      en: 'The questions you engage with deeply are leaving a consistent trace.',
      pl: 'Pytania, z którymi głęboko się angażujesz, pozostawiają spójny ślad.',
    };
  }
  // rare
  if (kind === 'pattern') {
    return {
      en: 'A stable decision pattern has emerged across your answers.',
      pl: 'Stabilny wzorzec decyzji wyłonił się z Twoich odpowiedzi.',
    };
  }
  if (kind === 'rarity') {
    return {
      en: 'Your profile reflects an unusual combination of decision signals.',
      pl: 'Twój profil odzwierciedla niecodzienną kombinację sygnałów decyzji.',
    };
  }
  return {
    en: 'Your response pattern has become more consistent across the answers you have given.',
    pl: 'Twój wzorzec odpowiedzi stał się bardziej spójny na przestrzeni danych odpowiedzi.',
  };
}

function buildProgressLabel(count: number): string {
  return `${count} ${count === 1 ? 'answer' : 'answers'} analyzed`;
}

function buildRarityLabel(extremity: number): string {
  if (extremity >= RARITY_EXTREMITY_THRESHOLD) return 'Uncommon response pattern';
  return 'Estimated signal';
}

function buildComparisonLabel(level: RewardLevel, kind: RewardKind): string {
  if (kind === 'rarity' || level === 'rare') {
    return 'This decision combination appears in a distinct subset of answer profiles.';
  }
  if (level === 'meaningful') {
    return 'A specific pattern has emerged at this stage.';
  }
  return 'This combination of answers stands out in this stage of the profile.';
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function computeSocialRewardLayer(
  answersAnalyzed: number,
  patternResult: PatternEngineResult | null,
  canonicalVector: CanonicalVector,
  rarityPoints: number,
): SocialRewardLayerResult {
  const count = Math.max(0, Math.floor(
    Number.isFinite(answersAnalyzed) ? answersAnalyzed : 0,
  ));
  const is_sufficient  = count >= SUFFICIENT_THRESHOLD;
  const is_displayable = count >= DISPLAY_THRESHOLD;

  const level    = toLevel(count);
  const extremity = vectorExtremity(canonicalVector);
  const kind     = toKind(level, patternResult, extremity);
  const { en, pl } = buildSafeText(level, kind);

  const debug_notes: string[] = [
    `level=${level}`,
    `kind=${kind}`,
    `extremity=${extremity.toFixed(2)}`,
    `rarity_points=${typeof rarityPoints === 'number' && Number.isFinite(rarityPoints) ? rarityPoints.toFixed(1) : '0'}`,
    `pattern_detected=${Boolean(patternResult?.strongest_pattern)}`,
  ];

  return {
    version: 'stage8_social_reward_layer_v1',
    answers_analyzed: count,
    is_sufficient,
    is_displayable,
    reward_level: level,
    reward_kind: kind,
    safe_text_en: is_displayable ? en : '',
    safe_text_pl: is_displayable ? pl : '',
    progress_label: buildProgressLabel(count),
    rarity_label: buildRarityLabel(extremity),
    anonymous_comparison_label: buildComparisonLabel(level, kind),
    debug_notes,
  };
}
