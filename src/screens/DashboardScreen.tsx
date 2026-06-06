import { useState } from 'react';
import { UserProfile } from '../lib/supabase';
import { ProfileVector, DIMENSIONS, getMaxValue } from '../utils/profileVector';
import { FeedEvent } from '../utils/eventFeed';
import { ProfileFragment } from '../utils/profileFragments';
import { TwinFeedEvent, getTwinStage } from '../utils/twinFeed';
import { TimelineEvent } from '../utils/profileTimeline';
import { computeHiddenProfile, isHiddenProfileUnlocked } from '../utils/hiddenProfile';
import { calcProfileProgress } from '../utils/contentSelector';
import { canContinueTest, MILESTONES } from '../utils/premiumProgression';
import { computeArchetypeMix, isArchetypeMixUnlocked } from '../utils/archetypes';
import { getCuriosities } from '../utils/curiosities';
import { useT, useLang } from '../context/LangContext';
import ProfileRadarChart from '../components/ProfileRadarChart';

interface Props {
  userProfile: UserProfile;
  profileVector: ProfileVector;
  humanTwinMatch: number;
  totalProfileAnswers: number;
  feedEvents: FeedEvent[];
  profileFragments: ProfileFragment[];
  twinFeedEvents: TwinFeedEvent[];
  timeline: TimelineEvent[];
  isPremium: boolean;
  onStartTest: () => void;
  onTruthOrDare: () => void;
  onMyProfile: () => void;
  onExportJson: () => void;
  onResetSession: () => void;
  onLogout: () => void;
  onProfileSnapshot: () => void;
  onFullProfile: () => void;
  onHiddenParams: () => void;
  onAccount?: () => void;
  onPremiumDepth?: () => void;
  onArchetypes?: () => void;
}

const ANSWERS_FOR_READ = 51;

export default function DashboardScreen({
  userProfile,
  profileVector,
  humanTwinMatch,
  totalProfileAnswers,
  profileFragments,
  twinFeedEvents,
  timeline,
  isPremium,
  onStartTest,
  onTruthOrDare,
  onMyProfile,
  onExportJson,
  onResetSession,
  onLogout,
  onProfileSnapshot,
  onFullProfile,
  onHiddenParams,
  onAccount,
  onPremiumDepth,
  onArchetypes,
}: Props) {
  const t = useT();
  const [lang, setLang] = useLang();
  const [showRadarInSignalMap, setShowRadarInSignalMap] = useState(true);
  const { free_profile_tests_used, total_answers } = userProfile;
  const freeTestsUsed = free_profile_tests_used ?? 0;
  const canStartTest = canContinueTest(freeTestsUsed, isPremium);
  const missingAnswers = Math.max(0, ANSWERS_FOR_READ - total_answers);
  const progress = calcProfileProgress(total_answers);
  const profileReady = total_answers >= ANSWERS_FOR_READ;
  const maxVec = getMaxValue(profileVector);
  const hasVectorData = DIMENSIONS.some((d) => profileVector[d] > 0);

  const twinDataReady = totalProfileAnswers >= 5;
  const twinStage = getTwinStage(humanTwinMatch);
  const hiddenUnlocked = isHiddenProfileUnlocked(totalProfileAnswers);
  const hiddenProfileData = computeHiddenProfile(profileVector, totalProfileAnswers);

  const archetypeMixUnlocked = isArchetypeMixUnlocked(totalProfileAnswers);
  const archetypeMix = computeArchetypeMix(profileVector, totalProfileAnswers);

  void lang;

  return (
    <div className="screen" style={{ background: 'var(--bg)', minHeight: '100dvh' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 20px 12px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--accent-light)' }}>
          The Other 99
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isPremium && (
            <span style={{
              padding: '3px 8px', fontSize: '0.62rem', fontWeight: 700,
              background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: '20px', color: 'var(--gold)', letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              {t.premiumBadge.active}
            </span>
          )}
          {onAccount && (
            <button
              className="btn btn-ghost"
              onClick={onAccount}
              style={{ padding: '5px 12px', fontSize: '0.75rem' }}
              aria-label={t.account.menuButton}
            >
              {userProfile.display_name ?? userProfile.email ?? t.account.statusGuest}
            </button>
          )}
        </div>
      </div>

      <main
        style={{
          flex: 1, padding: '20px 20px 32px',
          maxWidth: '480px', margin: '0 auto', width: '100%',
          display: 'flex', flexDirection: 'column', gap: '12px',
        }}
        aria-label={t.dashboard.mainLabel}
      >
        {/* Profile progress header */}
        <div style={{ marginBottom: '4px' }}>
          <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>
            {t.dashboard.profileHiddenLabel}
          </p>
          <p className="body-sm" style={{ fontSize: '0.72rem', marginBottom: '8px' }}>
            {t.dashboard.profileSeenSubtext(progress)}
          </p>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          {/* Milestones strip — compact locked chips */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
            {MILESTONES.map((m) => {
              const reached = totalProfileAnswers >= m.answers;
              const chipLabel = lang === 'pl' ? (m.label_pl ?? m.label) : m.label;
              return (
                <span
                  key={m.answers}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    background: reached ? 'rgba(45,212,191,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${reached ? 'rgba(45,212,191,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    color: reached ? 'var(--teal-light)' : 'var(--text-dim)',
                  }}
                >
                  {reached ? '✓ ' : ''}{chipLabel}
                </span>
              );
            })}
          </div>
        </div>

        {/* 1. Profile Reading */}
        <div className="card animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <h2 className="heading-md" style={{ marginBottom: '3px' }}>{t.dashboard.profileReading}</h2>
            <p className="body-sm">{t.dashboard.profileReadingSubtitle}</p>
          </div>

          <p className="body-sm" style={{ fontSize: '0.78rem', fontStyle: 'italic', color: 'var(--text-dim)' }}>
            {t.dashboard.profileReadingSupporting}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="dashboard-stat-row">
              <span className="label">{t.dashboard.freeTests}</span>
              <span className="label" style={{ color: freeTestsUsed >= 3 ? 'var(--text-dim)' : 'var(--accent-light)' }}>
                {Math.max(0, 3 - freeTestsUsed)}&nbsp;/&nbsp;3
              </span>
            </div>
            <div className="dashboard-stat-row">
              <span className="label">{t.dashboard.profileAnswers}</span>
              <span className="label" style={{ color: 'var(--text-muted)' }}>{total_answers}</span>
            </div>
            <div className="dashboard-stat-row">
              <span className="label">{t.dashboard.status}</span>
              <span className="label" style={{ color: profileReady ? 'var(--teal-light)' : 'var(--text-dim)' }}>
                {t.dashboard.statusLabel(total_answers)}
              </span>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={onStartTest}
            disabled={!canStartTest}
            aria-label={t.dashboard.startTestLabel(freeTestsUsed)}
            style={{ opacity: canStartTest ? 1 : 0.4 }}
          >
            {canStartTest
              ? (totalProfileAnswers > 0 ? t.premium.continueDiscovery : t.dashboard.startTestLabel(freeTestsUsed))
              : t.dashboard.noFreeTests}
          </button>

          {!canStartTest && (
            <p className="body-sm" style={{ textAlign: 'center', fontSize: '0.75rem' }}>
              {t.dashboard.noFreeTestsNote}
            </p>
          )}
        </div>

        {/* Profile Snapshot CTA */}
        {totalProfileAnswers >= 51 && !isPremium && (
          <div className="card animate-in" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(45,212,191,0.08) 100%)', border: '1px solid rgba(124,58,237,0.4)' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent-light)', textTransform: 'uppercase' }}>
              {lang === 'pl' ? 'MIGAWKA PROFILU GOTOWA' : 'PROFILE SNAPSHOT READY'}
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text)', margin: '6px 0 4px' }}>
              {lang === 'pl'
                ? 'System zaczyna widzieć wzorzec. To nie jest gotowy profil.'
                : 'The system is starting to see a pattern. This is not a finished profile.'}
            </p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontStyle: 'italic', marginBottom: '12px' }}>
              {lang === 'pl'
                ? 'Twój profil nie jest gotowy. Dopiero zaczął reagować.'
                : 'Your profile is not complete. It just started reacting.'}
            </p>
            <button className="btn btn-primary" onClick={onProfileSnapshot} style={{ fontSize: '0.82rem', padding: '10px 20px' }}>
              {lang === 'pl' ? 'Zobacz migawkę profilu' : 'See Profile Snapshot'}
            </button>
          </div>
        )}

        {/* 2. Signal Map */}
        <div className="card animate-in" style={{ animationDelay: '0.04s', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h2 className="heading-md">{t.signalMap.title}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '1px' }}>
                  {t.humanTwin.label}
                </div>
                <div style={{ fontSize: twinDataReady ? '1.5rem' : '0.72rem', fontWeight: 800, color: twinDataReady ? 'var(--accent-light)' : 'var(--text-dim)', lineHeight: 1 }}>
                  {twinDataReady ? `${humanTwinMatch}%` : 'Calibrating…'}
                </div>
              </div>
              {hasVectorData && (
                <button
                  onClick={() => setShowRadarInSignalMap((v) => !v)}
                  style={{
                    fontSize: '0.62rem',
                    color: 'var(--text-dim)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px 4px',
                  }}
                >
                  {showRadarInSignalMap ? 'Show as list' : 'Show chart'}
                </button>
              )}
            </div>
          </div>

          {!hasVectorData ? (
            <p className="body-sm" style={{ fontStyle: 'italic' }}>{t.signalMap.empty}</p>
          ) : showRadarInSignalMap ? (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ProfileRadarChart
                vector={profileVector}
                size={200}
                variant="full"
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {DIMENSIONS.map((dim) => {
                const val = profileVector[dim];
                const pct = maxVec > 0 ? (val / maxVec) * 100 : 0;
                const barColor = pct > 60
                  ? 'var(--accent-light)'
                  : pct > 25
                  ? 'var(--teal-light)'
                  : 'rgba(255,255,255,0.22)';
                return (
                  <div key={dim} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      width: '82px', flexShrink: 0,
                      fontSize: '0.72rem',
                      color: val > 0 ? 'var(--text)' : 'var(--text-dim)',
                    }}>
                      {t.dimensions[dim]}
                    </span>
                    <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: '2px',
                        width: `${pct}%`,
                        background: barColor,
                        transition: 'width 0.6s ease',
                        minWidth: val > 0 ? '3px' : '0',
                      }} />
                    </div>
                    <span style={{ width: '22px', fontSize: '0.65rem', color: 'var(--text-dim)', textAlign: 'right' }}>
                      {val > 0 ? val : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>{t.humanTwin.subtext}</p>
        </div>

        {/* 3. Human Twin card */}
        <div className="card animate-in" style={{ animationDelay: '0.08s', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 className="heading-md">{t.twinFeed.title}</h2>
              <p style={{ fontSize: '0.72rem', color: 'var(--accent-light)', fontWeight: 600 }}>
                {twinDataReady ? t.twinFeed.stages[twinStage] : t.twinFeed.stages['no_match']}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              {twinDataReady ? (
                <>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-light)', lineHeight: 1 }}>
                    {humanTwinMatch}%
                  </div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>
                    {t.twinFeed.microcopy[twinStage]}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                  {5 - totalProfileAnswers} more answers
                </div>
              )}
            </div>
          </div>
          {twinFeedEvents.slice(0, 3).map((ev, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '3px 0' }}>
              <span style={{ fontSize: '0.6rem', color: 'var(--accent-light)', opacity: 0.7 }}>◈</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {t.twinFeed.events[ev.type] ?? ev.type}
              </span>
            </div>
          ))}
          {twinFeedEvents.length === 0 && (
            <p style={{ fontSize: '0.72rem', fontStyle: 'italic', color: 'var(--text-dim)' }}>
              {t.twinFeed.microcopy['no_match']}
            </p>
          )}
        </div>

        {/* 4. Profile Fragments card */}
        <div className="card animate-in" style={{ animationDelay: '0.12s', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 className="heading-md">{t.fragments.title}</h2>
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-light)', fontWeight: 700 }}>
              {t.fragments.discovered(profileFragments.length)}
            </span>
          </div>
          {profileFragments.length === 0 ? (
            <p style={{ fontSize: '0.72rem', fontStyle: 'italic', color: 'var(--text-dim)' }}>
              {t.fragments.empty}
            </p>
          ) : (
            <>
              {profileFragments.slice(-3).reverse().map((frag) => (
                <div key={frag.id} style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)' }}>{frag.title}</span>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                      {t.fragments.rarityLabel[frag.rarity] ?? frag.rarity}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{frag.text}</p>
                </div>
              ))}
              <p style={{ fontSize: '0.65rem', fontStyle: 'italic', color: 'var(--text-dim)' }}>
                {t.fragments.lockedHint}
              </p>
            </>
          )}
        </div>

        {/* 5. Hidden Profile card */}
        <div className="card animate-in" style={{ animationDelay: '0.16s', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 className="heading-md">{t.hiddenProfile.title}</h2>
            {hiddenUnlocked && (
              <span style={{ fontSize: '0.6rem', color: 'var(--teal-light)', fontWeight: 700 }}>
                {t.hiddenProfile.confidence}: {hiddenProfileData.confidence}%
              </span>
            )}
          </div>
          {!hiddenUnlocked ? (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              {t.hiddenProfile.answersLeft(Math.max(0, 51 - totalProfileAnswers))}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                [t.hiddenProfile.primaryDriver, hiddenProfileData.primaryDriver],
                [t.hiddenProfile.secondaryDriver, hiddenProfileData.secondaryDriver],
                [t.hiddenProfile.decisionStyle, hiddenProfileData.decisionStyle],
                [t.hiddenProfile.socialPattern, hiddenProfileData.socialPattern],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{label}</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-light)' }}>{value}</span>
                </div>
              ))}
              <div style={{ padding: '8px 10px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>
                  {t.hiddenProfile.rarestSignal}
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-light)' }}>
                  {hiddenProfileData.rarestSignal}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                  {t.hiddenProfile.onlyPercent(hiddenProfileData.rarestSignalPercent)}
                </div>
              </div>
              {hiddenProfileData.lockedSections.map((section) => (
                <div key={section} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', opacity: 0.5 }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{section}</span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {t.hiddenProfile.lockedLabel}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Premium Features card */}
        {isPremium && (
          <div className="card animate-in" style={{
            animationDelay: '0.22s',
            background: 'linear-gradient(135deg, var(--bg-elevated) 0%, rgba(124,58,237,0.12) 100%)',
            border: '1px solid rgba(245,158,11,0.25)',
            boxShadow: '0 0 24px rgba(124,58,237,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <p className="heading-md" style={{ margin: 0 }}>{t.premiumBadge.active}</p>
              <span style={{
                padding: '2px 8px', fontSize: '0.6rem', fontWeight: 700,
                background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: '20px', color: 'var(--gold)', letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>✦</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {onPremiumDepth && (
                <button
                  className="btn btn-primary"
                  onClick={onPremiumDepth}
                  style={{ fontSize: '0.82rem', background: 'linear-gradient(90deg, var(--accent), rgba(124,58,237,0.8))' }}
                >
                  {t.premiumDepth.title} →
                </button>
              )}
              <button className="btn btn-ghost" onClick={onFullProfile} style={{ textAlign: 'left', fontSize: '0.82rem' }}>
                {t.fullProfile.title} →
              </button>
              <button className="btn btn-ghost" onClick={onHiddenParams} style={{ textAlign: 'left', fontSize: '0.82rem' }}>
                {t.hiddenParameters.title} →
              </button>
              <button className="btn btn-ghost" onClick={onProfileSnapshot} style={{ textAlign: 'left', fontSize: '0.82rem' }}>
                {t.profileSnapshot.title} →
              </button>
            </div>
          </div>
        )}

        {/* Premium CTA for free users */}
        {!isPremium && totalProfileAnswers >= 17 && (
          <div className="card animate-in" style={{ animationDelay: '0.22s', border: '1px solid rgba(124,58,237,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <p className="heading-md" style={{ margin: 0 }}>{t.premiumDepth.title}</p>
              <span style={{
                padding: '2px 8px', fontSize: '0.6rem', fontWeight: 700,
                background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
                borderRadius: '20px', color: 'var(--accent-light)', letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                {t.premiumDepth.locked}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
              {t.premiumDepth.subtitle}
            </p>
            {onPremiumDepth && (
              <button className="btn btn-ghost" onClick={onPremiumDepth} style={{ fontSize: '0.8rem', color: 'var(--accent-light)' }}>
                {t.premiumBadge.upgrade} →
              </button>
            )}
          </div>
        )}

        {/* 6. Archetype Mix card */}
        <div className="card animate-in" style={{ animationDelay: '0.2s', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 className="heading-md">{t.archetypes.title}</h2>
            {archetypeMixUnlocked && (
              <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>
                {t.archetypes.confidence}: {archetypeMix.confidence}%
              </span>
            )}
          </div>
          {!archetypeMixUnlocked ? (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              {t.archetypes.forming(Math.max(0, 100 - totalProfileAnswers))}
            </p>
          ) : (
            <>
              {archetypeMix.mix.slice(0, 3).map((arch) => (
                <div key={arch.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ width: '90px', fontSize: '0.75rem', color: 'var(--text)' }}>{arch.name}</span>
                  <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${arch.pct}%`, background: arch.color, transition: 'width 0.6s ease', borderRadius: '2px' }} />
                  </div>
                  <span style={{ width: '32px', fontSize: '0.65rem', color: 'var(--text-dim)', textAlign: 'right' }}>{arch.pct}%</span>
                </div>
              ))}
              {onArchetypes && (
                <button
                  className="btn btn-ghost"
                  onClick={onArchetypes}
                  style={{ marginTop: '4px', fontSize: '0.78rem', color: 'var(--accent-light)', textAlign: 'left' }}
                >
                  View full archetype profile →
                </button>
              )}
            </>
          )}
        </div>

        {/* 7. Discovery Timeline card */}
        <div className="card animate-in" style={{ animationDelay: '0.24s', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2 className="heading-md">{t.timeline.title}</h2>
          {timeline.length === 0 ? (
            <p style={{ fontSize: '0.72rem', fontStyle: 'italic', color: 'var(--text-dim)' }}>
              {t.timeline.empty}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {timeline.slice(0, 10).map((ev, i) => {
                const isFragment = ev.type === 'fragment_unlocked';
                const fragName = isFragment ? ev.label.replace('fragment_unlocked:', '') : null;
                const eventLabel = isFragment && fragName
                  ? `${t.timeline.events['fragment_unlocked']}: ${fragName}`
                  : t.timeline.events[ev.type] ?? ev.type;
                return (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--accent-light)', opacity: 0.6, whiteSpace: 'nowrap', marginTop: '1px' }}>
                      {t.timeline.answer(ev.answerNumber)}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {eventLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 8. Truth or Dare */}
        <div className="card animate-in" style={{ animationDelay: '0.28s', display: 'flex', flexDirection: 'column', gap: '10px', opacity: 0.55 }}>
          <div>
            <h2 className="heading-md" style={{ marginBottom: '3px' }}>{t.dashboard.truthOrDare}</h2>
            <p className="body-sm">{t.dashboard.truthOrDareSubtitle}</p>
          </div>
          <p className="body-sm" style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
            {t.dashboard.truthOrDareSubtext}
          </p>
          <button
            className="btn btn-ghost"
            onClick={onTruthOrDare}
            aria-label={t.dashboard.truthOrDare}
          >
            {t.dashboard.comingSoon}
          </button>
        </div>

        {/* 9. My Profile */}
        <div className="card animate-in" style={{ animationDelay: '0.32s', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2 className="heading-md">{t.dashboard.myProfile}</h2>
          {missingAnswers > 0 ? (
            <>
              <p className="body-sm">
                {t.dashboard.answersLeft(missingAnswers)}
              </p>
              <p className="body-sm" style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--text-dim)' }}>
                {t.dashboard.answersLeftSubtext}
              </p>
            </>
          ) : (
            <>
              <p className="body-sm" style={{ color: 'var(--teal-light)' }}>
                {t.dashboard.profileReadyForRead}
              </p>
              <p className="body-sm" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                {t.dashboard.profileReadyLocked}
              </p>
            </>
          )}
          <button
            className="btn btn-ghost"
            onClick={onMyProfile}
            aria-label={t.dashboard.myProfile}
          >
            {missingAnswers > 0 ? t.dashboard.gatherMore : t.dashboard.readProfile}
          </button>
        </div>

        {/* Curiosity */}
        {totalProfileAnswers > 0 && (() => {
          const c = getCuriosities(profileVector, totalProfileAnswers)[0];
          return c ? (
            <div className="card animate-in" style={{ animationDelay: '0.3s', background: 'rgba(255,255,255,0.02)' }}>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                CURIOSITY
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.5, fontStyle: 'italic' }}>
                "{c.text}"
              </p>
            </div>
          ) : null;
        })()}

        {/* 10. Settings */}
        <div className="card animate-in" style={{ animationDelay: '0.36s', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h2 className="heading-md" style={{ marginBottom: '4px' }}>{t.dashboard.settings}</h2>

          {/* Language switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="label" style={{ flex: 1 }}>{t.dashboard.language}</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['en', 'pl'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    border: '1px solid',
                    borderColor: lang === l ? 'var(--accent)' : 'var(--border)',
                    borderRadius: '4px',
                    background: lang === l ? 'rgba(124,58,237,0.15)' : 'transparent',
                    color: lang === l ? 'var(--accent-light)' : 'var(--text-dim)',
                    cursor: 'pointer',
                  }}
                  aria-pressed={lang === l}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <button className="debug-btn" onClick={onExportJson} aria-label={t.dashboard.exportSession}>{t.dashboard.exportSession}</button>
          <button className="debug-btn" onClick={onResetSession} style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.2)' }} aria-label={t.dashboard.resetSession}>{t.dashboard.resetSession}</button>
          <button className="debug-btn" onClick={onLogout} aria-label={t.dashboard.logout}>{t.dashboard.logout}</button>
        </div>
      </main>
    </div>
  );
}
