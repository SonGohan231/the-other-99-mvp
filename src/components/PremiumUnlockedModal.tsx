import { useT } from '../context/LangContext';

const SEEN_KEY = 'to99_premium_unlocked_seen';

export function markPremiumUnlockedSeen(): void {
  try { localStorage.setItem(SEEN_KEY, 'true'); } catch { /* ignore */ }
}

export function hasPremiumUnlockedBeenSeen(): boolean {
  try { return localStorage.getItem(SEEN_KEY) === 'true'; } catch { return false; }
}

export function resetPremiumUnlockedSeen(): void {
  try { localStorage.removeItem(SEEN_KEY); } catch { /* ignore */ }
}

interface Props {
  onClose: () => void;
  onOpenPremiumDepth: () => void;
}

export default function PremiumUnlockedModal({ onClose, onOpenPremiumDepth }: Props) {
  const t = useT();

  const MODULE_IDS = [
    'shadowProfile', 'maskVsCore', 'contradictions', 'futureSelf',
    'relationshipMode', 'humanTwin', 'hiddenParameters', 'profileEvolution',
  ];

  function handleClose() {
    markPremiumUnlockedSeen();
    onClose();
  }

  function handleOpen() {
    markPremiumUnlockedSeen();
    onOpenPremiumDepth();
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, var(--bg-elevated) 0%, rgba(124,58,237,0.15) 100%)',
          border: '1px solid rgba(245,158,11,0.4)',
          borderRadius: 'var(--radius)',
          padding: '28px 24px',
          maxWidth: 420,
          width: '100%',
          boxShadow: '0 0 60px rgba(124,58,237,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          display: 'inline-block', padding: '4px 14px', marginBottom: '14px',
          background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)',
          borderRadius: '20px', fontSize: '0.65rem', fontWeight: 700,
          color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          {t.premiumBadge.active}
        </div>

        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
          {t.premiumUnlocked.title}
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
          {t.premiumUnlocked.subtitle}
        </p>

        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
          {t.premiumUnlocked.modulesLabel}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '22px' }}>
          {MODULE_IDS.map((id) => {
            const mod = (t.premiumModules as Record<string, { title: string }>)[id];
            return mod ? (
              <span key={id} style={{
                padding: '4px 10px', fontSize: '0.72rem', fontWeight: 600,
                background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)',
                borderRadius: '20px', color: 'var(--accent-light)',
              }}>
                {mod.title}
              </span>
            ) : null;
          })}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1, background: 'var(--gold)', color: '#1a1a1f', fontWeight: 700 }}
            onClick={handleOpen}
          >
            {t.premiumUnlocked.cta}
          </button>
          <button className="btn btn-ghost" onClick={handleClose} style={{ flex: '0 0 auto' }}>
            {t.premiumUnlocked.close}
          </button>
        </div>
      </div>
    </div>
  );
}
