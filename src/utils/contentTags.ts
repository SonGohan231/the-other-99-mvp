import { ContentItem } from '../types';
import { ContentBehavioralProfile } from './behavioralSignals';

// Derive behavioral sensitivity tags from existing content metadata.
// No CSV changes needed — card_path, darkness_level, intimacy_level, and
// psychological_intensity already carry the information.

function parseLevel(value: string | undefined): number {
  const n = parseInt(value ?? '0', 10);
  return isNaN(n) ? 0 : Math.min(10, Math.max(0, n));
}

// Map card path to sensitivity boosts
const CARD_PATH_SENSITIVITY: Record<string, Partial<ContentBehavioralProfile>> = {
  'Shadow Question':       { emotionalIntensity: 8, privacyLevel: 7 },
  'Hidden Contradiction':  { emotionalIntensity: 7, privacyLevel: 6, vulnerabilityLevel: 7 },
  'Social Mirror':         { emotionalIntensity: 5, privacyLevel: 5, vulnerabilityLevel: 6 },
  'Secret Human':          { emotionalIntensity: 8, privacyLevel: 9, vulnerabilityLevel: 8 },
  'Memory Trace':          { emotionalIntensity: 7, privacyLevel: 7, vulnerabilityLevel: 6 },
  'Moral Dilemma':         { emotionalIntensity: 6, privacyLevel: 4 },
  'Pattern Break':         { emotionalIntensity: 5, privacyLevel: 4 },
  'Threshold Card':        { emotionalIntensity: 6, privacyLevel: 5, vulnerabilityLevel: 5 },
  'Risk Gate':             { emotionalIntensity: 4, privacyLevel: 3 },
  'Control Gate':          { emotionalIntensity: 4, privacyLevel: 4 },
  'Future Self':           { emotionalIntensity: 5, privacyLevel: 5 },
  'Object Choice':         { emotionalIntensity: 3, privacyLevel: 2 },
};

// Map content_type boosts
const CONTENT_TYPE_SENSITIVITY: Record<string, Partial<ContentBehavioralProfile>> = {
  secret:   { emotionalIntensity: 8, privacyLevel: 9, vulnerabilityLevel: 8 },
  dare:     { emotionalIntensity: 6, privacyLevel: 7 },
  question: {},
  game:     {},
  riddle:   {},
};

export function getContentBehavioralProfile(item: ContentItem): ContentBehavioralProfile {
  const darkness = parseLevel(item.darkness_level) * 1.2;
  const intimacy = parseLevel(item.intimacy_level);
  const psych = parseLevel(item.psychological_intensity);

  const cardBoost = CARD_PATH_SENSITIVITY[item.card_path ?? ''] ?? {};
  const typeBoost = CONTENT_TYPE_SENSITIVITY[item.content_type] ?? {};

  const emotional = Math.min(10, Math.round(
    (darkness * 0.5 + psych * 0.4 + (cardBoost.emotionalIntensity ?? 0) * 0.7 + (typeBoost.emotionalIntensity ?? 0) * 0.5) / 1.3
  ));
  const privacy = Math.min(10, Math.round(
    (intimacy * 0.6 + (cardBoost.privacyLevel ?? 0) * 0.7 + (typeBoost.privacyLevel ?? 0) * 0.5) / 1.0
  ));
  const vulnerability = Math.min(10, Math.round(
    ((cardBoost.vulnerabilityLevel ?? 0) * 0.7 + intimacy * 0.3 + (typeBoost.vulnerabilityLevel ?? 0) * 0.5) / 0.9
  ));

  return {
    emotionalIntensity: Math.min(10, emotional),
    privacyLevel: Math.min(10, privacy),
    vulnerabilityLevel: Math.min(10, vulnerability),
  };
}
