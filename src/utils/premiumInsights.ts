import { ProfileVector } from './profileVector';
import { BehavioralSummary } from './behavioralSignals';
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

type InsightGenerator = (vec: ProfileVector, b?: BehavioralSummary | null) => string[];

const INSIGHTS: Record<string, InsightGenerator> = {
  shadowProfile: (vec, b) => {
    const dominant = top(vec, ['control', 'independence', 'security']);
    const shadow =
      dominant === 'control' ? 'dependency' :
      dominant === 'independence' ? 'need for validation' :
      'impulse toward risk';

    if (b) {
      const avoidDesc =
        b.avoidanceLabel === 'avoidant' ? 'high evasion on sensitive questions' :
        b.avoidanceLabel === 'selective' ? 'selective disclosure under pressure' :
        'direct engagement even on sensitive content';
      const undoNote = b.totalUndos > 1 ? ` You reversed ${b.totalUndos} answers — a tell that surfaces under threat.` : '';
      return [
        `Your dominant signal is ${dominant}.`,
        `Your shadow pattern suggests a suppressed tendency toward ${shadow}.`,
        `Behavioral trace: ${avoidDesc}.${undoNote}`,
      ];
    }

    return [
      `Your dominant signal is ${dominant}.`,
      `Your shadow pattern suggests a suppressed tendency toward ${shadow}.`,
      'This tension between your expressed and suppressed tendencies shapes your choices.',
    ];
  },

  maskVsCore: (vec, b) => {
    const presented = top(vec, ['connection', 'security']);
    const hidden = top(vec, ['independence', 'risk']);

    if (b) {
      const contradictDesc =
        b.avgContradictionSignal > 50 ? 'strong contradictions between stated values and behavioral choices' :
        b.avgContradictionSignal > 25 ? 'moderate inconsistencies between what you say and what you do' :
        'relatively consistent alignment between stated and behavioral signals';
      const stabilityNote =
        b.stabilityLabel === 'volatile' ? ' Your decision pattern is volatile — the gap widens under pressure.' :
        b.stabilityLabel === 'uncertain' ? ' The gap shows in moments of uncertainty.' :
        '';
      return [
        `Presented pattern: high ${presented}.`,
        `Core signal: underlying ${hidden} that rarely surfaces publicly.`,
        `Behavioral read: ${contradictDesc}.${stabilityNote}`,
      ];
    }

    return [
      `Presented pattern: high ${presented}.`,
      `Core signal: underlying ${hidden} that rarely surfaces publicly.`,
      'The gap between your mask and your core creates a pattern the system can now read.',
    ];
  },

  contradictions: (vec, b) => {
    const v = vec as unknown as Record<string, number>;
    const riskVal = v['risk'] ?? 0;
    const secVal = v['security'] ?? 0;
    const changeVal = v['change'] ?? 0;
    const tension = Math.abs(riskVal - secVal);
    const label = tension > 1.5 ? 'strong' : tension > 0.8 ? 'moderate' : 'mild';

    if (b) {
      const behavioralContradiction =
        b.avgContradictionSignal > 50 ? 'Your behavior frequently contradicts your stated axis direction.' :
        b.avgContradictionSignal > 20 ? 'Periodic behavioral contradictions detected across question types.' :
        'Your behavioral choices are largely consistent with your profile direction.';
      const changeNote = b.totalAnswerChanges > 3
        ? ` You changed ${b.totalAnswerChanges} answers — each reversal marks a conflict point.`
        : '';
      return [
        `Contradiction strength: ${label}.`,
        `${behavioralContradiction}${changeNote}`,
        `You seek change (${changeVal.toFixed(1)}) while also anchoring to security (${secVal.toFixed(1)}).`,
      ];
    }

    return [
      `Contradiction strength: ${label}.`,
      `You seek change (${changeVal.toFixed(1)}) while also anchoring to security (${secVal.toFixed(1)}).`,
      'Your choices show an internal negotiation that most people do not notice in themselves.',
    ];
  },

  futureSelf: (vec, b) => {
    const future = top(vec, ['change', 'curiosity', 'risk']);

    if (b) {
      const decisionNote =
        b.decisivenessLabel === 'impulsive' ? 'Your impulsive decision pattern suggests rapid trajectory shifts.' :
        b.decisivenessLabel === 'decisive' ? 'Your decisive pattern indicates committed movement toward this direction.' :
        b.decisivenessLabel === 'deliberate' ? 'Your deliberate style suggests slow but stable evolution.' :
        'Your hesitant pattern may delay this trajectory from solidifying.';
      return [
        `Your profile is pulling toward: ${future}.`,
        decisionNote,
        'This is not a prediction — it is a direction your current behavioral signals point to.',
      ];
    }

    return [
      `Your profile is pulling toward: ${future}.`,
      `This is not a prediction — it is a direction your current behavioral signals point to.`,
      'If this trend continues, your dominant pattern will shift in the next phase.',
    ];
  },

  relationshipMode: (vec, b) => {
    const v = vec as unknown as Record<string, number>;
    const conn = v['connection'] ?? 0;
    const sec = v['security'] ?? 0;
    const emo = v['emotion'] ?? 0;
    const style =
      conn > sec && conn > emo ? 'connector' :
      sec > conn ? 'stabilizer' :
      'emotionally open';

    if (b) {
      const avoidanceNote =
        b.avoidanceLabel === 'avoidant' ? 'You show high resistance to emotionally exposed content.' :
        b.avoidanceLabel === 'selective' ? 'You open up selectively — intimacy is conditional.' :
        'You engage directly even with high-intimacy questions.';
      const frictionNote =
        b.avgEmotionalFrictionSignal > 50 ? ' High emotional friction signals detected across intimate questions.' :
        b.avgEmotionalFrictionSignal > 25 ? ' Moderate friction on emotionally charged content.' :
        '';
      return [
        `Your relationship mode: ${style}.`,
        avoidanceNote + frictionNote,
        `Connection score: ${conn.toFixed(1)}, Security: ${sec.toFixed(1)}, Emotion: ${emo.toFixed(1)}.`,
      ];
    }

    return [
      `Your relationship mode: ${style}.`,
      `Connection score: ${conn.toFixed(1)}, Security: ${sec.toFixed(1)}, Emotion: ${emo.toFixed(1)}.`,
      'This pattern determines how you bond, withdraw, and maintain closeness.',
    ];
  },

  humanTwin: (vec, b) => {
    const overall = score(vec, ['control', 'risk', 'curiosity', 'connection']);
    const tier = overall > 4 ? 'strong' : overall > 2 ? 'moderate' : 'developing';

    if (b) {
      const decLabel = b.decisivenessLabel;
      const stabLabel = b.stabilityLabel;
      const avoidLabel = b.avoidanceLabel;
      return [
        `Twin signal strength: ${tier}.`,
        `Behavioral fingerprint: ${decLabel} / ${stabLabel} / ${avoidLabel}.`,
        'These three axes narrow the behavioral twin search to a rare cluster.',
      ];
    }

    return [
      `Twin signal strength: ${tier}.`,
      `Your behavioral fingerprint is complex enough to detect matching patterns.`,
      'The system is narrowing the search for your closest behavioral twin.',
    ];
  },

  hiddenParameters: (vec, b) => {
    const v = vec as unknown as Record<string, number>;
    const emo = v['emotion'] ?? 0;
    const ind = v['independence'] ?? 0;
    const cur = v['curiosity'] ?? 0;
    const hidden = emo > ind ? 'emotionally driven processing' : 'independent decision framing';

    if (b) {
      const hesMs = b.avgHesitationMs;
      const hesDesc = hesMs !== null
        ? hesMs > 5000 ? `high hesitation (avg ${(hesMs / 1000).toFixed(1)}s after first touch)`
        : hesMs > 2000 ? `moderate hesitation (avg ${(hesMs / 1000).toFixed(1)}s)`
        : `low hesitation (avg ${(hesMs / 1000).toFixed(1)}s)`
        : 'hesitation data not available';
      const frictionLabel =
        b.avgEmotionalFrictionSignal > 60 ? 'high emotional friction' :
        b.avgEmotionalFrictionSignal > 30 ? 'moderate emotional friction' :
        'low emotional friction';
      return [
        `Hidden parameter: ${hidden}.`,
        `Decisiveness: ${b.decisivenessLabel} — ${hesDesc}.`,
        `Emotional load: ${frictionLabel} (signal: ${b.avgEmotionalFrictionSignal}). Curiosity index: ${cur.toFixed(1)}.`,
      ];
    }

    return [
      `Hidden parameter: ${hidden}.`,
      `Curiosity index: ${cur.toFixed(1)} — this drives your edge-case choices.`,
      'These parameters are only visible from your pattern edges, not your main signals.',
    ];
  },

  profileEvolution: (vec, b) => {
    const dominant = top(vec, ['change', 'control', 'security']);

    if (b) {
      const stabilityDesc =
        b.stabilityLabel === 'volatile' ? `volatile — your profile is in flux (instability: ${b.avgInstabilitySignal})` :
        b.stabilityLabel === 'uncertain' ? `uncertain — partial stabilization in progress` :
        `stable — your pattern has solidified`;
      const undoNote = b.totalUndos > 0
        ? ` ${b.totalUndos} undo${b.totalUndos > 1 ? 's' : ''} recorded — each marks a recalibration moment.`
        : '';
      return [
        `Most evolved dimension: ${dominant}.`,
        `Stability read: ${stabilityDesc}.${undoNote}`,
        'Evolution tracking shows whether your patterns are stabilizing or still changing.',
      ];
    }

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
  totalAnswers: number,
  behavioralSummary?: BehavioralSummary | null,
): PremiumInsight {
  const mod = PREMIUM_MODULES.find((m) => m.id === moduleId);
  if (!mod) return { moduleId, hasData: false, lines: [] };

  if (totalAnswers < mod.minAnswers) {
    return { moduleId, hasData: false, lines: [] };
  }

  const generator = INSIGHTS[moduleId];
  if (!generator) return { moduleId, hasData: false, lines: [] };

  return { moduleId, hasData: true, lines: generator(vec, behavioralSummary) };
}
