
interface Props {
  onBack: () => void;
}

export default function PremiumPlaceholder({ onBack }: Props) {
  return (
    <div className="screen-centered premium-placeholder">
      <div className="premium-inner animate-in">
        <div className="premium-badge">Wkrótce</div>

        <h2 className="premium-title">Pełny profil w przygotowaniu</h2>

        <p className="premium-note">
          Premium nie jest jeszcze aktywne. Ten ekran służy do testowania
          zainteresowania.
        </p>

        <p
          style={{
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            lineHeight: 1.65,
            textAlign: 'center',
          }}
        >
          Dziękujemy za udział w teście MVP. Twoja sesja i odpowiedzi zostały
          zapisane lokalnie.
        </p>

        <button className="btn btn-ghost" onClick={onBack} style={{ maxWidth: '280px', marginTop: '8px' }}>
          ← Wróć
        </button>
      </div>
    </div>
  );
}
