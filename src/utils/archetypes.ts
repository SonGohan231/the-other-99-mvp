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
  | 'rebel'
  | 'guardian'
  | 'mirror'
  | 'strategist'
  | 'seeker'
  | 'anchor'
  | 'catalyst'
  | 'observer'
  | 'alchemist'
  | 'pathfinder';

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
    name: 'The Explorer',
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
    coreDrive: 'The world is larger than your current life, and this bothers you.',
    strength: 'Sees possibility in situations where most people only see risk or repetition.',
    shadow: 'Leaves before things get complicated — and calls it freedom.',
    underPressure: 'Starts a new project. Not to escape. Just because this one is genuinely interesting.',
    relationshipPattern: 'Great at beginning things. The people in their life know this.',
    workPattern: 'Brilliant in early stages. A liability in the maintenance phase.',
    rarityBias: 0.4,
  },
  architect: {
    id: 'architect',
    name: 'The Architect',
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
    coreDrive: 'Things should work correctly. Most things do not, and this is a personal problem.',
    strength: 'Builds things that outlast the enthusiasm that started them.',
    shadow: 'Mistakes perfection of process for completion of purpose.',
    underPressure: 'Creates a more detailed system. The problem is usually not a lack of detail.',
    relationshipPattern: 'Shows love through reliability. This is not always what people ask for.',
    workPattern: 'Produces work with a long shelf life. Terrible at shipping things that are 80% ready.',
    rarityBias: 0.35,
  },
  alchemist: {
    id: 'alchemist',
    name: 'The Alchemist',
    shortName: 'Alchemist',
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
    coreDrive: 'Everything has a better form. Trying to find it.',
    strength: 'Makes connections between things that have no business being connected. They work.',
    shadow: 'Chases the transformation more than the thing being transformed.',
    underPressure: 'Fragments — three half-finished things where there should be one completed one.',
    relationshipPattern: 'Sees people\'s potential so clearly that sometimes loves who they could be more than who they are.',
    workPattern: 'Singular when focused. Scattered when chasing too many transformations at once.',
    rarityBias: 0.3,
  },
  pathfinder: {
    id: 'pathfinder',
    name: 'The Pathfinder',
    shortName: 'Pathfinder',
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
    coreDrive: 'Things worth building are worth building correctly. This takes longer than people think.',
    strength: 'Finishes what others abandon when it gets hard.',
    shadow: 'Holds on to the plan when the plan has stopped serving them.',
    underPressure: 'Becomes methodical to the point of rigidity. The method becomes the goal.',
    relationshipPattern: 'Reliable in ways that people take for granted until they experience someone who is not.',
    workPattern: 'Thorough, high-quality output. Not built for pivoting.',
    rarityBias: 0.45,
  },
  guardian: {
    id: 'guardian',
    name: 'The Guardian',
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
    coreDrive: 'What matters should be protected. The one who makes sure it is.',
    strength: 'Holds the center while everyone else experiments with leaving it.',
    shadow: 'Protects things past the point where they needed protecting.',
    underPressure: 'Tightens grip. Becomes more rule-bound. Feels like the only responsible one in the room.',
    relationshipPattern: 'The person people call in a crisis. This is not always comfortable.',
    workPattern: 'Irreplaceable in continuity. Difficult to have around when the organization needs to change.',
    rarityBias: 0.5,
  },
  observer: {
    id: 'observer',
    name: 'The Observer',
    shortName: 'Observer',
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
    coreDrive: 'Understanding something completely is different from understanding it enough to act.',
    strength: 'Processes what others scan. Gives a different kind of accuracy.',
    shadow: 'Watches until it is too late to enter.',
    underPressure: 'Retreats into analysis. The analysis is usually correct. The timing is not.',
    relationshipPattern: 'People feel understood, but not always reached. There is a difference.',
    workPattern: 'Invaluable in diagnosis. Slow at shipping. Rarely wrong in the long run.',
    rarityBias: 0.25,
  },
  seeker: {
    id: 'seeker',
    name: 'The Seeker',
    shortName: 'Seeker',
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
    coreDrive: 'There is a version of life that would feel completely right — and it has not been found yet.',
    strength: 'Holds open possibilities that others close too quickly.',
    shadow: 'So oriented toward what could be that misses what is.',
    underPressure: 'Becomes unreachable. Not geographically — just somehow not quite there.',
    relationshipPattern: 'People fall in love with their potential. This is not always fair to either of them.',
    workPattern: 'Visionary who needs translators. Ideas arrive complete. Execution arrives eventually.',
    rarityBias: 0.2,
  },
  catalyst: {
    id: 'catalyst',
    name: 'The Catalyst',
    shortName: 'Catalyst',
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
    coreDrive: 'Things that need to move should move. Makes them move.',
    strength: 'Creates momentum where there was none. People find this magnetic.',
    shadow: 'Changes direction mid-process and expects everyone to follow without warning.',
    underPressure: 'Acts. Quickly. The action is not always the right one.',
    relationshipPattern: 'People remember meeting them. Sustaining connection over time is harder.',
    workPattern: 'Extraordinary at initiation. Not available for the long middle.',
    rarityBias: 0.35,
  },
  mirror: {
    id: 'mirror',
    name: 'The Mirror',
    shortName: 'Mirror',
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
    coreDrive: 'Wants to understand what it is actually like to be someone else.',
    strength: 'Sees people clearly, including the parts they are hiding from themselves.',
    shadow: 'Can lose self in understanding others and forget to have a position of their own.',
    underPressure: 'Becomes a version of what everyone around them needs. Stops knowing which one is real.',
    relationshipPattern: 'People feel seen in a way they cannot explain. Creates both closeness and dependency.',
    workPattern: 'Exceptional in roles requiring human understanding. Quietly exhausted by them.',
    rarityBias: 0.3,
  },
  strategist: {
    id: 'strategist',
    name: 'The Strategist',
    shortName: 'Strategist',
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
    coreDrive: 'Every system has an optimal version. Finding it is not optional.',
    strength: 'Sees the structure underneath the chaos and knows exactly which lever to pull.',
    shadow: 'Optimizes things that were never meant to be optimized.',
    underPressure: 'Goes quiet. Computes. Returns with a plan that is correct and arrives too late.',
    relationshipPattern: 'Reliable. Not always warm. People confuse these two things.',
    workPattern: 'Decisive and scalable. Loses colleagues who cannot follow the logic.',
    rarityBias: 0.3,
  },
  rebel: {
    id: 'rebel',
    name: 'The Rebel',
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
    coreDrive: 'Things that should not exist should be made to not exist.',
    strength: 'Says the thing everyone agreed not to say.',
    shadow: 'Opposes things reflexively — including things worth keeping.',
    underPressure: 'Escalates. The argument gets louder. Becomes the problem.',
    relationshipPattern: 'Intensely loyal to the few who earn it. Invisible to everyone else.',
    workPattern: 'Extraordinary at the start and at the end. Does not stay for the middle.',
    rarityBias: 0.2,
  },
  anchor: {
    id: 'anchor',
    name: 'The Anchor',
    shortName: 'Anchor',
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
    coreDrive: 'People should feel safe. Willing to become smaller to make that happen.',
    strength: 'Holds groups together in ways no one sees until they are gone.',
    shadow: 'Gives more than they have, quietly, until they cannot.',
    underPressure: 'Becomes invisible. Accommodates. Wonders why no one asks how they are.',
    relationshipPattern: 'Loves deeply and carries it privately. Often underestimated by the people they love.',
    workPattern: 'The person the team could not function without. Rarely the one who gets credit for it.',
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
