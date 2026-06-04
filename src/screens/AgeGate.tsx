
interface Props {
  onConfirm: () => void;
}

export default function AgeGate({ onConfirm }: Props) {
  return (
    <div className="screen-centered age-gate">
      <div className="age-gate-inner animate-in">
        <div className="age-gate-logo">The Other 99</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p className="age-gate-title" style={{ fontSize: '1.05rem', color: 'var(--text)', fontWeight: 500 }}>
            The Other 99 jest doświadczeniem psychologicznym dla osób dorosłych.
          </p>
          <p className="age-gate-title">
            Niektóre treści mogą być intensywne emocjonalnie.
          </p>
        </div>

        <div
          style={{
            width: '40px',
            height: '1px',
            background: 'var(--border-accent)',
            margin: '4px auto',
          }}
        />

        <button className="btn btn-primary" onClick={onConfirm} style={{ marginTop: '4px' }}>
          Mam 18+ i wchodzę
        </button>

        <p className="body-sm" style={{ fontSize: '0.72rem', maxWidth: '280px', textAlign: 'center' }}>
          Klikając, potwierdzasz, że masz ukończone 18 lat.
        </p>
      </div>
    </div>
  );
}
