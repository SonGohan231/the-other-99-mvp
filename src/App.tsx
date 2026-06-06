import { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import {
  AppScreen, ContentItem, ProfileState, Interaction, TestAnswer, NextCard, BehavioralMetadata,
  SkipEvent, SwapEvent, ExitToMenuEvent, ReturnToSessionEvent,
} from './types';
import { loadContent } from './utils/csvLoader';
import { selectProfileTestContent, calcProfileProgress, selectContentByCategory } from './utils/contentSelector';
import { recommendCategories } from './utils/categoryRecommender';
import CategoryPickerScreen from './screens/CategoryPickerScreen';
import {
  isAgeConfirmed, confirmAge,
  getSeenIds, addSeenId, addSeenIds,
  addInteraction, getInteractions, getProfileState, saveProfileState,
  resetSession, exportFullSession,
  removeSeenId, removeLastInteraction, markLastInteractionUndone,
} from './utils/storage';
import { computeBehavioralMetadata, summarizeBehavioralProfile, BehavioralSummary } from './utils/behavioralSignals';
import { getContentBehavioralProfile } from './utils/contentTags';
import { updateUserVoteProfile } from './utils/userVoteProfile';
import {
  ProfileVector, loadVector, saveVector, applyDeltas, calcHumanTwinMatch, getTopDimensions,
} from './utils/profileVector';
import {
  CanonicalVector, loadCanonicalVector, saveCanonicalVector, applyCanonicalDeltas,
  clearCanonicalVector,
} from './utils/canonicalVector';
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
import { useT, useLang } from './context/LangContext';
import { deriveCardPath, deriveThemeCategory, CARD_PATH_DEFINITIONS } from './utils/contentTaxonomy';
import { canContinueTest, isPremiumUnlocked, unlockPremium } from './utils/premiumProgression';
import ProfileSnapshotScreen from './screens/ProfileSnapshotScreen';
import FullProfileScreen from './screens/FullProfileScreen';
import HiddenParametersScreen from './screens/HiddenParametersScreen';
import { pushUndoEntry, popUndoEntry, canUndo as canUndoFn, clearUndoStack, UndoEntry } from './utils/answerUndo';
import { isTestSessionActive, isTestModeRequested, enableTestSession, disableTestSession, TEST_PROFILE } from './utils/testSession';
import { isGuestModeActive, enableGuestMode, disableGuestMode, getGuestTestsUsed, incrementGuestTestsUsed, GUEST_USER_ID } from './utils/guestSession';
import { clearInProgressTest, saveQuizSnapshot, restoreQuizSnapshot, getInProgressEventQueues } from './utils/inProgressTest';
import { getQuestionBg, preloadBg } from './utils/questionBackgrounds';
import { debugLog, debugError } from './utils/debugStore';
import { getAppInfo } from './utils/appVersion';
import { isAdminEmail } from './config/admin';
import { LegalPage } from './types';
import AccountScreen from './screens/AccountScreen';
import SettingsScreen, { applyTheme, getTheme, applyReducedMotion, getReducedMotion } from './screens/SettingsScreen';
import LegalScreen from './screens/LegalScreen';
import SubscriptionScreen from './screens/SubscriptionScreen';
import PremiumDepthScreen from './screens/PremiumDepthScreen';
import PremiumUnlockedModal, { hasPremiumUnlockedBeenSeen, resetPremiumUnlockedSeen } from './components/PremiumUnlockedModal';
import { USE_V2_CONTENT } from './config/features';

import AgeGate from './screens/AgeGate';
import AuthScreen from './screens/AuthScreen';
import DashboardScreen from './screens/DashboardScreen';
import InteractionScreen from './screens/InteractionScreen';
import RewardScreen from './screens/RewardScreen';
import TestSummaryScreen from './screens/TestSummaryScreen';
import TruthOrDareScreen from './screens/TruthOrDareScreen';
import TestIntroScreen from './screens/TestIntroScreen';
import PremiumPlaceholder from './screens/PremiumPlaceholder';
import ArchetypeMixScreen from './screens/ArchetypeMixScreen';
import GalaxyMapScreen from './screens/GalaxyMapScreen';
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

// ─── Helper: build NextCard from ContentItem ────────────────────────────────────────────
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


// ─── Stage 2 helpers: per-answer deltas + content diagnostics ─────────────────

function parseJsonRecord(raw: string | undefined | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

function parseStringArray(raw: string | undefined | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function numericDeltas(raw: unknown): Record<string, number> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const n = typeof value === 'number' ? value : Number(value);
    if (Number.isFinite(n) && n !== 0) out[key] = n;
  }
  return Object.keys(out).length > 0 ? out : null;
}

function getSelectedAnswerDeltas(item: ContentItem, answer: string): Record<string, number> | null {
  const answerMap = parseJsonRecord((item as unknown as Record<string, string>).answer_axis_deltas_json);
  const direct = numericDeltas(answerMap[answer]);
  if (direct) return direct;
  const normalizedAnswer = answer.trim().toLowerCase();
  for (const [label, rawDeltas] of Object.entries(answerMap)) {
    if (label.trim().toLowerCase() === normalizedAnswer) {
      const deltas = numericDeltas(rawDeltas);
      if (deltas) return deltas;
    }
  }
  // Legacy fallback: question-level deltas
  return numericDeltas(parseJsonRecord(item.axis_delta_json));
}

function getContentDiagnostics(
  content: ContentItem[],
  currentItem: ContentItem | null,
  lang: string | null,
) {
  const v2Count = content.filter((item) => item.content_source === 'v2').length;
  const legacyCount = content.filter((item) => item.content_source !== 'v2').length;
  const answerIds = parseStringArray((currentItem as unknown as Record<string, string>)?.answer_ids_json);
  const activeSource = v2Count > 0 && legacyCount === 0
    ? 'v2'
    : v2Count > 0 && legacyCount > 0
      ? 'mixed'
      : legacyCount > 0
        ? 'legacy'
        : 'unknown';
  const warnings: string[] = [];
  if (USE_V2_CONTENT && v2Count === 0) warnings.push('USE_V2_CONTENT=true but no v2 items were loaded.');
  if (USE_V2_CONTENT && legacyCount > 0) warnings.push('Legacy items are present while v2 content is enabled.');
  if (currentItem && !currentItem.content_source) warnings.push('Current item has no content_source metadata.');

  const v2AnswerCount = v2Count > 0 ? 5300 : 0;

  return {
    use_v2_content: USE_V2_CONTENT,
    active_content_source: activeSource as 'legacy' | 'v2' | 'mixed' | 'fallback' | 'unknown',
    questions_loaded: content.length,
    answers_loaded: v2AnswerCount,
    loaded_content_count: content.length,
    loaded_v2_question_count: v2Count,
    loaded_v2_answer_count: v2AnswerCount,
    loaded_legacy_count: legacyCount,
    current_content_source: currentItem?.content_source ?? null,
    current_content_version: currentItem?.content_version ?? currentItem?.version ?? null,
    current_source_file: currentItem?.source_file ?? null,
    current_question_id: currentItem?.question_id ?? currentItem?.id ?? null,
    current_answer_ids: answerIds,
    current_lang: lang,
    warnings,
  };
}

// ─── App ──────────────────────────────────────────────────────────────────────────────
export default function App() {
  const t = useT();
  const [lang, setLang] = useLang();
  const [screen, setScreen] = useState<AppScreen>('age-gate');
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Tracks whether an in-progress test was restored on load (prevents initial-screen effect from overriding it)
  const restoredInProgressRef = useRef(false);
  // Tracks whether the current question was restored from an interrupted session
  const [wasRestoredFromInterrupt, setWasRestoredFromInterrupt] = useState(false);

  // Active test state
  const [testContent, setTestContent] = useState<ContentItem[]>([]);
  const [testAnswerIndex, setTestAnswerIndex] = useState(0);
  const [testAnswers, setTestAnswers] = useState<TestAnswer[]>([]);
  const [testSessionId, setTestSessionId] = useState<string | null>(null);
  const [testNumber, setTestNumber] = useState(1);
  const [testStartedAt, setTestStartedAt] = useState<string | null>(null);

  // Per-question state
  const [currentItem, setCurrentItem] = useState<ContentItem | null>(null);
  const [pendingAnswer, setPendingAnswer] = useState('');
  const [pendingSelection, setPendingSelection] = useState<string | null>(null); // pre-confirm selection
  const [profileState, setProfileState] = useState<ProfileState>(getProfileState());
  const [nextCards, setNextCards] = useState<NextCard[]>([]);
  const [changedAxes, setChangedAxes] = useState<string[]>([]);

  // Living profile
  const [profileVector, setProfileVector] = useState<ProfileVector>(loadVector);
  const [canonicalVector, setCanonicalVector] = useState<CanonicalVector>(loadCanonicalVector);
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>(getFeedEvents);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [profileFragments, setProfileFragments] = useState<ProfileFragment[]>(getFragments);
  const [twinFeedEvents, setTwinFeedEvents] = useState<TwinFeedEvent[]>(getTwinFeedEvents);
  const [timeline, setTimeline] = useState<TimelineEvent[]>(getTimeline);
  const [newFragment, setNewFragment] = useState<ProfileFragment | null>(null);

  // Category-first discovery
  const [recommendedCategories, setRecommendedCategories] = useState<string[]>([]);

  // Undo state
  const [canUndoAnswer, setCanUndoAnswer] = useState(false);

  // Behavioral event queues (flushed to session persistence)
  const [skipEvents, setSkipEvents] = useState<SkipEvent[]>([]);
  const [swapEvents, setSwapEvents] = useState<SwapEvent[]>([]);
  const [exitEvents, setExitEvents] = useState<ExitToMenuEvent[]>([]);
  const [returnEvents, setReturnEvents] = useState<ReturnToSessionEvent[]>([]);

  // Test mode (developer bypass)
  const [isTestMode] = useState<boolean>(() => {
    if (isTestModeRequested()) {
      enableTestSession();
      return true;
    }
    return isTestSessionActive();
  });

  // Guest mode (real user, no account, localStorage only)
  const [isGuestMode] = useState<boolean>(() => isGuestModeActive());

  // Computed premium status
  const isPremium = isPremiumUnlocked(userProfile?.premium_status ?? null);

  // New screens state
  const [currentLegalPage, setCurrentLegalPage] = useState<LegalPage>('terms');
  const [showPremiumUnlockedModal, setShowPremiumUnlockedModal] = useState(false);

  // Behavioral summary (computed from stored interactions)
  const [behavioralSummary, setBehavioralSummary] = useState<BehavioralSummary | null>(() => {
    const { skipEvents: se, swapEvents: sw, exitEvents: ex } = getInProgressEventQueues();
    return summarizeBehavioralProfile(getInteractions(), se, sw, ex);
  });
  // Last answer's behavioral metadata (for debug display)
  const [lastBehavioralMetadata, setLastBehavioralMetadata] = useState<BehavioralMetadata | null>(null);

  // Apply persisted theme + reduced motion on mount
  useState(() => {
    applyTheme(getTheme());
    applyReducedMotion(getReducedMotion());
  });

  // Show premium unlocked modal when premium state first detected
  useEffect(() => {
    if (isPremium && !hasPremiumUnlockedBeenSeen()) {
      setShowPremiumUnlockedModal(true);
    }
  }, [isPremium]);

  // Preload the next 2 question backgrounds when quiz is active
  useEffect(() => {
    if (screen !== 'profile-test' || testContent.length === 0) return;
    for (let i = testAnswerIndex; i < Math.min(testAnswerIndex + 3, testContent.length); i++) {
      preloadBg(getQuestionBg(testContent[i]));
    }
  }, [screen, testAnswerIndex, testContent]);

  // ─── Persist in-progress test ─────────────────────────────────────────────
  function persistInProgress(overrides?: { nextCards?: NextCard[]; testAnswerIndex?: number; testContent?: ContentItem[]; currentItem?: ContentItem | null; pendingSelection?: string | null }) {
    const tc = overrides?.testContent ?? testContent;
    if (!tc.length) return;
    const tai = overrides?.testAnswerIndex ?? testAnswerIndex;
    const ci = overrides?.currentItem !== undefined ? overrides.currentItem : currentItem;
    const nc = overrides?.nextCards ?? nextCards;
    const ps = overrides?.pendingSelection !== undefined ? overrides.pendingSelection : pendingSelection;
    const premiumSrc =
      isTestMode ? 'test' : isGuestMode ? 'guest' : user ? 'supabase' : null;
    saveQuizSnapshot({
      testNumber,
      testSessionId,
      testAnswerIndex: tai,
      testContentIds: tc.map((i) => i.id),
      currentItemId: ci?.id ?? null,
      pendingAnswer,
      pendingSelection: ps,
      selectedCard,
      canUndoAnswer,
      nextCardIds: nc.map((c) => c.linkedContentId ?? '').filter(Boolean),
      skipEvents,
      swapEvents,
      exitEvents,
      returnEvents,
      userId: user?.id ?? null,
      lang,
      startedAt: testStartedAt ?? new Date().toISOString(),
      premiumState: { unlocked: isPremium, source: premiumSrc },
      canonicalVector,
    });
  }

  // ─── Load CSV ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadContent()
      .then((items) => {
        setContent(items);
        setLoading(false);

        if (isAgeConfirmed()) {
          try {
            const saved = restoreQuizSnapshot();
            if (saved && saved.testContentIds.length > 0) {
              const restoredContent = saved.testContentIds
                .map((id: string) => items.find((i) => i.id === id))
                .filter(Boolean) as ContentItem[];
              if (restoredContent.length > 0) {
                setTestContent(restoredContent);
                setTestAnswerIndex(saved.testAnswerIndex);
                setTestNumber(saved.testNumber);
                setTestSessionId(saved.testSessionId);
                setPendingAnswer(saved.pendingAnswer);
                setSelectedCard(saved.selectedCard);
                setCanUndoAnswer(saved.canUndoAnswer);

                // Restore next cards if persisted (reward screen restore)
                if (saved.nextCardIds?.length) {
                  const restoredCards = saved.nextCardIds
                    .map((id: string) => items.find((i) => i.id === id))
                    .filter(Boolean)
                    .map((i) => buildNextCard(i as ContentItem));
                  if (restoredCards.length > 0) setNextCards(restoredCards);
                }

                const itemToRestore = saved.currentItemId
                  ? restoredContent.find((i) => i.id === saved.currentItemId) ?? null
                  : null;
                if (itemToRestore) {
                  restoredInProgressRef.current = true;
                  setCurrentItem(itemToRestore);
                  // Restore v4 session context
                  if (saved.startedAt) setTestStartedAt(saved.startedAt);
                  // Restore language if it was recorded and differs from current
                  if (saved.lang && saved.lang !== lang) setLang(saved.lang as 'en' | 'pl');
                  // Restore pre-confirmation selection
                  if (saved.pendingSelection) setPendingSelection(saved.pendingSelection);
                  // Restore persisted event queues
                  if (saved.skipEvents?.length) setSkipEvents(saved.skipEvents);
                  if (saved.swapEvents?.length) setSwapEvents(saved.swapEvents);
                  if (saved.exitEvents?.length) setExitEvents(saved.exitEvents);
                  if (saved.returnEvents?.length) setReturnEvents(saved.returnEvents);
                  // Restore canonical 10D vector so scoring is consistent on resume
                  if (saved.canonicalVector) {
                    setCanonicalVector(saved.canonicalVector);
                    saveCanonicalVector(saved.canonicalVector);
                  }
                  // Record return-to-session event
                  const timeAway = Date.now() - new Date(saved.updatedAt).getTime();
                  const returnEvent: ReturnToSessionEvent = {
                    event_type: 'return_to_session',
                    timestamp: new Date().toISOString(),
                    time_away_ms: timeAway,
                    same_question_restored: saved.currentItemId === itemToRestore.id,
                    session_depth_at_return: saved.testAnswerIndex,
                  };
                  setReturnEvents((prev) => [...prev, returnEvent]);
                  if (saved.pendingAnswer && saved.testAnswerIndex > 0) {
                    setScreen('reward');
                  } else {
                    setWasRestoredFromInterrupt(true);
                    setScreen('profile-test');
                  }
                }
              }
            }
          } catch (err) {
            debugError('restore_in_progress_failed', err);
          }
        }
      })
      .catch((err) => { setLoadError(String(err)); setLoading(false); });
  }, []);

  // ─── Auth listener ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isTestMode || isGuestMode) { setAuthLoading(false); return; }

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
  }, [isTestMode, isGuestMode]);

  // ─── Load profile after user changes ──────────────────────────────────────────────────
  useEffect(() => {
    if (isTestMode) {
      setUserProfile(TEST_PROFILE as UserProfile);
      return;
    }
    if (isGuestMode) {
      setUserProfile({
        id: GUEST_USER_ID,
        email: null,
        display_name: 'Guest',
        free_profile_tests_used: getGuestTestsUsed(),
        premium_status: '',
        total_answers: 0,
      } as unknown as UserProfile);
      return;
    }
    if (!user) { setUserProfile(null); return; }
    getOrCreateProfile(user).then((p) => { if (p) setUserProfile(p); });
  }, [user, isTestMode, isGuestMode]);

  // ─── Determine initial screen ────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading || authLoading) return;
    if (restoredInProgressRef.current) return; // in-progress test restored — don't redirect to dashboard
    if (isTestMode || isGuestMode) {
      if (!isAgeConfirmed()) { setScreen('age-gate'); return; }
      setScreen('dashboard');
      return;
    }
    if (!supabaseConfigured) { setScreen('supabase-config-error'); return; }
    if (!isAgeConfirmed()) { setScreen('age-gate'); return; }
    if (!user) { setScreen('auth'); return; }
    setScreen('dashboard');
  }, [loading, authLoading, user, isTestMode, isGuestMode]);

  // ─── Handlers ─────────────────────────────────────────────────────────────────────────
  function handleAgeConfirm() {
    confirmAge();
    if (isTestMode || isGuestMode) { setScreen('dashboard'); return; }
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
    if (user) {
      sessionId = await createTestSession(user.id, tNum, items.map((i) => i.id));
    }

    clearUndoStack();
    const startedAt = new Date().toISOString();
    setTestStartedAt(startedAt);
    setTestContent(items);
    setTestAnswerIndex(0);
    setTestAnswers([]);
    setTestSessionId(sessionId);
    setTestNumber(tNum);
    setCurrentItem(items[0]);
    setCanUndoAnswer(false);

    const ps = getProfileState();
    setProfileState(ps);
    debugLog('test_started', { testNumber: tNum, contentCount: items.length });
    setScreen('test-intro');
  }

  async function handleAnswer(
    answer: string,
    responseTimeMs: number,
    changeCount: number,
    firstReactionMs: number | null = null,
  ) {
    if (!currentItem) return;
    setPendingSelection(null); // confirmed — clear pre-confirm selection

    const axisDeltas = getSelectedAnswerDeltas(currentItem, answer);

    const contentProfile = getContentBehavioralProfile(currentItem);
    const behavioralMeta = computeBehavioralMetadata({
      responseTimeMs,
      firstReactionMs,
      changeCount,
      wasSkipped: false,
      wasUndone: false,
      wasReturned: wasRestoredFromInterrupt,
      axisDeltas,
      profileVector,
      contentProfile,
    });
    if (wasRestoredFromInterrupt) setWasRestoredFromInterrupt(false);
    setLastBehavioralMetadata(behavioralMeta);

    const testAnswer: TestAnswer = {
      content_id: currentItem.id,
      content_type: currentItem.content_type,
      rarity_tier: currentItem.rarity_tier,
      selected_answer: answer,
      response_time_ms: responseTimeMs,
      answer_changes_count: changeCount,
      axis_delta_json: axisDeltas,
      behavioral_metadata: behavioralMeta,
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
      behavioral_metadata: behavioralMeta,
    };
    addInteraction(localInteraction);
    setBehavioralSummary(summarizeBehavioralProfile(getInteractions(), skipEvents, swapEvents, exitEvents));
    updateUserVoteProfile({
      contentId: currentItem.id,
      selectedAnswer: answer,
      responseTimeMs,
      skipped: false,
      behavioral: behavioralMeta,
      userId: user?.id ?? null,
    });
    addSeenId(currentItem.id);

    const ps = getProfileState();
    ps.interaction_count += 1;
    ps.total_profile_answers += 1;
    ps.profile_progress = calcProfileProgress(ps.total_profile_answers);
    ps.rarity_points += parseFloat(currentItem.rarity_score) || 0;

    const vectorSnapshot = { ...profileVector };
    const canonicalSnapshot = { ...canonicalVector };

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

      // Canonical 10D vector — handles both AX01–AX10 keys (v2 content) and legacy poles
      const { next: newCanonical } = applyCanonicalDeltas(canonicalVector, axisDeltas);
      saveCanonicalVector(newCanonical);
      setCanonicalVector(newCanonical);
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

    if (user) {
      upsertProfileState(user.id, {
        answers_count: ps.total_profile_answers,
        profile_progress: ps.profile_progress,
        axes: ps.axes,
        hidden: ps.hidden,
        rarity_points: ps.rarity_points,
      });
    }

    const undoEntry: UndoEntry = {
      contentId: currentItem.id,
      selectedAnswer: answer,
      axisDeltas,
      profileVectorSnapshot: vectorSnapshot,
      canonicalVectorSnapshot: canonicalSnapshot,
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

    setNextCards([]);

    debugLog('answer_submitted', { contentId: currentItem?.id, answer, testAnswerIndex });
    persistInProgress({ nextCards: [], testAnswerIndex: testAnswerIndex + 1 });
    setScreen('reward');
  }

  async function handleRewardNext(_card: NextCard | null) {
    setNewFragment(null);
    setSelectedCard(null);
    const nextIndex = testAnswerIndex;

    if (nextIndex >= TEST_TOTAL || nextIndex >= testContent.length) {
      await finishTest();
      return;
    }

    // Recommend two categories based on current canonical vector uncertainty
    const seenIds = getSeenIds();
    const cats = recommendCategories(content, seenIds, canonicalVector, 2);
    setRecommendedCategories(cats.length >= 2 ? cats : ['General', 'Relationships']);
    setScreen('category-pick');
  }

  function handleCategorySelected(categoryEn: string) {
    const nextIndex = testAnswerIndex;

    if (nextIndex >= TEST_TOTAL || nextIndex >= testContent.length) {
      void finishTest();
      return;
    }

    let items = [...testContent];

    // Try to bring a matching item to the front of the remaining queue
    const matchIdx = items.findIndex(
      (item, idx) =>
        idx >= nextIndex &&
        (item.theme_category === categoryEn || item.category === categoryEn),
    );

    if (matchIdx > nextIndex) {
      [items[nextIndex], items[matchIdx]] = [items[matchIdx], items[nextIndex]];
      setTestContent(items);
    } else if (matchIdx === -1) {
      // No pre-selected item matches — pick one from full pool
      const seenIds = getSeenIds();
      const picked = selectContentByCategory(content, seenIds, categoryEn);
      if (picked) {
        items = [...items];
        items[nextIndex] = picked;
        setTestContent(items);
      }
    }

    setCurrentItem(items[nextIndex]);
    persistInProgress({ testContent: items, currentItem: items[nextIndex] });
    setScreen('profile-test');
  }

  function handleUndoAnswer() {
    const entry = popUndoEntry();
    if (!entry) return;

    // Mark the undone interaction in localStorage before removing it
    markLastInteractionUndone(entry.contentId);
    setBehavioralSummary(summarizeBehavioralProfile(getInteractions(), skipEvents, swapEvents, exitEvents));

    saveVector(entry.profileVectorSnapshot);
    setProfileVector({ ...entry.profileVectorSnapshot });

    if (entry.canonicalVectorSnapshot) {
      saveCanonicalVector(entry.canonicalVectorSnapshot);
      setCanonicalVector({ ...entry.canonicalVectorSnapshot });
    }

    const ps = getProfileState();
    ps.total_profile_answers = Math.max(0, ps.total_profile_answers - 1);
    ps.interaction_count = Math.max(0, ps.interaction_count - 1);
    ps.profile_progress = calcProfileProgress(ps.total_profile_answers);
    saveProfileState(ps);
    setProfileState({ ...ps });

    removeSeenId(entry.contentId);
    removeLastInteraction();

    setTwinFeedEvents(getTwinFeedEvents());
    setTimeline(getTimeline());
    setProfileFragments(getFragments());
    setFeedEvents(getFeedEvents());

    const prevIndex = Math.max(0, testAnswerIndex - 1);
    setTestAnswerIndex(prevIndex);
    setCurrentItem(testContent[prevIndex]);
    setCanUndoAnswer(canUndoFn());
    debugLog('undo_used', { testAnswerIndex });
    persistInProgress();
    setScreen('profile-test');
  }

  async function finishTest() {
    clearInProgressTest();
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

    if (testSessionId) {
      await completeTestSession(testSessionId, summaryJson);
    }

    if (user) {
      const updated = await incrementFreeTestsUsed(user.id, ps.total_profile_answers);
      if (updated) setUserProfile(updated);
    } else if (isGuestMode) {
      incrementGuestTestsUsed();
      setUserProfile((prev) => prev ? { ...prev, free_profile_tests_used: (prev.free_profile_tests_used ?? 0) + 1 } : prev);
    }

    addSeenIds(testContent.map((i) => i.id));
    debugLog('test_completed', { testNumber, totalProfileAnswers: ps.total_profile_answers });
    setScreen('test-summary');
  }

  async function handleLogout() {
    if (isTestMode) {
      disableTestSession();
      window.location.href = window.location.pathname;
      return;
    }
    if (isGuestMode) {
      disableGuestMode();
      window.location.href = window.location.pathname;
      return;
    }
    await signOut();
    setUser(null);
    setUserProfile(null);
    setScreen('auth');
  }

  function handleExportJson() {
    const ai = getAppInfo();
    const premiumSrc =
      isTestMode ? 'test' : isGuestMode ? 'guest' : user ? 'supabase' : null;
    const json = exportFullSession({
      profileVector: profileVector as Record<string, number>,
      canonicalVector,
      skipEvents,
      swapEvents,
      exitEvents,
      returnEvents,
      userId: user?.id ?? null,
      lang,
      startedAt: testStartedAt,
      premiumState: { unlocked: isPremium, source: premiumSrc },
      contentDiagnostics: getContentDiagnostics(content, currentItem, lang),
      buildInfo: {
        version: ai.version,
        commit: ai.commit,
        buildDate: ai.buildDate,
        deploySource: ai.deploySource,
        platform: ai.platform,
        environment: ai.environment,
      },
    });
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
      clearCanonicalVector();
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

  function handleTestMode() {
    enableTestSession();
    window.location.reload();
  }

  function handleGuest() {
    enableGuestMode();
    window.location.reload();
  }

  function handleSkipQuestion() {
    // Debug panel shortcut — no event metadata
    if (!testContent.length) return;
    const nextIndex = testAnswerIndex + 1;
    if (nextIndex < TEST_TOTAL && nextIndex < testContent.length) {
      setTestAnswerIndex(nextIndex);
      setCurrentItem(testContent[nextIndex]);
      setScreen('profile-test');
    } else {
      void finishTest();
    }
  }

  function handleSkipQuestionEvent(timeOnQuestionMs: number, hadSelection: boolean, selectedAnswer: string | null) {
    if (!currentItem) return;
    const skipCountInSession = skipEvents.length + 1;
    const skipCountInCategory = skipEvents.filter((e) => e.question_context.category === currentItem.category).length + 1;
    const skipCountOnAxis = skipEvents.filter((e) => e.question_context.axis_target === currentItem.axis_target).length + 1;
    const event: SkipEvent = {
      event_type: 'skip_question',
      question_id: currentItem.id,
      timestamp: new Date().toISOString(),
      time_to_skip_ms: timeOnQuestionMs,
      immediate_or_delayed: timeOnQuestionMs < 3000 ? 'immediate' : 'delayed',
      had_selection_before_skip: hadSelection,
      question_context: {
        question_id: currentItem.id,
        category: currentItem.category,
        content_type: currentItem.content_type,
        rarity_tier: currentItem.rarity_tier,
        axis_target: currentItem.axis_target,
        darkness_level: currentItem.darkness_level,
        intimacy_level: currentItem.intimacy_level,
        psychological_intensity: currentItem.psychological_intensity,
        content_tier: (currentItem.access_tier ?? 'free') as 'free' | 'premium',
      },
      skip_count_in_session: skipCountInSession,
      skip_count_in_category: skipCountInCategory,
      skip_count_on_axis: skipCountOnAxis,
    };
    const updatedSkips = [...skipEvents, event];
    setSkipEvents(updatedSkips);
    setPendingSelection(null); // selection gone after skip

    const nextIndex = testAnswerIndex + 1;
    if (nextIndex < TEST_TOTAL && nextIndex < testContent.length) {
      const nextItem = testContent[nextIndex];
      setTestAnswerIndex(nextIndex);
      setCurrentItem(nextItem);
      persistInProgress({ testAnswerIndex: nextIndex, currentItem: nextItem, pendingSelection: null });
      setScreen('profile-test');
    } else {
      void finishTest();
    }
    void selectedAnswer; // stored in event.had_selection_before_skip; not re-offered after skip
  }

  function handleExitToMenuEvent(timeOnQuestionMs: number, hadSelection: boolean, phase: string, selectedAnswer: string | null) {
    if (!currentItem) return;
    const event: ExitToMenuEvent = {
      event_type: 'exit_to_menu',
      question_id: currentItem.id,
      timestamp: new Date().toISOString(),
      session_depth: testAnswerIndex,
      answer_count_before_exit: testAnswers.length,
      time_on_question_ms: timeOnQuestionMs,
      phase_at_exit: phase,
      had_selection: hadSelection,
    };
    const updatedExits = [...exitEvents, event];
    setExitEvents(updatedExits);
    setPendingSelection(selectedAnswer);
    persistInProgress({ pendingSelection: selectedAnswer });
    setScreen('dashboard');
  }

  function handleSwapQuestionEvent(timeOnQuestionMs: number, hadSelection: boolean, selectedAnswer: string | null) {
    if (!currentItem || !testContent.length) return;

    // Pick a new question: not in answeredIds, not current item, from the remaining pool
    const answeredIds = new Set(testAnswers.map((a) => a.content_id));
    answeredIds.add(currentItem.id);
    const swappedOutIds = new Set(swapEvents.map((e) => e.old_question_id));

    // Find a replacement from the full content pool (not testContent, to get a fresh item)
    const candidateItem = content.find(
      (item) => !answeredIds.has(item.id) && !swappedOutIds.has(item.id) && item.id !== currentItem.id
    );
    if (!candidateItem) {
      // No swap available — silently skip instead
      handleSkipQuestionEvent(timeOnQuestionMs, hadSelection, selectedAnswer);
      return;
    }

    // Replace current item in testContent queue at current index
    const updatedContent = [...testContent];
    updatedContent[testAnswerIndex] = candidateItem;

    const event: SwapEvent = {
      event_type: 'swap_question',
      old_question_id: currentItem.id,
      new_question_id: candidateItem.id,
      timestamp: new Date().toISOString(),
      time_to_swap_ms: timeOnQuestionMs,
      had_selection_before_swap: hadSelection,
      old_question_context: {
        question_id: currentItem.id,
        category: currentItem.category,
        content_type: currentItem.content_type,
        rarity_tier: currentItem.rarity_tier,
        axis_target: currentItem.axis_target,
        darkness_level: currentItem.darkness_level,
        intimacy_level: currentItem.intimacy_level,
        psychological_intensity: currentItem.psychological_intensity,
        content_tier: (currentItem.access_tier ?? 'free') as 'free' | 'premium',
      },
      new_question_context: {
        question_id: candidateItem.id,
        category: candidateItem.category,
        content_type: candidateItem.content_type,
        rarity_tier: candidateItem.rarity_tier,
        axis_target: candidateItem.axis_target,
        darkness_level: candidateItem.darkness_level,
        intimacy_level: candidateItem.intimacy_level,
        psychological_intensity: candidateItem.psychological_intensity,
        content_tier: (candidateItem.access_tier ?? 'free') as 'free' | 'premium',
      },
      swap_count_in_session: swapEvents.length + 1,
    };

    const updatedSwaps = [...swapEvents, event];
    setSwapEvents(updatedSwaps);
    setTestContent(updatedContent);
    setCurrentItem(candidateItem);
    setPendingSelection(null);
    persistInProgress({ testContent: updatedContent, currentItem: candidateItem, pendingSelection: null });
    setScreen('profile-test');
    void selectedAnswer;
  }

  function handleSkipToQuestion(n: number) {
    if (!testContent.length) return;
    const idx = Math.max(0, Math.min(n - 1, testContent.length - 1));
    setTestAnswerIndex(idx);
    setCurrentItem(testContent[idx]);
    setScreen('profile-test');
  }

  async function handleCompleteTest() {
    if (!testContent.length) return;
    await finishTest();
  }

  function handleSeedAnswers(count: number) {
    const ps = getProfileState();
    for (let i = 0; i < count; i++) {
      addInteraction({
        content_id: `seed_${Date.now()}_${i}`,
        selected_answer: 'A',
        response_time_ms: 3000,
        answer_changes_count: 0,
        skipped: false,
        created_at: new Date().toISOString(),
        rarity_tier: 'standard',
        content_type: 'question',
      });
    }
    ps.total_profile_answers += count;
    ps.interaction_count += count;
    ps.profile_progress = calcProfileProgress(ps.total_profile_answers);
    saveProfileState(ps);
    setProfileState({ ...ps });
    debugLog('debug_seed_answers', { count, total: ps.total_profile_answers });
  }

  function handleForceSnapshot() {
    setScreen('profile-snapshot');
  }

  function handleLegalPage(page: LegalPage) {
    setCurrentLegalPage(page);
    setScreen('legal');
  }

  function handleUnlockFull() {
    unlockPremium();
    setScreen('full-profile');
  }

  // ─── Loading ───────────────────────────────────────────────────────────────────────
  if (loading || authLoading) {
    return (
      <div className="loading-screen" style={{
        position: 'relative', overflow: 'hidden',
        backgroundImage: 'url(/backgrounds/core/deep-stars.png)',
        backgroundSize: 'cover', backgroundPosition: 'center top',
      }}>
        {/* dim overlay so dots/text are legible */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,15,0.58)', pointerEvents: 'none' }} />
        <div className="loading-dots" style={{ position: 'relative', zIndex: 1 }}>
          <div className="loading-dot" />
          <div className="loading-dot" />
          <div className="loading-dot" />
        </div>
        <p className="loading-text" style={{ position: 'relative', zIndex: 1 }}>{t.loading}</p>
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

  // ─── Screens ───────────────────────────────────────────────────────────────────────────
  return (
    <>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {screen === 'supabase-config-error' && <SupabaseConfigError />}

      {screen === 'age-gate' && <AgeGate onConfirm={handleAgeConfirm} />}

      {screen === 'auth' && (
        <AuthScreen
          onTestMode={isTestMode || isTestModeRequested() ? () => { enableTestSession(); window.location.reload(); } : handleTestMode}
          onGuest={handleGuest}
        />
      )}

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
          onAccount={() => setScreen('account')}
          onPremiumDepth={() => setScreen('premium-depth')}
          onArchetypes={() => setScreen('archetypes')}
          onGalaxyMap={() => setScreen('galaxy-map')}
        />
      )}

      {screen === 'archetypes' && (
        <ArchetypeMixScreen
          profileVector={profileVector}
          totalAnswers={profileState.total_profile_answers}
          onBack={() => setScreen('dashboard')}
        />
      )}

      {screen === 'galaxy-map' && userProfile && (
        <GalaxyMapScreen
          totalProfileAnswers={profileState.total_profile_answers}
          profileVector={profileVector}
          isPremium={isPremium}
          humanTwinMatch={calcHumanTwinMatch(profileVector, profileState.total_profile_answers)}
          onBack={() => setScreen('dashboard')}
          onMyProfile={() => setScreen('my-profile')}
          onArchetypes={() => setScreen('archetypes')}
          onPremiumDepth={() => setScreen('premium-depth')}
          onHiddenParams={() => setScreen('hidden-parameters')}
          onFullProfile={() => setScreen('full-profile')}
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
          userId={user?.id ?? null}
          onAnswer={handleAnswer}
          onUndo={handleUndoAnswer}
          canUndo={canUndoAnswer}
          onSkip={handleSkipQuestionEvent}
          onExitToMenu={handleExitToMenuEvent}
          onSwap={handleSwapQuestionEvent}
          initialSelected={pendingSelection}
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

      {screen === 'category-pick' && (
        <CategoryPickerScreen
          categories={recommendedCategories}
          questionsAnswered={testAnswerIndex}
          testTotal={TEST_TOTAL}
          onPick={handleCategorySelected}
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
          onContinueAnswering={() => {
            // If there's an active test, return to it; otherwise go to dashboard to start a new one
            if (currentItem && testContent.length > 0) {
              setScreen('profile-test');
            } else {
              setScreen('dashboard');
            }
          }}
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

      {screen === 'account' && (
        <AccountScreen
          userProfile={userProfile}
          isGuest={isGuestMode}
          isPremium={isPremium}
          onLogout={handleLogout}
          onSettings={() => setScreen('settings')}
          onSubscription={() => setScreen('subscription')}
          onLegal={handleLegalPage}
          onLoginRegister={isGuestMode ? () => { disableGuestMode(); window.location.reload(); } : undefined}
          onBack={() => setScreen('dashboard')}
        />
      )}

      {screen === 'settings' && (
        <SettingsScreen
          onBack={() => setScreen('account')}
          onExport={handleExportJson}
          onReset={handleResetSession}
        />
      )}

      {screen === 'legal' && (
        <LegalScreen
          page={currentLegalPage}
          onBack={() => setScreen('account')}
        />
      )}

      {screen === 'subscription' && (
        <SubscriptionScreen
          isPremium={isPremium}
          isDebugMode={isTestMode || isAdminEmail(userProfile?.email ?? null) || false}
          onBack={() => setScreen('account')}
        />
      )}

      {screen === 'premium-depth' && (
        <PremiumDepthScreen
          isPremium={isPremium}
          totalAnswers={profileState.total_profile_answers}
          profileVector={profileVector}
          behavioralSummary={behavioralSummary}
          onBack={() => setScreen('dashboard')}
          onUpgrade={() => setScreen('subscription')}
        />
      )}

      </main>

      {showPremiumUnlockedModal && (
        <PremiumUnlockedModal
          onClose={() => setShowPremiumUnlockedModal(false)}
          onOpenPremiumDepth={() => { setShowPremiumUnlockedModal(false); setScreen('premium-depth'); }}
        />
      )}

      {(isTestMode || isAdminEmail(userProfile?.email) || isTestModeRequested()) && (
        <DebugPanel
          profileState={profileState}
          testContent={testContent}
          testAnswerIndex={testAnswerIndex}
          currentItem={currentItem}
          totalProfileAnswers={profileState.total_profile_answers}
          isTestMode={isTestMode}
          lastBehavioralMetadata={lastBehavioralMetadata}
          behavioralSummary={behavioralSummary}
          skipEvents={skipEvents}
          swapEvents={swapEvents}
          exitEvents={exitEvents}
          returnEvents={returnEvents}
          profileVector={profileVector as Record<string, number>}
          canonicalVector={canonicalVector}
          userId={user?.id ?? null}
          lang={lang}
          startedAt={testStartedAt}
          premiumState={{ unlocked: isPremium, source: isTestMode ? 'test' : isGuestMode ? 'guest' : user ? 'supabase' : null }}
          contentDiagnostics={getContentDiagnostics(content, currentItem, lang)}
          onStartTest={handleStartTest}
          onUndo={handleUndoAnswer}
          canUndo={canUndoAnswer}
          onRefreshProfile={handleRefreshProfile}
          onLogout={handleLogout}
          onReset={handleDebugReset}
          onSkipQuestion={handleSkipQuestion}
          onSkipToQuestion={handleSkipToQuestion}
          onCompleteTest={handleCompleteTest}
          onSeedAnswers={handleSeedAnswers}
          onForceSnapshot={handleForceSnapshot}
          onResetPremiumModal={() => { resetPremiumUnlockedSeen(); setShowPremiumUnlockedModal(true); }}
          onForcePremiumModule={(_id) => { setScreen('premium-depth'); }}
        />
      )}
    </>
  );
}
