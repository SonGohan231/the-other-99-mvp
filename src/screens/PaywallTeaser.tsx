
interface Props {
  profileProgress: number;
  onUnlock: () => void;
}

const LOCKED_ITEMS = [
  'Pełny archetyp',
  'Hidden Profile',
  'Human Twin',
  'Rzadkie wzorce odpowiedzi',
  'Archiwum odkryć',
];

export default function PaywallTeaser({ profileProgress, onUnlock }: Props) {
  const displayProgress = Math.min(profileProgress, 34).toFixed(1);

  return (
    <div className="screen-centered paywall-screen">
      <div className="paywall-inner animate-up">
        <div
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: '20px',
            fontSize: '0.65rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--gold-light)',
            alignSelf: 'flex-start',
          }}
        >
          Wykryto wzorzec
        </div>

        <h1 className="paywall-title">
          Odkryliśmy nietypowy układ w Twoim profilu.
        </h1>

        <div className="paywall-stats">
          <div className="paywall-stat">
            <span className="paywall-stat-label">Profil odkryty</span>
            <span className="paywall-stat-value">~{displayProgress}%</span>
          </div>
          <div className="paywall-stat">
            <span className="paywall-stat-label">Rarity Pattern</span>
            <span className="paywall-stat-value" style={{ color: 'var(--teal-light)' }}>
              aktywny
            </span>
          </div>
          <div className="paywall-stat">
            <span className="paywall-stat-label">Hidden Profile</span>
            <span className="paywall-stat-value" style={{ color: 'var(--text-muted)' }}>
              częściowo wykryty
            </span>
          </div>
          <div className="paywall-stat">
            <span className="paywall-stat-label">Archetype Signal</span>
            <span className="paywall-stat-value" style={{ color: 'var(--gold-light)' }}>
              gotowy do odblokowania
            </span>
          </div>
        </div>

        <div className="paywall-locked">
          <p className="paywall-locked-title">Zablokowane</p>
          {LOCKED_ITEMS.map((item) => (
            <div key={item} className="paywall-locked-item">
              <span className="paywall-locked-icon">🔒</span>
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="paywall-cta">
          <button className="btn btn-primary" onClick={onUnlock}>
            Odblokuj pełny profil
          </button>
          <p
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-dim)',
              textAlign: 'center',
            }}
          >
            Odkryj swój archetyp i porównaj z innymi
          </p>
        </div>
      </div>
    </div>
  );
}
