// Raw row shape parsed from v2 questions CSV (comma-delimited)
export interface QuestionRowV2 {
  question_id: string;
  language_pair_id: string;
  source_series: string;
  tier: string;
  mode: string;
  category_pl: string;
  category_en: string;
  question_pl: string;
  question_en: string;
  answer_type: string;
  primary_axis: string;
  secondary_axes: string;
  archetype_targets: string;
  archetype_oppositions: string;
  hidden_signal_targets: string;
  sensitivity_level: string;
  controversy_level: string;
  social_desirability_risk: string;
  rarity_weight: string;
  contradiction_pair_id: string;
  safety_label: string;
  statistic_source_label: string;
  reveal_template_ids: string;
  system_actions: string;
  hidden_events_policy: string;
  production_status: string;
  pattern_tags: string;
  pattern_signal_id: string;
  pattern_axis_direction: string;
  pattern_hidden_signal: string;
  pattern_confidence_weight: string;
  pattern_min_occurrences: string;
  reveal_dosing_policy: string;
  pattern_engine_status: string;
}

// Raw row shape parsed from v2 answers CSV (comma-delimited)
export interface AnswerRowV2 {
  answer_id: string;
  question_id: string;
  source_series: string;
  answer_order: string;
  label_pl: string;
  label_en: string;
  short_label_pl: string;
  short_label_en: string;
  axis_deltas_json: string;          // e.g. {"AX01": -3, "AX04": -1}
  archetype_deltas_json: string;
  hidden_signal_deltas_json: string;
  rarity_impact: string;
  social_desirability_flag: string;
  reveal_pl: string;
  reveal_en: string;
  statistic_source_label: string;
  wow_refinement_status: string;
  answer_reveal_short_pl: string;    // TIER_1 per-answer reveal (PL)
  answer_reveal_short_en: string;    // TIER_1 per-answer reveal (EN)
  pattern_reveal_pl: string;         // TIER_2
  pattern_reveal_en: string;
  snapshot_reveal_pl: string;        // TIER_3
  snapshot_reveal_en: string;
  premium_reveal_pl: string;         // TIER_5
  premium_reveal_en: string;
  reveal_tier: string;
  reveal_depth: string;
  pattern_tags: string;
  pattern_signal_id: string;
  pattern_axis_direction: string;
  pattern_hidden_signal: string;
  pattern_confidence_weight: string;
  pattern_min_occurrences: string;
  original_long_reveal_pl: string;
  original_long_reveal_en: string;
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
  // Reveal copy per tier
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
  version: '2.0.0',
  questionsFile: 'questions_all_2650.csv',
  answersFile: 'answers_all_5300.csv',
  expectedQuestionCount: 2650,
  expectedAnswerCount: 5300,
  canonicalAxes: ['AX01','AX02','AX03','AX04','AX05','AX06','AX07','AX08','AX09','AX10'] as const,
  hiddenParams: ['HP01','HP02','HP03'] as const,
  validRevealTiers: ['TIER_1','TIER_2','TIER_3','TIER_5'] as const,
  tier1RevealMaxChars: 200,
  patternEngineStatus: 'pattern_ready_v2',
} as const;

// ─── Supplemental dataset shapes (files expected in future drops) ──────────────

export interface HiddenEvent {
  event_id: string;
  trigger_condition: string;        // e.g. "HP01 >= 0.7 AND AX03 >= 2"
  event_type: string;               // e.g. "reveal" | "unlock" | "nudge"
  payload_pl: string;
  payload_en: string;
  cooldown_answers: number;
  requires_premium: boolean;
}

export interface PatternRule {
  rule_id: string;
  pattern_signal_id: string;
  axis_direction: string;           // e.g. "AX03:positive"
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
  contradiction_type: string;       // e.g. "axis_flip" | "value_conflict"
  reveal_pl: string;
  reveal_en: string;
  confidence_threshold: number;
}

export interface EmergingArchetypeState {
  template_id: string;
  archetype_id: string;
  axis_thresholds_json: string;     // JSON: Record<string, number>
  unlock_answer_count: number;
  reveal_title_pl: string;
  reveal_title_en: string;
  reveal_body_pl: string;
  reveal_body_en: string;
}

export interface RevealDosingTemplate {
  template_id: string;
  dosing_policy: string;            // e.g. "immediate" | "delayed_3" | "pattern_gated"
  min_answers_before_reveal: number;
  max_reveals_per_session: number;
  cooldown_answers: number;
  applies_to_tiers: string;         // comma-separated: "TIER_1,TIER_2"
}

// ─── Convenience aliases ───────────────────────────────────────────────────────

/** Alias for ergonomic imports in runtime code */
export type QuestionItem = ContentItemV2;
export type AnswerOption = AnswerOptionV2;
