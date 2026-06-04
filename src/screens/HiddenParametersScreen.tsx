import { ProfileVector } from '../utils/profileVector';
import { computeHiddenParameters, ParameterLevel } from '../utils/hiddenParameters';

interface Props {
  profileVector: ProfileVector;
  onBack: () => void;
}

function levelColor(lv: ParameterLevel): string {
  if (lv === 'Low') return 'rgba(107,114,128,0.5)';
  if (lv === 'High') return 'var(--teal-light)';
  return 'var(--accent-light)';
}

function barColor(lv: ParameterLevel): string {
  if (lv === 'Low') return 'rgba(107,114,128,0.4)';
  if (lv === 'High') return 'var(--teal-light)';
  return 'var(--accent-light)';
}

export default function HiddenParametersScreen({ profileVector, onBack }: Props) {
  const params = computeHiddenParameters(profileVector);

  return (
    <div
      className="screen"
      style={{
        background: 'var(--bg)',
        minHeight: '100dvh',
        overflowY: 'auto',
      }}
    >
      <main
        style={{
          maxWidth: '480px',
          margin: '0 auto',
          width: '100%',
          padding: '20px 20px 48px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0',
        }}
      >
        {/* Back */}
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-dim)',
            fontSize: '0.82rem',
            cursor: 'pointer',
            padding: '0 0 20px 0',
            textAlign: 'left',
          }}
        >
          ← Back
        </button>

        {/* Header */}
        <h1 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '0.02em', marginBottom: '6px' }}>
          HIDDEN PARAMETERS
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '24px', lineHeight: 1.5, fontStyle: 'italic' }}>
          Internal behavioral signals derived from your answers.
        </p>

        <div style={{ height: '1px', background: 'var(--border)', marginBottom: '8px' }} />

        {/* Parameter list */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {params.map((p) => (
            <div
              key={p.id}
              style={{
                padding: '16px 0',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              {/* Name + Level */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>
                  {p.name}
                </span>
                <span style={{
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: levelColor(p.level),
                  padding: '2px 6px',
                  border: `1px solid ${levelColor(p.level)}`,
                  borderRadius: '4px',
                  opacity: 0.8,
                }}>
                  {p.level}
                </span>
              </div>

              {/* Bar */}
              <div
                style={{
                  height: '4px',
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  marginBottom: '8px',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${p.value}%`,
                    background: barColor(p.level),
                    borderRadius: '2px',
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>

              {/* Description */}
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.5, fontStyle: 'italic' }}>
                "{p.description}"
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
