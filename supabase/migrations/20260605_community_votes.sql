-- The Other 99 — Community votes migration
-- Based on community_votes_schema_template.sql from MASTER_FIXED seed package.
-- Status: PARTIAL — apply after Supabase project is provisioned.
--
-- Seed data: all 300 rows in percentages_FIXED_batches_01_03.csv have
-- real_content_id = '' (NEEDS_REAL_CONTENT_ID). Seed data cannot be imported
-- until real content IDs are mapped. Use localStorage seed baseline in the
-- meantime (communityVotes.ts hash-based seeding).

-- ─── Community votes table ────────────────────────────────────────────────────

create table if not exists community_votes (
  id                        text primary key default gen_random_uuid()::text,
  content_id                text not null,
  user_id                   text,               -- null for guest votes
  anonymous_id              text,               -- always set (even for logged-in users for dedup)
  selected_answer           text not null,
  source                    text not null default 'real',  -- 'real' | 'seed'
  seed_batch_id             text,               -- populated for seed rows only
  response_time_ms          integer,
  first_reaction_time_ms    integer,
  hesitation_time_ms        integer,
  answer_changes_count      integer default 0,
  was_answer_changed        boolean default false,
  was_skipped               boolean default false,
  behavioral_metadata_json  jsonb,
  created_at                timestamptz default now(),
  updated_at                timestamptz default now()
);

-- Prevent duplicate votes: same user/anon + content_id → one row only
create unique index if not exists uq_community_vote_user_content
  on community_votes (content_id, coalesce(user_id, anonymous_id));

create index if not exists idx_community_votes_content_id
  on community_votes (content_id);

create index if not exists idx_community_votes_user_id
  on community_votes (user_id) where user_id is not null;

-- ─── Distribution view ────────────────────────────────────────────────────────

create or replace view community_vote_percentages as
select
  content_id,
  count(*)                                                      as total_votes,
  count(*) filter (where source = 'real')                       as real_votes,
  count(*) filter (where source = 'seed')                       as seed_votes,
  count(*) filter (where selected_answer = 'A')                 as a_count,
  round(100.0 * count(*) filter (where selected_answer = 'A')
    / nullif(count(*), 0), 1)                                   as a_pct,
  count(*) filter (where selected_answer = 'B')                 as b_count,
  round(100.0 * count(*) filter (where selected_answer = 'B')
    / nullif(count(*), 0), 1)                                   as b_pct,
  count(*) filter (where selected_answer = 'C')                 as c_count,
  round(100.0 * count(*) filter (where selected_answer = 'C')
    / nullif(count(*), 0), 1)                                   as c_pct,
  count(*) filter (where selected_answer = 'D')                 as d_count,
  round(100.0 * count(*) filter (where selected_answer = 'D')
    / nullif(count(*), 0), 1)                                   as d_pct,
  count(*) filter (where selected_answer = 'SKIP')              as skip_count,
  round(100.0 * count(*) filter (where selected_answer = 'SKIP')
    / nullif(count(*), 0), 1)                                   as skip_pct,
  -- Distribution label for UI
  case
    when count(*) filter (where source = 'real') < 30  then 'Projected distribution'
    when count(*) filter (where source = 'real') < 100 then 'Early community distribution'
    else                                                     'Community distribution'
  end                                                           as distribution_label
from community_votes
group by content_id;

-- ─── User vote profile table ──────────────────────────────────────────────────

create table if not exists user_vote_profiles (
  id                    text primary key,   -- user_id or anonymous_id
  profile_type          text not null default 'anonymous',  -- 'anonymous' | 'user'
  total_votes           integer default 0,
  answered_ids          jsonb default '[]',
  answer_distribution   jsonb default '{}',
  skipped_count         integer default 0,
  avg_response_time_ms  integer,
  avg_hesitation_ms     integer,
  answer_changes_total  integer default 0,
  fast_answer_count     integer default 0,
  slow_answer_count     integer default 0,
  high_friction_count   integer default 0,
  contradiction_count   integer default 0,
  avg_confidence        integer,
  avg_avoidance         integer,
  avg_impulsivity       integer,
  avg_deliberation      integer,
  avg_instability       integer,
  dominant_pattern      text,
  most_common_answer    text,
  last_answered_at      timestamptz,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- ─── RLS policies (enable after confirming auth setup) ───────────────────────
-- alter table community_votes enable row level security;
-- alter table user_vote_profiles enable row level security;
--
-- create policy "anyone can insert real votes"
--   on community_votes for insert with check (source = 'real');
--
-- create policy "anyone can read vote counts"
--   on community_votes for select using (true);
--
-- create policy "users can update their own votes"
--   on community_votes for update
--   using (user_id = auth.uid()::text or anonymous_id = current_setting('request.jwt.claims', true)::json->>'anon_id');

-- ─── Notes ────────────────────────────────────────────────────────────────────
-- 1. Seed import: blocked until content_id_mapping_REQUIRED.csv is populated
--    with real_content_id values matching actual content IDs.
-- 2. Guest-to-account migration: when a guest logs in, UPDATE community_votes
--    SET user_id = <new_user_id> WHERE anonymous_id = <old_anon_id>.
-- 3. Duplicate prevention: the unique index on (content_id, coalesce(user_id, anonymous_id))
--    enforces one vote per user/content combination at the DB level.
