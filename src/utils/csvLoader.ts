import Papa from 'papaparse';
import { ContentItem } from '../types';

async function loadFile(path: string): Promise<ContentItem[]> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed to load ${path}`);
  const text = await response.text();
  const result = Papa.parse<ContentItem>(text, {
    delimiter: ';',
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().replace(/^﻿/, ''),
    transform: (v) => v.trim(),
  });
  return result.data;
}

export async function loadContent(): Promise<ContentItem[]> {
  // Load primary content
  const primary = await loadFile('/content.csv');

  // Try loading v2 (English-first)
  let v2: ContentItem[] = [];
  try { v2 = await loadFile('/content_en_v2.csv'); } catch { /* ok */ }

  // Try loading premium content
  let premium: ContentItem[] = [];
  try {
    const raw = await loadFile('/content_premium_en_v1.csv');
    premium = raw.map(item => ({ ...item, access_tier: 'premium' as const }));
  } catch { /* ok */ }

  // Merge, deduplicate by id
  const all = [...primary, ...v2, ...premium];
  const seen = new Set<string>();
  return all.filter(item => {
    if (!item.id || seen.has(item.id)) return false;
    if (!item.prompt_pl && !item.prompt_en) return false;
    seen.add(item.id);
    return true;
  });
}
