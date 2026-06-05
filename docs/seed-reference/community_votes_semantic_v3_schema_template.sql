-- The Other 99 — Semantic Seed Vote Schema Template v3 SOCIETY PROJECTED
-- This seed is scenario-calibrated and archetype/axis-driven.
-- It is NOT real population data and must be labelled as Projected distribution.
-- Import ONLY after mapping semantic content_id to real app content_id.

create table if not exists community_votes (
  id text primary key,
  content_id text not null,
  user_id text,
  anonymous_id text,
  selected_answer text not null,
  source text not null default 'real',
  seed_model_version text,
  seed_scenario_id text,
  synthetic_user_id text,
  response_time_ms integer,
  first_reaction_time_ms integer,
  hesitation_time_ms integer,
  answer_changes_count integer default 0,
  was_answer_changed boolean default false,
  was_skipped boolean default false,
  behavioral_metadata_json jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists uq_community_vote_user_content
on community_votes(content_id, coalesce(user_id, anonymous_id));

create table if not exists user_vote_profiles (
  id text primary key,
  user_id text,
  anonymous_id text,
  total_votes integer default 0,
  answered_content_ids jsonb,
  answer_pattern_summary jsonb,
  behavioral_summary jsonb,
  archetype_vector_summary jsonb,
  last_answered_at timestamptz,
  updated_at timestamptz default now()
);

create or replace view community_vote_percentages as
select
  content_id,
  count(*) as total_votes,
  count(*) filter (where source = 'real') as real_votes,
  count(*) filter (where source like 'seed%') as seed_votes,
  count(*) filter (where selected_answer = 'A') as a_count,
  round(100.0 * count(*) filter (where selected_answer = 'A') / nullif(count(*), 0), 1) as a_pct,
  count(*) filter (where selected_answer = 'B') as b_count,
  round(100.0 * count(*) filter (where selected_answer = 'B') / nullif(count(*), 0), 1) as b_pct,
  count(*) filter (where selected_answer = 'C') as c_count,
  round(100.0 * count(*) filter (where selected_answer = 'C') / nullif(count(*), 0), 1) as c_pct,
  count(*) filter (where selected_answer = 'D') as d_count,
  round(100.0 * count(*) filter (where selected_answer = 'D') / nullif(count(*), 0), 1) as d_pct,
  count(*) filter (where selected_answer = 'SKIP') as skip_count,
  round(100.0 * count(*) filter (where selected_answer = 'SKIP') / nullif(count(*), 0), 1) as skip_pct
from community_votes
group by content_id;

-- UI labels:
-- seed only or real_votes < 30: Projected distribution
-- 30 <= real_votes < 100: Early community distribution
-- real_votes >= 100: Community distribution
