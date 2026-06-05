import { ProfileVector } from './profileVector';
import { PREMIUM_MODULES } from '../data/premiumModules';

export interface PremiumInsight {
  moduleId: string;
  hasData: boolean;
  lines: string[];
}

function top(vec: ProfileVector, dims: string[]): string {
  return dims
    .map((d) => ({ d, v: (vec as unknown as Record<string, number>)[d] ?? 0 }))
    .sort((a, b) => b.v - a.v)[0]?.d ?? dims[0];
}

function score(vec: ProfileVector, dims: string[]): number {
  return dims.reduce((sum, d) => sum + Math.abs((vec as unknown as Record<string, number>)[d] ?? 0), 0);
}

const INSIGHTS: Record<string, (vec: ProfileVector) => string[]> = {
  shadowProfile: (vec) => {
    const dominant = top(vec, ['control', 'independence', 'security']);
    const shadow =
      dominant === 'control' ? 'dependency' :
      dominant === 'independence' ? 'need for validation' :
      'impulse toward risk';
    return [
      `Your dominant signal is ${dominant}.`,
      `Your shadow pattern suggests a suppressed tendency toward ${shadow}.`,
      'This tension between your expressed and suppressed tendencies shapes your choices.',
    ];
  },
  maskVsCore: (vec) => {
    const presented = top(vec, ['connection', 'security']);
    const hidden = top(vec, ['independence', 'risk']);
    return [
      `Presented pattern: high ${presented}.`,
      `Core signal: underlying ${hidden} that rarely surfaces publicly.`,
      'The gap between your mask and your core creates a pattern the system can now read.',
    ];
  },
  contradictions: (vec) => {
    const v = vec as unknown as Record<string, number>;
    const riskVal = v['risk'] ?? 0;
    const secVal = v['security'] ?? 0;
    const changeVal = v['change'] ?? 0;
    const tension = Math.abs(riskVal - secVal);
    const label = tension > 1.5 ? 'strong' : tension > 0.8 ? 'moderate' : 'mild';
    return [
      `Contradiction strength: ${label}.`,
      `You seek change (${changeVal.toFixed(1)}) while also anchoring to security (${secVal.toFixed(1)}).`,
      'Your choices show an internal negotiation that most people do not notice in themselves.',
    ];
  },
  futureSelf: (vec) => {
    const future = top(vec, ['change', 'curiosity', 'risk']);
    return [
      `Your profile is pulling toward: ${future}.`,
      `This is not a prediction — it is a direction your current behavioral signals point to.`,
      'If this trend continues, your dominant pattern will shift in the next phase.',
    ];
  },
  relationshipMode: (vec) => {
    const v = vec as unknown as Record<string, number>;
    const conn = v['connection'] ?? 0;
    const sec = v['security'] ?? 0;
    const emo = v['emotion'] ?? 0;
    const style =
      conn > sec && conn > emo ? 'connector' :
      sec > conn ? 'stabilizer' :
      'emotionally open';
    return [
      `Your relationship mode: ${style}.`,
      `Connection score: ${conn.toFixed(1)}, Security: ${sec.toFixed(1)}, Emotion: ${emo.toFixed(1)}.`,
      'This pattern determines how you bond, withdraw, and maintain closeness.',
    ];
  },
  humanTwin: (vec) => {
    const overall = score(vec, ['control', 'risk', 'curiosity', 'connection']);
    const tier = overall > 4 ? 'strong' : overall > 2 ? 'moderate' : 'developing';
    return [
      `Twin signal strength: ${tier}.`,
      `Your behavioral fingerprint is complex enough to detect matching patterns.`,
      'The system is narrowing the search for your closest behavioral twin.',
    ];
  },
  hiddenParameters: (vec) => {
    const v = vec as unknown as Record<string, number>;
    const emo = v['emotion'] ?? 0;
    const ind = v['independence'] ?? 0;
    const cur = v['curiosity'] ?? 0;
    const hidden = emo > ind ? 'emotionally driven processing' : 'independent decision framing';
    return [
      `Hidden parameter: ${hidden}.`,
      `Curiosity index: ${cur.toFixed(1)} — this drives your edge-case choices.`,
      'These parameters are only visible from your pattern edges, not your main signals.',
    ];
  },
  profileEvolution: (vec) => {
    const dominant = top(vec, ['change', 'control', 'security']);
    return [
      `Most evolved dimension: ${dominant}.`,
      'Your profile has shifted toward this signal across multiple answer sessions.',
      'Evolution tracking shows whether your patterns are stabilizing or still changing.',
    ];
  },
};

export function generatePremiumInsight(
  moduleId: string,
  vec: ProfileVector,
  totalAnswers: number
): PremiumInsight {
  const mod = PREMIUM_MODULES.find((m) => m.id === moduleId);
  if (!mod) return { moduleId, hasData: false, lines: [] };

  if (totalAnswers < mod.minAnswers) {
    return { moduleId, hasData: false, lines: [] };
  }

  const generator = INSIGHTS[moduleId];
  if (!generator) return { moduleId, hasData: false, lines: [] };

  return { moduleId, hasData: true, lines: generator(vec) };
}
