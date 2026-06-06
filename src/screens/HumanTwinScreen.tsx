import type { HumanTwinResult } from '../engine/humanTwin';

interface Props {
  humanTwin: HumanTwinResult;
  totalAnswers: number;
  onBack: () => void;
}

function GlassCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      padding: '16px 18px',
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px',
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em',
      color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '10px',
    }}>
      {children}
    </p>
  );
}

function SimilarityRing({ pct }: { pct: number }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: '96px', height: '96px', margin: '0 auto 20px' }}>
      <svg width="96" height="96" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <circle
          cx="48" cy="48" r={r} fill="none"
          stroke="var(--gold-light)" strokeWidth="5"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct / 100)}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold-light)' }}>{pct}%</span>
      </div>
    </div>
  );
}

export default function HumanTwinScreen({ humanTwin, totalAnswers, onBack }: Props) {
  const remaining25 = Math.max(0, 25 - totalAnswers);
  const remaining51 = Math.max(0, 51 - totalAnswers);

  return (
    <div className="screen" style={{ background: 'var(--bg)', minHeight: '100dvh', overflowY: 'auto' }}>
      <main style={{
        maxWidth: '480px', margin: '0 auto', width: '100%',
        padding: '20px 20px 60px',
        display: 'flex', flexDirection: 'column', gap: '0',
      }}>

        {/* Back */}
        <button
          onClick={onBack}
          className="tappable"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-dim)', fontSize: '0.78rem',
            padding: '4px 0 20px', textAlign: 'left',
          }}
        >
          ← Back
        </button>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <p style={{
            fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: humanTwin.tier === 'locked' ? 'var(--text-dim)'
              : humanTwin.tier === 'preview' ? 'var(--accent-light)'
              : 'var(--gold-light)',
            marginBottom: '6px',
          }}>
            {humanTwin.tier === 'locked' ? 'Locked'
              : humanTwin.tier === 'preview' ? 'Early Preview'
              : humanTwin.tier === 'meaningful' ? 'Projected Match'
              : 'Strong Match'}
          </p>
          <h1 style={{
            fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em',
            color: 'var(--text)', marginBottom: '4px',
          }}>
            Human Twin
          </h1>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
            {totalAnswers} answers · estimated match
          </p>
        </div>

        {/* LOCKED */}
        {humanTwin.tier === 'locked' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: '2.4rem', marginBottom: '16px', color: 'rgba(255,255,255,0.12)' }}>◎</div>
            <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px' }}>
              No match yet
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.7, maxWidth: '280px', margin: '0 auto 24px' }}>
              Answer <strong style={{ color: 'var(--text)' }}>{remaining25} more</strong> to unlock your first projected profile match.
            </p>
            <GlassCard style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '12px' }}>
                How it works
              </p>
              {[
                '25 answers → first estimated match',
                '51 answers → meaningful similarity score',
                '100 answers → strong projected pattern',
              ].map((line) => (
                <div key={line} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--accent-light)', fontSize: '0.7rem' }}>◈</span>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>{line}</span>
                </div>
              ))}
            </GlassCard>
          </div>
        )}

        {/* PREVIEW */}
        {humanTwin.tier === 'preview' && (
          <div className="animate-in">
            <GlassCard style={{ marginBottom: '20px', borderColor: 'rgba(124,58,237,0.2)' }}>
              <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent-light)', marginBottom: '10px' }}>
                Closest projected profile
              </p>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
                {humanTwin.closest_reference_name}
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.65 }}>
                {humanTwin.user_facing_summary}
              </p>
            </GlassCard>

            <GlassCard style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', lineHeight: 1.65 }}>
                Answer <strong style={{ color: 'var(--text)' }}>{remaining51} more</strong> to unlock a similarity score and shared patterns.
              </p>
            </GlassCard>
          </div>
        )}

        {/* MEANINGFUL / STRONG */}
        {(humanTwin.tier === 'meaningful' || humanTwin.tier === 'strong') && (
          <>
            {/* Similarity ring */}
            <div className="animate-in" style={{ textAlign: 'center', marginBottom: '20px' }}>
              <SimilarityRing pct={humanTwin.similarity_percent} />
              <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '4px' }}>
                Estimated similarity
              </p>
              <p className="animate-blur-in" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', animationDelay: '0.15s' }}>
                {humanTwin.closest_reference_name}
              </p>
            </div>

            {/* Summary */}
            <GlassCard style={{ marginBottom: '16px', borderColor: 'rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.04)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                {humanTwin.user_facing_summary}
              </p>
            </GlassCard>

            {/* Shared patterns */}
            {humanTwin.shared_patterns.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <SectionLabel>Shared patterns</SectionLabel>
                <GlassCard>
                  {humanTwin.shared_patterns.map((pattern) => (
                    <div key={pattern} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--teal-light)', fontSize: '0.7rem', marginTop: '1px' }}>◆</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{pattern}</span>
                    </div>
                  ))}
                </GlassCard>
              </div>
            )}

            {/* Differences */}
            {humanTwin.differences.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <SectionLabel>Key differences</SectionLabel>
                <GlassCard>
                  {humanTwin.differences.map((diff) => (
                    <div key={diff} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem', marginTop: '1px' }}>◌</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>{diff}</span>
                    </div>
                  ))}
                </GlassCard>
              </div>
            )}
          </>
        )}

        {/* Always-visible disclaimer */}
        {humanTwin.tier !== 'locked' && (
          <GlassCard style={{ background: 'transparent', borderStyle: 'dashed', marginTop: '8px' }}>
            <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', lineHeight: 1.65, fontStyle: 'italic' }}>
              This match is projected from archetypal reference patterns — not from real user data. It is an estimate and will be updated as population data becomes available.
            </p>
          </GlassCard>
        )}

      </main>
    </div>
  );
}
