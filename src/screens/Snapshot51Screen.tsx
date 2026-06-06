import type { Snapshot51Result } from '../engine/snapshot51';
import { getProfileConfidence, TIER_COLOR } from '../utils/profileConfidence';

interface Props {
  snapshot: Snapshot51Result;
  totalAnswers: number;
  onBack: () => void;
  onStartTest?: () => void;
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

function GlassCard({ children, accent, gold, style }: {
  children: React.ReactNode;
  accent?: boolean;
  gold?: boolean;
  style?: React.CSSProperties;
}) {
  const border = gold
    ? '1px solid rgba(245,158,11,0.25)'
    : accent
    ? '1px solid rgba(124,58,237,0.25)'
    : '1px solid rgba(255,255,255,0.06)';
  const bg = gold
    ? 'rgba(245,158,11,0.06)'
    : accent
    ? 'rgba(124,58,237,0.07)'
    : 'rgba(255,255,255,0.025)';
  return (
    <div style={{ padding: '16px 18px', background: bg, border, borderRadius: '12px', ...style }}>
      {children}
    </div>
  );
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div style={{
      height: '4px', borderRadius: '2px',
      background: 'rgba(255,255,255,0.08)',
      marginTop: '8px', overflow: 'hidden',
    }}>
      <div style={{
        height: '100%', width: `${score}%`,
        background: color,
        borderRadius: '2px',
        transition: 'width 0.6s ease',
      }} />
    </div>
  );
}

function AxisStrengthBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, Math.round(Math.abs(value) * 100));
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{pct}%</span>
      </div>
      <div style={{ height: '3px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: 'var(--accent-light)',
          borderRadius: '2px',
          transition: 'width 0.8s ease',
        }} />
      </div>
    </div>
  );
}

function LockedState({ totalAnswers, onStartTest }: { totalAnswers: number; onStartTest?: () => void }) {
  const remaining = Math.max(0, 51 - totalAnswers);
  const conf = getProfileConfidence(totalAnswers);
  const pct = Math.round((totalAnswers / 51) * 100);

  return (
    <div style={{ textAlign: 'center', padding: '40px 0 32px' }}>
      {/* Progress ring (CSS-based) */}
      <div style={{ position: 'relative', width: '96px', height: '96px', margin: '0 auto 24px' }}>
        <svg width="96" height="96" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
          <circle
            cx="48" cy="48" r="42" fill="none"
            stroke="var(--accent-light)" strokeWidth="5"
            strokeDasharray={`${2 * Math.PI * 42}`}
            strokeDashoffset={`${2 * Math.PI * 42 * (1 - pct / 100)}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>{pct}%</span>
        </div>
      </div>

      <p style={{
        fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: TIER_COLOR[conf.tier], marginBottom: '8px',
      }}>
        {conf.label}
      </p>
      <h2 style={{
        fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)',
        lineHeight: 1.25, marginBottom: '8px',
      }}>
        Snapshot 51
      </h2>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '280px', margin: '0 auto 24px' }}>
        Answer <strong style={{ color: 'var(--text)' }}>{remaining} more</strong> to unlock your full profile snapshot.
      </p>

      <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', lineHeight: 1.65, marginBottom: '20px' }}>
        {conf.description}
      </p>

      {/* What's inside teaser */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px', padding: '16px 18px',
        textAlign: 'left', marginBottom: '24px',
      }}>
        <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '12px' }}>
          Unlocks at 51 answers
        </p>
        {[
          'Primary + Secondary Archetype',
          'Confidence level and direction',
          'Top 3 strongest axes',
          'Unresolved dimensions',
          'Hidden Parameter summary',
          'Contradiction analysis',
          'Closest projected profile',
          'Growth direction hint',
        ].map((item) => (
          <div key={item} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '8px',
          }}>
            <span style={{ color: 'var(--accent-light)', fontSize: '0.7rem' }}>◈</span>
            <span style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.35)' }}>{item}</span>
          </div>
        ))}
      </div>

      {onStartTest && (
        <button
          className="btn btn-primary tappable"
          onClick={onStartTest}
          style={{ minWidth: '200px', marginBottom: '12px' }}
        >
          Continue answering
        </button>
      )}
    </div>
  );
}

export default function Snapshot51Screen({ snapshot, totalAnswers, onBack, onStartTest }: Props) {
  const conf = getProfileConfidence(totalAnswers);
  const arch = snapshot.emerging_archetype;
  const hp = snapshot.hidden_parameters;
  const contr = snapshot.contradiction_summary;
  const twin = snapshot.human_twin_preview;

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
        <div style={{ marginBottom: '24px' }}>
          <p style={{
            fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: TIER_COLOR[conf.tier], marginBottom: '6px',
          }}>
            {conf.label}
          </p>
          <h1 style={{
            fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em',
            color: 'var(--text)', marginBottom: '4px',
          }}>
            Snapshot 51
          </h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            {snapshot.profile_confidence_label}
          </p>
        </div>

        {/* LOCKED STATE */}
        {!snapshot.is_available && (
          <LockedState totalAnswers={totalAnswers} onStartTest={onStartTest} />
        )}

        {/* UNLOCKED STATE */}
        {snapshot.is_available && (
          <>
            {/* ── Emerging Archetype ─────────────────── */}
            <div className="animate-in" style={{ marginBottom: '20px', animationDelay: '0.05s' }}>
              <SectionLabel>Emerging Archetype</SectionLabel>
              <GlassCard accent>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <p style={{
                      fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)',
                      letterSpacing: '-0.01em', marginBottom: '2px',
                    }}>
                      {arch.primary.name}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      with {arch.secondary.name}
                    </p>
                  </div>
                  <div style={{
                    padding: '3px 10px', borderRadius: '20px', fontSize: '0.6rem', fontWeight: 700,
                    background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.28)',
                    color: 'var(--accent-light)', letterSpacing: '0.06em', textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}>
                    {arch.confidence}
                  </div>
                </div>

                <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '10px', fontStyle: 'italic' }}>
                  {arch.blend_label}
                </p>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>
                  {arch.user_facing_summary}
                </p>

                {/* Primary % */}
                <div style={{ marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Primary signal</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--accent-light)' }}>{arch.primary.percentage}%</span>
                  </div>
                  <ScoreBar score={arch.primary.percentage} color="var(--accent-light)" />
                </div>
                {arch.secondary.percentage > 5 && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Secondary signal</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--teal-light)' }}>{arch.secondary.percentage}%</span>
                    </div>
                    <ScoreBar score={arch.secondary.percentage} color="var(--teal-light)" />
                  </div>
                )}
              </GlassCard>
            </div>

            {/* ── Strongest Axes ─────────────────────── */}
            <div className="animate-in" style={{ marginBottom: '20px', animationDelay: '0.12s' }}>
              <SectionLabel>Strongest Dimensions</SectionLabel>
              <GlassCard>
                {snapshot.strongest_axes.map((ax) => (
                  <AxisStrengthBar
                    key={ax.axis}
                    label={ax.label}
                    value={ax.normalized_value}
                  />
                ))}
              </GlassCard>
            </div>

            {/* ── Uncertain Axes ─────────────────────── */}
            {snapshot.uncertain_axes.length > 0 && (
              <div className="animate-in" style={{ marginBottom: '20px', animationDelay: '0.19s' }}>
                <SectionLabel>Still Forming</SectionLabel>
                <GlassCard style={{ borderStyle: 'dashed' }}>
                  <p style={{ fontSize: '0.73rem', color: 'var(--text-dim)', marginBottom: '10px', lineHeight: 1.5 }}>
                    These dimensions have low signal — more answers will resolve them.
                  </p>
                  {snapshot.uncertain_axes.map((ax) => (
                    <div key={ax.axis} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      marginBottom: '6px',
                    }}>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>◌</span>
                      <span style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.38)' }}>{ax.label}</span>
                    </div>
                  ))}
                </GlassCard>
              </div>
            )}

            {/* ── Hidden Parameters ──────────────────── */}
            <div className="animate-in" style={{ marginBottom: '20px', animationDelay: '0.26s' }}>
              <SectionLabel>Hidden Parameters</SectionLabel>
              <GlassCard>
                {[
                  {
                    label: 'Confidence ↔ Hesitation',
                    dim: hp.confidence,
                    color: hp.confidence.score >= 70 ? 'var(--teal-light)' : hp.confidence.score <= 30 ? 'rgba(255,255,255,0.3)' : 'var(--accent-light)',
                  },
                  {
                    label: 'Openness ↔ Guardedness',
                    dim: hp.openness,
                    color: hp.openness.score >= 70 ? 'var(--teal-light)' : hp.openness.score <= 30 ? 'rgba(255,255,255,0.3)' : 'var(--accent-light)',
                  },
                  {
                    label: 'Consistency ↔ Contradiction',
                    dim: hp.consistency,
                    color: hp.consistency.score >= 70 ? 'var(--teal-light)' : hp.consistency.score <= 30 ? 'rgba(255,255,255,0.3)' : 'var(--accent-light)',
                  },
                ].map(({ label, dim, color }) => (
                  <div key={label} style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '3px' }}>
                      <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{label}</span>
                      <span style={{ fontSize: '0.65rem', color, fontWeight: 600 }}>{dim.user_facing_label}</span>
                    </div>
                    <ScoreBar score={dim.score} color={color} />
                  </div>
                ))}
                {!hp.is_sufficient && (
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontStyle: 'italic', marginTop: '4px' }}>
                    Answer more questions for richer behavioral data.
                  </p>
                )}
              </GlassCard>
            </div>

            {/* ── Contradiction Summary ──────────────── */}
            <div className="animate-in" style={{ marginBottom: '20px', animationDelay: '0.33s' }}>
              <SectionLabel>Internal Pattern</SectionLabel>
              <GlassCard style={{
                borderColor: contr.level === 'high'
                  ? 'rgba(168,85,247,0.2)'
                  : contr.level === 'medium'
                  ? 'rgba(168,85,247,0.12)'
                  : 'rgba(255,255,255,0.06)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {contr.level === 'none' || contr.level === 'low'
                      ? 'Highly consistent'
                      : contr.level === 'medium'
                      ? 'Some complexity'
                      : 'Significant complexity'}
                  </span>
                  <span style={{
                    fontSize: '0.6rem', fontWeight: 700, color: 'var(--teal-light)',
                    background: 'rgba(8,145,178,0.1)', padding: '2px 8px', borderRadius: '10px',
                  }}>
                    {contr.consistency_score}% consistent
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.65 }}>
                  {contr.summary}
                </p>
              </GlassCard>
            </div>

            {/* ── Human Twin Preview ─────────────────── */}
            {twin.is_unlocked && (
              <div className="animate-in" style={{ marginBottom: '20px', animationDelay: '0.40s' }}>
                <SectionLabel>Closest Projected Profile</SectionLabel>
                <GlassCard gold>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)' }}>
                      {twin.closest_reference_name}
                    </span>
                    <span style={{
                      fontSize: '1rem', fontWeight: 800, color: 'var(--gold-light)',
                    }}>
                      {twin.similarity_percent}%
                    </span>
                  </div>
                  <p style={{ fontSize: '0.73rem', color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: '8px' }}>
                    {twin.summary}
                  </p>
                  <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.22)', fontStyle: 'italic' }}>
                    Estimated match — simulated until real population data exists
                  </p>
                </GlassCard>
              </div>
            )}

            {/* ── Growth Direction ───────────────────── */}
            <div className="animate-in" style={{ marginBottom: '24px', animationDelay: '0.47s' }}>
              <SectionLabel>Growth Direction</SectionLabel>
              <GlassCard>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  {snapshot.next_best_questions_hint}
                </p>
              </GlassCard>
            </div>

            {/* ── Confidence note ────────────────────── */}
            <p style={{
              fontSize: '0.64rem', color: 'var(--text-dim)', lineHeight: 1.65,
              textAlign: 'center', fontStyle: 'italic', marginBottom: '24px', padding: '0 8px',
            }}>
              This snapshot reflects patterns in your answers so far. It is not a permanent label — it shifts as you add more signals.
            </p>

            {onStartTest && (
              <button
                className="btn btn-primary tappable"
                onClick={onStartTest}
                style={{ marginBottom: '12px' }}
              >
                Continue building your profile
              </button>
            )}
          </>
        )}

      </main>
    </div>
  );
}
