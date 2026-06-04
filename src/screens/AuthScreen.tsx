import { useState } from 'react';
import { signInWithGoogle, signInWithMagicLink } from '../lib/supabase';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    const { error: err } = await signInWithMagicLink(email.trim());
    setLoading(false);
    if (err) { setError(err); return; }
    setSent(true);
  }

  async function handleGoogle() {
    setLoading(true);
    await signInWithGoogle();
  }

  return (
    <div className="screen-centered" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.08) 0%, transparent 65%), var(--bg)' }}>
      <main className="auth-inner animate-up" aria-label="Logowanie">
        <div className="age-gate-logo">The Other 99</div>

        {sent ? (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>
              Sprawdź swoją skrzynkę
            </p>
            <p className="body-sm">
              Wysłaliśmy link logowania na <strong style={{ color: 'var(--text)' }}>{email}</strong>.
              Kliknij go, żeby wejść do aplikacji.
            </p>
            <button className="btn btn-ghost" onClick={() => setSent(false)} style={{ marginTop: '8px' }}>
              Wróć
            </button>
          </div>
        ) : (
          <>
            <button
              className="btn btn-primary"
              onClick={handleGoogle}
              disabled={loading}
              aria-label="Zaloguj się przez Google"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Zaloguj się przez Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', maxWidth: '360px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span className="label">lub</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            <form onSubmit={handleMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '360px' }}>
              <label htmlFor="auth-email" className="label" style={{ textAlign: 'left' }}>
                Email — otrzymasz link logowania
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="twoj@email.com"
                required
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--text)',
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              />
              {error && (
                <p style={{ fontSize: '0.78rem', color: '#f87171' }}>{error}</p>
              )}
              <button className="btn btn-ghost" type="submit" disabled={loading || !email.trim()}>
                {loading ? 'Wysyłanie…' : 'Wyślij link logowania'}
              </button>
            </form>

            <p className="body-sm" style={{ textAlign: 'center', fontSize: '0.7rem' }}>
              Aplikacja 18+. Rejestracja = akceptacja warunków testowania MVP.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
