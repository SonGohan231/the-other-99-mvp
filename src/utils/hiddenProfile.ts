import { ProfileVector, DIMENSIONS, DimensionKey } from './profileVector';

export interface HiddenProfile {
  confidence: number;
  primaryDriver: string;
  secondaryDriver: string;
  decisionStyle: string;
  socialPattern: string;
  rarestSignal: string;
  rarestSignalPercent: number;
  lockedSections: string[];
}

const DIM_LABELS: Record<DimensionKey, string> = {
  control: 'Control',
  security: 'Security',
  risk: 'Risk',
  emotion: 'Emotion',
  change: 'Change',
  independence: 'Independence',
  connection: 'Connection',
  curiosity: 'Curiosity',
};

const RAREST_SIGNAL_MAP: Record<string, string> = {
  'control+security': 'System Dependency',
  'control+independence': 'Lone Control',
  'curiosity+change': 'Restless Signal',
  'emotion+connection': 'Unfiltered Belonging',
  'security+emotion': 'Protected Interior',
  'independence+curiosity': 'Solo Explorer',
  'change+risk': 'Threshold Pattern',
  'connection+emotion': 'Social Depth',
};

export function computeHiddenProfile(
  vector: ProfileVector,
  totalAnswers: number,
): HiddenProfile {
  // Sort dimensions by value descending
  const sorted = ([...DIMENSIONS] as DimensionKey[]).sort(
    (a, b) => vector[b] - vector[a],
  );

  const top1 = sorted[0];
  const top2 = sorted[1];
  const top1val = vector[top1] ?? 0;
  const top2val = vector[top2] ?? 0;

  const primaryDriver = DIM_LABELS[top1] ?? top1;
  const secondaryDriver = DIM_LABELS[top2] ?? top2;

  // Decision style
  const control = vector['control'] ?? 0;
  const emotion = vector['emotion'] ?? 0;
  const connection = vector['connection'] ?? 0;
  const curiosity = vector['curiosity'] ?? 0;
  const security = vector['security'] ?? 0;
  const independence = vector['independence'] ?? 0;

  let decisionStyle: string;
  if (control > 15 && emotion < 10) {
    decisionStyle = 'Analytical';
  } else if (emotion > 15 && connection > 10) {
    decisionStyle = 'Relational';
  } else if (curiosity > 15 && security < 10) {
    decisionStyle = 'Exploratory';
  } else if (security > 10 && control > 10) {
    decisionStyle = 'Controlled';
  } else {
    decisionStyle = 'Instinctive';
  }

  // Social pattern
  let socialPattern: string;
  if (connection > 15 && independence < 10) {
    socialPattern = 'Adaptive Connector';
  } else if (independence > 15 && connection < 10) {
    socialPattern = 'Reserved Observer';
  } else if (security > 15) {
    socialPattern = 'Boundary Keeper';
  } else {
    socialPattern = 'Selective Revealer';
  }

  // Rarest signal — try both orderings of top2 combo
  const comboKey1 = `${top1}+${top2}`;
  const comboKey2 = `${top2}+${top1}`;
  const rarestSignal =
    RAREST_SIGNAL_MAP[comboKey1] ??
    RAREST_SIGNAL_MAP[comboKey2] ??
    'Rare Convergence';

  // Deterministic percent 6-22
  const rarestSignalPercent =
    Math.abs((top1val * 7 + top2val * 3) % 17) + 6;

  // Confidence
  const confidence = Math.min(85, Math.round((totalAnswers / 51) * 55 + 10));

  const lockedSections = [
    'Relationship Pattern',
    'Conflict Pattern',
    'Trust Pattern',
    'Motivation Pattern',
    'Shadow Pattern',
  ];

  return {
    confidence,
    primaryDriver,
    secondaryDriver,
    decisionStyle,
    socialPattern,
    rarestSignal,
    rarestSignalPercent,
    lockedSections,
  };
}

export function isHiddenProfileUnlocked(totalAnswers: number): boolean {
  return totalAnswers >= 51;
}
