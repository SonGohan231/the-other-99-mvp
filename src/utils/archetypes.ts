import { ProfileVector } from './profileVector';

export type AxisId =
  | 'curiosity_security'
  | 'logic_emotion'
  | 'independence_belonging'
  | 'observation_action'
  | 'present_future'
  | 'spontaneity_control'
  | 'pragmatism_idealism'
  | 'stability_transformation'
  | 'nature_technology'
  | 'creator_builder';

export type HiddenAxisId =
  | 'confidence_hesitation'
  | 'openness_guardedness'
  | 'consistency_contradiction';

export type ArchetypeId =
  | 'explorer'
  | 'architect'
  | 'creator'
  | 'builder'
  | 'guardian'
  | 'sage'
  | 'visionary'
  | 'adventurer'
  | 'naturalist'
  | 'technologist'
  | 'rebel'
  | 'harmonizer';

export interface ArchetypeDefinition {
  id: ArchetypeId;
  name: string;
  shortName: string;
  symbol: string;
  color: string;
  axisSignature: Record<AxisId, number>;
  hiddenSignature: Record<HiddenAxisId, number>;
  coreDrive: string;
  strength: string;
  shadow: string;
  underPressure: string;
  relationshipPattern: string;
  workPattern: string;
  rarityBias: number;
}

export interface ArchetypeMix {
  primary: ArchetypeId;
  mix: Array<{ id: ArchetypeId; name: string; pct: number; color: string }>;
  confidence: number;
}

export const ARCHETYPES: Record<ArchetypeId, ArchetypeDefinition> = {
  explorer: {
    id: 'explorer',
    name: 'Explorer',
    shortName: 'Explorer',
    symbol: '◎',
    color: '#60a5fa',
    axisSignature: {
      curiosity_security: 80,
      logic_emotion: 0,
      independence_belonging: 40,
      observation_action: -20,
      present_future: 0,
      spontaneity_control: -60,
      pragmatism_idealism: -30,
      stability_transformation: -70,
      nature_technology: 0,
      creator_builder: 60,
    },
    hiddenSignature: {
      confidence_hesitation: 40,
      openness_guardedness: 60,
      consistency_contradiction: -20,
    },
    coreDrive: 'Discovery and expansion.',
    strength: 'Sees possibility where others see limits.',
    shadow: 'Restlessness that makes commitment hard.',
    underPressure: 'Escapes into new projects or ideas.',
    relationshipPattern: 'Attracts through curiosity, withdraws when confined.',
    workPattern: 'Thrives in new territory, fades in routine.',
    rarityBias: 0.4,
  },
  architect: {
    id: 'architect',
    name: 'Architect',
    shortName: 'Architect',
    symbol: '⬡',
    color: '#a78bfa',
    axisSignature: {
      curiosity_security: 0,
      logic_emotion: 70,
      independence_belonging: 0,
      observation_action: 0,
      present_future: 0,
      spontaneity_control: 80,
      pragmatism_idealism: 50,
      stability_transformation: 40,
      nature_technology: 0,
      creator_builder: -70,
    },
    hiddenSignature: {
      confidence_hesitation: 50,
      openness_guardedness: -40,
      consistency_contradiction: 70,
    },
    coreDrive: 'Order and precision.',
    strength: 'Builds systems that outlast their creator.',
    shadow: 'Can optimize the soul out of things.',
    underPressure: 'Doubles down on structure.',
    relationshipPattern: 'Reliable and precise, but struggles with emotional chaos.',
    workPattern: 'Meticulous, long-horizon planning.',
    rarityBias: 0.35,
  },
  creator: {
    id: 'creator',
    name: 'Creator',
    shortName: 'Creator',
    symbol: '✦',
    color: '#f472b6',
    axisSignature: {
      curiosity_security: 0,
      logic_emotion: -40,
      independence_belonging: 0,
      observation_action: 0,
      present_future: 0,
      spontaneity_control: -30,
      pragmatism_idealism: -60,
      stability_transformation: 0,
      nature_technology: 0,
      creator_builder: 90,
    },
    hiddenSignature: {
      confidence_hesitation: 20,
      openness_guardedness: 50,
      consistency_contradiction: -50,
    },
    coreDrive: 'Expression and originality.',
    strength: 'Makes something from nothing.',
    shadow: 'Perfectionism that prevents finishing.',
    underPressure: 'Creates to process — sometimes obsessively.',
    relationshipPattern: 'Deep connection through shared creative vision.',
    workPattern: 'Bursts of intense focus, fallow periods.',
    rarityBias: 0.3,
  },
  builder: {
    id: 'builder',
    name: 'Builder',
    shortName: 'Builder',
    symbol: '▣',
    color: '#34d399',
    axisSignature: {
      curiosity_security: 0,
      logic_emotion: 40,
      independence_belonging: 0,
      observation_action: 0,
      present_future: 0,
      spontaneity_control: 0,
      pragmatism_idealism: 70,
      stability_transformation: 60,
      nature_technology: 0,
      creator_builder: -90,
    },
    hiddenSignature: {
      confidence_hesitation: 60,
      openness_guardedness: -30,
      consistency_contradiction: 60,
    },
    coreDrive: 'Tangible results.',
    strength: 'Turns ideas into concrete reality.',
    shadow: 'Can miss the bigger picture.',
    underPressure: 'Focuses on execution, avoids reflection.',
    relationshipPattern: 'Loyal, dependable, sometimes rigid.',
    workPattern: 'Steady progress, strong follow-through.',
    rarityBias: 0.45,
  },
  guardian: {
    id: 'guardian',
    name: 'Guardian',
    shortName: 'Guardian',
    symbol: '◈',
    color: '#fbbf24',
    axisSignature: {
      curiosity_security: -60,
      logic_emotion: 0,
      independence_belonging: -70,
      observation_action: 0,
      present_future: 0,
      spontaneity_control: 60,
      pragmatism_idealism: 0,
      stability_transformation: 70,
      nature_technology: 0,
      creator_builder: 0,
    },
    hiddenSignature: {
      confidence_hesitation: -30,
      openness_guardedness: -60,
      consistency_contradiction: 50,
    },
    coreDrive: 'Protection and continuity.',
    strength: 'Keeps things safe and people together.',
    shadow: 'Resists necessary change.',
    underPressure: 'Becomes controlling or withdraws.',
    relationshipPattern: 'Protective, devoted, difficult with change.',
    workPattern: 'Consistent, thorough, institutional.',
    rarityBias: 0.5,
  },
  sage: {
    id: 'sage',
    name: 'Sage',
    shortName: 'Sage',
    symbol: '◉',
    color: '#67e8f9',
    axisSignature: {
      curiosity_security: 50,
      logic_emotion: 60,
      independence_belonging: 0,
      observation_action: 50,
      present_future: 0,
      spontaneity_control: 0,
      pragmatism_idealism: -30,
      stability_transformation: 0,
      nature_technology: 0,
      creator_builder: 0,
    },
    hiddenSignature: {
      confidence_hesitation: 30,
      openness_guardedness: 20,
      consistency_contradiction: 40,
    },
    coreDrive: 'Understanding and insight.',
    strength: 'Sees patterns others miss.',
    shadow: 'Can intellectualize to avoid feeling.',
    underPressure: 'Retreats into analysis.',
    relationshipPattern: 'Valued for wisdom, sometimes emotionally distant.',
    workPattern: 'Deep research, careful synthesis.',
    rarityBias: 0.25,
  },
  visionary: {
    id: 'visionary',
    name: 'Visionary',
    shortName: 'Visionary',
    symbol: '◬',
    color: '#c084fc',
    axisSignature: {
      curiosity_security: 70,
      logic_emotion: 0,
      independence_belonging: 0,
      observation_action: 0,
      present_future: -80,
      spontaneity_control: 0,
      pragmatism_idealism: 0,
      stability_transformation: -80,
      nature_technology: 0,
      creator_builder: 50,
    },
    hiddenSignature: {
      confidence_hesitation: 40,
      openness_guardedness: 40,
      consistency_contradiction: -60,
    },
    coreDrive: 'Transforming the possible.',
    strength: 'Sees what doesn\'t exist yet.',
    shadow: 'Impatience with the present.',
    underPressure: 'Leaps to new visions rather than executing.',
    relationshipPattern: 'Inspiring, sometimes elusive.',
    workPattern: 'Big-picture orientation, needs implementers.',
    rarityBias: 0.2,
  },
  adventurer: {
    id: 'adventurer',
    name: 'Adventurer',
    shortName: 'Adventurer',
    symbol: '▲',
    color: '#fb923c',
    axisSignature: {
      curiosity_security: 60,
      logic_emotion: 0,
      independence_belonging: 0,
      observation_action: -70,
      present_future: 0,
      spontaneity_control: -70,
      pragmatism_idealism: 0,
      stability_transformation: -50,
      nature_technology: 0,
      creator_builder: 0,
    },
    hiddenSignature: {
      confidence_hesitation: 60,
      openness_guardedness: 50,
      consistency_contradiction: -40,
    },
    coreDrive: 'Experience and sensation.',
    strength: 'Lives fully in the moment.',
    shadow: 'Avoids depth and commitment.',
    underPressure: 'Seeks new stimulation to escape.',
    relationshipPattern: 'Magnetic but unpredictable.',
    workPattern: 'High-energy starts, struggles with maintenance.',
    rarityBias: 0.35,
  },
  naturalist: {
    id: 'naturalist',
    name: 'Naturalist',
    shortName: 'Naturalist',
    symbol: '◌',
    color: '#4ade80',
    axisSignature: {
      curiosity_security: 0,
      logic_emotion: 0,
      independence_belonging: -30,
      observation_action: 40,
      present_future: 0,
      spontaneity_control: 0,
      pragmatism_idealism: 0,
      stability_transformation: 30,
      nature_technology: 80,
      creator_builder: 0,
    },
    hiddenSignature: {
      confidence_hesitation: 10,
      openness_guardedness: 30,
      consistency_contradiction: 40,
    },
    coreDrive: 'Harmony with what exists.',
    strength: 'Deeply attuned to patterns in nature and people.',
    shadow: 'Can resist progress as disruption.',
    underPressure: 'Returns to physical or natural environments.',
    relationshipPattern: 'Patient, grounded, non-confrontational.',
    workPattern: 'Observational, holistic, environmental.',
    rarityBias: 0.3,
  },
  technologist: {
    id: 'technologist',
    name: 'Technologist',
    shortName: 'Technologist',
    symbol: '⬢',
    color: '#38bdf8',
    axisSignature: {
      curiosity_security: 0,
      logic_emotion: 50,
      independence_belonging: 0,
      observation_action: 0,
      present_future: 0,
      spontaneity_control: 0,
      pragmatism_idealism: 60,
      stability_transformation: 0,
      nature_technology: -80,
      creator_builder: -60,
    },
    hiddenSignature: {
      confidence_hesitation: 40,
      openness_guardedness: -20,
      consistency_contradiction: 50,
    },
    coreDrive: 'Optimization through systems.',
    strength: 'Bridges human need and technical solution.',
    shadow: 'Dehumanizes problems.',
    underPressure: 'Falls back on data and logic.',
    relationshipPattern: 'Efficient, logical, sometimes cold.',
    workPattern: 'Iterative, data-driven, scalable.',
    rarityBias: 0.3,
  },
  rebel: {
    id: 'rebel',
    name: 'Rebel',
    shortName: 'Rebel',
    symbol: '✕',
    color: '#f87171',
    axisSignature: {
      curiosity_security: 0,
      logic_emotion: 0,
      independence_belonging: 80,
      observation_action: 0,
      present_future: 0,
      spontaneity_control: -80,
      pragmatism_idealism: 0,
      stability_transformation: -60,
      nature_technology: 0,
      creator_builder: 0,
    },
    hiddenSignature: {
      confidence_hesitation: 30,
      openness_guardedness: 20,
      consistency_contradiction: -60,
    },
    coreDrive: 'Breaking what shouldn\'t exist.',
    strength: 'Forces necessary ruptures.',
    shadow: 'Opposes for its own sake.',
    underPressure: 'Escalates conflict.',
    relationshipPattern: 'Intensely loyal to a few, dismissive of many.',
    workPattern: 'Disruptive, iconoclastic, short-tenured.',
    rarityBias: 0.2,
  },
  harmonizer: {
    id: 'harmonizer',
    name: 'Harmonizer',
    shortName: 'Harmonizer',
    symbol: '◎',
    color: '#86efac',
    axisSignature: {
      curiosity_security: 0,
      logic_emotion: -50,
      independence_belonging: -80,
      observation_action: 30,
      present_future: 0,
      spontaneity_control: 0,
      pragmatism_idealism: -40,
      stability_transformation: 0,
      nature_technology: 0,
      creator_builder: 0,
    },
    hiddenSignature: {
      confidence_hesitation: -20,
      openness_guardedness: 40,
      consistency_contradiction: 30,
    },
    coreDrive: 'Keeping people together.',
    strength: 'Navigates complex social dynamics with ease.',
    shadow: 'Loses self in others\' needs.',
    underPressure: 'Appeases rather than addresses.',
    relationshipPattern: 'Deeply invested, sometimes self-effacing.',
    workPattern: 'Collaborative, mediating, team-oriented.',
    rarityBias: 0.45,
  },
};

// ─── Map ProfileVector to axis values ────────────────────────────────────────

function vectorToAxes(v: ProfileVector): Record<AxisId, number> {
  const clamp = (val: number) => Math.max(-100, Math.min(100, val));
  const scale = (a: number, b: number) => {
    const total = Math.max(1, a + b);
    return clamp(((a - b) / total) * 100);
  };

  return {
    curiosity_security: scale(v.curiosity, v.security),
    logic_emotion: scale(v.control, v.emotion),
    independence_belonging: scale(v.independence, v.connection),
    observation_action: scale(v.security, v.risk),
    present_future: clamp(-v.change * 5),
    spontaneity_control: clamp(-v.control * 5),
    pragmatism_idealism: scale(v.security, v.curiosity),
    stability_transformation: clamp(-v.change * 5),
    nature_technology: 0,
    creator_builder: scale(v.curiosity, v.control),
  };
}

// ─── Compute archetype mix ────────────────────────────────────────────────────

export function computeArchetypeMix(
  vector: ProfileVector,
  totalAnswers: number
): ArchetypeMix {
  const userAxes = vectorToAxes(vector);

  const archetypeIds = Object.keys(ARCHETYPES) as ArchetypeId[];

  // Compute similarity for each archetype
  const similarities: Record<ArchetypeId, number> = {} as Record<ArchetypeId, number>;
  const axisIds = Object.keys(userAxes) as AxisId[];

  for (const aId of archetypeIds) {
    const def = ARCHETYPES[aId];
    let totalDiff = 0;
    for (const axis of axisIds) {
      const userVal = userAxes[axis] ?? 0;
      const archetypeVal = def.axisSignature[axis] ?? 0;
      totalDiff += Math.abs(userVal - archetypeVal);
    }
    // similarity in 0..1 range
    similarities[aId] = 1 - totalDiff / (axisIds.length * 200);
  }

  // Normalize to percentages
  const total = Object.values(similarities).reduce((a, b) => a + b, 0);
  const pcts: Record<ArchetypeId, number> = {} as Record<ArchetypeId, number>;
  for (const aId of archetypeIds) {
    pcts[aId] = Math.round((similarities[aId] / total) * 100);
  }

  // Sort descending
  const sorted = archetypeIds
    .map((id) => ({ id, pct: pcts[id] }))
    .sort((a, b) => b.pct - a.pct);

  const confidence =
    totalAnswers < 20
      ? 10
      : Math.min(85, Math.round((totalAnswers / 100) * 75 + 10));

  const mix = sorted.slice(0, 4).map((item) => ({
    id: item.id,
    name: ARCHETYPES[item.id].name,
    pct: item.pct,
    color: ARCHETYPES[item.id].color,
  }));

  return {
    primary: sorted[0].id,
    mix,
    confidence,
  };
}

export function isArchetypeMixUnlocked(totalAnswers: number): boolean {
  return totalAnswers >= 100;
}
