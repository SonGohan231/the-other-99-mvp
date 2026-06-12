// Raw row shape parsed from v3 questions CSV (comma-delimited, Stage 2B schema)
export interface QuestionRowV2 {
  question_id: string;
  tier: string;
  mode: string;                    // 'question' | 'riddle' | 'controversy' | 'mystic' | 'social_dilemma' | 'free_plus'
  category: string;
  subcategory: string;
  language_status: string;
  question_pl: string;
  question_en: string;
  question_type: string;           // 'four_choice' etc.
  primary_axis: string;            // AX01–AX10
  secondary_axis: string;
  sensitivity_level: string;
  controversy_level: string;
  safety_label: string;
  source_id: string;
  content_status: string;
  content_contract_status: string;
  created_at: string;
  notes: string;
}

// Raw row shape parsed from v3 answers CSV (comma-delimited, Stage 2B schema)
export interface AnswerRowV2 {
  answer_id: string;
  question_id: string;
  option_key: string;              // A | B | C | D
  answer_pl: string;
  answer_en: string;
  axis_delta_AX01: string;
  axis_delta_AX02: string;
  axis_delta_AX03: string;
  axis_delta_AX04: string;
  axis_delta_AX05: string;
  axis_delta_AX06: string;
  axis_delta_AX07: string;
  axis_delta_AX08: string;
  axis_delta_AX09: string;
  axis_delta_AX10: string;
  hidden_delta_confidence: string;
  hidden_delta_openness: string;
  hidden_delta_consistency: string;
  short_reveal_pl: string;
  short_reveal_en: string;
  comparison_insight_pl: string;
  comparison_insight_en: string;
  pattern_signal_pl: string;
  pattern_signal_en: string;
  micro_reward_pl: string;
  micro_reward_en: string;
  projected_distribution_percent: string;
  rarity_weight: string;
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
  mode: string;
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
