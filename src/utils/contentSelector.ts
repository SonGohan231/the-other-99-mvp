import { ContentItem, ContentType, RarityTier } from '../types';

// ─── Weighted random helper ───────────────────────────────────────────────────

function weightedRandom<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return items[i];
  }
  return items[items.length - 1];
}

// ─── v0.1 — 30-question loop (kept for reference) ────────────────────────────

interface TypeDist { question: number; secret: number; game: number; dare?: number; riddle?: number; }
interface RarityDist { standard: number; rare: number; epic?: number; legendary?: number; }

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
  const targetType = weightedRandom(typeEntries.map((e) => e[0]), typeEntries.map((e) => e[1]));

  let rarityEntries = Object.entries(rarityDist) as [RarityTier, number][];
  if (legendaryCount >= legendaryLimit) rarityEntries = rarityEntries.filter(([k]) => k !== 'legendary');
  const targetRarity = weightedRandom(rarityEntries.map((e) => e[0]), rarityEntries.map((e) => e[1]));

  const byBoth   = available.filter((i) => i.content_type === targetType && i.rarity_tier === targetRarity);
  const byType   = available.filter((i) => i.content_type === targetType);
  const byRarity = available.filter((i) => i.rarity_tier === targetRarity);

  let candidates = byBoth.length ? byBoth : byType.length ? byType : byRarity.length ? byRarity : available;

  if (legendaryCount >= legendaryLimit) {
    const nonLeg = candidates.filter((i) => i.rarity_tier !== 'legendary');
    if (nonLeg.length) candidates = nonLeg;
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

const RARITY_MULTIPLIER: Record<RarityTier, number> = { standard: 1.0, rare: 1.3, epic: 1.8, legendary: 2.5 };

export function calcProgressGain(item: ContentItem): number {
  const mult = RARITY_MULTIPLIER[item.rarity_tier] ?? 1.0;
  const pw = parseFloat(item.paywall_weight) || 0;
  return 0.8 * mult + pw * 0.25;
}

// ─── v0.2 — Profile Test (17 fixed items) ────────────────────────────────────

const PROFILE_TEST_TYPE_SLOTS: [ContentType, number][] = [
  ['question', 13],
  ['secret', 2],
  ['game', 1],
  ['riddle', 1],
];

const PROFILE_TEST_RARITY_BUDGET: Record<RarityTier, number> = {
  standard: 8,
  rare: 5,
  epic: 3,
  legendary: 1,
};

export function selectProfileTestContent(
  allContent: ContentItem[],
  seenIds: string[],
  isPremium: boolean = false,
): ContentItem[] {
  const available = allContent.filter((i) =>
    !seenIds.includes(i.id) && (isPremium || i.access_tier !== 'premium')
  );

  const rarityBudget = { ...PROFILE_TEST_RARITY_BUDGET };
  const selected: ContentItem[] = [];
  const usedIds = new Set<string>();

  for (const [type, count] of PROFILE_TEST_TYPE_SLOTS) {
    let added = 0;

    // Prefer rarest-first to respect rarity budget.
    for (const rarity of ['legendary', 'epic', 'rare', 'standard'] as RarityTier[]) {
      if (added >= count || rarityBudget[rarity] <= 0) continue;
      const pool = available.filter(
        (i) => i.content_type === type && i.rarity_tier === rarity && !usedIds.has(i.id)
      );
      const take = Math.min(pool.length, rarityBudget[rarity], count - added);
      for (let k = 0; k < take; k++) {
        const idx = Math.floor(Math.random() * pool.length);
        const item = pool.splice(idx, 1)[0];
        selected.push(item);
        usedIds.add(item.id);
        rarityBudget[rarity]--;
        added++;
      }
    }

    // Fill remaining with any available of this type.
    if (added < count) {
      const fallback = available.filter((i) => i.content_type === type && !usedIds.has(i.id));
      while (added < count && fallback.length > 0) {
        const idx = Math.floor(Math.random() * fallback.length);
        const item = fallback.splice(idx, 1)[0];
        selected.push(item);
        usedIds.add(item.id);
        added++;
      }
    }

    // Last resort: ignore seenIds for this content type.
    if (added < count) {
      const lastResort = allContent.filter((i) =>
        i.content_type === type && !usedIds.has(i.id) && (isPremium || i.access_tier !== 'premium')
      );
      while (added < count && lastResort.length > 0) {
        const idx = Math.floor(Math.random() * lastResort.length);
        const item = lastResort.splice(idx, 1)[0];
        selected.push(item);
        usedIds.add(item.id);
        added++;
      }
    }
  }

  // Final global fill. The current v2 runtime maps the corpus as content_type='question'.
  // Without this, the fixed 17-step test can silently become 13 items when
  // secret/game/riddle slots cannot be filled.
  const targetCount = PROFILE_TEST_TYPE_SLOTS.reduce((sum, [, count]) => sum + count, 0);
  if (selected.length < targetCount) {
    const globalFallback = available.filter((i) => !usedIds.has(i.id));
    while (selected.length < targetCount && globalFallback.length > 0) {
      const idx = Math.floor(Math.random() * globalFallback.length);
      const item = globalFallback.splice(idx, 1)[0];
      selected.push(item);
      usedIds.add(item.id);
    }
  }

  // Shuffle.
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }

  return selected;
}

// Profile progress formula (v0.2)
export function calcProfileProgress(totalProfileAnswers: number): number {
  if (totalProfileAnswers >= 51) return 100;
  return Math.min(85, (totalProfileAnswers / 51) * 85);
}

// Category-first selection: pick an unseen question from the given category.
// Falls back to any unseen question if the category has no remaining items.
export function selectContentByCategory(
  allContent: ContentItem[],
  seenIds: string[],
  categoryEn: string,
): ContentItem | null {
  const available = allContent.filter((item) => !seenIds.includes(item.id));
  if (available.length === 0) return null;

  const inCategory = available.filter(
    (item) => (item.theme_category || item.category) === categoryEn,
  );

  const pool = inCategory.length > 0 ? inCategory : available;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Adaptive next-question selector ─────────────────────────────────────────

const CANONICAL_AXES = ['AX01','AX02','AX03','AX04','AX05','AX06','AX07','AX08','AX09','AX10'];

export interface NextQuestionSelection {
  item: ContentItem;
  axis: string | null;
  reason: string;
}

export function selectNextAdaptiveQuestion(
  allContent: ContentItem[],
  seenIds: string[],
  canonicalVector: Record<string, number>,
  currentQueue: ContentItem[],
  nextIndex: number,
): NextQuestionSelection | null {
  // Compute axis uncertainty: higher = less data on that axis = more useful to target.
  const uncertainty: Record<string, number> = {};
  for (const ax of CANONICAL_AXES) {
    uncertainty[ax] = 1 / (1 + Math.abs(canonicalVector[ax] ?? 0));
  }

  const seenSet = new Set(seenIds);

  function scoreItem(item: ContentItem): number {
    const target = item.axis_target;
    if (target && uncertainty[target] !== undefined) return uncertainty[target];
    return 0.5;
  }

  const queueCandidates: ContentItem[] = [];
  for (let i = nextIndex; i < currentQueue.length; i++) {
    const item = currentQueue[i];
    if (!seenSet.has(item.id)) queueCandidates.push(item);
  }

  if (queueCandidates.length > 0) {
    const sorted = queueCandidates.slice().sort((a, b) => scoreItem(b) - scoreItem(a));
    const topN = sorted.slice(0, Math.min(3, sorted.length));
    const picked = topN[Math.floor(Math.random() * topN.length)];
    const axis = picked.axis_target || null;
    const unc = axis ? Math.round(uncertainty[axis] * 100) : null;
    const reason = axis
      ? `queue – axis ${axis} uncertainty ${unc}%`
      : 'queue – no axis target';
    return { item: picked, axis, reason };
  }

  const availablePool = allContent.filter((item) => !seenSet.has(item.id));
  if (availablePool.length === 0) return null;

  const sorted = availablePool.slice().sort((a, b) => scoreItem(b) - scoreItem(a));
  const topN = sorted.slice(0, Math.min(3, sorted.length));
  const picked = topN[Math.floor(Math.random() * topN.length)];
  const axis = picked.axis_target || null;
  const unc = axis ? Math.round(uncertainty[axis] * 100) : null;
  const reason = axis
    ? `adaptive – axis ${axis} uncertainty ${unc}%`
    : 'adaptive – no axis target';
  return { item: picked, axis, reason };
}
