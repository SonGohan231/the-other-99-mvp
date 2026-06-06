import { ContentItem } from '../types';

// Question background image paths
export const QUESTION_BG = {
  lake:        '/backgrounds/questions/question-lake.png',
  mountains:   '/backgrounds/questions/question-mountains.png',
  fog:         '/backgrounds/questions/question-fog.png',
  forest:      '/backgrounds/questions/question-forest.png',
  horizon:     '/backgrounds/questions/question-horizon.png',
  desertNight: '/backgrounds/questions/question-desert-night.png',
} as const;

type BgKey = keyof typeof QUESTION_BG;

// Pool definitions from the assignment spec
const POOLS: Record<string, BgKey[]> = {
  common:       ['lake', 'mountains', 'horizon'],
  discovery:    ['forest', 'lake'],
  deep:         ['fog', 'desertNight'],
  premium:      ['fog', 'desertNight'],
  archetype:    ['forest', 'horizon'],
  contradiction:['fog'],
  emotional:    ['desertNight'],
};

function poolFor(item: ContentItem): BgKey[] {
  if (item.access_tier === 'premium') return POOLS.premium;

  const card = (item.card_path ?? '').trim();

  // Card-path specific assignments
  if (card === 'Hidden Contradiction') return POOLS.contradiction;
  if (card === 'Threshold Card' || card === 'Moral Dilemma' || card === 'Shadow Question') return POOLS.emotional;
  if (card === 'Social Mirror') return POOLS.common;
  if (card === 'Control Gate' || card === 'Risk Gate') return POOLS.common;
  if (card === 'Future Self' || card === 'Memory Trace') return POOLS.discovery;
  if (card === 'Object Choice' || card === 'Secret Human') return POOLS.discovery;
  if (card === 'Pattern Break') return POOLS.archetype;

  // Rarity escalation
  if (item.rarity_tier === 'legendary') return POOLS.emotional;
  if (item.rarity_tier === 'epic')      return POOLS.deep;
  if (item.rarity_tier === 'rare')      return POOLS.deep;

  // Content-type fallback
  if (item.content_type === 'secret') return POOLS.deep;
  if (item.content_type === 'dare')   return POOLS.emotional;

  return POOLS.common;
}

// Deterministic hash: same question ID always gets same background
function stableHash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(h * 31 + id.charCodeAt(i), 1);
  }
  return Math.abs(h);
}

export function getQuestionBg(item: ContentItem): string {
  const pool = poolFor(item);
  return QUESTION_BG[pool[stableHash(item.id) % pool.length]];
}

// Preload the next background image so it's ready before the question appears
const preloadCache = new Set<string>();
export function preloadBg(src: string): void {
  if (preloadCache.has(src)) return;
  preloadCache.add(src);
  const img = new Image();
  img.src = src;
}
