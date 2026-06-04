import { useT } from '../context/LangContext';

interface Props {
  onConfirm: () => void;
}

export default function AgeGate({ onConfirm }: Props) {
  const t = useT();
  return (
    <div className="screen-centered age-gate">
      <div className="age-gate-inner animate-in">
        <div className="age-gate-logo">The Other 99</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p className="age-gate-title" style={{ fontSize: '1.05rem', color: 'var(--text)', fontWeight: 500 }}>
            {t.ageGate.description}
          </p>
          <p className="age-gate-title">
            {t.ageGate.intensity}
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
          {t.ageGate.button}
        </button>

        <p className="body-sm" style={{ fontSize: '0.72rem', maxWidth: '280px', textAlign: 'center' }}>
          {t.ageGate.confirm}
        </p>
      </div>
    </div>
  );
}
