import { useState, useEffect } from 'react';
import { ContentItem, ProfileState, Interaction, AppScreen } from './types';
import { loadContent } from './utils/csvLoader';
import { selectContent, calcProgressGain } from './utils/contentSelector';
import {
  isAgeConfirmed, confirmAge,
  isStarted, setStarted,
  getSeenIds, addSeenId,
  addInteraction,
  getProfileState, saveProfileState,
  setPaywallShown,
} from './utils/storage';

import AgeGate from './screens/AgeGate';
import LandingScreen from './screens/LandingScreen';
import InteractionScreen from './screens/InteractionScreen';
import RewardScreen from './screens/RewardScreen';
import PaywallTeaser from './screens/PaywallTeaser';
import PremiumPlaceholder from './screens/PremiumPlaceholder';
import DebugPanel from './screens/DebugPanel';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('age-gate');
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentItem, setCurrentItem] = useState<ContentItem | null>(null);
  const [pendingAnswer, setPendingAnswer] = useState<string>('');
  const [profileState, setProfileState] = useState<ProfileState>(getProfileState());

  // Load CSV once
  useEffect(() => {
    loadContent()
      .then((items) => {
        setContent(items);
        setLoading(false);
      })
      .catch((err) => {
        setLoadError(String(err));
        setLoading(false);
      });
  }, []);

  // Resolve initial screen after CSV loads
  useEffect(() => {
    if (loading) return;
    if (!isAgeConfirmed()) {
      setScreen('age-gate');
    } else if (!isStarted()) {
      setScreen('landing');
    } else {
      advanceToNextInteraction();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  function advanceToNextInteraction() {
    const profile = getProfileState();
    const seenIds = getSeenIds();

    // Check paywall
    if (profile.interaction_count >= profile.paywall_trigger) {
      setPaywallShown();
      setProfileState(profile);
      setScreen('paywall');
      return;
    }

    const nextNum = profile.interaction_count + 1;
    const item = selectContent(
      content,
      seenIds,
      nextNum,
      profile.legendary_count
    );

    if (!item) {
      // All content exhausted — show paywall
      setPaywallShown();
      setScreen('paywall');
      return;
    }

    setCurrentItem(item);
    setProfileState(profile);
    setScreen('interaction');
  }

  function handleAgeConfirm() {
    confirmAge();
    setScreen('landing');
  }

  function handleStart() {
    setStarted();
    advanceToNextInteraction();
  }

  function handleAnswer(answer: string, responseTimeMs: number, changeCount: number) {
    if (!currentItem) return;

    const profile = getProfileState();

    // Record interaction
    const interaction: Interaction = {
      content_id: currentItem.id,
      selected_answer: answer,
      response_time_ms: responseTimeMs,
      answer_changes_count: changeCount,
      skipped: false,
      created_at: new Date().toISOString(),
      rarity_tier: currentItem.rarity_tier,
      content_type: currentItem.content_type,
    };
    addInteraction(interaction);
    addSeenId(currentItem.id);

    // Update profile
    const gain = calcProgressGain(currentItem);
    profile.interaction_count += 1;
    profile.profile_progress = Math.min(profile.profile_progress + gain, 34);
    profile.rarity_points += parseFloat(currentItem.rarity_score) || 0;
    if (currentItem.rarity_tier === 'legendary') {
      profile.legendary_count += 1;
    }

    // Apply axis deltas
    if (currentItem.axis_delta_json) {
      try {
        const deltas = JSON.parse(currentItem.axis_delta_json) as Record<string, number>;
        const isHidden =
          currentItem.profile_reveal_type?.toLowerCase().includes('hidden') ?? false;
        for (const [axis, delta] of Object.entries(deltas)) {
          if (typeof delta === 'number') {
            if (isHidden) {
              profile.hidden[axis] = (profile.hidden[axis] ?? 0) + delta;
            } else {
              profile.axes[axis] = (profile.axes[axis] ?? 0) + delta;
            }
          }
        }
      } catch {
        // Malformed JSON — skip silently
      }
    }

    // Archetype teasers
    if (currentItem.unlock_type && !profile.archetype_teasers.includes(currentItem.unlock_type)) {
      profile.archetype_teasers.push(currentItem.unlock_type);
    }

    saveProfileState(profile);
    setProfileState({ ...profile });
    setPendingAnswer(answer);
    setScreen('reward');
  }

  function handleRewardNext() {
    advanceToNextInteraction();
  }

  function handleUnlock() {
    setScreen('premium-placeholder');
  }

  function handleReset() {
    // storage.resetSession() was called inside DebugPanel
    window.location.reload();
  }

  // ─── Loading / Error ─────────────────────────
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-dots">
          <div className="loading-dot" />
          <div className="loading-dot" />
          <div className="loading-dot" />
        </div>
        <p className="loading-text">Ładowanie treści…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="loading-screen">
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Nie udało się załadować treści. Odśwież stronę.
        </p>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>{loadError}</p>
      </div>
    );
  }

  // ─── Screens ─────────────────────────────────
  return (
    <>
      {screen === 'age-gate' && (
        <AgeGate onConfirm={handleAgeConfirm} />
      )}

      {screen === 'landing' && (
        <LandingScreen onStart={handleStart} />
      )}

      {screen === 'interaction' && currentItem && (
        <InteractionScreen
          key={currentItem.id}
          item={currentItem}
          interactionNum={profileState.interaction_count + 1}
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
          interactionNum={profileState.interaction_count}
          onNext={handleRewardNext}
        />
      )}

      {screen === 'paywall' && (
        <PaywallTeaser
          profileProgress={profileState.profile_progress}
          onUnlock={handleUnlock}
        />
      )}

      {screen === 'premium-placeholder' && (
        <PremiumPlaceholder onBack={() => setScreen('paywall')} />
      )}

      <DebugPanel onReset={handleReset} />
    </>
  );
}
