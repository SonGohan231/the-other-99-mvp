import { ProfileVector } from '../utils/profileVector';
import { computeFullProfile } from '../utils/fullProfile';
import ProfileRadarChart from '../components/ProfileRadarChart';

interface Props {
  profileVector: ProfileVector;
  totalAnswers: number;
  onBack: () => void;
}

interface SectionProps {
  label: string;
  children: React.ReactNode;
}

function Section({ label, children }: SectionProps) {
  return (
    <div style={{ paddingTop: '20px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <p style={{
        fontSize: '0.62rem',
        fontWeight: 700,
        letterSpacing: '0.12em',
        color: 'var(--text-dim)',
        textTransform: 'uppercase',
        marginBottom: '8px',
      }}>
        {label}
      </p>
      {children}
    </div>
  );
}

export default function FullProfileScreen({
  profileVector,
  totalAnswers,
  onBack,
}: Props) {
  const profile = computeFullProfile(profileVector, totalAnswers);
  const confidence = Math.min(85, Math.round((totalAnswers / 85) * 70 + 15));

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
        }}
      >
        {/* Back button */}
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
        <div style={{ marginBottom: '4px' }}>
          <h1 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '0.02em', marginBottom: '4px' }}>
            FULL PROFILE ANALYSIS
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Confidence:
            </span>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--accent-light)' }}>
              {confidence}%
            </span>
          </div>
        </div>

        <div style={{ height: '1px', background: 'var(--border)', margin: '16px 0' }} />

        {/* Core Pattern */}
        <Section label="Core Pattern">
          <p style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.7 }}>
            {profile.corePattern}
          </p>
        </Section>

        {/* Primary Driver */}
        <Section label="Primary Driver">
          <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-light)' }}>
            {profile.primaryDriver}
          </p>
        </Section>

        {/* Secondary Driver */}
        <Section label="Secondary Driver">
          <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--teal-light)' }}>
            {profile.secondaryDriver}
          </p>
        </Section>

        {/* Decision Style */}
        <Section label="Decision Style">
          <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)' }}>
            {profile.decisionStyle}
          </p>
        </Section>

        {/* Emotional Direction */}
        <Section label="Emotional Direction">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
            {profile.emotionalDirection}
          </p>
        </Section>

        {/* Social Pattern */}
        <Section label="Social Pattern">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
            {profile.socialPattern}
          </p>
        </Section>

        {/* Risk Pattern */}
        <Section label="Risk Pattern">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
            This system profile {profile.riskPattern}.
          </p>
        </Section>

        {/* Rarest Signal */}
        <Section label="Rarest Signal">
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '6px', fontStyle: 'italic' }}>
            Only {profile.rarestSignalPercent.toFixed(1)}% of users generated this signal.
          </p>
          <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-light)' }}>
            {profile.rarestSignal}
          </p>
        </Section>

        {/* Contradiction Pattern */}
        <Section label="Contradiction Pattern">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>
            {profile.contradictionPattern}
          </p>
        </Section>

        {/* Archetype Direction */}
        <Section label="Probable Archetype Direction">
          <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>
            {profile.probableArchetypeDirection}
          </p>
        </Section>

        {/* Incomplete */}
        <Section label="What the system still does not know">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
            {profile.incomplete.map((item) => (
              <div key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', opacity: 0.6 }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>● {item}</span>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>incomplete</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
            These patterns require more answers to read.
          </p>
        </Section>

        {/* Radar Chart */}
        <div style={{ paddingTop: '28px', display: 'flex', justifyContent: 'center' }}>
          <ProfileRadarChart vector={profileVector} size={240} variant="full" />
        </div>
      </main>
    </div>
  );
}
