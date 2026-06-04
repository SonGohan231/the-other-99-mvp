import { UserProfile } from '../lib/supabase';
import { calcProfileProgress } from '../utils/contentSelector';

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
        aria-label="Menu główne"
      >
        {/* Profile progress bar */}
        <div style={{ marginBottom: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span className="label">Profil odkryty</span>
            <span className="label" style={{ color: 'var(--accent-light)' }}>{progress.toFixed(0)}%</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* 1. Odczyt profilu */}
        <div className="card animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <h2 className="heading-md" style={{ marginBottom: '3px' }}>Odczyt profilu</h2>
            <p className="body-sm">17 pytań. Jeden fragment profilu.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="dashboard-stat-row">
              <span className="label">Testy darmowe</span>
              <span className="label" style={{ color: free_profile_tests_used >= MAX_FREE_TESTS ? 'var(--text-dim)' : 'var(--accent-light)' }}>
                {MAX_FREE_TESTS - free_profile_tests_used}&nbsp;/&nbsp;{MAX_FREE_TESTS} pozostało
              </span>
            </div>
            <div className="dashboard-stat-row">
              <span className="label">Odpowiedzi profilu</span>
              <span className="label" style={{ color: 'var(--text-muted)' }}>{total_answers}</span>
            </div>
            <div className="dashboard-stat-row">
              <span className="label">Status</span>
              <span className="label" style={{ color: profileReady ? 'var(--teal-light)' : 'var(--text-dim)' }}>
                {profileReady ? 'Profil gotowy do odczytu' : 'Profil niegotowy'}
              </span>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={onStartTest}
            disabled={!canStartTest}
            aria-label="Rozpocznij test profilu"
            style={{ opacity: canStartTest ? 1 : 0.4 }}
          >
            {canStartTest ? 'Rozpocznij test' : 'Brak darmowych testów'}
          </button>

          {!canStartTest && (
            <p className="body-sm" style={{ textAlign: 'center', fontSize: '0.75rem' }}>
              Ukończono 3 darmowe testy. Odblokuj premium, żeby kontynuować.
            </p>
          )}
        </div>

        {/* 2. Prawda czy wyzwanie */}
        <div className="card animate-in" style={{ animationDelay: '0.05s', display: 'flex', flexDirection: 'column', gap: '10px', opacity: 0.55 }}>
          <div>
            <h2 className="heading-md" style={{ marginBottom: '3px' }}>Prawda czy wyzwanie</h2>
            <p className="body-sm">Tryb online. Wkrótce.</p>
          </div>
          <button
            className="btn btn-ghost"
            onClick={onTruthOrDare}
            aria-label="Prawda czy wyzwanie — wkrótce"
          >
            Wkrótce
          </button>
        </div>

        {/* 3. Mój profil */}
        <div className="card animate-in" style={{ animationDelay: '0.1s', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2 className="heading-md">Mój profil</h2>
          {missingAnswers > 0 ? (
            <p className="body-sm">
              Brakuje jeszcze <strong style={{ color: 'var(--text)' }}>{missingAnswers}</strong> odpowiedzi do pierwszego odczytu profilu.
            </p>
          ) : (
            <p className="body-sm" style={{ color: 'var(--teal-light)' }}>
              Twój pierwszy odczyt profilu jest gotowy.
            </p>
          )}
          <button
            className="btn btn-ghost"
            onClick={onMyProfile}
            aria-label="Przejdź do mojego profilu"
          >
            {missingAnswers > 0 ? 'Zbierz więcej odpowiedzi' : 'Odczytaj profil'}
          </button>
        </div>

        {/* 4. Ustawienia */}
        <div className="card animate-in" style={{ animationDelay: '0.15s', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h2 className="heading-md" style={{ marginBottom: '4px' }}>Ustawienia</h2>
          <button className="debug-btn" onClick={onExportJson} aria-label="Eksportuj dane sesji jako JSON">↓ Eksportuj dane sesji (JSON)</button>
          <button className="debug-btn" onClick={onResetSession} style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.2)' }} aria-label="Zresetuj lokalną sesję">✕ Reset lokalnej sesji</button>
          <button className="debug-btn" onClick={onLogout} aria-label="Wyloguj się">⎋ Wyloguj się</button>
        </div>
      </main>
    </div>
  );
}
