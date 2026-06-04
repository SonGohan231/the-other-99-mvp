import { ContentItem, ContentType, RarityTier } from '../types';

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export interface ContentValidationReport {
  total: number;
  valid: number;
  invalid: number;
  invalidItems: Array<{ id: string; reasons: string[] }>;
  warnings: Array<{ id: string; message: string }>;
}

const VALID_CONTENT_TYPES: ContentType[] = ['question', 'secret', 'dare', 'game', 'riddle'];
const VALID_RARITY_TIERS: RarityTier[] = ['standard', 'rare', 'epic', 'legendary'];

const RARITY_SCORE_RANGES: Record<RarityTier, [number, number]> = {
  standard: [0, 39],
  rare: [40, 69],
  epic: [70, 89],
  legendary: [90, 100],
};

export function validateItem(item: ContentItem): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Rule 1: Must have non-empty id
  if (!item.id || item.id.trim() === '') {
    errors.push('Missing id');
  }

  // Rule 2: Must have prompt_en OR prompt_pl
  const hasPromptEn = item.prompt_en && item.prompt_en.trim() !== '';
  const hasPromptPl = item.prompt_pl && item.prompt_pl.trim() !== '';
  if (!hasPromptEn && !hasPromptPl) {
    errors.push('Missing both prompt_en and prompt_pl');
  }

  // Rule 3: rarity_score must be 0-100
  const rarityScore = parseFloat(item.rarity_score);
  if (isNaN(rarityScore) || rarityScore < 0 || rarityScore > 100) {
    errors.push(`Invalid rarity_score: ${item.rarity_score} (must be 0-100)`);
  }

  // Rule 4: content_type must be valid
  if (!VALID_CONTENT_TYPES.includes(item.content_type)) {
    errors.push(`Invalid content_type: ${item.content_type}`);
  }

  // Rule 5: rarity_tier must be valid
  if (!VALID_RARITY_TIERS.includes(item.rarity_tier)) {
    errors.push(`Invalid rarity_tier: ${item.rarity_tier}`);
  }

  // Rule 6: rarity_score should match rarity_tier range (warning)
  if (!isNaN(rarityScore) && VALID_RARITY_TIERS.includes(item.rarity_tier)) {
    const [min, max] = RARITY_SCORE_RANGES[item.rarity_tier];
    if (rarityScore < min || rarityScore > max) {
      warnings.push(
        `rarity_score ${rarityScore} is outside expected range [${min}-${max}] for tier "${item.rarity_tier}"`
      );
    }
  }

  // Rule 7: answer_options must have at least 2 options
  const answerOptions = (item.answer_options_en || item.answer_options_pl || '')
    .split('|')
    .map((a) => a.trim())
    .filter(Boolean);
  if (answerOptions.length < 2) {
    errors.push(`Insufficient answer options: ${answerOptions.length} (need at least 2)`);
  }

  // Rule 8: Warn if prompt is under 15 chars
  const promptText = (item.prompt_en || item.prompt_pl || '').trim();
  if (promptText.length > 0 && promptText.length < 15) {
    warnings.push(`Prompt is very short (${promptText.length} chars): "${promptText}"`);
  }

  // Rule 9: Games should have 3 options
  if (item.content_type === 'game' && answerOptions.length > 0 && answerOptions.length !== 3) {
    warnings.push(`Game item has ${answerOptions.length} options (expected 3)`);
  }

  // Rule 10: Threshold Card should only apply to epic/legendary
  if (item.card_path === 'Threshold Card' &&
    (item.rarity_tier === 'standard' || item.rarity_tier === 'rare')) {
    warnings.push(`Threshold Card path set on ${item.rarity_tier} item (expected epic/legendary)`);
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}

export function filterValidContent(items: ContentItem[]): ContentItem[] {
  const result: ContentItem[] = [];
  for (const item of items) {
    const { valid, warnings } = validateItem(item);
    if (valid) {
      result.push(item);
    }
    if (import.meta.env.DEV && warnings.length > 0) {
      console.warn(`[ContentValidation] Item ${item.id} warnings:`, warnings);
    }
  }
  return result;
}

export function generateValidationReport(items: ContentItem[]): ContentValidationReport {
  let valid = 0;
  let invalid = 0;
  const invalidItems: Array<{ id: string; reasons: string[] }> = [];
  const warnings: Array<{ id: string; message: string }> = [];

  for (const item of items) {
    const result = validateItem(item);
    if (result.valid) {
      valid++;
    } else {
      invalid++;
      invalidItems.push({ id: item.id || '(no id)', reasons: result.errors });
    }
    for (const w of result.warnings) {
      warnings.push({ id: item.id || '(no id)', message: w });
    }
  }

  return {
    total: items.length,
    valid,
    invalid,
    invalidItems,
    warnings,
  };
}
