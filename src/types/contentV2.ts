// Raw row shape parsed from v3 questions CSV (comma-delimited)
export interface QuestionRowV2 {
  question_id: string;
  tier: string;
  content_type: string;
  internal_category: string;
  user_visible_category: string;
  question_pl: string;
  question_en: string;
  answer_type: string;
  source_id: string;
  source_name: string;
  source_url: string;
  source_usage_mode: string;
  source_license_status: string;
  source_construct: string;
  axis_primary: string;
  axis_primary_name_en: string;
  axis_primary_name_pl: string;
  axis_secondary: string;
  axis_secondary_name_en: string;
  axis_secondary_name_pl: string;
  hidden_parameter_primary: string;
  hidden_parameter_name: string;
  sensitivity_level: string;
  rarity_weight: string;
  social_label_default: string;
  import_status: string;
  safety_label: string;
  language_status: string;
  dedupe_status: string;
  created_at: string;
  notes: string;
}

// Raw row shape parsed from v3 answers CSV (comma-delimited)
export interface AnswerRowV2 {
  answer_id: string;
  question_id: string;
  answer_index: string;
  answer_pl: string;
  answer_en: string;
  answer_style: string;
  axis_primary_delta: string;
  axis_secondary_delta: string;
  hidden_parameter_delta: string;
  rarity_weight: string;
  comparison_insight_pl: string;
  comparison_insight_en: string;
  top_archetype: string;
  archetype_sum_check: string;
  A01: string;
  A02: string;
  A03: string;
  A04: string;
  A05: string;
  A06: string;
  A07: string;
  A08: string;
  A09: string;
  A10: string;
  A11: string;
  A12: string;
}

// Parsed answer option — attached to ContentItemV2
export interface AnswerOptionV2 {
  answerId: string;
  order: number;
  labelPl: string;
  labelEn: string;
  shortLabelPl: string;
  shortLabelEn: string;
  axisDeltas: Record<string, number>;  // AX01–AX10 keys
  rarityImpact: number;
  answerRevealShortPl: string;         // TIER_1 — shown after every answer
  answerRevealShortEn: string;
  patternRevealPl: string;             // TIER_2 — shown after pattern detected
  patternRevealEn: string;
  snapshotRevealPl: string;            // TIER_3 — mini snapshot (20–30 answers)
  snapshotRevealEn: string;
  premiumRevealPl: string;             // TIER_5 — premium depth
  premiumRevealEn: string;
}

// Joined content item: one question + its ordered answer options
export interface ContentItemV2 {
  questionId: string;
  tier: 'free' | 'premium';
  categoryPl: string;
  categoryEn: string;
  questionPl: string;
  questionEn: string;
  answerType: string;
  primaryAxis: string;
  sensitivityLevel: number;
  controversyLevel: number;
  rarityWeight: number;
  safetyLabel: string;
  statisticSourceLabel: string;
  revealTemplateIds: string[];
  productionStatus: string;
  answers: AnswerOptionV2[];
}

// ─── Data contract registry ────────────────────────────────────────────────────

export const DATA_CONTRACT_V2 = {
  version: '3.0.0',
  questionsFile: 'TO99_questions_master.csv',
  answersFile: 'TO99_answers_long.csv',
  expectedQuestionCount: 2400,
  expectedAnswerCount: 9600,
  expectedAnswersPerQuestion: 4,
  canonicalAxes: ['AX01','AX02','AX03','AX04','AX05','AX06','AX07','AX08','AX09','AX10'] as const,
  hiddenParams: ['H01','H02','H03'] as const,
  socialLabelPolicy: 'estimated_only_until_real_backend_votes_exist',
  sourceFolder: 'public/v3',
} as const;

// ─── Supplemental dataset shapes (files expected in future drops) ──────────────

export interface HiddenEvent {
  event_id: string;
  trigger_condition: string;
  event_type: string;
  payload_pl: string;
  payload_en: string;
  cooldown_answers: number;
  requires_premium: boolean;
}

export interface PatternRule {
  rule_id: string;
  pattern_signal_id: string;
  axis_direction: string;
  min_occurrences: number;
  confidence_weight: number;
  reveal_template_id: string;
  hidden_signal: string;
  active: boolean;
}

export interface ContradictionRule {
  rule_id: string;
  question_id_a: string;
  question_id_b: string;
  contradiction_type: string;
  reveal_pl: string;
  reveal_en: string;
  confidence_threshold: number;
}

export interface EmergingArchetypeState {
  template_id: string;
  archetype_id: string;
  axis_thresholds_json: string;
  unlock_answer_count: number;
  reveal_title_pl: string;
  reveal_title_en: string;
  reveal_body_pl: string;
  reveal_body_en: string;
}

export interface RevealDosingTemplate {
  template_id: string;
  dosing_policy: string;
  min_answers_before_reveal: number;
  max_reveals_per_session: number;
  cooldown_answers: number;
  applies_to_tiers: string;
}

export type QuestionItem = ContentItemV2;
export type AnswerOption = AnswerOptionV2;
