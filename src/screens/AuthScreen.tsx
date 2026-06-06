import { useState } from 'react';
import { signInWithGoogle, signInWithMagicLink, signInWithPassword, signUpWithPassword } from '../lib/supabase';
import { useT } from '../context/LangContext';

interface Props {
  onTestMode?: () => void;
  onGuest?: () => void;
}

type AuthTab = 'signin' | 'register';

export default function AuthScreen({ onTestMode, onGuest }: Props) {
  const t = useT();
  const [tab, setTab] = useState<AuthTab>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [sent, setSent] = useState(false);
  const [confirmationNeeded, setConfirmationNeeded] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  function resetForm() {
    setFormError(null);
    setSent(false);
    setConfirmationNeeded(false);
  }

  function handleTabChange(newTab: AuthTab) {
    setTab(newTab);
    setShowMagicLink(false);
    resetForm();
  }

  async function handleEmailPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    if (password.length < 6) { setFormError(t.auth.passwordMinLength); return; }
    setFormError(null);
    setLoading(true);
    try {
      if (tab === 'register') {
        const { error, needsConfirmation } = await signUpWithPassword(email.trim(), password);
        if (error) { setFormError(error); return; }
        if (needsConfirmation) setConfirmationNeeded(true);
      } else {
        const { error } = await signInWithPassword(email.trim(), password);
        if (error) { setFormError(error); }
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t.auth.genericError);
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setFormError(null);
    setLoading(true);
    try {
      const { error } = await signInWithMagicLink(email.trim());
      if (error) { setFormError(error); return; }
      setSent(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t.auth.genericError);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleError(null);
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        if (error === 'Supabase not configured') {
          setGoogleError(t.auth.googleNotConfigured);
        } else if (error.toLowerCase().includes('provider') || error.toLowerCase().includes('not enabled')) {
          setGoogleError(t.auth.googleProviderDisabled);
        } else {
          setGoogleError(error);
        }
      }
    } catch (err) {
      setGoogleError(err instanceof Error ? err.message : t.auth.genericError);
    } finally {
      setGoogleLoading(false);
    }
  }

  const isRateLimit = formError != null && (
    formError.toLowerCase().includes('rate') ||
    formError.includes('429') ||
    formError.toLowerCase().includes('too many')
  );

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px',
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: '0.95rem',
    outline: 'none', boxSizing: 'border-box',
  };

  if (confirmationNeeded) {
    return (
      <div className="screen-centered" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.08) 0%, transparent 65%), var(--bg)' }}>
        <main className="auth-inner animate-up">
          <div className="age-gate-logo">The Other 99</div>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>{t.auth.confirmTitle}</p>
            <p className="body-sm">
              {t.auth.confirmBody}{' '}<strong style={{ color: 'var(--text)' }}>{email}</strong>.
              <br />{t.auth.confirmNote}
            </p>
            <button className="btn btn-ghost" onClick={() => setConfirmationNeeded(false)} style={{ marginTop: '8px' }}>
              {t.auth.back}
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="screen-centered" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.08) 0%, transparent 65%), var(--bg)' }}>
        <main className="auth-inner animate-up">
          <div className="age-gate-logo">The Other 99</div>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>{t.auth.sentTitle}</p>
            <p className="body-sm">
              {t.auth.sentBody}{' '}<strong style={{ color: 'var(--text)' }}>{email}</strong>.
              <br />{t.auth.sentNote}
            </p>
            <button className="btn btn-ghost" onClick={() => setSent(false)} style={{ marginTop: '8px' }}>{t.auth.back}</button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="screen-centered" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.08) 0%, transparent 65%), var(--bg)' }}>
      <main className="auth-inner animate-up">
        <div className="age-gate-logo">The Other 99</div>

        {/* Google */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '360px' }}>
          <button className="btn btn-primary" onClick={handleGoogle} disabled={googleLoading || loading} aria-label={t.auth.googleButton}>
            {googleLoading ? t.auth.googleConnecting : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {t.auth.googleButton}
              </>
            )}
          </button>
          {googleError && <p style={{ fontSize: '0.78rem', color: '#f87171', textAlign: 'center' }} role="alert">{googleError}</p>}
        </div>

        {/* OR divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', maxWidth: '360px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span className="label">{t.auth.orDivider}</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', width: '100%', maxWidth: '360px', background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '4px' }}>
          {(['signin', 'register'] as AuthTab[]).map((t2) => (
            <button
              key={t2}
              type="button"
              onClick={() => handleTabChange(t2)}
              style={{
                flex: 1, padding: '8px', fontSize: '0.8rem',
                fontWeight: tab === t2 ? 600 : 400,
                background: tab === t2 ? 'var(--accent)' : 'transparent',
                color: tab === t2 ? '#fff' : 'var(--text-muted)',
                border: 'none', borderRadius: 'calc(var(--radius) - 2px)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {t2 === 'signin' ? t.auth.signInTab : t.auth.createAccountTab}
            </button>
          ))}
        </div>

        {/* Email + Password form */}
        {!showMagicLink ? (
          <form onSubmit={handleEmailPassword} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '360px' }} noValidate>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.auth.emailPlaceholder}
              required
              autoComplete="email"
              disabled={loading}
              style={{ ...inputStyle, opacity: loading ? 0.6 : 1 }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.auth.passwordPlaceholder}
              required
              autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
              disabled={loading}
              style={{ ...inputStyle, opacity: loading ? 0.6 : 1 }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            />
            {formError && (
              <p style={{ color: '#f87171', fontSize: '0.75rem' }} role="alert">
                {isRateLimit ? t.auth.rateLimitError : formError}
              </p>
            )}
            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading || !email.trim() || !password}
            >
              {loading ? t.auth.sending : (tab === 'register' ? t.auth.createAccountButton : t.auth.signInButton)}
            </button>
            {tab === 'signin' && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => { setShowMagicLink(true); resetForm(); }}
                style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}
              >
                {t.auth.forgotPasswordLink}
              </button>
            )}
          </form>
        ) : (
          <form onSubmit={handleMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '360px' }} noValidate>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>{t.auth.magicLinkNote}</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.auth.emailPlaceholder}
              required
              autoComplete="email"
              disabled={loading}
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            />
            {formError && <p style={{ color: '#f87171', fontSize: '0.75rem' }} role="alert">{isRateLimit ? t.auth.rateLimitError : formError}</p>}
            <button className="btn btn-ghost" type="submit" disabled={loading || !email.trim()}>
              {loading ? t.auth.sending : t.auth.sendButton}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => { setShowMagicLink(false); resetForm(); }} style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              {t.auth.back}
            </button>
          </form>
        )}

        <p className="body-sm" style={{ textAlign: 'center', fontSize: '0.7rem' }}>{t.auth.footer}</p>

        {/* Guest mode */}
        {onGuest && (
          <div style={{ width: '100%', maxWidth: '360px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              className="btn btn-ghost"
              onClick={onGuest}
              style={{ width: '100%', fontSize: '0.82rem', color: 'var(--text-dim)' }}
            >
              {t.auth.guestButton}
            </button>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textAlign: 'center' }}>{t.auth.guestNote}</p>
          </div>
        )}

        {/* Dev test mode (debug_mode flag only) */}
        {(() => {
          const debugMode = typeof localStorage !== 'undefined' && localStorage.getItem('to99_debug_mode') === 'true';
          return debugMode && onTestMode ? (
            <div style={{ width: '100%', maxWidth: '360px' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textAlign: 'center', marginBottom: '6px' }}>
                {t.auth.testModeNote}
              </p>
              <button
                className="btn btn-ghost"
                onClick={onTestMode}
                style={{ width: '100%', fontSize: '0.78rem', color: 'var(--text-dim)' }}
              >
                {t.auth.testModeButton}
              </button>
            </div>
          ) : null;
        })()}
      </main>
    </div>
  );
}
