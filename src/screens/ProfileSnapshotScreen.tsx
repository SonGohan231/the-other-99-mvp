import { ProfileVector } from '../utils/profileVector';
import { ProfileFragment } from '../utils/profileFragments';
import { getInteractions } from '../utils/storage';
import { summarizeBehavioralProfile } from '../utils/behavioralSignals';
import { generateProfileInsights } from '../content/profileInsights';
import ProfileRadarChart from '../components/ProfileRadarChart';
import { useT, useLang } from '../context/LangContext';

interface Props {
  profileVector: ProfileVector;
  totalAnswers: number;
  profileFragments: ProfileFragment[];
  onUnlockFull: () => void;
  onDashboard: () => void;
}

function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <p style={{
      fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em',
      color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px',
      ...style,
    }}>
      {children}
    </p>
  );
}

function InsightBlock({ label, text, accent }: { label: string; text: string; accent?: boolean }) {
  return (
    <div style={{
      padding: '14px 16px',
      background: accent ? 'rgba(124,58,237,0.07)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${accent ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)'}`,
      borderRadius: '8px',
      marginBottom: '10px',
    }}>
      <p style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', color: accent ? 'var(--accent-light)' : 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '6px' }}>
        {label}
      </p>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>
        {text}
      </p>
    </div>
  );
}

const LOCKED_SECTIONS_EN = [
  'Relationship Pattern',
  'Conflict Pattern',
  'Motivation Architecture',
  'Shadow Pattern',
  'Trust Pattern',
  'Attachment Style',
];

const LOCKED_SECTIONS_PL = [
  'Wzorzec Relacji',
  'Wzorzec Konfliktu',
  'Architektura Motywacji',
  'Wzorzec Cienia',
  'Wzorzec Zaufania',
  'Styl Przywiązania',
];

export default function ProfileSnapshotScreen({
  profileVector,
  totalAnswers,
  onUnlockFull,
  onDashboard,
}: Props) {
  const t = useT();
  const [lang] = useLang();
  const isPl = lang === 'pl';

  const summary = summarizeBehavioralProfile(getInteractions());
  const insights = generateProfileInsights(profileVector, summary, lang, totalAnswers);

  const lockedSections = isPl ? LOCKED_SECTIONS_PL : LOCKED_SECTIONS_EN;

  const L = {
    title:              isPl ? 'MIGAWKA PROFILU'   : 'PROFILE SNAPSHOT',
    badge:              isPl ? 'WCZESNY SYGNAŁ'    : 'EARLY SIGNAL',
    subtitle:           isPl
      ? 'System zaczyna widzieć wzorzec. To nie jest gotowy profil.'
      : 'The system is starting to see a pattern. This is not a finished profile.',
    profileMap:         isPl ? 'Mapa profilu'      : 'Profile Map',
    firstSignal:        isPl ? 'Pierwszy sygnał'   : 'First Signal',
    hiddenTension:      isPl ? 'Ukryte napięcie'   : 'Hidden Tension',
    behavioralContra:   isPl ? 'Sprzeczność behawioralna' : 'Behavioral Contradiction',
    socialSignal:       isPl ? 'Sygnał społeczny'  : 'Social Signal',
    decisionSignal:     isPl ? 'Sygnał decyzyjny'  : 'Decision Signal',
    archetypeDir:       isPl ? 'Kierunek archetypu': 'Archetype Direction',
    lockedBelow:        isPl ? 'Zablokowane poniżej' : 'Locked Below',
    unlockButton:       t.profileSnapshot.unlockButton,
    returnDashboard:    t.profileSnapshot.returnDashboard,
    postLoopA:          isPl
      ? 'Twój profil nie jest gotowy. Dopiero zaczął reagować.'
      : 'Your profile is not complete. It just started reacting.',
    postLoopB:          isPl
      ? 'Odpowiadaj dalej, żeby sprawdzić, czy ten wzór się wzmocni, pęknie albo zmieni.'
      : 'Answer more questions to see whether this pattern becomes stronger, breaks, or transforms.',
  };

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
          maxWidth: '480px', margin: '0 auto', width: '100%',
          padding: '24px 20px 48px',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--accent-light)' }}>
            The Other 99
          </span>
        </div>

        <div style={{ height: '1px', background: 'var(--border)', marginBottom: '24px' }} />

        {/* Title + badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '0.02em' }}>
            {L.title}
          </h1>
          <span style={{
            padding: '3px 8px',
            background: 'rgba(45,212,191,0.1)',
            border: '1px solid rgba(45,212,191,0.3)',
            borderRadius: '20px',
            fontSize: '0.58rem', fontWeight: 700,
            color: 'var(--teal-light)', letterSpacing: '0.1em',
          }}>
            {totalAnswers} · {L.badge}
          </span>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.5 }}>
          {L.subtitle}
        </p>

        {/* Profile Map */}
        <SectionLabel>{L.profileMap}</SectionLabel>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <ProfileRadarChart vector={profileVector} size={200} variant="full" />
        </div>

        {/* Block 1: First Signal */}
        <InsightBlock label={L.firstSignal} text={insights.firstSignal} accent />

        {/* Block 2: Hidden Tension */}
        <InsightBlock label={L.hiddenTension} text={insights.hiddenTension} />

        {/* Block 3: Behavioral Contradiction */}
        <InsightBlock label={L.behavioralContra} text={insights.behavioralContradiction} />

        {/* Block 4: Social Signal */}
        <InsightBlock label={L.socialSignal} text={insights.socialSignal} />

        {/* Block 5: Decision Signal */}
        <InsightBlock label={L.decisionSignal} text={insights.decisionSignal} />

        {/* Block 6: Archetype Direction */}
        <div style={{
          padding: '14px 16px',
          background: 'rgba(124,58,237,0.06)',
          border: '1px solid rgba(124,58,237,0.25)',
          borderRadius: '8px',
          marginBottom: '10px',
        }}>
          <p style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--accent-light)', textTransform: 'uppercase', marginBottom: '6px' }}>
            {L.archetypeDir}
          </p>
          <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
            {insights.archetypeDirection}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.55, fontStyle: 'italic' }}>
            {insights.archetypeDirectionNote}
          </p>
        </div>

        {/* Block 7: Premium Lock */}
        <SectionLabel style={{ marginTop: '14px' }}>{L.lockedBelow}</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '28px' }}>
          {lockedSections.map((s) => (
            <div
              key={s}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '6px', opacity: 0.45,
              }}
            >
              <span style={{ fontSize: '0.55rem', color: 'var(--text-dim)' }}>●</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{s}</span>
            </div>
          ))}
        </div>

        {/* Post-snapshot loop */}
        <div style={{
          padding: '14px 16px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '8px',
          marginBottom: '28px',
        }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '6px' }}>
            {L.postLoopA}
          </p>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', lineHeight: 1.55, fontStyle: 'italic' }}>
            {L.postLoopB}
          </p>
        </div>

        <div style={{ height: '1px', background: 'var(--border)', marginBottom: '24px' }} />

        <button
          className="btn btn-primary"
          onClick={onUnlockFull}
          style={{ marginBottom: '16px' }}
        >
          {L.unlockButton}
        </button>

        <button
          onClick={onDashboard}
          style={{
            background: 'none', border: 'none',
            color: 'var(--text-dim)', fontSize: '0.78rem',
            cursor: 'pointer', textAlign: 'center', padding: '8px',
          }}
        >
          {L.returnDashboard}
        </button>
      </main>
    </div>
  );
}
