import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import {
  AppScreen, ContentItem, ProfileState, Interaction, TestAnswer, NextCard,
} from './types';
import { loadContent } from './utils/csvLoader';
import { selectProfileTestContent, calcProfileProgress } from './utils/contentSelector';
import {
  isAgeConfirmed, confirmAge,
  getSeenIds, addSeenId, addSeenIds,
  addInteraction, getProfileState, saveProfileState,
  resetSession, exportSession,
  removeSeenId, removeLastInteraction,
} from './utils/storage';
import {
  ProfileVector, loadVector, saveVector, applyDeltas, calcHumanTwinMatch, getTopDimensions,
} from './utils/profileVector';
import { FeedEvent, getFeedEvents, addFeedEvent } from './utils/eventFeed';
import { ProfileFragment, getFragments, checkAndUnlockFragment } from './utils/profileFragments';
import { TwinFeedEvent, getTwinFeedEvents, checkAndAddTwinEvent } from './utils/twinFeed';
import { TimelineEvent, getTimeline, addTimelineEvent } from './utils/profileTimeline';
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
import { deriveCardPath, deriveThemeCategory, CARD_PATH_DEFINITIONS } from './utils/contentTaxonomy';
import { canContinueTest, isPremiumUnlocked, unlockPremium } from './utils/premiumProgression';
import ProfileSnapshotScreen from './screens/ProfileSnapshotScreen';
import FullProfileScreen from './screens/FullProfileScreen';
import HiddenParametersScreen from './screens/HiddenParametersScreen';
import { pushUndoEntry, popUndoEntry, canUndo as canUndoFn, clearUndoStack, UndoEntry } from './utils/answerUndo';

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

// ─── Local test mode auth bypass ─────────────────────────────────────────────
const TEST_USER_ID = 'local-test-user';

const isTestModeRequested = () =>
  new URLSearchParams(window.location.search).get('test') === '1' ||
  new URLSearchParams(window.location.search).get('debug') === '1' ||
  localStorage.getItem('to99_test_session') === 'true';

const enableTestMode = () => {
  localStorage.setItem('to99_test_session', 'true');
  localStorage.setItem('to99_debug_mode', 'true');
  localStorage.setItem('to99_premium_unlocked', 'true');
};

const disableTestMode = () => {
  localStorage.removeItem('to99_test_session');
  localStorage.removeItem('to99_debug_mode');
  localStorage.removeItem('to99_premium_unlocked');
};

const TEST_USER = {
  id: TEST_USER_ID,
  email: 'test@theother99.local',
  user_metadata: { full_name: 'Local Test User' },
} as unknown as User;

const TEST_PROFILE = {
  id: TEST_USER_ID,
  email: 'test@theother99.local',
  display_name: 'Local Test User',
  free_profile_tests_used: 0,
  total_answers: 0,
  premium_status: 'premium',
} as UserProfile;

const isLocalTestUser = (u: User | null) => u?.id === TEST_USER_ID;


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

// ─── Helper: build NextCard from ContentItem ──────────────────────────────────
function buildNextCard(item: ContentItem): NextCard {
  const cp = deriveCardPath(item);
  const def = CARD_PATH_DEFINITIONS.find((d) => d.path === cp) ?? CARD_PATH_DEFINITIONS[0];
  return {
    id: `nc_${item.id}_${Date.now()}`,
    linkedContentId: item.id,
    contentType: item.content_type,
    rarityTier: item.rarity_tier,
    cardPath: cp,
    themeCategory: deriveThemeCategory(item),
    title: def.displayLabel,
    subtitle: def.displaySubtitle,
  };
}

// ─── Helper: pick 3 candidate items with rarity variety ──────────────────────
function pickNextCards(pool: ContentItem[], fromIndex: number): NextCard[] {
  const available = pool.slice(fromIndex);
  if (available.length === 0) return [];

  const standard = available.filter((i) => i.rarity_tier === 'standard');
  const rare = available.filter((i) => i.rarity_tier === 'rare');
  const epicLegendary = available.filter((i) => i.rarity_tier === 'epic' || i.rarity_tier === 'legendary');

  const picks: ContentItem[] = [];

  // Try to get a standard, rare, and epic/legendary spread
  if (standard.length > 0) picks.push(standard[0]);
  if (rare.length > 0) picks.push(rare[0]);
  if (epicLegendary.length > 0) picks.push(epicLegendary[0]);

  // Fill remaining slots from available items if not enough variety
  for (const item of available) {
    if (picks.length >= 3) break;
    if (!picks.includes(item)) picks.push(item);
  }

  return picks.slice(0, 3).map(buildNextCard);
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
  const [nextCards, setNextCards] = useState<NextCard[]>([]);
  const [changedAxes, setChangedAxes] = useState<string[]>([]);

  // Living profile
  const [profileVector, setProfileVector] = useState<ProfileVector>(loadVector);
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>(getFeedEvents);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [profileFragments, setProfileFragments] = useState<ProfileFragment[]>(getFragments);
  const [twinFeedEvents, setTwinFeedEvents] = useState<TwinFeedEvent[]>(getTwinFeedEvents);
  const [timeline, setTimeline] = useState<TimelineEvent[]>(getTimeline);
  const [newFragment, setNewFragment] = useState<ProfileFragment | null>(null);

  // Undo state
  const [canUndoAnswer, setCanUndoAnswer] = useState(false);

  // Test mode (isTestMode used to track test mode state)
  const [, setIsTestMode] = useState(false);

  // Computed premium status
  const isPremium = isPremiumUnlocked(userProfile?.premium_status ?? null);

  // ─── Load CSV ──────────────────────────────────────────────────────────────
  useEffect(() => {
    loadContent()
      .then((items) => { setContent(items); setLoading(false); })
      .catch((err) => { setLoadError(String(err)); setLoading(false); });
  }, []);

  // ─── Auth listener ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isTestModeRequested()) {
      enableTestMode();
      setUser(TEST_USER);
      setUserProfile(TEST_PROFILE);
      setIsTestMode(true);
      setAuthLoading(false);
      return;
    }

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

    if (isLocalTestUser(user)) {
      setUserProfile(TEST_PROFILE);
      setIsTestMode(true);
      return;
    }

    getOrCreateProfile(user).then((p) => { if (p) setUserProfile(p); });
  }, [user]);

  // ─── Determine initial screen ──────────────────────────────────────────────
  useEffect(() => {
    if (loading || authLoading) return;
    if (!supabaseConfigured && !isTestModeRequested()) { setScreen('supabase-config-error'); return; }
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

    const freeTestsUsed = userProfile.free_profile_tests_used ?? 0;
    if (!canContinueTest(freeTestsUsed, isPremium)) {
      setScreen('premium-placeholder');
      return;
    }

    const seenIds = getSeenIds();
    const items = selectProfileTestContent(content, seenIds, isPremium);
    const tNum = freeTestsUsed + 1;

    let sessionId: string | null = null;
    if (user && !isLocalTestUser(user)) {
      sessionId = await createTestSession(user.id, tNum, items.map((i) => i.id));
    }

    clearUndoStack();
    setTestContent(items);
    setTestAnswerIndex(0);
    setTestAnswers([]);
    setTestSessionId(sessionId);
    setTestNumber(tNum);
    setCurrentItem(items[0]);
    setCanUndoAnswer(false);

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

    if (user && !isLocalTestUser(user) && testSessionId) {
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

    // Snapshot BEFORE applying deltas (for undo)
    const vectorSnapshot = { ...profileVector };

    let updatedVec = profileVector;
    const newChangedAxes: string[] = [];

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

      const { next: newVec, changed } = applyDeltas(profileVector, axisDeltas);
      updatedVec = newVec;
      saveVector(newVec);
      setProfileVector(newVec);
      newChangedAxes.push(...changed);

      if (changed.length > 0) {
        addFeedEvent({ type: 'dimension_up', label: changed[0] });
      }
    }

    setChangedAxes(newChangedAxes);

    if (currentItem.rarity_tier !== 'standard') {
      addFeedEvent({ type: 'rare_signal', label: currentItem.rarity_tier });
    }

    const oldTwinScore = calcHumanTwinMatch(profileVector, ps.total_profile_answers - 1);
    const newTwinScore = calcHumanTwinMatch(updatedVec, ps.total_profile_answers);
    const twinChanged = checkAndAddTwinEvent(oldTwinScore, newTwinScore, currentItem.rarity_tier);

    if (currentItem.rarity_tier !== 'standard') {
      addTimelineEvent({
        answerNumber: ps.total_profile_answers,
        type: 'rare_signal',
        label: 'rare_signal',
      });
    }
    if (twinChanged) {
      addTimelineEvent({
        answerNumber: ps.total_profile_answers,
        type: 'twin_stage_changed',
        label: 'twin_stage_changed',
      });
    }

    const topDim = getTopDimensions(updatedVec, 1)[0] ?? 'curiosity';
    const unlocked = checkAndUnlockFragment(ps.total_profile_answers, topDim);
    if (unlocked) {
      setNewFragment(unlocked);
      addTimelineEvent({
        answerNumber: ps.total_profile_answers,
        type: 'fragment_unlocked',
        label: `fragment_unlocked:${unlocked.title}`,
      });
    }
    setTwinFeedEvents(getTwinFeedEvents());
    setTimeline(getTimeline());
    setProfileFragments(getFragments());
    setFeedEvents(getFeedEvents());

    saveProfileState(ps);
    setProfileState({ ...ps });

    if (user && !isLocalTestUser(user)) {
      upsertProfileState(user.id, {
        answers_count: ps.total_profile_answers,
        profile_progress: ps.profile_progress,
        axes: ps.axes,
        hidden: ps.hidden,
        rarity_points: ps.rarity_points,
      });
    }

    // Push undo entry AFTER applying deltas, with BEFORE snapshot
    const undoEntry: UndoEntry = {
      contentId: currentItem.id,
      selectedAnswer: answer,
      axisDeltas,
      profileVectorSnapshot: vectorSnapshot,
      answerNumber: ps.total_profile_answers,
      changeCount,
      createdAt: new Date().toISOString(),
    };
    pushUndoEntry(undoEntry);
    setCanUndoAnswer(canUndoFn());

    const newAnswers = [...testAnswers, testAnswer];
    setTestAnswers(newAnswers);
    setPendingAnswer(answer);
    setTestAnswerIndex(testAnswerIndex + 1);

    // Pre-select next cards
    const cards = pickNextCards(testContent, testAnswerIndex + 1);
    setNextCards(cards);

    setScreen('reward');
  }

  async function handleRewardNext(card: NextCard | null) {
    setNewFragment(null);
    const nextIndex = testAnswerIndex;

    if (card !== null) {
      setSelectedCard(card.title);
      addFeedEvent({ type: 'card_pick', label: card.title });
      setFeedEvents(getFeedEvents());
    } else {
      setSelectedCard(null);
    }

    if (nextIndex < TEST_TOTAL && nextIndex < testContent.length) {
      let items = testContent;

      if (card !== null) {
        // Find the linked content item and try to swap it to next position
        const matchIdx = items.findIndex((item, idx) => {
          return idx > nextIndex && item.id === card.linkedContentId;
        });

        if (matchIdx > nextIndex) {
          const newItems = [...items];
          [newItems[nextIndex], newItems[matchIdx]] = [newItems[matchIdx], newItems[nextIndex]];
          setTestContent(newItems);
          items = newItems;
        }
      }

      setCurrentItem(items[nextIndex]);
      setScreen('profile-test');
    } else {
      await finishTest();
    }
  }

  function handleUndoAnswer() {
    const entry = popUndoEntry();
    if (!entry) return;

    // Restore profile vector
    saveVector(entry.profileVectorSnapshot);
    setProfileVector({ ...entry.profileVectorSnapshot });

    // Restore profile state
    const ps = getProfileState();
    ps.total_profile_answers = Math.max(0, ps.total_profile_answers - 1);
    ps.interaction_count = Math.max(0, ps.interaction_count - 1);
    ps.profile_progress = calcProfileProgress(ps.total_profile_answers);
    saveProfileState(ps);
    setProfileState({ ...ps });

    // Remove seen id and last interaction
    removeSeenId(entry.contentId);
    removeLastInteraction();

    // Reload living profile data
    setTwinFeedEvents(getTwinFeedEvents());
    setTimeline(getTimeline());
    setProfileFragments(getFragments());
    setFeedEvents(getFeedEvents());

    // Go back to previous question
    const prevIndex = Math.max(0, testAnswerIndex - 1);
    setTestAnswerIndex(prevIndex);
    setCurrentItem(testContent[prevIndex]);
    setCanUndoAnswer(canUndoFn());
    setScreen('profile-test');
  }

  async function finishTest() {
    const ps = getProfileState();

    if (testNumber === 1) {
      addFeedEvent({ type: 'first_signal', label: '' });
      setFeedEvents(getFeedEvents());
      addTimelineEvent({
        answerNumber: ps.total_profile_answers,
        type: 'first_signal',
        label: 'first_signal',
      });
      setTimeline(getTimeline());
    }

    const summaryJson = {
      test_number: testNumber,
      answers_count: testAnswers.length + 1,
      profile_progress: ps.profile_progress,
      total_profile_answers: ps.total_profile_answers,
    };

    if (testSessionId && user && !isLocalTestUser(user)) {
      await completeTestSession(testSessionId, summaryJson);
    }

    if (user && !isLocalTestUser(user)) {
      const updated = await incrementFreeTestsUsed(user.id, ps.total_profile_answers);
      if (updated) setUserProfile(updated);
    } else if (isLocalTestUser(user)) {
      setUserProfile({
        ...TEST_PROFILE,
        free_profile_tests_used: testNumber,
        total_answers: ps.total_profile_answers,
      });
    }

    addSeenIds(testContent.map((i) => i.id));
    setScreen('test-summary');
  }

  async function handleLogout() {
    if (isLocalTestUser(user)) {
      disableTestMode();
      setIsTestMode(false);
      setUser(null);
      setUserProfile(null);
      setScreen('auth');
      return;
    }

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

    if (isLocalTestUser(user)) {
      const ps = getProfileState();
      setUserProfile({
        ...TEST_PROFILE,
        total_answers: ps.total_profile_answers,
      });
      return;
    }

    const p = await refreshProfile(user.id);
    if (p) setUserProfile(p);
  }

  function handleTestMode() {
    enableTestMode();
    setUser(TEST_USER);
    setUserProfile(TEST_PROFILE);
    setIsTestMode(true);
    confirmAge();
    setScreen('dashboard');
  }

  function handleUnlockFull() {
    unlockPremium();
    setScreen('full-profile');
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

      {screen === 'auth' && <AuthScreen onTestMode={handleTestMode} />}

      {screen === 'dashboard' && userProfile && (
        <DashboardScreen
          userProfile={userProfile}
          profileVector={profileVector}
          humanTwinMatch={calcHumanTwinMatch(profileVector, profileState.total_profile_answers)}
          totalProfileAnswers={profileState.total_profile_answers}
          feedEvents={feedEvents}
          profileFragments={profileFragments}
          twinFeedEvents={twinFeedEvents}
          timeline={timeline}
          isPremium={isPremium}
          onStartTest={handleStartTest}
          onTruthOrDare={() => setScreen('truth-or-dare')}
          onMyProfile={() => setScreen('my-profile')}
          onExportJson={handleExportJson}
          onResetSession={handleResetSession}
          onLogout={handleLogout}
          onProfileSnapshot={() => setScreen('profile-snapshot')}
          onFullProfile={() => setScreen('full-profile')}
          onHiddenParams={() => setScreen('hidden-parameters')}
        />
      )}

      {screen === 'profile-test' && currentItem && (
        <InteractionScreen
          key={currentItem.id}
          item={currentItem}
          testIndex={testAnswerIndex}
          testTotal={TEST_TOTAL}
          profileProgress={profileState.profile_progress}
          selectedCard={selectedCard}
          onAnswer={handleAnswer}
          onUndo={handleUndoAnswer}
          canUndo={canUndoAnswer}
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
          totalProfileAnswers={profileState.total_profile_answers}
          newFragment={newFragment}
          nextCards={nextCards}
          profileVector={profileVector}
          changedAxes={changedAxes}
          onNext={handleRewardNext}
          onChangeAnswer={handleUndoAnswer}
          canChangeAnswer={canUndoAnswer}
        />
      )}

      {screen === 'test-summary' && (
        <TestSummaryScreen
          testNumber={testNumber}
          answers={testAnswers}
          totalProfileAnswers={profileState.total_profile_answers}
          profileVector={profileVector}
          onBack={async () => {
            await handleRefreshProfile();
            const ps = getProfileState();
            const snapshotSeen = localStorage.getItem('to99_snapshot_seen') === 'true';
            if (ps.total_profile_answers >= 51 && !snapshotSeen && !isPremium) {
              localStorage.setItem('to99_snapshot_seen', 'true');
              setScreen('profile-snapshot');
            } else {
              setScreen('dashboard');
            }
          }}
          onUnlockPremium={() => {
            const snapshotSeen = localStorage.getItem('to99_snapshot_seen') === 'true';
            if (!snapshotSeen) { localStorage.setItem('to99_snapshot_seen', 'true'); }
            setScreen('profile-snapshot');
          }}
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

      {screen === 'profile-snapshot' && (
        <ProfileSnapshotScreen
          profileVector={profileVector}
          totalAnswers={profileState.total_profile_answers}
          profileFragments={profileFragments}
          onUnlockFull={handleUnlockFull}
          onDashboard={() => setScreen('dashboard')}
        />
      )}

      {screen === 'full-profile' && (
        <FullProfileScreen
          profileVector={profileVector}
          totalAnswers={profileState.total_profile_answers}
          onBack={() => setScreen('dashboard')}
        />
      )}

      {screen === 'hidden-parameters' && (
        <HiddenParametersScreen
          profileVector={profileVector}
          onBack={() => setScreen('dashboard')}
        />
      )}

      <DebugPanel onReset={handleDebugReset} />
    </>
  );
}
