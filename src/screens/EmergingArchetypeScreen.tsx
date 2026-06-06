import type { EmergingArchetypeResult, ArchetypeConfidence } from '../engine/emergingArchetype';
import { getProfileConfidence } from '../utils/profileConfidence';

interface Props {
  archetype: EmergingArchetypeResult;
  totalAnswers: number;
  onBack: () => void;
}

function confidenceHeadline(confidence: ArchetypeConfidence): string {
  if (confidence === 'very_low') return 'Signal Forming';
  if (confidence === 'low') return 'Current Signal';
  if (confidence === 'forming') return 'Emerging Pattern';
  return 'Strong Archetype Signal';
}

function confidenceColor(confidence: ArchetypeConfidence): string {
  if (confidence === 'very_low') return 'rgba(255,255,255,0.35)';
  if (confidence === 'low') return 'var(--text-muted)';
  if (confidence === 'forming') return 'var(--accent-light)';
  return 'var(--gold-light)';
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

function ScoreBar({ score, color, animated }: { score: number; color: string; animated?: boolean }) {
  return (
    <div style={{ height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${score}%`,
        background: color, borderRadius: '2px',
        transition: animated ? 'width 0.8s ease' : 'none',
      }} />
    </div>
  );
}

export default function EmergingArchetypeScreen({ archetype, totalAnswers, onBack }: Props) {
  const conf = getProfileConfidence(totalAnswers);
  const headline = confidenceHeadline(archetype.confidence);
  const headlineColor = confidenceColor(archetype.confidence);

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
            textTransform: 'uppercase', color: headlineColor, marginBottom: '6px',
          }}>
            {headline}
          </p>
          <h1 style={{
            fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em',
            color: 'var(--text)', marginBottom: '4px',
          }}>
            Archetype
          </h1>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
            {conf.label} · {totalAnswers} answers
          </p>
        </div>

        {/* Very low confidence: no pattern yet */}
        {archetype.confidence === 'very_low' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: '2.4rem', marginBottom: '16px', color: 'rgba(255,255,255,0.15)' }}>◌</div>
            <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px' }}>
              Not enough signal yet
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.7, maxWidth: '280px', margin: '0 auto' }}>
              {archetype.confidence_reason}
            </p>
          </div>
        )}

        {/* Low confidence: basic direction */}
        {archetype.confidence === 'low' && (
          <>
            <GlassCard style={{ marginBottom: '20px', borderColor: 'rgba(124,58,237,0.15)' }}>
              <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '10px' }}>
                A direction is appearing
              </p>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                {archetype.primary.name}
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.65 }}>
                {archetype.user_facing_summary}
              </p>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '10px', fontStyle: 'italic' }}>
                {archetype.confidence_reason}
              </p>
            </GlassCard>
          </>
        )}

        {/* Forming confidence: emerging pattern */}
        {archetype.confidence === 'forming' && (
          <>
            <GlassCard style={{ marginBottom: '20px', borderColor: 'rgba(124,58,237,0.22)' }}>
              <div style={{ marginBottom: '14px' }}>
                <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent-light)', marginBottom: '8px' }}>
                  Primary
                </p>
                <p style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>
                  {archetype.primary.name}
                </p>
                <ScoreBar score={archetype.primary.percentage} color="var(--accent-light)" animated />
                <p style={{ fontSize: '0.62rem', color: 'var(--accent-light)', marginTop: '4px', textAlign: 'right' }}>
                  {archetype.primary.percentage}%
                </p>
              </div>

              <div>
                <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '8px' }}>
                  Secondary
                </p>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  {archetype.secondary.name}
                </p>
                <ScoreBar score={archetype.secondary.percentage} color="var(--teal-light)" animated />
              </div>
            </GlassCard>

            <GlassCard style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '6px' }}>
                Blend signal
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '10px' }}>
                {archetype.blend_label}
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.65 }}>
                {archetype.user_facing_summary}
              </p>
            </GlassCard>
          </>
        )}

        {/* Stable / strong: full display */}
        {(archetype.confidence === 'stable' || archetype.confidence === 'strong') && (
          <>
            {/* Primary archetype hero */}
            <div style={{
              padding: '24px 20px',
              background: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(124,58,237,0.04) 100%)',
              border: '1px solid rgba(124,58,237,0.28)',
              borderRadius: '16px',
              marginBottom: '16px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent-light)', marginBottom: '12px' }}>
                {archetype.confidence === 'strong' ? 'Dominant Archetype' : 'Leading Archetype'}
              </p>
              <h2 style={{
                fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)',
                letterSpacing: '-0.02em', marginBottom: '4px',
              }}>
                {archetype.primary.name}
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--accent-light)', marginBottom: '14px' }}>
                {archetype.primary.percentage}% signal strength
              </p>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden', margin: '0 16px' }}>
                <div style={{ height: '100%', width: `${archetype.primary.percentage}%`, background: 'var(--accent-light)', borderRadius: '2px' }} />
              </div>
            </div>

            {/* Secondary */}
            <GlassCard style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <p style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '4px' }}>
                    Secondary
                  </p>
                  <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {archetype.secondary.name}
                  </p>
                </div>
                <span style={{ fontSize: '0.82rem', color: 'var(--teal-light)', fontWeight: 700 }}>
                  {archetype.secondary.percentage}%
                </span>
              </div>
              <ScoreBar score={archetype.secondary.percentage} color="var(--teal-light)" animated />
            </GlassCard>

            {/* Blend + summary */}
            <GlassCard style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '6px' }}>
                Blend
              </p>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '12px' }}>
                {archetype.blend_label}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                {archetype.user_facing_summary}
              </p>
            </GlassCard>

            {/* All archetype scores */}
            <div style={{ marginBottom: '20px' }}>
              <p style={{
                fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.14em',
                color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '12px',
              }}>
                Full pattern breakdown
              </p>
              <GlassCard>
                {archetype.all_scores.slice(0, 6).map((score, i) => (
                  <div key={score.id} style={{ marginBottom: i < 5 ? '10px' : '0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                      <span style={{
                        fontSize: '0.73rem',
                        color: i === 0 ? 'var(--text)' : i === 1 ? 'var(--text-muted)' : 'var(--text-dim)',
                        fontWeight: i === 0 ? 600 : 400,
                      }}>
                        {score.name}
                      </span>
                      <span style={{
                        fontSize: '0.65rem',
                        color: i === 0 ? 'var(--accent-light)' : i === 1 ? 'var(--teal-light)' : 'var(--text-dim)',
                      }}>
                        {score.percentage}%
                      </span>
                    </div>
                    <ScoreBar
                      score={score.percentage}
                      color={i === 0 ? 'var(--accent-light)' : i === 1 ? 'var(--teal-light)' : 'rgba(255,255,255,0.12)'}
                      animated
                    />
                  </div>
                ))}
              </GlassCard>
            </div>
          </>
        )}

        {/* Confidence note */}
        <GlassCard style={{ background: 'transparent', borderStyle: 'dashed' }}>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.65, fontStyle: 'italic' }}>
            {archetype.confidence_reason}
          </p>
          <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)', marginTop: '8px' }}>
            Archetype direction may shift as more answers are added.
          </p>
        </GlassCard>

      </main>
    </div>
  );
}
