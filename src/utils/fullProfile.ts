import { ProfileVector, DimensionKey, getTopDimensions } from './profileVector';

export interface FullProfileData {
  corePattern: string;
  primaryDriver: string;
  secondaryDriver: string;
  decisionStyle: string;
  emotionalDirection: string;
  socialPattern: string;
  riskPattern: string;
  contradictionPattern: string;
  rarestSignal: string;
  rarestSignalPercent: number;
  incomplete: string[];
  probableArchetypeDirection: string;
}

const CORE_PATTERNS: Partial<Record<DimensionKey, string>> = {
  control: "Your pattern shows a preference for structure over uncertainty. Before moving, you establish a frame. Before deciding, you find the rule. This is not rigidity — it is your method of navigating a world you don't fully control.",
  curiosity: "Your signal points toward exploration. More than most, your answers reveal a pull toward open questions over fixed answers. You are drawn to edge cases others overlook.",
  security: "The system detected a strong stability orientation. Your answers consistently favor predictable outcomes — not because you fear change, but because you trust what you can calculate.",
  emotion: "Your internal responses are strong. Your answers suggest more emotional signal than your visible choices reveal — a gap between felt intensity and expressed reaction.",
  risk: "Your pattern shows a higher-than-average risk permission threshold. When others hesitate, you assess and act. Uncertainty is manageable when you choose to enter it.",
  independence: "Autonomy appears as a primary driver. You operate inside your own frame, and external pressure to conform creates friction rather than compliance.",
  connection: "Belonging influences your decisions more than independence does. Relational context affects your risk tolerance, and your choices carry a social weight you may not always name.",
  change: "Transformation is a default for you — not a reaction to crisis. The system detected forward orientation as a consistent behavioral tendency.",
};

const SECOND_DIM_ADDONS: Partial<Record<DimensionKey, string>> = {
  control: " At the same time, a secondary signal shows a layer of structure beneath your dominant tendency.",
  curiosity: " Alongside this, curiosity adds an exploratory current that moves under the surface.",
  security: " A secondary preference for stability shapes how far you let yourself go.",
  emotion: " Emotional sensitivity runs alongside, creating depth in your reactions.",
  risk: " A risk-positive tendency adds movement to your pattern.",
  independence: " Independence reinforces this, pushing decisions inward rather than outward.",
  connection: " Relational weight adds complexity to your choices.",
  change: " An orientation toward change keeps your pattern in motion.",
};

export function computeFullProfile(vector: ProfileVector, totalAnswers: number): FullProfileData {
  const top = getTopDimensions(vector, 2);
  const top1 = top[0] as DimensionKey | undefined;
  const top2 = top[1] as DimensionKey | undefined;

  // corePattern
  const basePat = top1 ? (CORE_PATTERNS[top1] ?? "Your behavioral pattern is still emerging.") : "Your behavioral pattern is still emerging.";
  const addon = top2 && CORE_PATTERNS[top2] ? (SECOND_DIM_ADDONS[top2] ?? '') : '';
  const corePattern = basePat + addon;

  // primaryDriver / secondaryDriver
  const primaryDriver = top1 ? (top1.charAt(0).toUpperCase() + top1.slice(1)) : 'Undefined';
  const secondaryDriver = top2 ? (top2.charAt(0).toUpperCase() + top2.slice(1)) : 'Undefined';

  // decisionStyle
  const v = vector;
  let decisionStyle = 'Pattern-Based Decider';
  if (v.control > 5 && v.emotion < 3) decisionStyle = 'Analytical';
  else if (v.emotion > 5 && v.control < 3) decisionStyle = 'Intuitive Reactor';
  else if (v.curiosity > 5 && v.control > 5) decisionStyle = 'Strategic Explorer';
  else if (v.risk > 5 && v.independence > 3) decisionStyle = 'Autonomous Actor';
  else if (v.connection > 5 && v.emotion > 3) decisionStyle = 'Relational Adapter';
  else if (v.security > 5 && v.change < 3) decisionStyle = 'Stability-First Decider';
  else if (v.independence > 5 && v.curiosity > 3) decisionStyle = 'Controlled Explorer';

  // emotionalDirection
  let emotionalDirection = 'Guarded but responsive';
  if (v.emotion > 5 && v.security > 3) emotionalDirection = 'Intense but selective';
  else if (v.emotion > 3 && v.connection > 3) emotionalDirection = 'Responsive and relationally attuned';
  else if (v.emotion < 2 && v.control > 4) emotionalDirection = 'Calm until uncertainty rises';
  else if (v.emotion > 3 && v.independence > 4) emotionalDirection = 'Emotionally self-contained';

  // socialPattern
  let socialPattern = 'Quiet Challenger';
  if (v.connection > v.independence + 4) socialPattern = 'Adaptive Connector';
  else if (v.independence > v.connection + 4) socialPattern = 'Boundary Keeper';
  else if (v.security > 5 && v.connection < 3) socialPattern = 'Reserved Observer';
  else if (v.independence > 3 && v.security > 3) socialPattern = 'Selective Revealer';

  // riskPattern
  let riskPattern = 'prefers safety under ambiguity';
  if (v.risk > 7) riskPattern = 'seeks novelty and acts before full data';
  else if (v.risk > 4) riskPattern = 'accepts structured risk within visible parameters';
  else if (v.risk > 1) riskPattern = 'avoids blind risk but accepts calculated uncertainty';

  // contradictionPattern
  let contradictionPattern = 'No strong contradiction pattern detected yet.';
  if (v.independence > 3 && v.connection > 3) contradictionPattern = 'You may seek independence, but your answers show sensitivity to relational consequences.';
  else if (v.control > 3 && v.curiosity > 3) contradictionPattern = 'You value exploration, but within self-imposed limits. This creates productive tension.';
  else if (v.security > 3 && v.risk > 3) contradictionPattern = 'Your answers pull in two directions: toward stability and toward action. This tension is not a flaw — it is complexity.';
  else if (v.emotion > 3 && v.control > 3) contradictionPattern = 'You feel more than your choices reveal. The distance between internal experience and external decision is a pattern in itself.';

  // rarestSignal
  const RAREST_SIGNAL_NAMES: Partial<Record<DimensionKey, string>> = {
    control: 'Pattern Trust',
    curiosity: 'Edge Explorer',
    security: 'System Trust',
    emotion: 'Private Intensity',
    risk: 'First Mover',
    independence: 'Internal Authority',
    connection: 'Mirror Effect',
    change: 'Adaptive Default',
  };
  const rarestSignal = top1 ? (RAREST_SIGNAL_NAMES[top1] ?? 'Signal Unknown') : 'Signal Unknown';

  // rarestSignalPercent — deterministic from vector hash
  const rarestSignalPercent = 5 + (Object.values(vector).reduce((a, b) => a + b, 0) % 12);

  // incomplete
  const incomplete = ['Conflict Pattern', 'Attachment Style', 'Motivation Architecture', 'Shadow Pattern'];

  // probableArchetypeDirection
  const d1 = top1 ?? '';
  const d2 = top2 ?? '';
  let probableArchetypeDirection = 'Strategist / Observer blend';
  if ((d1 === 'curiosity' && d2 === 'risk') || (d1 === 'risk' && d2 === 'curiosity')) probableArchetypeDirection = 'Explorer / Catalyst blend';
  else if ((d1 === 'control' && d2 === 'security') || (d1 === 'security' && d2 === 'control')) probableArchetypeDirection = 'Architect / Guardian blend';
  else if ((d1 === 'emotion' && d2 === 'connection') || (d1 === 'connection' && d2 === 'emotion')) probableArchetypeDirection = 'Mirror / Anchor blend';
  else if ((d1 === 'independence' && d2 === 'risk') || (d1 === 'risk' && d2 === 'independence')) probableArchetypeDirection = 'Rebel / Catalyst blend';
  else if ((d1 === 'curiosity' && d2 === 'independence') || (d1 === 'independence' && d2 === 'curiosity')) probableArchetypeDirection = 'Explorer / Pathfinder blend';
  else if ((d1 === 'security' && d2 === 'control') || (d1 === 'control' && d2 === 'security')) probableArchetypeDirection = 'Guardian / Strategist blend';
  else if ((d1 === 'change' && d2 === 'curiosity') || (d1 === 'curiosity' && d2 === 'change')) probableArchetypeDirection = 'Alchemist / Seeker blend';

  void totalAnswers;

  return {
    corePattern,
    primaryDriver,
    secondaryDriver,
    decisionStyle,
    emotionalDirection,
    socialPattern,
    riskPattern,
    contradictionPattern,
    rarestSignal,
    rarestSignalPercent,
    incomplete,
    probableArchetypeDirection,
  };
}
