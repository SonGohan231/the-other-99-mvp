import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && key);

const safeStorage = {
  getItem: (key: string) => { try { return localStorage.getItem(key); } catch { return null; } },
  setItem: (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* ignore */ } },
  removeItem: (key: string) => { try { localStorage.removeItem(key); } catch { /* ignore */ } },
};

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url!, key!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: safeStorage,
      },
    })
  : null;

// ─── Domain types ────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  free_profile_tests_used: number;
  premium_status: string;
  total_answers: number;
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

// Web-only Google OAuth — navigates the current tab.
export async function signInWithGoogle(): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase not configured' };
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  return { error: error?.message ?? null };
}

// Android PKCE: returns the authorization URL without opening a browser.
// The caller is responsible for opening the URL and handling the callback.
export async function getGoogleOAuthUrl(
  redirectTo: string,
): Promise<{ url: string | null; error: string | null }> {
  if (!supabase) return { url: null, error: 'Supabase not configured' };
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) return { url: null, error: error.message };
  return { url: data?.url ?? null, error: null };
}

export async function signInWithMagicLink(email: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase not configured' };
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
  return { error: error?.message ?? null };
}

export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<{ error: string | null; needsConfirmation: boolean }> {
  if (!supabase) return { error: 'Supabase not configured', needsConfirmation: false };
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) return { error: error.message, needsConfirmation: false };
  return { error: null, needsConfirmation: !data.session };
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase not configured' };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null };
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut({ scope: 'local' });
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export async function getOrCreateProfile(user: User): Promise<UserProfile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error?.code === 'PGRST116') {
    const { data: created } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email ?? null,
        display_name: (user.user_metadata?.full_name as string | undefined) ?? null,
      })
      .select('*')
      .single();
    return (created as UserProfile) ?? null;
  }
  return (data as UserProfile) ?? null;
}

export async function refreshProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return (data as UserProfile) ?? null;
}

// ─── Test sessions ────────────────────────────────────────────────────────────

export async function createTestSession(
  userId: string,
  testNumber: number,
  contentIds: string[]
): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('test_sessions')
    .insert({
      user_id: userId,
      test_number: testNumber,
      mode: 'profile_test',
      status: 'active',
      content_ids: contentIds,
    })
    .select('id')
    .single();
  if (error) return null;
  return (data as { id: string }).id ?? null;
}

export async function completeTestSession(
  sessionId: string,
  summaryJson: Record<string, unknown>
): Promise<void> {
  if (!supabase) return;
  await supabase
    .from('test_sessions')
    .update({ status: 'completed', completed_at: new Date().toISOString(), summary_json: summaryJson })
    .eq('id', sessionId);
}

// ─── Answers ──────────────────────────────────────────────────────────────────

export async function saveAnswerToDb(
  sessionId: string,
  userId: string,
  answer: {
    content_id: string;
    content_type: string;
    rarity_tier: string;
    selected_answer: string;
    response_time_ms: number;
    answer_changes_count: number;
    skipped: boolean;
    axis_delta_json: Record<string, number> | null;
  }
): Promise<void> {
  if (!supabase) return;
  await supabase.from('answers').insert({ session_id: sessionId, user_id: userId, ...answer });
}

// ─── Profile state ────────────────────────────────────────────────────────────

export async function upsertProfileState(
  userId: string,
  state: {
    answers_count: number;
    profile_progress: number;
    axes: Record<string, number>;
    hidden: Record<string, number>;
    rarity_points: number;
  }
): Promise<void> {
  if (!supabase) return;
  await supabase
    .from('profile_state')
    .upsert({ user_id: userId, ...state, updated_at: new Date().toISOString() });
}

export async function incrementFreeTestsUsed(userId: string, totalAnswers: number): Promise<UserProfile | null> {
  if (!supabase) return null;
  const { data: cur } = await supabase
    .from('profiles')
    .select('free_profile_tests_used')
    .eq('id', userId)
    .single();
  const next = ((cur as { free_profile_tests_used: number } | null)?.free_profile_tests_used ?? 0) + 1;
  const { data } = await supabase
    .from('profiles')
    .update({ free_profile_tests_used: next, total_answers: totalAnswers })
    .eq('id', userId)
    .select('*')
    .single();
  return (data as UserProfile) ?? null;
}
