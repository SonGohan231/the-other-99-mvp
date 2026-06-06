import type { EmergingArchetypeResult } from '../engine/emergingArchetype';
import type { ContradictionResult } from '../engine/contradictionEngine';
import type { CanonicalVector } from './canonicalVector';

export interface MicroReveal {
  title: string;
  body: string;
  source: string;
  confidence: string;
  shouldShow: boolean;
}

// Human-readable display names for canonical axes and legacy poles
export const AXIS_DISPLAY_NAMES: Record<string, string> = {
  // Canonical codes
  AX01: 'Curiosity',
  AX02: 'Logic',
  AX03: 'Independence',
  AX04: 'Observation',
  AX05: 'Present-focus',
  AX06: 'Spontaneity',
  AX07: 'Pragmatism',
  AX08: 'Stability',
  AX09: 'Nature',
  AX10: 'Creativity',
  // Legacy named poles
  curiosity:      'Curiosity',
  openness:       'Openness',
  security:       'Security',
  guardedness:    'Guardedness',
  logic:          'Logic',
  observation:    'Observation',
  pattern:        'Pattern',
  emotion:        'Depth',
  authenticity:   'Authenticity',
  present:        'Present-focus',
  independence:   'Independence',
  connection:     'Connection',
  belonging:      'Belonging',
  social:         'Connection',
  action:         'Action',
  courage:        'Courage',
  future:         'Future-focus',
  change:         'Change',
  risk:           'Risk',
  thrill:         'Thrill',
  adventure:      'Adventure',
  spontaneity:    'Spontaneity',
  control:        'Control',
  pragmatism:     'Pragmatism',
  idealism:       'Idealism',
  contradiction:  'Complexity',
  stability:      'Stability',
  consistency:    'Consistency',
  hesitation:     'Hesitation',
  resilience:     'Resilience',
  transformation: 'Transformation',
  nature:         'Nature',
  technology:     'Technology',
  creator:        'Creativity',
  idea_creator:   'Creativity',
  builder:        'Builder',
};

export function getAxisDisplayName(axisCode: string): string {
  return AXIS_DISPLAY_NAMES[axisCode]
    ?? AXIS_DISPLAY_NAMES[axisCode.toLowerCase()]
    ?? axisCode;
}

export function getMicroReveal(
  totalAnswers: number,
  archetype: EmergingArchetypeResult,
  contradiction: ContradictionResult,
  canonicalVector: CanonicalVector | null,
): MicroReveal {
  // Show every 3rd answer, starting at 3
  if (totalAnswers < 3 || totalAnswers % 3 !== 0) {
    return { title: '', body: '', source: '', confidence: '', shouldShow: false };
  }

  // Find the strongest shifted canonical axis
  let strongestAxis = 'AX01';
  let strongestVal  = 0;
  if (canonicalVector) {
    for (const [key, val] of Object.entries(canonicalVector)) {
      if (Math.abs(val) > strongestVal) { strongestVal = Math.abs(val); strongestAxis = key; }
    }
  }
  const axisName  = getAxisDisplayName(strongestAxis).toLowerCase();
  const archName  = archetype.confidence === 'very_low' ? 'a direction' : archetype.primary.name;
  const idx       = Math.floor(totalAnswers / 3) % 8;

  const reveals: Array<Omit<MicroReveal, 'shouldShow'>> = [
    {
      title: 'New signal detected.',
      body: `Your profile shifted toward ${axisName}.`,
      source: 'canonical_vector',
      confidence: archetype.confidence,
    },
    {
      title: 'Pattern forming.',
      body: 'Your answers are aligning in a consistent direction.',
      source: 'emerging_archetype',
      confidence: archetype.confidence,
    },
    {
      title: 'Hidden layer forming.',
      body: `One dimension is beginning to separate — ${axisName} shows movement.`,
      source: 'canonical_vector',
      confidence: archetype.confidence,
    },
    {
      title: 'Archetype signal.',
      body: archetype.confidence === 'very_low'
        ? 'No clear direction yet — still gathering signal.'
        : `${archName} direction strengthening.`,
      source: 'emerging_archetype',
      confidence: archetype.confidence,
    },
    {
      title: 'Consistency signal.',
      body: contradiction.level === 'none' || contradiction.level === 'low'
        ? 'Your answers are building a clear, consistent pattern.'
        : 'Some internal complexity is forming — not a flaw, just depth.',
      source: 'contradiction_profile',
      confidence: archetype.confidence,
    },
    {
      title: 'Axis movement.',
      body: `${getAxisDisplayName(strongestAxis)} is one of the dimensions actively updating.`,
      source: 'canonical_vector',
      confidence: archetype.confidence,
    },
    {
      title: 'Signal deepening.',
      body: 'Each answer adds weight to the same underlying structure.',
      source: 'emerging_archetype',
      confidence: archetype.confidence,
    },
    {
      title: 'Something shifted.',
      body: 'This answer moved at least one hidden dimension.',
      source: 'canonical_vector',
      confidence: archetype.confidence,
    },
  ];

  return { ...reveals[idx], shouldShow: true };
}

// Milestone text for unlock meter
export function getUnlockMilestoneText(totalAnswers: number): string | null {
  if (totalAnswers === 5)  return 'New layer forming';
  if (totalAnswers === 10) return 'Hidden Profile becoming clearer';
  if (totalAnswers === 25) return 'Snapshot approaching';
  if (totalAnswers === 51) return 'Profile map expanding';
  if (totalAnswers === 99) return 'Full confidence reached';
  return null;
}
