import { UserProfile } from '../lib/supabase';
import { ProfileVector, DIMENSIONS, getMaxValue } from '../utils/profileVector';
import { FeedEvent } from '../utils/eventFeed';
import { ProfileFragment } from '../utils/profileFragments';
import { TwinFeedEvent, getTwinStage } from '../utils/twinFeed';
import { TimelineEvent } from '../utils/profileTimeline';
import { computeHiddenProfile, isHiddenProfileUnlocked } from '../utils/hiddenProfile';
import { calcProfileProgress } from '../utils/contentSelector';
import { useT, useLang } from '../context/LangContext';

interface Props {
  userProfile: UserProfile;
  profileVector: ProfileVector;
  humanTwinMatch: number;
  totalProfileAnswers: number;
  feedEvents: FeedEvent[];
  profileFragments: ProfileFragment[];
  twinFeedEvents: TwinFeedEvent[];
  timeline: TimelineEvent[];
  onStartTest: () => void;
  onTruthOrDare: () => void;
  onMyProfile: () => void;
  onExportJson: () => void;
  onResetSession: () => void;
  onLogout: () => void;
}

const MAX_FREE_TESTS = 3;
const ANSWERS_FOR_READ = 51;

export default function DashboardScreen({
  userProfile,
  profileVector,
  humanTwinMatch,
  totalProfileAnswers,
  profileFragments,
  twinFeedEvents,
  timeline,
  onStartTest,
  onTruthOrDare,
  onMyProfile,
  onExportJson,
  onResetSession,
  onLogout,
}: Props) {
  const t = useT();
  const [lang, setLang] = useLang();
  const { free_profile_tests_used, total_answers, premium_status } = userProfile;
  const isPremium = premium_status === 'premium';
  const canStartTest = isPremium || free_profile_tests_used < MAX_FREE_TESTS;
  const missingAnswers = Math.max(0, ANSWERS_FOR_READ - total_answers);
  const progress = calcProfileProgress(total_answers);
  const profileReady = total_answers >= ANSWERS_FOR_READ;
  const maxVec = getMaxValue(profileVector);
  const hasVectorData = DIMENSIONS.some((d) => profileVector[d] > 0);

  const twinStage = getTwinStage(humanTwinMatch);
  const hiddenUnlocked = isHiddenProfileUnlocked(totalProfileAnswers);
  const hiddenProfileData = computeHiddenProfile(profileVector, totalProfileAnswers);

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
        <span className="body-sm" style={{ fontSize: '0.72rem', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {userProfile.display_name ?? userProfile.email ?? '—'}
        </span>
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
              <span className="label" style={{ color: free_profile_tests_used >= MAX_FREE_TESTS ? 'var(--text-dim)' : 'var(--accent-light)' }}>
                {MAX_FREE_TESTS - free_profile_tests_used}&nbsp;/&nbsp;{MAX_FREE_TESTS}
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
            aria-label={t.dashboard.startTestLabel(free_profile_tests_used)}
            style={{ opacity: canStartTest ? 1 : 0.4 }}
          >
            {canStartTest ? t.dashboard.startTestLabel(free_profile_tests_used) : t.dashboard.noFreeTests}
          </button>

          {!canStartTest && (
            <p className="body-sm" style={{ textAlign: 'center', fontSize: '0.75rem' }}>
              {t.dashboard.noFreeTestsNote}
            </p>
          )}
        </div>

        {/* 2. Signal Map */}
        <div className="card animate-in" style={{ animationDelay: '0.04s', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h2 className="heading-md">{t.signalMap.title}</h2>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '1px' }}>
                {t.humanTwin.label}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-light)', lineHeight: 1 }}>
                {humanTwinMatch}%
              </div>
            </div>
          </div>

          {!hasVectorData ? (
            <p className="body-sm" style={{ fontStyle: 'italic' }}>{t.signalMap.empty}</p>
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
                {t.twinFeed.stages[twinStage]}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-light)', lineHeight: 1 }}>
                {humanTwinMatch}%
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>
                {t.twinFeed.microcopy[twinStage]}
              </div>
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
              {/* Rarest signal */}
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
              {/* Locked sections */}
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

        {/* 6. Discovery Timeline card */}
        <div className="card animate-in" style={{ animationDelay: '0.2s', display: 'flex', flexDirection: 'column', gap: '10px' }}>
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

        {/* 7. Truth or Dare */}
        <div className="card animate-in" style={{ animationDelay: '0.24s', display: 'flex', flexDirection: 'column', gap: '10px', opacity: 0.55 }}>
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

        {/* 8. My Profile */}
        <div className="card animate-in" style={{ animationDelay: '0.28s', display: 'flex', flexDirection: 'column', gap: '10px' }}>
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

        {/* 9. Settings */}
        <div className="card animate-in" style={{ animationDelay: '0.32s', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
