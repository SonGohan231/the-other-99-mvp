import { ProfileVector } from '../utils/profileVector';
import { ProfileFragment } from '../utils/profileFragments';
import { computeFullProfile } from '../utils/fullProfile';
import ProfileRadarChart from '../components/ProfileRadarChart';

interface Props {
  profileVector: ProfileVector;
  totalAnswers: number;
  profileFragments: ProfileFragment[];
  onUnlockFull: () => void;
  onDashboard: () => void;
}

const LOCKED_SECTIONS = [
  'Full Archetype',
  'Hidden Parameters',
  'Contradiction Pattern',
  'Relationship Pattern',
  'Conflict Pattern',
  'Motivation Pattern',
  'Shadow Pattern',
];

export default function ProfileSnapshotScreen({
  profileVector,
  totalAnswers,
  profileFragments,
  onUnlockFull,
  onDashboard,
}: Props) {
  const profile = computeFullProfile(profileVector, totalAnswers);

  // Top 3 signals: use fragments or dimension names
  const signals: string[] = profileFragments.length > 0
    ? profileFragments.slice(-3).reverse().map((f) => f.title)
    : [profile.primaryDriver, profile.secondaryDriver, profile.decisionStyle].filter(Boolean).slice(0, 3);

  // Truncate corePattern to first 2-3 sentences
  const sentences = profile.corePattern.split('. ');
  const shortPattern = sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '.' : '');

  return (
    <div
      className="screen"
      style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.1) 0%, transparent 60%), var(--bg)',
        minHeight: '100dvh',
        overflowY: 'auto',
      }}
    >
      <main
        style={{
          maxWidth: '480px',
          margin: '0 auto',
          width: '100%',
          padding: '24px 20px 48px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--accent-light)' }}>
            The Other 99
          </span>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--border)', marginBottom: '24px' }} />

        {/* Title + badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '0.02em' }}>
            PROFILE SNAPSHOT
          </h1>
          <span style={{
            padding: '3px 8px',
            background: 'rgba(124,58,237,0.15)',
            border: '1px solid rgba(124,58,237,0.35)',
            borderRadius: '20px',
            fontSize: '0.6rem',
            fontWeight: 700,
            color: 'var(--accent-light)',
            letterSpacing: '0.1em',
          }}>
            {totalAnswers} ANSWERS
          </span>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.5 }}>
          The system has enough to show one clear pattern.
        </p>

        {/* Profile Map */}
        <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '12px' }}>
          Profile Map
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <ProfileRadarChart vector={profileVector} size={220} variant="full" />
        </div>

        {/* Strongest Signals */}
        <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '10px' }}>
          Strongest Signals
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          {signals.map((s, i) => (
            <div
              key={i}
              style={{
                padding: '10px 14px',
                background: 'rgba(124,58,237,0.07)',
                border: '1px solid rgba(124,58,237,0.2)',
                borderRadius: '8px',
              }}
            >
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>{s}</span>
            </div>
          ))}
        </div>

        {/* Rarest Signal */}
        <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '10px' }}>
          Rarest Signal
        </p>
        <div style={{ marginBottom: '24px', padding: '10px 14px', background: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.2)', borderRadius: '8px' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--teal-light)', fontStyle: 'italic' }}>
            Only {profile.rarestSignalPercent.toFixed(1)}% of users generated a similar pattern.
          </p>
        </div>

        {/* Pattern Direction */}
        <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '10px' }}>
          Your Pattern Direction
        </p>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '24px' }}>
          {shortPattern}
        </p>

        {/* Locked Below */}
        <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '10px' }}>
          Locked Below
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '32px' }}>
          {LOCKED_SECTIONS.map((s) => (
            <div
              key={s}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '6px',
                opacity: 0.45,
              }}
            >
              <span style={{ fontSize: '0.55rem', color: 'var(--text-dim)' }}>●</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{s}</span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--border)', marginBottom: '24px' }} />

        {/* CTA */}
        <button
          className="btn btn-primary"
          onClick={onUnlockFull}
          style={{ marginBottom: '16px' }}
        >
          Unlock Full Profile
        </button>

        <button
          onClick={onDashboard}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-dim)',
            fontSize: '0.78rem',
            cursor: 'pointer',
            textAlign: 'center',
            padding: '8px',
          }}
        >
          Return to Dashboard
        </button>
      </main>
    </div>
  );
}
