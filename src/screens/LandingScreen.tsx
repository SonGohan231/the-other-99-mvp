
interface Props {
  onStart: () => void;
}

export default function LandingScreen({ onStart }: Props) {
  return (
    <div className="screen-centered landing">
      <div className="landing-inner animate-up">
        <div className="landing-logo">The Other 99</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h1 className="landing-tagline">
            Odkryj, kim naprawdę jesteś na tle innych.
          </h1>
          <p className="landing-subtitle">
            Odpowiadaj. Porównuj. Odkrywaj swój ukryty profil.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '20px', margin: '8px 0' }}>
          {['25-30 pytań', 'Bez rejestracji', 'Prywatnie'].map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: '0.68rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                letterSpacing: '0.06em',
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <button className="btn btn-primary" onClick={onStart} style={{ marginTop: '8px' }}>
          Zacznij odkrywanie
        </button>
      </div>
    </div>
  );
}
