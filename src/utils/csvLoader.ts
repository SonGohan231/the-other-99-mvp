import Papa from 'papaparse';
import { ContentItem } from '../types';

async function parseCSV(text: string): Promise<ContentItem[]> {
  const result = Papa.parse<ContentItem>(text, {
    delimiter: ';',
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().replace(/^﻿/, ''),
    transform: (v) => v.trim(),
  });
  return result.data.filter((item) => item.id && (item.prompt_pl || item.prompt_en));
}

export async function loadContent(): Promise<ContentItem[]> {
  const response = await fetch('/content.csv');
  if (!response.ok) throw new Error('Failed to load content.csv');
  const text = await response.text();
  const primary = await parseCSV(text);

  // Try to load secondary content file (English-first v2)
  let secondary: ContentItem[] = [];
  try {
    const res2 = await fetch('/content_en_v2.csv');
    if (res2.ok) {
      const text2 = await res2.text();
      secondary = await parseCSV(text2);
    }
  } catch {
    // Secondary file is optional
  }

  if (secondary.length === 0) return primary;

  // Merge and deduplicate by id
  const seen = new Set<string>(primary.map((i) => i.id));
  const merged = [...primary];
  for (const item of secondary) {
    if (item.id && !seen.has(item.id)) {
      seen.add(item.id);
      merged.push(item);
    }
  }

  return merged;
}
