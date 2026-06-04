interface Props {
  onBack: () => void;
}

export default function TruthOrDareScreen({ onBack }: Props) {
  return (
    <div className="screen-centered" style={{ background: 'var(--bg)' }}>
      <main className="premium-inner animate-in" aria-label="Prawda czy wyzwanie">
        <div className="premium-badge">Wkrótce</div>

        <h1 className="premium-title">Prawda czy wyzwanie</h1>

        <p className="premium-note" style={{ textAlign: 'left' }}>
          Tryb towarzyski z weryfikacją online, zdjęciami i trybem dla wielu graczy jest w przygotowaniu.
          <br /><br />
          Na razie dostępny jest tylko tryb odczytu profilu.
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
            <span>Tryb online</span>
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
            <span>Weryfikacja zdjęciami</span>
          </div>
        </div>

        <button
          className="btn btn-ghost"
          onClick={onBack}
          style={{ maxWidth: '280px', marginTop: '8px' }}
          aria-label="Wróć do menu"
        >
          ← Wróć
        </button>
      </main>
    </div>
  );
}
