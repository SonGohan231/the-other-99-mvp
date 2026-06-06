import { ProfileVector } from './profileVector';
import { BehavioralSummary } from './behavioralSignals';

export type ParameterLevel = 'Low' | 'Medium' | 'High';

export interface HiddenParameter {
  id: string;
  name: string;
  level: ParameterLevel;
  value: number; // 0-100 for display bar
  description: string;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function level(value: number): ParameterLevel {
  if (value < 35) return 'Low';
  if (value > 65) return 'High';
  return 'Medium';
}

export function computeHiddenParameters(vector: ProfileVector, behavioral?: BehavioralSummary | null): HiddenParameter[] {
  const v = vector;

  // Behavioral adjustment modifiers derived from skip/swap/exit patterns
  const skipPressure = behavioral ? Math.min(30, behavioral.skipRatePercent * 0.6) : 0;
  const exitPressure = behavioral ? Math.min(20, behavioral.totalExits * 4) : 0;
  const avoidanceBoost = behavioral ? (behavioral.avgAvoidanceSignal > 50 ? 15 : 0) : 0;
  const contradictionBoost = behavioral ? Math.min(20, behavioral.avgContradictionSignal * 0.25) : 0;
  const confidenceDip = behavioral ? (behavioral.avgConfidenceSignal < 40 ? 10 : 0) : 0;

  const params: Array<{ id: string; name: string; raw: number; value: number; descriptions: Record<ParameterLevel, string> }> = [
    {
      id: 'p1',
      name: 'Control Under Uncertainty',
      raw: v.control,
      value: clamp(v.control * 5, 0, 100),
      descriptions: {
        Low: 'Low tendency to impose structure under pressure. You adapt without needing to control.',
        Medium: 'Moderate. You look for structure when stakes are high.',
        High: 'High. You build order before acting. Clarity is a prerequisite.',
      },
    },
    {
      id: 'p2',
      name: 'Decision Latency',
      raw: (v.security * 0.6 + v.emotion * 0.4) - v.risk,
      value: clamp(50 + ((v.security * 0.6 + v.emotion * 0.4) - v.risk) * 5 + skipPressure * 0.5, 0, 100),
      descriptions: {
        Low: 'Decisions arrive quickly. Some topics may not get the pause they need.',
        Medium: 'Some questions create a longer internal pause before choice.',
        High: 'You take time. The pause before deciding is part of your process.',
      },
    },
    {
      id: 'p3',
      name: 'Novelty Resistance',
      raw: v.security - v.curiosity,
      value: clamp(50 + (v.security - v.curiosity) * 5, 0, 100),
      descriptions: {
        Low: 'Low resistance to novelty. You move toward new patterns easily.',
        Medium: 'Moderate. Novelty is appealing, but not at the cost of stability.',
        High: 'High. You resist unfamiliar inputs until they can be evaluated.',
      },
    },
    {
      id: 'p4',
      name: 'Social Exposure Sensitivity',
      raw: v.connection - v.independence,
      value: clamp(50 + (v.connection - v.independence) * 4, 0, 100),
      descriptions: {
        Low: 'Low. Social context has less effect on your decisions than average.',
        Medium: 'Medium. You are aware of others\' presence without being controlled by it.',
        High: 'High. You calibrate differently when others can see you.',
      },
    },
    {
      id: 'p5',
      name: 'Emotional Guarding',
      raw: v.control - v.emotion,
      value: clamp(50 + (v.control - v.emotion) * 4 + avoidanceBoost + exitPressure * 0.4, 0, 100),
      descriptions: {
        Low: 'Low. You express emotional content with less filtering than average.',
        Medium: 'Moderate guarding. You share selectively.',
        High: 'High. There is a significant gap between what you feel and what you show.',
      },
    },
    {
      id: 'p6',
      name: 'Pattern Trust',
      raw: (v.security + v.control) / 2,
      value: clamp(((v.security + v.control) / 2) * 5, 0, 100),
      descriptions: {
        Low: 'You question systems more than you trust them.',
        Medium: 'Moderate. You trust patterns that have proven themselves.',
        High: 'High. You trust established patterns and systems over spontaneous signals.',
      },
    },
    {
      id: 'p7',
      name: 'Risk Permission Threshold',
      raw: v.risk,
      value: clamp(v.risk * 5, 0, 100),
      descriptions: {
        Low: 'Low. Risk requires strong justification before you accept it.',
        Medium: 'Medium. You accept risk when parameters are visible.',
        High: 'High. Your threshold for acceptable risk is higher than most.',
      },
    },
    {
      id: 'p8',
      name: 'Future Orientation',
      raw: v.change,
      value: clamp(v.change * 5, 0, 100),
      descriptions: {
        Low: 'Present-focused. Past experience and current stability carry more weight.',
        Medium: 'Balanced between now and later.',
        High: 'Future-dominant. You make decisions with a long arc in mind.',
      },
    },
    {
      id: 'p9',
      name: 'Relational Weight',
      raw: v.connection,
      value: clamp(v.connection * 5, 0, 100),
      descriptions: {
        Low: 'Low. Relationships rarely appear in your decision calculus.',
        Medium: 'Moderate. People matter, but not as the primary variable.',
        High: 'High. Relational consequences appear in most decisions.',
      },
    },
    {
      id: 'p10',
      name: 'Identity Rigidity',
      raw: v.security - v.change,
      value: clamp(50 + (v.security - v.change) * 4, 0, 100),
      descriptions: {
        Low: 'Flexible. Your sense of self accommodates change without friction.',
        Medium: 'Moderate. You hold your identity while allowing some redefinition.',
        High: 'High. Your self-concept is stable and resistant to external redefinition.',
      },
    },
    {
      id: 'p11',
      name: 'Contradiction Density',
      raw: Math.abs(v.independence - v.connection) + Math.abs(v.control - v.risk),
      value: clamp((Math.abs(v.independence - v.connection) + Math.abs(v.control - v.risk)) * 4 + contradictionBoost, 0, 100),
      descriptions: {
        Low: 'Your behavioral pattern shows low internal tension.',
        Medium: 'Some contradictions exist — pulls in opposite directions.',
        High: 'High internal tension. Your answers pull in multiple directions simultaneously.',
      },
    },
    {
      id: 'p12',
      name: 'Consistency Drift',
      raw: v.change - v.security,
      value: clamp(50 + (v.change - v.security) * 4 + confidenceDip * 0.5, 0, 100),
      descriptions: {
        Low: 'Your pattern is stable over time.',
        Medium: 'Moderate drift. Your answers suggest some evolution in underlying tendencies.',
        High: 'High. Your pattern shows movement — this could be growth or unresolved tension.',
      },
    },
  ];

  return params.map((p) => {
    const lv = level(p.value);
    return {
      id: p.id,
      name: p.name,
      level: lv,
      value: Math.round(p.value),
      description: p.descriptions[lv],
    };
  });
}
