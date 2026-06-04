export const DIMENSIONS = [
  'control', 'security', 'risk', 'emotion',
  'change', 'independence', 'connection', 'curiosity',
] as const;

export type DimensionKey = typeof DIMENSIONS[number];
export type ProfileVector = Record<DimensionKey, number>;

const AXIS_MAP: Record<string, DimensionKey> = {
  // Direct
  control: 'control',
  security: 'security',
  risk: 'risk',
  emotion: 'emotion',
  change: 'change',
  independence: 'independence',
  connection: 'connection',
  curiosity: 'curiosity',
  // Mapped
  belonging: 'connection',
  social: 'connection',
  nature: 'connection',
  transformation: 'change',
  future: 'change',
  openness: 'curiosity',
  idealism: 'curiosity',
  logic: 'curiosity',
  observation: 'curiosity',
  pattern: 'curiosity',
  guardedness: 'security',
  pragmatism: 'security',
  consistency: 'security',
  hesitation: 'security',
  builder: 'independence',
  action: 'risk',
  thrill: 'risk',
  adventure: 'risk',
  danger: 'risk',
  present: 'emotion',
  authenticity: 'emotion',
};

const STORAGE_KEY = 'to99_profile_vector';

export function emptyVector(): ProfileVector {
  return { control: 0, security: 0, risk: 0, emotion: 0, change: 0, independence: 0, connection: 0, curiosity: 0 };
}

export function loadVector(): ProfileVector {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...emptyVector(), ...(JSON.parse(raw) as Partial<ProfileVector>) };
  } catch { /* ignore */ }
  return emptyVector();
}

export function saveVector(v: ProfileVector): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)); } catch { /* ignore */ }
}

export function applyDeltas(
  vector: ProfileVector,
  rawDeltas: Record<string, number>,
): { next: ProfileVector; changed: DimensionKey[] } {
  const next = { ...vector };
  const changed: DimensionKey[] = [];
  const seen = new Set<DimensionKey>();

  for (const [key, delta] of Object.entries(rawDeltas)) {
    if (typeof delta !== 'number') continue;
    const dim = AXIS_MAP[key.toLowerCase()];
    if (!dim) continue;
    next[dim] = Math.max(0, (next[dim] ?? 0) + delta);
    if (delta !== 0 && !seen.has(dim)) {
      changed.push(dim);
      seen.add(dim);
    }
  }
  return { next, changed };
}

export function calcHumanTwinMatch(vector: ProfileVector, totalAnswers: number): number {
  const base = Math.min(62, (totalAnswers / 85) * 62) + 10;
  const total = Object.values(vector).reduce((a, b) => a + Math.abs(b), 0);
  const variance = (total % 13) - 6;
  return Math.max(5, Math.min(99, Math.round(base + variance)));
}

export function getTopDimensions(vector: ProfileVector, n = 3): DimensionKey[] {
  return ([...DIMENSIONS] as DimensionKey[])
    .filter((d) => vector[d] > 0)
    .sort((a, b) => vector[b] - vector[a])
    .slice(0, n);
}

export function getMaxValue(vector: ProfileVector): number {
  return Math.max(1, ...Object.values(vector));
}
