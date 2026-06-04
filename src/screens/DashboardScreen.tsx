import { UserProfile } from '../lib/supabase';
import { ProfileVector, DIMENSIONS, getMaxValue } from '../utils/profileVector';
import { FeedEvent } from '../utils/eventFeed';
import { calcProfileProgress } from '../utils/contentSelector';
import { useT, useLang } from '../context/LangContext';

interface Props {
  userProfile: UserProfile;
  profileVector: ProfileVector;
  humanTwinMatch: number;
  feedEvents: FeedEvent[];
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
  feedEvents,
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

  void lang;

  function formatFeedEvent(event: FeedEvent): string {
    switch (event.type) {
      case 'dimension_up': return t.feed.dimensionUp(t.dimensions[event.label] ?? event.label);
      case 'rare_signal': return t.feed.rareSignal;
      case 'card_pick': return t.feed.cardPick(event.label);
      case 'first_signal': return t.feed.firstSignal;
      default: return event.label;
    }
  }

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

        {/* 2. Signal Map + Human Twin Match */}
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

        {/* 3. Progress Milestones */}
        <div className="card animate-in" style={{ animationDelay: '0.08s', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2 className="heading-md">{t.milestones.title}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {t.milestones.items.map((m) => {
              const unlocked = total_answers >= m.answers;
              return (
                <div key={m.answers} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 10px',
                  background: unlocked ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${unlocked ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: '6px',
                  opacity: unlocked ? 1 : 0.55,
                }}>
                  <span style={{ fontSize: '0.85rem', color: unlocked ? 'var(--accent-light)' : 'var(--text-dim)' }}>
                    {unlocked ? '◉' : '○'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: unlocked ? 'var(--text)' : 'var(--text-muted)' }}>
                      {m.label}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                      {m.description}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.65rem', color: unlocked ? 'var(--teal-light)' : 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                    {unlocked ? '✓' : `${m.answers} answers`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Recent Discoveries */}
        {feedEvents.length > 0 && (
          <div className="card animate-in" style={{ animationDelay: '0.12s', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h2 className="heading-md">{t.feed.title}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {feedEvents.map((ev, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                  <span style={{ fontSize: '0.6rem', color: 'var(--accent-light)', opacity: 0.7 }}>▸</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {formatFeedEvent(ev)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Truth or Dare */}
        <div className="card animate-in" style={{ animationDelay: '0.16s', display: 'flex', flexDirection: 'column', gap: '10px', opacity: 0.55 }}>
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

        {/* 6. My Profile */}
        <div className="card animate-in" style={{ animationDelay: '0.2s', display: 'flex', flexDirection: 'column', gap: '10px' }}>
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

        {/* 7. Settings */}
        <div className="card animate-in" style={{ animationDelay: '0.24s', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
