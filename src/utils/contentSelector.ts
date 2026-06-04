import { ContentItem, ContentType, RarityTier } from '../types';

function weightedRandom<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return items[i];
  }
  return items[items.length - 1];
}

interface TypeDist {
  question: number;
  secret: number;
  game: number;
  dare?: number;
  riddle?: number;
}

interface RarityDist {
  standard: number;
  rare: number;
  epic?: number;
  legendary?: number;
}

function getTypeDistribution(n: number): TypeDist {
  if (n <= 5)  return { question: 0.60, secret: 0.20, game: 0.20 };
  if (n <= 10) return { question: 0.50, secret: 0.20, game: 0.15, dare: 0.10, riddle: 0.05 };
  if (n <= 20) return { question: 0.45, secret: 0.25, game: 0.15, dare: 0.10, riddle: 0.05 };
  return          { question: 0.40, secret: 0.25, game: 0.15, dare: 0.15, riddle: 0.05 };
}

function getRarityDistribution(n: number): RarityDist {
  if (n <= 5)  return { standard: 0.80, rare: 0.20 };
  if (n <= 10) return { standard: 0.55, rare: 0.35, epic: 0.10 };
  if (n <= 20) return { standard: 0.45, rare: 0.35, epic: 0.17, legendary: 0.03 };
  return          { standard: 0.35, rare: 0.35, epic: 0.25, legendary: 0.05 };
}

export function selectContent(
  allContent: ContentItem[],
  seenIds: string[],
  interactionNum: number,
  legendaryCount: number,
  legendaryLimit = 2
): ContentItem | null {
  const available = allContent.filter((item) => !seenIds.includes(item.id));
  if (available.length === 0) return null;

  const typeDist = getTypeDistribution(interactionNum);
  const rarityDist = getRarityDistribution(interactionNum);

  const typeEntries = Object.entries(typeDist) as [ContentType, number][];
  const targetType = weightedRandom(
    typeEntries.map((e) => e[0]),
    typeEntries.map((e) => e[1])
  );

  let rarityEntries = Object.entries(rarityDist) as [RarityTier, number][];
  if (legendaryCount >= legendaryLimit) {
    rarityEntries = rarityEntries.filter(([k]) => k !== 'legendary');
  }
  const targetRarity = weightedRandom(
    rarityEntries.map((e) => e[0]),
    rarityEntries.map((e) => e[1])
  );

  const byBoth = available.filter(
    (i) => i.content_type === targetType && i.rarity_tier === targetRarity
  );
  const byType = available.filter((i) => i.content_type === targetType);
  const byRarity = available.filter((i) => i.rarity_tier === targetRarity);

  let candidates = byBoth.length ? byBoth : byType.length ? byType : byRarity.length ? byRarity : available;

  if (legendaryCount >= legendaryLimit) {
    const nonLeg = candidates.filter((i) => i.rarity_tier !== 'legendary');
    if (nonLeg.length) candidates = nonLeg;
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

const RARITY_MULTIPLIER: Record<RarityTier, number> = {
  standard: 1.0,
  rare: 1.3,
  epic: 1.8,
  legendary: 2.5,
};

export function calcProgressGain(item: ContentItem): number {
  const mult = RARITY_MULTIPLIER[item.rarity_tier] ?? 1.0;
  const pw = parseFloat(item.paywall_weight) || 0;
  return 0.8 * mult + pw * 0.25;
}
