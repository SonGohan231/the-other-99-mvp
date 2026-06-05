import { useT } from '../context/LangContext';
import { UserProfile } from '../lib/supabase';
import { LegalPage } from '../types';

interface Props {
  userProfile: UserProfile | null;
  isGuest: boolean;
  isPremium: boolean;
  onLogout: () => void;
  onSettings: () => void;
  onSubscription: () => void;
  onLegal: (page: LegalPage) => void;
  onLoginRegister?: () => void;
  onBack: () => void;
}

export default function AccountScreen({
  userProfile,
  isGuest,
  isPremium,
  onLogout,
  onSettings,
  onSubscription,
  onLegal,
  onLoginRegister,
  onBack,
}: Props) {
  const t = useT();

  const statusLabel = isPremium
    ? t.account.statusPremium
    : isGuest
    ? t.account.statusGuest
    : t.account.statusFree;

  const statusColor = isPremium
    ? 'var(--gold)'
    : isGuest
    ? 'var(--text-dim)'
    : 'var(--teal-light)';

  const rowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '13px 0', borderBottom: '1px solid var(--border)',
    fontSize: '0.85rem', color: 'var(--text)', cursor: 'pointer',
  };
  const labelStyle: React.CSSProperties = { color: 'var(--text-muted)', fontSize: '0.75rem' };

  return (
    <div className="screen-centered" style={{ background: 'var(--bg)', alignItems: 'stretch' }}>
      <div style={{ maxWidth: 480, width: '100%', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button
            className="btn btn-ghost"
            onClick={onBack}
            style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            aria-label={t.account.back}
          >
            {t.account.back}
          </button>
          <h1 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            {t.account.profile}
          </h1>
        </div>

        {/* Status card */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: '16px',
        }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
            {t.account.status}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              fontSize: '0.78rem', fontWeight: 700, color: statusColor,
              padding: '3px 10px', borderRadius: '20px',
              background: isPremium ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isPremium ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}`,
            }}>
              {statusLabel}
            </span>
          </div>
          {!isGuest && userProfile?.email && (
            <div style={{ marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span style={labelStyle}>{t.account.email}: </span>{userProfile.email}
            </div>
          )}
          {isGuest && (
            <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              {t.account.noEmail}
            </div>
          )}
        </div>

        {/* Menu rows */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0 20px' }}>
          {isGuest && onLoginRegister && (
            <div style={rowStyle} onClick={onLoginRegister} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onLoginRegister()}>
              <span style={{ color: 'var(--accent-light)', fontWeight: 600 }}>{t.account.loginRegister}</span>
              <span style={{ color: 'var(--text-dim)' }}>›</span>
            </div>
          )}

          {!isPremium && (
            <div style={rowStyle} onClick={onSubscription} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onSubscription()}>
              <span style={{ color: 'var(--gold)' }}>{t.account.manageSubscription}</span>
              <span style={{ color: 'var(--text-dim)' }}>›</span>
            </div>
          )}

          {isPremium && (
            <div style={rowStyle} onClick={onSubscription} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onSubscription()}>
              <span>{t.account.manageSubscription}</span>
              <span style={{ color: 'var(--text-dim)' }}>›</span>
            </div>
          )}

          <div style={rowStyle} onClick={onSettings} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onSettings()}>
            <span>{t.account.settings}</span>
            <span style={{ color: 'var(--text-dim)' }}>›</span>
          </div>

          <div style={rowStyle} onClick={() => onLegal('privacy')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onLegal('privacy')}>
            <span>{t.account.privacy}</span>
            <span style={{ color: 'var(--text-dim)' }}>›</span>
          </div>

          <div style={rowStyle} onClick={() => onLegal('terms')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onLegal('terms')}>
            <span>{t.account.terms}</span>
            <span style={{ color: 'var(--text-dim)' }}>›</span>
          </div>

          <div style={{ ...rowStyle, borderBottom: 'none' }} onClick={() => onLegal('help')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onLegal('help')}>
            <span>{t.account.helpContact}</span>
            <span style={{ color: 'var(--text-dim)' }}>›</span>
          </div>
        </div>

        {!isGuest && (
          <div style={{ marginTop: '16px' }}>
            <button
              className="btn btn-ghost"
              onClick={onLogout}
              style={{ width: '100%', color: '#f87171', borderColor: 'rgba(239,68,68,0.2)' }}
            >
              {t.account.logout}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
