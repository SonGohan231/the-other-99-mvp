/**
 * Canonical axis key validation.
 * VALID_AXIS_KEYS is the single source of truth for all recognized axis keys —
 * both v2 canonical (AX01–AX10) and every legacy named pole in POLE_MAP.
 * Unknown keys in axis_delta_json must be rejected, not silently ignored.
 */

// All canonical axis IDs
export const CANONICAL_AXIS_IDS = new Set([
  'AX01', 'AX02', 'AX03', 'AX04', 'AX05',
  'AX06', 'AX07', 'AX08', 'AX09', 'AX10',
]);

// All recognized axis keys: canonical IDs + every legacy pole name from POLE_MAP
export const VALID_AXIS_KEYS = new Set([
  // Canonical v2 keys
  'AX01', 'AX02', 'AX03', 'AX04', 'AX05', 'AX06', 'AX07', 'AX08', 'AX09', 'AX10',
  // AX01: Curiosity ↔ Security
  'curiosity', 'openness', 'security', 'guardedness',
  // AX02: Logic ↔ Emotion
  'logic', 'observation', 'pattern', 'emotion', 'authenticity', 'present',
  // AX03: Independence ↔ Belonging
  'independence', 'connection', 'belonging', 'social',
  // AX04: Observation ↔ Action
  'action', 'courage',
  // AX05: Present ↔ Future
  'future', 'change',
  // AX06: Spontaneity ↔ Control
  'risk', 'thrill', 'adventure', 'danger', 'spontaneity', 'control',
  // AX07: Pragmatism ↔ Idealism
  'pragmatism', 'idealism', 'contradiction',
  // AX08: Stability ↔ Transformation
  'stability', 'consistency', 'hesitation', 'resilience', 'transformation',
  // AX09: Nature ↔ Technology
  'nature', 'technology',
  // AX10: Idea Creator ↔ Builder
  'creator', 'idea_creator', 'builder',
]);

export interface AxisDeltaValidationResult {
  valid: boolean;
  unknownKeys: string[];
  errors: string[];
}

/**
 * Validate a raw axis_delta_json string.
 * Returns valid=false if the string is empty, not valid JSON, has non-numeric values,
 * or contains any key not in VALID_AXIS_KEYS.
 */
export function validateAxisDeltaJson(raw: string): AxisDeltaValidationResult {
  if (!raw || raw.trim() === '') {
    return { valid: false, unknownKeys: [], errors: ['empty axis_delta_json'] };
  }
  const trimmed = raw.trim();
  if (!trimmed.startsWith('{')) {
    return { valid: false, unknownKeys: [], errors: [`plain text instead of JSON object: ${trimmed.slice(0, 40)}`] };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (e) {
    return { valid: false, unknownKeys: [], errors: [`invalid JSON: ${(e as Error).message}`] };
  }
  if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
    return { valid: false, unknownKeys: [], errors: ['not a JSON object'] };
  }
  const obj = parsed as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length === 0) {
    return { valid: false, unknownKeys: [], errors: ['empty JSON object {}'] };
  }

  const unknownKeys: string[] = [];
  const errors: string[] = [];

  for (const k of keys) {
    if (typeof obj[k] !== 'number') {
      errors.push(`axis "${k}" has non-numeric value: ${String(obj[k])}`);
    }
    if (!VALID_AXIS_KEYS.has(k)) {
      unknownKeys.push(k);
    }
  }

  return {
    valid: errors.length === 0 && unknownKeys.length === 0,
    unknownKeys,
    errors,
  };
}
