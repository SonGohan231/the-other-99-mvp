import { useT } from '../context/LangContext';

interface Props {
  onBack: () => void;
}

export default function TruthOrDareScreen({ onBack }: Props) {
  const t = useT();
  return (
    <div className="screen-centered" style={{ background: 'var(--bg)' }}>
      <main className="premium-inner animate-in" aria-label={t.truthOrDare.ariaLabel}>
        <div className="premium-badge">{t.truthOrDare.badge}</div>

        <h1 className="premium-title">{t.truthOrDare.title}</h1>

        <p className="premium-note" style={{ textAlign: 'left', whiteSpace: 'pre-line' }}>
          {t.truthOrDare.description}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '320px' }}>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '11px 14px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.87rem', color: 'var(--text-dim)',
            }}
          >
            <span style={{ opacity: 0.5 }}>🔒</span>
            <span>{t.truthOrDare.onlineMode}</span>
          </div>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '11px 14px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.87rem', color: 'var(--text-dim)',
            }}
          >
            <span style={{ opacity: 0.5 }}>🔒</span>
            <span>{t.truthOrDare.photoVerification}</span>
          </div>
        </div>

        <button
          className="btn btn-ghost"
          onClick={onBack}
          style={{ maxWidth: '280px', marginTop: '8px' }}
          aria-label={t.truthOrDare.back}
        >
          {t.truthOrDare.back}
        </button>
      </main>
    </div>
  );
}
