export const CANONICAL_AXES = [
  'AX01', 'AX02', 'AX03', 'AX04', 'AX05',
  'AX06', 'AX07', 'AX08', 'AX09', 'AX10',
] as const;

export type CanonicalAxisId = typeof CANONICAL_AXES[number];
export type CanonicalVector = Record<CanonicalAxisId, number>;

// Maps legacy named pole keys to a canonical axis + direction.
// dir = +1: the pole is the "positive" (first-named) pole of that axis.
// dir = -1: the pole is the "negative" (second-named) pole.
// AX09 (Nature↔Technology) and AX10 (Idea Creator↔Builder) have no 8D legacy
// equivalent — they are canonical-only and MUST NOT be squashed into another axis.
const POLE_MAP: Record<string, { axis: CanonicalAxisId; dir: 1 | -1 }> = {
  // AX01: Curiosity ↔ Security
  curiosity:      { axis: 'AX01', dir:  1 },
  openness:       { axis: 'AX01', dir:  1 },
  security:       { axis: 'AX01', dir: -1 },
  guardedness:    { axis: 'AX01', dir: -1 },
  // AX02: Logic ↔ Emotion
  logic:          { axis: 'AX02', dir:  1 },
  observation:    { axis: 'AX02', dir:  1 },
  pattern:        { axis: 'AX02', dir:  1 },
  emotion:        { axis: 'AX02', dir: -1 },
  authenticity:   { axis: 'AX02', dir: -1 },
  present:        { axis: 'AX02', dir: -1 },
  // AX03: Independence ↔ Belonging
  independence:   { axis: 'AX03', dir:  1 },
  connection:     { axis: 'AX03', dir: -1 },
  belonging:      { axis: 'AX03', dir: -1 },
  social:         { axis: 'AX03', dir: -1 },
  // AX04: Observation ↔ Action
  action:         { axis: 'AX04', dir: -1 },
  // AX05: Present ↔ Future
  future:         { axis: 'AX05', dir: -1 },
  change:         { axis: 'AX05', dir: -1 },
  // AX06: Spontaneity ↔ Control
  risk:           { axis: 'AX06', dir:  1 },
  thrill:         { axis: 'AX06', dir:  1 },
  adventure:      { axis: 'AX06', dir:  1 },
  danger:         { axis: 'AX06', dir:  1 },
  control:        { axis: 'AX06', dir: -1 },
  // AX07: Pragmatism ↔ Idealism
  pragmatism:     { axis: 'AX07', dir:  1 },
  idealism:       { axis: 'AX07', dir: -1 },
  // AX08: Stability ↔ Transformation
  stability:      { axis: 'AX08', dir:  1 },
  consistency:    { axis: 'AX08', dir:  1 },
  hesitation:     { axis: 'AX08', dir:  1 },
  transformation: { axis: 'AX08', dir: -1 },
  // AX09: Nature ↔ Technology
  nature:         { axis: 'AX09', dir:  1 },
  technology:     { axis: 'AX09', dir: -1 },
  // AX10: Idea Creator ↔ Builder
  creator:        { axis: 'AX10', dir:  1 },
  builder:        { axis: 'AX10', dir: -1 },
};

const AXIS_SET = new Set<string>(CANONICAL_AXES);
const STORAGE_KEY = 'to99_canonical_vector';

export function emptyCanonicalVector(): CanonicalVector {
  return { AX01: 0, AX02: 0, AX03: 0, AX04: 0, AX05: 0,
           AX06: 0, AX07: 0, AX08: 0, AX09: 0, AX10: 0 };
}

/**
 * Apply raw axis deltas to the canonical vector.
 * Accepts v2 AX01–AX10 keys and legacy named poles (via POLE_MAP).
 * Unknown keys are silently skipped — no zero-score side-effect.
 */
export function applyCanonicalDeltas(
  vector: CanonicalVector,
  rawDeltas: Record<string, number>,
): { next: CanonicalVector; changed: CanonicalAxisId[] } {
  const next = { ...vector };
  const changed: CanonicalAxisId[] = [];
  const seen = new Set<CanonicalAxisId>();

  for (const [key, delta] of Object.entries(rawDeltas)) {
    if (typeof delta !== 'number' || delta === 0) continue;
    const upper = key.toUpperCase();

    if (AXIS_SET.has(upper)) {
      // v2 format: direct AX01–AX10 key
      const axis = upper as CanonicalAxisId;
      next[axis] = (next[axis] ?? 0) + delta;
      if (!seen.has(axis)) { changed.push(axis); seen.add(axis); }
    } else {
      // Legacy named pole
      const mapping = POLE_MAP[key.toLowerCase()];
      if (!mapping) continue;
      const { axis, dir } = mapping;
      next[axis] = (next[axis] ?? 0) + delta * dir;
      if (!seen.has(axis)) { changed.push(axis); seen.add(axis); }
    }
  }

  return { next, changed };
}

export function loadCanonicalVector(): CanonicalVector {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...emptyCanonicalVector(), ...(JSON.parse(raw) as Partial<CanonicalVector>) };
    }
  } catch { /* ignore */ }
  return emptyCanonicalVector();
}

export function saveCanonicalVector(v: CanonicalVector): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)); } catch { /* ignore */ }
}

export function clearCanonicalVector(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

/**
 * Project the canonical 10D vector to a legacy 8D shape for backward-compatible UI.
 * AX09 (Nature↔Technology) and AX10 (Idea Creator↔Builder) have no 8D equivalent
 * and are intentionally NOT projected — they are preserved only in the canonical vector.
 */
export function projectToLegacy(cv: CanonicalVector): Record<string, number> {
  return {
    curiosity:    Math.max(0,  cv.AX01),
    security:     Math.max(0, -cv.AX01) + Math.max(0,  cv.AX07) + Math.max(0,  cv.AX08),
    emotion:      Math.max(0, -cv.AX02) + Math.max(0, -cv.AX05),
    risk:         Math.max(0,  cv.AX06) + Math.max(0, -cv.AX04),
    change:       Math.max(0,  cv.AX05) + Math.max(0, -cv.AX08),
    independence: Math.max(0,  cv.AX03),
    connection:   Math.max(0, -cv.AX03),
    control:      Math.max(0, -cv.AX06),
  };
}
