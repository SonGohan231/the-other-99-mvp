-- The Other 99 — Supabase schema v0.2

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  created_at timestamptz DEFAULT now(),
  free_profile_tests_used int DEFAULT 0,
  premium_status text DEFAULT 'free',
  total_answers int DEFAULT 0
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON profiles FOR ALL USING (auth.uid() = id);

CREATE TABLE IF NOT EXISTS test_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  test_number int,
  mode text,
  status text DEFAULT 'active',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  content_ids jsonb DEFAULT '[]'::jsonb,
  summary_json jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE test_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sessions" ON test_sessions FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES test_sessions(id) ON DELETE CASCADE,
  content_id text,
  content_type text,
  rarity_tier text,
  selected_answer text,
  response_time_ms int,
  answer_changes_count int DEFAULT 0,
  skipped boolean DEFAULT false,
  axis_delta_json jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own answers" ON answers FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS profile_state (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  answers_count int DEFAULT 0,
  profile_progress numeric DEFAULT 0,
  axes jsonb DEFAULT '{}'::jsonb,
  hidden jsonb DEFAULT '{}'::jsonb,
  rarity_points numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profile_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile state" ON profile_state FOR ALL USING (auth.uid() = user_id);
