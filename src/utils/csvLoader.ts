import Papa from 'papaparse';
import { ContentItem } from '../types';

export async function loadContent(): Promise<ContentItem[]> {
  const response = await fetch('/content.csv');
  if (!response.ok) throw new Error('Failed to load content.csv');
  const text = await response.text();

  const result = Papa.parse<ContentItem>(text, {
    delimiter: ';',
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().replace(/^﻿/, ''),
    transform: (v) => v.trim(),
  });

  return result.data.filter((item) => item.id && item.prompt_pl);
}
