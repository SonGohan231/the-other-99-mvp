import { ContentItem } from '../types';
import { CanonicalVector } from './canonicalVector';

/**
 * Recommend `count` categories for the next question.
 * Priority: categories covering axes with the lowest absolute canonical vector values
 * (i.e., the axes where the profile signal is weakest / most uncertain).
 * Slight shuffling ensures the same two categories don't always appear.
 */
export function recommendCategories(
  allContent: ContentItem[],
  seenIds: string[],
  canonicalVector: CanonicalVector,
  count = 2,
): string[] {
  const available = allContent.filter((item) => !seenIds.includes(item.id));

  // Build per-category uncertainty score based on the axes they target
  const catStats = new Map<string, { count: number; uncertaintySum: number }>();

  for (const item of available) {
    const cat = item.theme_category || item.category;
    if (!cat || cat === 'v2') continue;

    const axis = item.axis_target;
    let uncertainty = 0.5;
    if (axis) {
      const val = (canonicalVector as unknown as Record<string, number>)[axis] ?? 0;
      uncertainty = 1 / (1 + Math.abs(val));
    }

    const stats = catStats.get(cat) ?? { count: 0, uncertaintySum: 0 };
    stats.count++;
    stats.uncertaintySum += uncertainty;
    catStats.set(cat, stats);
  }

  // Score by average uncertainty (higher = more unknown territory)
  const catScores: [string, number][] = [];
  for (const [cat, stats] of catStats) {
    catScores.push([cat, stats.uncertaintySum / stats.count]);
  }
  catScores.sort((a, b) => b[1] - a[1]);

  // Take top candidates then shuffle the top tier slightly to prevent repetition
  const topN = Math.max(count * 3, 6);
  const top = catScores.slice(0, topN);
  for (let i = top.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * Math.min(i + 1, 3));
    [top[i], top[j]] = [top[j], top[i]];
  }

  return top.slice(0, count).map(([cat]) => cat);
}
