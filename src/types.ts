export type ContentType = 'question' | 'secret' | 'dare' | 'game' | 'riddle';
export type RarityTier = 'standard' | 'rare' | 'epic' | 'legendary';

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
  community_stat_seed_json: string;
  reward_sequence_json: string;
  sample_reward_screen_pl: string;
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

export interface Interaction {
  content_id: string;
  selected_answer: string;
  response_time_ms: number;
  answer_changes_count: number;
  skipped: boolean;
  created_at: string;
  rarity_tier: string;
  content_type: string;
}

export interface TestAnswer {
  content_id: string;
  content_type: string;
  rarity_tier: string;
  selected_answer: string;
  response_time_ms: number;
  answer_changes_count: number;
  axis_delta_json: Record<string, number> | null;
}

export type AppScreen =
  | 'supabase-config-error'
  | 'age-gate'
  | 'auth'
  | 'dashboard'
  | 'profile-test'
  | 'reward'
  | 'test-summary'
  | 'truth-or-dare'
  | 'my-profile'
  | 'premium-placeholder';

export interface RewardBlock {
  type: string;
  text: string;
}

export interface RewardSequence {
  blocks: RewardBlock[];
  intensity: number;
  reward_type: string;
}
