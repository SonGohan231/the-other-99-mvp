export type ContentType = 'question' | 'secret' | 'dare' | 'game' | 'riddle';
export type RarityTier = 'standard' | 'rare' | 'epic' | 'legendary';
export type SafetyLabel = 'safe' | 'mild' | 'sensitive' | 'intimate' | 'taboo' | 'forbidden';
export type StatisticSourceLabel = 'estimated' | 'community' | 'research';
export type ContentContractStatus =
  | 'draft'
  | 'migrated_needs_editorial_review'
  | 'reviewed'
  | 'approved';

export type CardPath =
  | 'Social Mirror'
  | 'Shadow Question'
  | 'Control Gate'
  | 'Risk Gate'
  | 'Future Self'
  | 'Memory Trace'
  | 'Moral Dilemma'
  | 'Pattern Break'
  | 'Secret Human'
  | 'Object Choice'
  | 'Hidden Contradiction'
  | 'Threshold Card';

export interface ContentItem {
  id: string;
  version: string;
  content_type: ContentType;
  rarity_tier: RarityTier;
  rarity_score: string;
  category: string;
  darkness_level: string;
  intimacy_level: string;
  psychological_intensity: string;
  prompt_pl: string;
  answer_type: string;
  answer_options_pl: string;
  axis_target: string;
  axis_delta_json: string;
  hidden_signal: string;
  reward_after_answer_pl: string;
  verification_type: string;
  moderation_level: string;
  paywall_weight: string;
  notes: string;
  reward_type: string;
  reward_intensity: string;
  community_reveal_type: string;
  profile_reveal_type: string;
  unlock_type: string;
  next_hook_pl: string;
  // English content fields (v1.4 EN)
  prompt_en?: string;
  answer_options_en?: string;
  next_hook_en?: string;
  reward_en?: string;
  profile_fragment_en?: string;
  archetype_hint_en?: string;
  card_path?: string;
  theme_category?: string;
  access_tier?: 'free' | 'premium';
  community_stat_seed_json: string;
  reward_sequence_json: string;
  sample_reward_screen_pl: string;
  // v2 content contract fields
  canon_version?: string;
  safety_label?: SafetyLabel;
  statistic_source_label?: StatisticSourceLabel;
  allowed_actions?: string;
  reveal_template_id?: string;
  sensitivity_level?: string;
  controversy_level?: string;
  content_contract_status?: ContentContractStatus;
  // Runtime content diagnostics / v2 adapter metadata
  content_source?: 'legacy' | 'v2' | 'special_mode' | 'fallback';
  content_version?: string;
  source_file?: string;
  question_id?: string;
  answer_ids_json?: string;
  answer_axis_deltas_json?: string;
  answer_reveal_shorts_json?: string;
  source_mode?: string;
  source_tier?: string;
}

export interface ProfileState {
  interaction_count: number;
  profile_progress: number;
  rarity_points: number;
  axes: Record<string, number>;
  hidden: Record<string, number>;
  archetype_teasers: string[];
  legendary_count: number;
  paywall_trigger: number;
  total_profile_answers: number;
}

export interface BehavioralMetadata {
  first_reaction_time_ms: number | null;
  hesitation_time_ms: number | null;
  was_answer_changed: boolean;
  was_undone: boolean;
  returned_to_question: boolean;
  was_swapped?: boolean;
  was_skipped_with_selection?: boolean;
  confidence_signal: number;
  avoidance_signal: number;
  impulsivity_signal: number;
  deliberation_signal: number;
  instability_signal: number;
  emotional_friction_signal: number;
  contradiction_signal: number;
}

export interface QuestionContext {
  question_id: string;
  category: string;
  content_type: string;
  rarity_tier: string;
  axis_target: string;
  darkness_level: string;
  intimacy_level: string;
  psychological_intensity: string;
  content_tier: 'free' | 'premium';
}

export interface SkipEvent {
  event_type: 'skip_question';
  question_id: string;
  timestamp: string;
  time_to_skip_ms: number;
  immediate_or_delayed: 'immediate' | 'delayed';
  had_selection_before_skip: boolean;
  question_context: QuestionContext;
  skip_count_in_session: number;
  skip_count_in_category: number;
  skip_count_on_axis: number;
}

export interface SwapEvent {
  event_type: 'swap_question';
  old_question_id: string;
  new_question_id: string;
  timestamp: string;
  time_to_swap_ms: number;
  had_selection_before_swap: boolean;
  old_question_context: QuestionContext;
  new_question_context: QuestionContext;
  swap_count_in_session: number;
}

export interface ExitToMenuEvent {
  event_type: 'exit_to_menu';
  question_id: string;
  timestamp: string;
  session_depth: number;
  answer_count_before_exit: number;
  time_on_question_ms: number;
  phase_at_exit: string;
  had_selection: boolean;
}

export interface ReturnToSessionEvent {
  event_type: 'return_to_session';
  timestamp: string;
  time_away_ms: number;
  same_question_restored: boolean;
  session_depth_at_return: number;
}

export interface Interaction {
  content_id: string;
  selected_answer: string;
  response_time_ms: number;
  answer_changes_count: number;
  skipped: boolean;
  created_at: string;
  rarity_tier: string;
  content_type: string;
  behavioral_metadata?: BehavioralMetadata | null;
}

export interface TestAnswer {
  content_id: string;
  content_type: string;
  rarity_tier: string;
  selected_answer: string;
  response_time_ms: number;
  answer_changes_count: number;
  axis_delta_json: Record<string, number> | null;
  behavioral_metadata?: BehavioralMetadata | null;
}

export type AppScreen =
  | 'supabase-config-error'
  | 'age-gate'
  | 'auth'
  | 'dashboard'
  | 'test-intro'
  | 'profile-test'
  | 'reward'
  | 'test-summary'
  | 'truth-or-dare'
  | 'my-profile'
  | 'premium-placeholder'
  | 'profile-snapshot'
  | 'full-profile'
  | 'hidden-parameters'
  | 'archetypes'
  | 'account'
  | 'settings'
  | 'legal'
  | 'subscription'
  | 'premium-depth'
  | 'galaxy-map';

export type LegalPage = 'terms' | 'privacy' | 'cookie' | 'subscription-terms' | 'disclaimer' | 'help';

export interface ContentBias {
  content_type?: ContentType;
  rarity_tier?: RarityTier;
  label?: string;
}

export interface NextCard {
  id: string;
  linkedContentId: string;
  contentType: ContentType;
  rarityTier: RarityTier;
  cardPath: CardPath;
  themeCategory: string;
  title: string;
  subtitle: string;
}

export interface RewardBlock {
  type: string;
  text: string;
}

export interface RewardSequence {
  blocks: RewardBlock[];
  intensity: number;
  reward_type: string;
}
