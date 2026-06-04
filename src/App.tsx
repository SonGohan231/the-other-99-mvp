import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import {
  AppScreen, ContentItem, ProfileState, Interaction, TestAnswer,
} from './types';
import { loadContent } from './utils/csvLoader';
import { selectProfileTestContent, calcProfileProgress } from './utils/contentSelector';
import {
  isAgeConfirmed, confirmAge,
  getSeenIds, addSeenId, addSeenIds,
  addInteraction, getProfileState, saveProfileState,
  resetSession, exportSession,
} from './utils/storage';
import {
  supabase, supabaseConfigured,
  UserProfile,
  getOrCreateProfile, refreshProfile,
  createTestSession, completeTestSession,
  saveAnswerToDb,
  upsertProfileState, incrementFreeTestsUsed,
  signOut,
} from './lib/supabase';
import { useT } from './context/LangContext';

import AgeGate from './screens/AgeGate';
import AuthScreen from './screens/AuthScreen';
import DashboardScreen from './screens/DashboardScreen';
import InteractionScreen from './screens/InteractionScreen';
import RewardScreen from './screens/RewardScreen';
import TestSummaryScreen from './screens/TestSummaryScreen';
import TruthOrDareScreen from './screens/TruthOrDareScreen';
import TestIntroScreen from './screens/TestIntroScreen';
import PremiumPlaceholder from './screens/PremiumPlaceholder';
import DebugPanel from './screens/DebugPanel';

const TEST_TOTAL = 17;

// ─── Config error screen ──────────────────────────────────────────────────────
function SupabaseConfigError() {
  const t = useT();
  return (
    <div className="screen-centered" style={{ background: 'var(--bg)' }}>
      <div className="config-error-inner animate-in">
        <div style={{ padding: '4px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#f87171' }}>
          {t.configError.badge}
        </div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>
          {t.configError.title}
        </h1>
        <p className="body-sm">
          {t.configError.instruction} <code style={{ color: 'var(--accent-light)' }}>.env.local</code>:
        </p>
        <pre className="config-error-code">{`VITE_SUPABASE_URL=https://xxx.supabase.co\nVITE_SUPABASE_PUBLISHABLE_KEY=eyJ...`}</pre>
        <p className="body-sm">
          {t.configError.afterNote} <code style={{ color: 'var(--accent-light)' }}>{t.configError.devCmd}</code>.
        </p>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const t = useT();
  const [screen, setScreen] = useState<AppScreen>('age-gate');
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Active test state
  const [testContent, setTestContent] = useState<ContentItem[]>([]);
  const [testAnswerIndex, setTestAnswerIndex] = useState(0);
  const [testAnswers, setTestAnswers] = useState<TestAnswer[]>([]);
  const [testSessionId, setTestSessionId] = useState<string | null>(null);
  const [testNumber, setTestNumber] = useState(1);

  // Per-question state
  const [currentItem, setCurrentItem] = useState<ContentItem | null>(null);
  const [pendingAnswer, setPendingAnswer] = useState('');
  const [profileState, setProfileState] = useState<ProfileState>(getProfileState());

  // ─── Load CSV ──────────────────────────────────────────────────────────────
  useEffect(() => {
    loadContent()
      .then((items) => { setContent(items); setLoading(false); })
      .catch((err) => { setLoadError(String(err)); setLoading(false); });
  }, []);

  // ─── Auth listener ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!supabaseConfigured || !supabase) {
      setAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ─── Load profile after user changes ──────────────────────────────────────
  useEffect(() => {
    if (!user) { setUserProfile(null); return; }
    getOrCreateProfile(user).then((p) => { if (p) setUserProfile(p); });
  }, [user]);

  // ─── Determine initial screen ──────────────────────────────────────────────
  useEffect(() => {
    if (loading || authLoading) return;
    if (!supabaseConfigured) { setScreen('supabase-config-error'); return; }
    if (!isAgeConfirmed()) { setScreen('age-gate'); return; }
    if (!user) { setScreen('auth'); return; }
    setScreen('dashboard');
  }, [loading, authLoading, user]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  function handleAgeConfirm() {
    confirmAge();
    setScreen(user ? 'dashboard' : 'auth');
  }

  async function handleStartTest() {
    if (!userProfile) return;
    const seenIds = getSeenIds();
    const items = selectProfileTestContent(content, seenIds);
    const tNum = (userProfile.free_profile_tests_used ?? 0) + 1;

    let sessionId: string | null = null;
    if (user) {
      sessionId = await createTestSession(user.id, tNum, items.map((i) => i.id));
    }

    setTestContent(items);
    setTestAnswerIndex(0);
    setTestAnswers([]);
    setTestSessionId(sessionId);
    setTestNumber(tNum);
    setCurrentItem(items[0]);

    const ps = getProfileState();
    setProfileState(ps);
    setScreen('test-intro');
  }

  async function handleAnswer(answer: string, responseTimeMs: number, changeCount: number) {
    if (!currentItem) return;

    let axisDeltas: Record<string, number> | null = null;
    try {
      if (currentItem.axis_delta_json) {
        axisDeltas = JSON.parse(currentItem.axis_delta_json) as Record<string, number>;
      }
    } catch { /* ignore */ }

    const testAnswer: TestAnswer = {
      content_id: currentItem.id,
      content_type: currentItem.content_type,
      rarity_tier: currentItem.rarity_tier,
      selected_answer: answer,
      response_time_ms: responseTimeMs,
      answer_changes_count: changeCount,
      axis_delta_json: axisDeltas,
    };

    if (user && testSessionId) {
      await saveAnswerToDb(testSessionId, user.id, {
        ...testAnswer,
        skipped: false,
      });
    }

    const localInteraction: Interaction = {
      content_id: currentItem.id,
      selected_answer: answer,
      response_time_ms: responseTimeMs,
      answer_changes_count: changeCount,
      skipped: false,
      created_at: new Date().toISOString(),
      rarity_tier: currentItem.rarity_tier,
      content_type: currentItem.content_type,
    };
    addInteraction(localInteraction);
    addSeenId(currentItem.id);

    const ps = getProfileState();
    ps.interaction_count += 1;
    ps.total_profile_answers += 1;
    ps.profile_progress = calcProfileProgress(ps.total_profile_answers);
    ps.rarity_points += parseFloat(currentItem.rarity_score) || 0;

    if (axisDeltas) {
      const isHidden = currentItem.profile_reveal_type?.toLowerCase().includes('hidden') ?? false;
      for (const [axis, delta] of Object.entries(axisDeltas)) {
        if (typeof delta === 'number') {
          if (isHidden) {
            ps.hidden[axis] = (ps.hidden[axis] ?? 0) + delta;
          } else {
            ps.axes[axis] = (ps.axes[axis] ?? 0) + delta;
          }
        }
      }
    }

    saveProfileState(ps);
    setProfileState({ ...ps });

    if (user) {
      upsertProfileState(user.id, {
        answers_count: ps.total_profile_answers,
        profile_progress: ps.profile_progress,
        axes: ps.axes,
        hidden: ps.hidden,
        rarity_points: ps.rarity_points,
      });
    }

    const newAnswers = [...testAnswers, testAnswer];
    setTestAnswers(newAnswers);
    setPendingAnswer(answer);
    setTestAnswerIndex(testAnswerIndex + 1);
    setScreen('reward');
  }

  async function handleRewardNext() {
    const nextIndex = testAnswerIndex;

    if (nextIndex < TEST_TOTAL && nextIndex < testContent.length) {
      setCurrentItem(testContent[nextIndex]);
      setScreen('profile-test');
    } else {
      await finishTest();
    }
  }

  async function finishTest() {
    const ps = getProfileState();
    const summaryJson = {
      test_number: testNumber,
      answers_count: testAnswers.length + 1,
      profile_progress: ps.profile_progress,
      total_profile_answers: ps.total_profile_answers,
    };

    if (testSessionId) {
      await completeTestSession(testSessionId, summaryJson);
    }

    if (user) {
      const updated = await incrementFreeTestsUsed(user.id, ps.total_profile_answers);
      if (updated) setUserProfile(updated);
    }

    addSeenIds(testContent.map((i) => i.id));
    setScreen('test-summary');
  }

  async function handleLogout() {
    await signOut();
    setUser(null);
    setUserProfile(null);
    setScreen('auth');
  }

  function handleExportJson() {
    const json = exportSession();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `to99-session-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleResetSession() {
    if (window.confirm('Reset local session? Supabase data is not affected.')) {
      resetSession();
      window.location.reload();
    }
  }

  function handleDebugReset() {
    window.location.reload();
  }

  async function handleRefreshProfile() {
    if (!user) return;
    const p = await refreshProfile(user.id);
    if (p) setUserProfile(p);
  }

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading || authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-dots">
          <div className="loading-dot" />
          <div className="loading-dot" />
          <div className="loading-dot" />
        </div>
        <p className="loading-text">{t.loading}</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="loading-screen">
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t.loadError}</p>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>{loadError}</p>
      </div>
    );
  }

  // ─── Screens ───────────────────────────────────────────────────────────────
  return (
    <>
      {screen === 'supabase-config-error' && <SupabaseConfigError />}

      {screen === 'age-gate' && <AgeGate onConfirm={handleAgeConfirm} />}

      {screen === 'auth' && <AuthScreen />}

      {screen === 'dashboard' && userProfile && (
        <DashboardScreen
          userProfile={userProfile}
          onStartTest={handleStartTest}
          onTruthOrDare={() => setScreen('truth-or-dare')}
          onMyProfile={() => setScreen('my-profile')}
          onExportJson={handleExportJson}
          onResetSession={handleResetSession}
          onLogout={handleLogout}
        />
      )}

      {screen === 'profile-test' && currentItem && (
        <InteractionScreen
          key={currentItem.id}
          item={currentItem}
          testIndex={testAnswerIndex}
          testTotal={TEST_TOTAL}
          profileProgress={profileState.profile_progress}
          onAnswer={handleAnswer}
        />
      )}

      {screen === 'reward' && currentItem && (
        <RewardScreen
          key={`reward-${currentItem.id}`}
          item={currentItem}
          selectedAnswer={pendingAnswer}
          profileProgress={profileState.profile_progress}
          testIndex={testAnswerIndex}
          testTotal={TEST_TOTAL}
          onNext={handleRewardNext}
        />
      )}

      {screen === 'test-summary' && (
        <TestSummaryScreen
          testNumber={testNumber}
          answers={testAnswers}
          totalProfileAnswers={profileState.total_profile_answers}
          onBack={async () => { await handleRefreshProfile(); setScreen('dashboard'); }}
          onUnlockPremium={() => setScreen('premium-placeholder')}
        />
      )}

      {screen === 'test-intro' && (
        <TestIntroScreen
          testNumber={testNumber}
          onBegin={() => setScreen('profile-test')}
        />
      )}

      {screen === 'truth-or-dare' && (
        <TruthOrDareScreen onBack={() => setScreen('dashboard')} />
      )}

      {screen === 'my-profile' && (
        <div className="screen-centered" style={{ background: 'var(--bg)' }}>
          <div className="premium-inner animate-in">
            <div className="premium-badge">
              {profileState.total_profile_answers >= 51
                ? t.myProfile.badgeReady
                : t.myProfile.badgeProgress(profileState.total_profile_answers)}
            </div>
            <h1 className="premium-title">{t.myProfile.title}</h1>
            {profileState.total_profile_answers < 51 ? (
              <p className="premium-note">
                {t.myProfile.answersLeft(51 - profileState.total_profile_answers)}
              </p>
            ) : (
              <>
                <p className="premium-note" style={{ color: 'var(--teal-light)' }}>
                  {t.myProfile.readyText}
                </p>
                <p className="premium-note">
                  {t.myProfile.premiumLocked}
                </p>
              </>
            )}
            <button
              className="btn btn-ghost"
              onClick={() => setScreen('dashboard')}
              style={{ maxWidth: '280px' }}
              aria-label={t.myProfile.back}
            >
              {t.myProfile.back}
            </button>
          </div>
        </div>
      )}

      {screen === 'premium-placeholder' && (
        <PremiumPlaceholder onBack={() => setScreen(testNumber >= 3 ? 'test-summary' : 'dashboard')} />
      )}

      <DebugPanel onReset={handleDebugReset} />
    </>
  );
}
