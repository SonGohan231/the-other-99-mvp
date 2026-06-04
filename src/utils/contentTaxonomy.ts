import { ContentItem, ContentType, RarityTier } from '../types';

export type CardPath =
  | 'Social Mirror'
  | 'Shadow Question'
  | 'Control Gate'
  | 'Risk Gate'
  | 'Future Self'
  | 'Memory Trace'
  | 'Moral Dilemma'
  | 'Pattern Break'
  | 'Secret Human'
  | 'Object Choice'
  | 'Hidden Contradiction'
  | 'Threshold Card';

export type ThemeCategory = string;

export interface CardPathDefinition {
  path: CardPath;
  compatibleTypes: ContentType[];
  compatibleRarities: RarityTier[];
  compatibleAxes: string[];
  displayLabel: string;
  displaySubtitle: string;
}

export const CARD_PATH_DEFINITIONS: CardPathDefinition[] = [
  {
    path: 'Social Mirror',
    compatibleTypes: ['question', 'secret'],
    compatibleRarities: ['standard', 'rare', 'epic', 'legendary'],
    compatibleAxes: ['belonging', 'emotion', 'guardedness'],
    displayLabel: 'Social Mirror',
    displaySubtitle: 'How you appear to others vs. how you see yourself.',
  },
  {
    path: 'Shadow Question',
    compatibleTypes: ['question', 'secret'],
    compatibleRarities: ['standard', 'rare', 'epic', 'legendary'],
    compatibleAxes: ['guardedness', 'hesitation', 'emotion', 'contradiction'],
    displayLabel: 'Shadow Question',
    displaySubtitle: 'The part of you that stays hidden.',
  },
  {
    path: 'Control Gate',
    compatibleTypes: ['question'],
    compatibleRarities: ['standard', 'rare', 'epic', 'legendary'],
    compatibleAxes: ['control', 'security', 'stability', 'logic'],
    displayLabel: 'Control Gate',
    displaySubtitle: 'What you hold onto and what you release.',
  },
  {
    path: 'Risk Gate',
    compatibleTypes: ['question', 'dare'],
    compatibleRarities: ['standard', 'rare', 'epic', 'legendary'],
    compatibleAxes: ['risk', 'transformation', 'action', 'curiosity'],
    displayLabel: 'Risk Gate',
    displaySubtitle: 'Where your threshold lies.',
  },
  {
    path: 'Future Self',
    compatibleTypes: ['question'],
    compatibleRarities: ['standard', 'rare', 'epic', 'legendary'],
    compatibleAxes: ['future', 'curiosity', 'builder', 'idealism'],
    displayLabel: 'Future Self',
    displaySubtitle: 'The version of you that might exist.',
  },
  {
    path: 'Memory Trace',
    compatibleTypes: ['question', 'secret'],
    compatibleRarities: ['standard', 'rare', 'epic', 'legendary'],
    compatibleAxes: ['belonging', 'emotion', 'security', 'present'],
    displayLabel: 'Memory Trace',
    displaySubtitle: 'Something that still shapes you.',
  },
  {
    path: 'Moral Dilemma',
    compatibleTypes: ['question'],
    compatibleRarities: ['standard', 'rare', 'epic', 'legendary'],
    compatibleAxes: ['logic', 'emotion', 'belonging', 'independence', 'idealism'],
    displayLabel: 'Moral Dilemma',
    displaySubtitle: 'No right answer. Only yours.',
  },
  {
    path: 'Pattern Break',
    compatibleTypes: ['question', 'riddle'],
    compatibleRarities: ['standard', 'rare', 'epic', 'legendary'],
    compatibleAxes: ['contradiction', 'transformation', 'risk', 'hesitation'],
    displayLabel: 'Pattern Break',
    displaySubtitle: 'Something that doesn\'t fit your pattern.',
  },
  {
    path: 'Secret Human',
    compatibleTypes: ['secret', 'question'],
    compatibleRarities: ['standard', 'rare', 'epic', 'legendary'],
    compatibleAxes: ['emotion', 'guardedness', 'openness'],
    displayLabel: 'Secret Human',
    displaySubtitle: 'What you carry privately.',
  },
  {
    path: 'Object Choice',
    compatibleTypes: ['game'],
    compatibleRarities: ['standard', 'rare', 'epic', 'legendary'],
    compatibleAxes: [],
    displayLabel: 'Object Choice',
    displaySubtitle: 'A symbolic choice that maps your instincts.',
  },
  {
    path: 'Hidden Contradiction',
    compatibleTypes: ['question'],
    compatibleRarities: ['standard', 'rare', 'epic', 'legendary'],
    compatibleAxes: ['consistency', 'guardedness', 'logic', 'emotion'],
    displayLabel: 'Hidden Contradiction',
    displaySubtitle: 'The tension you haven\'t resolved.',
  },
  {
    path: 'Threshold Card',
    compatibleTypes: ['question', 'secret'],
    compatibleRarities: ['epic', 'legendary'],
    compatibleAxes: [],
    displayLabel: 'Threshold Card',
    displaySubtitle: 'A signal that appears in very few profiles.',
  },
];

// ─── Axis → CardPath mapping ──────────────────────────────────────────────────

const AXIS_TO_PATH: Record<string, CardPath> = {
  // Control Gate axes
  control: 'Control Gate',
  security: 'Control Gate',
  stability: 'Control Gate',
  logic: 'Control Gate',
  // Risk Gate axes
  risk: 'Risk Gate',
  transformation: 'Risk Gate',
  action: 'Risk Gate',
  // Future Self axes
  future: 'Future Self',
  builder: 'Future Self',
  idealism: 'Future Self',
  // Memory Trace axes
  present: 'Memory Trace',
  belonging: 'Memory Trace',
  // Shadow Question axes
  guardedness: 'Shadow Question',
  hesitation: 'Shadow Question',
  contradiction: 'Shadow Question',
  // Moral Dilemma axes
  independence: 'Moral Dilemma',
  // Hidden Contradiction axes
  consistency: 'Hidden Contradiction',
  // Secret Human axes
  openness: 'Secret Human',
  // Social Mirror axes
  emotion: 'Social Mirror',
  curiosity: 'Risk Gate',
};

function hashId(id: string): number {
  return id.split('').reduce((a, c) => Math.imul(31, a) + c.charCodeAt(0), 0) >>> 0;
}

export function deriveCardPath(item: ContentItem): CardPath {
  // If CSV provides card_path, use it
  if (item.card_path && item.card_path.trim()) {
    return item.card_path.trim() as CardPath;
  }

  // game → Object Choice
  if (item.content_type === 'game') return 'Object Choice';

  // riddle → Pattern Break
  if (item.content_type === 'riddle') return 'Pattern Break';

  // secret → Secret Human or Shadow Question
  if (item.content_type === 'secret') {
    const h = hashId(item.id);
    return h % 2 === 0 ? 'Secret Human' : 'Shadow Question';
  }

  // epic/legendary → Threshold Card with 30% probability
  if (item.rarity_tier === 'legendary' || item.rarity_tier === 'epic') {
    const h = hashId(item.id);
    if (h % 10 < 3) return 'Threshold Card';
  }

  // Parse axis_target to derive path
  if (item.axis_target) {
    const axes = item.axis_target
      .split(';')
      .map((a) => a.trim().toLowerCase())
      .filter(Boolean);

    for (const axis of axes) {
      const mapped = AXIS_TO_PATH[axis];
      if (mapped) return mapped;
    }
  }

  // Default fallback
  return 'Shadow Question';
}

// ─── Theme category derivation ────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, ThemeCategory> = {
  // Polish → English
  'tożsamość': 'identity',
  'tozsamosc': 'identity',
  'relacje': 'relationships',
  'moralność': 'morality',
  'moralnosc': 'morality',
  'żal': 'regret',
  'zal': 'regret',
  'strach': 'fear',
  'lęk': 'fear',
  'lek': 'fear',
  'kontrola': 'control',
  'ryzyko': 'risk',
  'zmiana': 'change',
  'przyszłość': 'future',
  'przyszlosc': 'future',
  'przeszłość': 'past',
  'przeszlosc': 'past',
  'sekret': 'secrets',
  'wartości': 'values',
  'wartosci': 'values',
  'wolność': 'freedom',
  'wolnosc': 'freedom',
  'emocje': 'emotions',
  'ciekawość': 'curiosity',
  'ciekawosc': 'curiosity',
  'bezpieczeństwo': 'security',
  'bezpieczenstwo': 'security',
  'niezależność': 'independence',
  'niezaleznosc': 'independence',
  'połączenie': 'connection',
  'polaczenie': 'connection',
  // English passthrough
  'identity': 'identity',
  'relationships': 'relationships',
  'morality': 'morality',
  'regret': 'regret',
  'fear': 'fear',
  'control': 'control',
  'risk': 'risk',
  'change': 'change',
  'future': 'future',
  'past': 'past',
  'secrets': 'secrets',
  'values': 'values',
  'freedom': 'freedom',
  'emotions': 'emotions',
  'curiosity': 'curiosity',
  'security': 'security',
  'independence': 'independence',
  'connection': 'connection',
  'decisions': 'decisions',
  'patterns': 'patterns',
  'contradiction': 'contradiction',
};

export function deriveThemeCategory(item: ContentItem): ThemeCategory {
  if (item.theme_category && item.theme_category.trim()) {
    return item.theme_category.trim();
  }
  if (item.category) {
    const key = item.category.trim().toLowerCase();
    return CATEGORY_MAP[key] ?? item.category.trim();
  }
  return 'general';
}
