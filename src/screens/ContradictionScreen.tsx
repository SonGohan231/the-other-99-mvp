import type { ContradictionResult, ContradictionSignal, ContradictionLevel } from '../engine/contradictionEngine';

interface Props {
  contradiction: ContradictionResult;
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

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div style={{ height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${score}%`,
        background: color, borderRadius: '2px',
        transition: 'width 0.8s ease',
      }} />
    </div>
  );
}

const LEVEL_CONFIG: Record<ContradictionLevel, {
  headline: string;
  framing: string;
  copy: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  none: {
    headline: 'Highly Consistent',
    framing: 'Your pattern is clear',
    copy: 'Your choices show strong internal alignment. Your answers and behaviors point in a consistent direction — a reliable signal.',
    color: 'var(--teal-light)',
    bgColor: 'rgba(8,145,178,0.06)',
    borderColor: 'rgba(8,145,178,0.2)',
  },
  low: {
    headline: 'Mostly Consistent',
    framing: 'A clear pattern with minor variation',
    copy: 'Your answers show a clear overall direction with a few areas of variation. This is normal — no profile is perfectly uniform.',
    color: 'var(--teal-light)',
    bgColor: 'rgba(8,145,178,0.05)',
    borderColor: 'rgba(8,145,178,0.15)',
  },
  medium: {
    headline: 'Some Complexity',
    framing: 'Your profile holds internal tension',
    copy: 'Your answers show a primary direction, but also carry some internal complexity. You may operate differently depending on context — or hold values in tension with each other.',
    color: 'var(--accent-light)',
    bgColor: 'rgba(124,58,237,0.06)',
    borderColor: 'rgba(124,58,237,0.2)',
  },
  high: {
    headline: 'Significant Depth',
    framing: 'Multiple signals pulling in different ways',
    copy: 'Your profile holds significant internal complexity. This often reflects real-world nuance: someone who navigates competing values, shifts between modes, or has developed an adaptive strategy across different contexts.',
    color: 'var(--gold-light)',
    bgColor: 'rgba(245,158,11,0.06)',
    borderColor: 'rgba(245,158,11,0.2)',
  },
};

const SIGNAL_COPY: Record<ContradictionSignal, { label: string; description: string }> = {
  answer_revision: {
    label: 'Answer revisions',
    description: 'You changed some answers — suggesting you second-guessed your first instinct on certain questions.',
  },
  latency_spike: {
    label: 'Response time variation',
    description: 'Some questions took significantly longer to answer — indicating higher internal processing or uncertainty.',
  },
  opposite_axis_movement: {
    label: 'Opposing signals',
    description: 'Some of your choices pulled in opposite directions on the same dimension.',
  },
  skip_sensitive: {
    label: 'Selective engagement',
    description: 'You chose to pass certain questions — which often signals active filtering around specific topics.',
  },
  return_to_question: {
    label: 'Question revisits',
    description: 'You returned to previous questions — suggesting reconsideration of earlier choices.',
  },
  reverse_pair_mismatch: {
    label: 'Inconsistent patterns',
    description: 'Similar types of questions received different kinds of answers across the session.',
  },
};

const AXIS_NAMES: Record<string, string> = {
  AX01: 'Curiosity ↔ Security',
  AX02: 'Logic ↔ Emotion',
  AX03: 'Independence ↔ Belonging',
  AX04: 'Observation ↔ Action',
  AX05: 'Present ↔ Future',
  AX06: 'Spontaneity ↔ Control',
  AX07: 'Pragmatism ↔ Idealism',
  AX08: 'Stability ↔ Transformation',
  AX09: 'Nature ↔ Technology',
  AX10: 'Idea Creator ↔ Builder',
};

export default function ContradictionScreen({ contradiction, totalAnswers, onBack }: Props) {
  const config = LEVEL_CONFIG[contradiction.level];
  const hasEnoughData = totalAnswers >= 5;
  const activeSignals = contradiction.signals.filter((s) => {
    const count = contradiction.signal_counts[s] ?? 0;
    return count > 0;
  });

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
            textTransform: 'uppercase', color: config.color, marginBottom: '6px',
          }}>
            Internal Pattern
          </p>
          <h1 style={{
            fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em',
            color: 'var(--text)', marginBottom: '4px',
          }}>
            {config.headline}
          </h1>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
            {totalAnswers} answers analyzed
          </p>
        </div>

        {/* Insufficient data */}
        {!hasEnoughData && (
          <GlassCard style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', lineHeight: 1.65 }}>
              Answer at least 5 questions to see your internal pattern analysis.
            </p>
          </GlassCard>
        )}

        {hasEnoughData && (
          <>
            {/* Main framing card */}
            <div style={{
              padding: '20px',
              background: config.bgColor,
              border: `1px solid ${config.borderColor}`,
              borderRadius: '14px',
              marginBottom: '20px',
            }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: config.color, marginBottom: '8px' }}>
                {config.framing}
              </p>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                {config.copy}
              </p>
            </div>

            {/* Consistency score */}
            <GlassCard style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Consistency score</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--teal-light)' }}>
                  {contradiction.consistency_score}%
                </span>
              </div>
              <ScoreBar score={contradiction.consistency_score} color="var(--teal-light)" />
              <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '8px', lineHeight: 1.5 }}>
                How aligned your choices and behavioral signals are with each other.
              </p>
            </GlassCard>

            {/* Engine summary */}
            <GlassCard style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '8px' }}>
                Pattern analysis
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                {contradiction.user_facing_summary}
              </p>
            </GlassCard>

            {/* Primary axis of tension */}
            {contradiction.primary_axis && AXIS_NAMES[contradiction.primary_axis] && (
              <GlassCard style={{ marginBottom: '20px', borderColor: 'rgba(124,58,237,0.15)' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '6px' }}>
                  Primary tension axis
                </p>
                <p style={{ fontSize: '0.88rem', color: 'var(--accent-light)', fontWeight: 600 }}>
                  {AXIS_NAMES[contradiction.primary_axis]}
                </p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '6px', lineHeight: 1.55 }}>
                  This dimension shows the most back-and-forth movement in your pattern.
                </p>
              </GlassCard>
            )}

            {/* Detected signals */}
            {activeSignals.length > 0 && (contradiction.level === 'medium' || contradiction.level === 'high') && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{
                  fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.14em',
                  color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '10px',
                }}>
                  What we observed
                </p>
                {activeSignals.map((signal) => {
                  const copy = SIGNAL_COPY[signal];
                  return (
                    <div key={signal} style={{
                      padding: '12px 14px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '8px',
                      marginBottom: '8px',
                    }}>
                      <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                        {copy.label}
                      </p>
                      <p style={{ fontSize: '0.73rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                        {copy.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Framing note */}
            <GlassCard style={{ background: 'transparent', borderStyle: 'dashed' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', lineHeight: 1.7, fontStyle: 'italic' }}>
                {contradiction.level === 'high'
                  ? 'High internal complexity is not a flaw — it often reflects genuine depth, multiple roles, or adaptive intelligence. The most interesting profiles are rarely simple.'
                  : contradiction.level === 'medium'
                  ? 'Some internal complexity is healthy. It often means you hold real values in tension rather than oversimplifying your own worldview.'
                  : 'A consistent pattern means your choices build on each other in a coherent way. This produces a clear, readable profile signal.'}
              </p>
            </GlassCard>
          </>
        )}

      </main>
    </div>
  );
}
