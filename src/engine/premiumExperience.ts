// ─── Types ────────────────────────────────────────────────────────────────────

export type ReadinessLabel =
  | 'beginning'
  | 'developing'
  | 'forming'
  | 'substantial'
  | 'comprehensive';

export interface ModuleStatus {
  id: string;
  label_en: string;
  min_answers: number;
  is_accessible: boolean;
}

export interface MilestoneStatus {
  answers: number;
  label: string;
  is_reached: boolean;
}

export interface PremiumExperienceResult {
  version: 'stage10_premium_longterm_experience_v1';
  answer_count: number;
  profile_readiness: number;          // 0–95 (never 100; always more to discover)
  readiness_label: ReadinessLabel;
  is_displayable: boolean;            // true when answer_count >= 1
  milestones: MilestoneStatus[];
  next_milestone_label: string | null;
  answers_to_next_milestone: number;  // 0 when all milestones reached
  modules_available: number;          // 0–8
  modules_total: 8;
  module_status: ModuleStatus[];
  discovered_signals: string[];       // what engines have surfaced at this count
  safe_text_en: string;               // hedged, non-clinical, non-manipulative
  safe_text_pl: string;
  debug_notes: string[];
}

// ─── Module registry (mirrors src/data/premiumModules.ts thresholds) ──────────

const MODULES: ReadonlyArray<{ id: string; label_en: string; min_answers: number }> = [
  { id: 'shadowProfile',    label_en: 'Shadow Profile',     min_answers: 34 },
  { id: 'maskVsCore',       label_en: 'Mask vs Core',       min_answers: 34 },
  { id: 'contradictions',   label_en: 'Contradiction Map',  min_answers: 51 },
  { id: 'futureSelf',       label_en: 'Future Self',        min_answers: 51 },
  { id: 'hiddenParameters', label_en: 'Hidden Parameters',  min_answers: 51 },
  { id: 'relationshipMode', label_en: 'Relationship Mode',  min_answers: 68 },
  { id: 'profileEvolution', label_en: 'Profile Evolution',  min_answers: 68 },
  { id: 'humanTwin',        label_en: 'Human Twin',         min_answers: 85 },
] as const;

// ─── Milestone registry (mirrors src/utils/premiumProgression.ts) ─────────────

const MILESTONE_DEFS: ReadonlyArray<{ answers: number; label: string }> = [
  { answers: 51,  label: 'Snapshot 51 unlocked' },
  { answers: 85,  label: 'Human Twin module accessible' },
  { answers: 100, label: 'Full profile readable' },
  { answers: 150, label: 'Deep signal reached' },
  { answers: 250, label: 'Master profile signal' },
  { answers: 500, label: 'Comprehensive profile' },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toReadiness(count: number): number {
  // Breakpoints: [answer_count, readiness_percent]
  const BP: ReadonlyArray<readonly [number, number]> = [
    [0, 0], [17, 20], [34, 30], [51, 45], [68, 55],
    [85, 65], [100, 72], [150, 80], [250, 88], [500, 95],
  ];
  if (count <= 0) return 0;
  if (count >= 500) return 95;
  for (let i = 1; i < BP.length; i++) {
    const [x0, y0] = BP[i - 1];
    const [x1, y1] = BP[i];
    if (count <= x1) {
      return Math.round(y0 + ((count - x0) / (x1 - x0)) * (y1 - y0));
    }
  }
  return 95;
}

function toReadinessLabel(count: number): ReadinessLabel {
  if (count < 17)  return 'beginning';
  if (count < 51)  return 'developing';
  if (count < 85)  return 'forming';
  if (count < 150) return 'substantial';
  return 'comprehensive';
}

function toDiscoveredSignals(count: number): string[] {
  const signals: string[] = [];
  if (count >= 3)   signals.push('Pattern signal detected');
  if (count >= 8)   signals.push('Social response comparison visible');
  if (count >= 12)  signals.push('Archetype direction forming');
  if (count >= 12)  signals.push('Hidden parameters accessible');
  if (count >= 17)  signals.push('Behavioral similarity signal');
  if (count >= 34)  signals.push('Shadow Profile module accessible');
  if (count >= 51)  signals.push('Snapshot 51 first view available');
  if (count >= 68)  signals.push('Relationship mode pattern accessible');
  if (count >= 85)  signals.push('Human Twin module accessible');
  if (count >= 100) signals.push('Full profile signal readable');
  return signals;
}

interface SafeCopy { en: string; pl: string }

function buildSafeText(label: ReadinessLabel): SafeCopy {
  switch (label) {
    case 'beginning':
      return {
        en: 'Your profile has started forming. Each answer adds signal to the picture.',
        pl: 'Twój profil zaczyna się kształtować. Każda odpowiedź dodaje sygnał do obrazu.',
      };
    case 'developing':
      return {
        en: 'A direction has emerged. Key patterns across your answers are becoming visible.',
        pl: 'Kierunek się pojawił. Kluczowe wzorce w Twoich odpowiedziach stają się widoczne.',
      };
    case 'forming':
      return {
        en: 'Your Snapshot 51 is now active. Core behavioral patterns are readable across your answers.',
        pl: 'Twój Snapshot 51 jest teraz aktywny. Podstawowe wzorce behawioralne są czytelne w Twoich odpowiedziach.',
      };
    case 'substantial':
      return {
        en: 'Your profile reflects a substantial behavioral signal across multiple dimensions.',
        pl: 'Twój profil odzwierciedla znaczący sygnał behawioralny w wielu wymiarach.',
      };
    case 'comprehensive':
      return {
        en: 'A comprehensive behavioral pattern has emerged across your answers. The signal is stable.',
        pl: 'Kompleksowy wzorzec behawioralny wyłonił się z Twoich odpowiedzi. Sygnał jest stabilny.',
      };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function computePremiumExperience(answerCount: number): PremiumExperienceResult {
  const safeCount = Math.max(0, Number.isFinite(answerCount) ? Math.floor(answerCount) : 0);

  const profile_readiness = toReadiness(safeCount);
  const readiness_label   = toReadinessLabel(safeCount);
  const is_displayable    = safeCount >= 1;

  const milestones: MilestoneStatus[] = MILESTONE_DEFS.map((m) => ({
    answers:    m.answers,
    label:      m.label,
    is_reached: safeCount >= m.answers,
  }));

  const nextMilestone = MILESTONE_DEFS.find((m) => safeCount < m.answers) ?? null;
  const next_milestone_label      = nextMilestone?.label ?? null;
  const answers_to_next_milestone = nextMilestone ? Math.max(0, nextMilestone.answers - safeCount) : 0;

  const module_status: ModuleStatus[] = MODULES.map((m) => ({
    id:           m.id,
    label_en:     m.label_en,
    min_answers:  m.min_answers,
    is_accessible: safeCount >= m.min_answers,
  }));
  const modules_available = module_status.filter((m) => m.is_accessible).length;

  const discovered_signals = toDiscoveredSignals(safeCount);
  const { en: safe_text_en, pl: safe_text_pl } = buildSafeText(readiness_label);

  const debug_notes: string[] = [
    `readiness=${profile_readiness}`,
    `label=${readiness_label}`,
    `modules=${modules_available}/8`,
    `milestones_reached=${milestones.filter((m) => m.is_reached).length}/${milestones.length}`,
    `next_milestone=${next_milestone_label ?? 'none'}`,
    `signals=${discovered_signals.length}`,
  ];

  return {
    version: 'stage10_premium_longterm_experience_v1',
    answer_count: safeCount,
    profile_readiness,
    readiness_label,
    is_displayable,
    milestones,
    next_milestone_label,
    answers_to_next_milestone,
    modules_available,
    modules_total: 8,
    module_status,
    discovered_signals,
    safe_text_en: is_displayable ? safe_text_en : '',
    safe_text_pl: is_displayable ? safe_text_pl : '',
    debug_notes,
  };
}
