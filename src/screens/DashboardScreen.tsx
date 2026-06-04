import { UserProfile } from '../lib/supabase';
import { calcProfileProgress } from '../utils/contentSelector';
import { useT, useLang } from '../context/LangContext';

interface Props {
  userProfile: UserProfile;
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
        {/* Profile progress bar */}
        <div style={{ marginBottom: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span className="label">{t.dashboard.profileDiscovered}</span>
            <span className="label" style={{ color: 'var(--accent-light)' }}>{progress.toFixed(0)}%</span>
          </div>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="dashboard-stat-row">
              <span className="label">{t.dashboard.freeTests}</span>
              <span className="label" style={{ color: free_profile_tests_used >= MAX_FREE_TESTS ? 'var(--text-dim)' : 'var(--accent-light)' }}>
                {MAX_FREE_TESTS - free_profile_tests_used}&nbsp;/&nbsp;{MAX_FREE_TESTS} {t.dashboard.remaining}
              </span>
            </div>
            <div className="dashboard-stat-row">
              <span className="label">{t.dashboard.profileAnswers}</span>
              <span className="label" style={{ color: 'var(--text-muted)' }}>{total_answers}</span>
            </div>
            <div className="dashboard-stat-row">
              <span className="label">{t.dashboard.status}</span>
              <span className="label" style={{ color: profileReady ? 'var(--teal-light)' : 'var(--text-dim)' }}>
                {profileReady ? t.dashboard.profileReady : t.dashboard.profileNotReady}
              </span>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={onStartTest}
            disabled={!canStartTest}
            aria-label={t.dashboard.startTest}
            style={{ opacity: canStartTest ? 1 : 0.4 }}
          >
            {canStartTest ? t.dashboard.startTest : t.dashboard.noFreeTests}
          </button>

          {!canStartTest && (
            <p className="body-sm" style={{ textAlign: 'center', fontSize: '0.75rem' }}>
              {t.dashboard.noFreeTestsNote}
            </p>
          )}
        </div>

        {/* 2. Truth or Dare */}
        <div className="card animate-in" style={{ animationDelay: '0.05s', display: 'flex', flexDirection: 'column', gap: '10px', opacity: 0.55 }}>
          <div>
            <h2 className="heading-md" style={{ marginBottom: '3px' }}>{t.dashboard.truthOrDare}</h2>
            <p className="body-sm">{t.dashboard.truthOrDareSubtitle}</p>
          </div>
          <button
            className="btn btn-ghost"
            onClick={onTruthOrDare}
            aria-label={t.dashboard.truthOrDare}
          >
            {t.dashboard.comingSoon}
          </button>
        </div>

        {/* 3. My Profile */}
        <div className="card animate-in" style={{ animationDelay: '0.1s', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2 className="heading-md">{t.dashboard.myProfile}</h2>
          {missingAnswers > 0 ? (
            <p className="body-sm">
              {t.dashboard.answersLeft(missingAnswers)}
            </p>
          ) : (
            <p className="body-sm" style={{ color: 'var(--teal-light)' }}>
              {t.dashboard.profileReadyForRead}
            </p>
          )}
          <button
            className="btn btn-ghost"
            onClick={onMyProfile}
            aria-label={t.dashboard.myProfile}
          >
            {missingAnswers > 0 ? t.dashboard.gatherMore : t.dashboard.readProfile}
          </button>
        </div>

        {/* 4. Settings */}
        <div className="card animate-in" style={{ animationDelay: '0.15s', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
