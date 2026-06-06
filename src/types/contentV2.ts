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
