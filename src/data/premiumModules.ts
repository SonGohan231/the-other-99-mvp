export interface PremiumModule {
  id: string;
  minAnswers: number;
  dimensionKeys: string[];
}

export const PREMIUM_MODULES: PremiumModule[] = [
  {
    id: 'shadowProfile',
    minAnswers: 34,
    dimensionKeys: ['control', 'independence', 'security'],
  },
  {
    id: 'maskVsCore',
    minAnswers: 34,
    dimensionKeys: ['connection', 'independence', 'security'],
  },
  {
    id: 'contradictions',
    minAnswers: 51,
    dimensionKeys: ['risk', 'security', 'change'],
  },
  {
    id: 'futureSelf',
    minAnswers: 51,
    dimensionKeys: ['change', 'curiosity', 'risk'],
  },
  {
    id: 'relationshipMode',
    minAnswers: 68,
    dimensionKeys: ['connection', 'security', 'emotion'],
  },
  {
    id: 'humanTwin',
    minAnswers: 85,
    dimensionKeys: ['control', 'risk', 'curiosity', 'connection'],
  },
  {
    id: 'hiddenParameters',
    minAnswers: 51,
    dimensionKeys: ['emotion', 'independence', 'curiosity'],
  },
  {
    id: 'profileEvolution',
    minAnswers: 68,
    dimensionKeys: ['change', 'control', 'security'],
  },
];
