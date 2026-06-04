import { useT } from '../context/LangContext';

interface Props {
  onBack: () => void;
}

export default function PremiumPlaceholder({ onBack }: Props) {
  const t = useT();
  return (
    <div className="screen-centered premium-placeholder">
      <div className="premium-inner animate-in">
        <div className="premium-badge">{t.premium.badge}</div>

        <h2 className="premium-title">{t.premium.title}</h2>

        <p className="premium-note">{t.premium.note}</p>

        <p
          style={{
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            lineHeight: 1.65,
            textAlign: 'center',
          }}
        >
          {t.premium.thanks}
        </p>

        <button className="btn btn-ghost" onClick={onBack} style={{ maxWidth: '280px', marginTop: '8px' }}>
          {t.premium.back}
        </button>
      </div>
    </div>
  );
}
