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
  onContinueAnswering?: () => void;
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

function InsightBlock({ label, text, accent, muted }: { label: string; text: string; accent?: boolean; muted?: boolean }) {
  return (
    <div style={{
      padding: '14px 16px',
      background: accent ? 'rgba(124,58,237,0.07)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${accent ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)'}`,
      borderRadius: '8px',
      marginBottom: '10px',
      opacity: muted ? 0.75 : 1,
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

// ─── Estimated rarity signal ─────────────────────────────────────────────────

function computeEstimatedRarity(vec: ProfileVector): { label: string; desc_en: string; desc_pl: string } {
  const vals = Object.values(vec).map(Math.abs);
  const strong = vals.filter((v) => v > 4).length;
  const moderate = vals.filter((v) => v > 2).length;
  const extreme = vals.filter((v) => v > 7).length;

  if (extreme >= 2) {
    return {
      label: 'STRONG SIGNAL',
      desc_en: 'Your pattern shows multiple extreme values. This early signal suggests an unusually defined profile — though this estimate may shift as more data accumulates.',
      desc_pl: 'Twój wzorzec pokazuje wiele ekstremalnych wartości. Ten wczesny sygnał sugeruje wyjątkowo wyrazisty profil — choć szacunek może się zmienić wraz z kolejnymi odpowiedziami.',
    };
  }
  if (strong >= 3) {
    return {
      label: 'DISTINCTIVE SIGNAL',
      desc_en: 'Several dimensions are leaning strongly. Your pattern is becoming distinct from the projected average — this is an early estimate, not a final reading.',
      desc_pl: 'Kilka wymiarów wyraźnie dominuje. Twój wzorzec staje się wyraźnie inny od przewidywanej średniej — to wczesne szacowanie, nie ostateczny odczyt.',
    };
  }
  if (moderate >= 4) {
    return {
      label: 'EMERGING SIGNAL',
      desc_en: 'A pattern is forming. Your responses are beginning to pull in a consistent direction. Estimated rarity: moderate — more answers needed for a clearer reading.',
      desc_pl: 'Wzorzec się formuje. Twoje odpowiedzi zaczynają ciągnąć w spójnym kierunku. Szacowana rzadkość: umiarkowana — potrzeba więcej odpowiedzi, by odczyt był wyraźniejszy.',
    };
  }
  return {
    label: 'SIGNAL FORMING',
    desc_en: 'Your profile is still forming. Multiple dimensions are active, but no dominant pattern has emerged yet. This is expected at this stage.',
    desc_pl: 'Twój profil wciąż się kształtuje. Wiele wymiarów jest aktywnych, ale żaden dominujący wzorzec jeszcze nie wyłonił. To normalne na tym etapie.',
  };
}

// ─── Next discovery teaser ────────────────────────────────────────────────────

function getNextDiscoveryTeaser(totalAnswers: number, isPl: boolean): string {
  const remaining = Math.max(0, 85 - totalAnswers);
  const to100 = Math.max(0, 100 - totalAnswers);

  if (totalAnswers < 60) {
    const moreNeeded = 60 - totalAnswers;
    return isPl
      ? `Jeszcze ${moreNeeded} odpowiedzi może ujawnić wzorzec konfliktu i styl zaufania.`
      : `${moreNeeded} more answers may reveal your conflict pattern and trust style.`;
  }
  if (totalAnswers < 75) {
    return isPl
      ? 'Twój profil staje się wyjątkowo spójny. To rzadkie w tym stadium.'
      : 'Your profile is becoming unusually consistent. This is rare at this stage.';
  }
  if (totalAnswers < 85) {
    return isPl
      ? `Jeszcze ${remaining} odpowiedzi do pełnego odblokowania profilu. Nieoczekiwana sprzeczność może się pojawić.`
      : `${remaining} more answers to full profile unlock. An unexpected contradiction may emerge.`;
  }
  return isPl
    ? `Odpowiedziałeś już ${totalAnswers} pytań. Twój wzorzec jest wyraźnie ustalony — ale ${to100} pytań nadal może go przesunąć.`
    : `You have answered ${totalAnswers} questions. Your pattern is strongly set — but ${to100} more questions may still shift it.`;
}

export default function ProfileSnapshotScreen({
  profileVector,
  totalAnswers,
  onUnlockFull,
  onDashboard,
  onContinueAnswering,
}: Props) {
  const t = useT();
  const [lang] = useLang();
  const isPl = lang === 'pl';

  const summary = summarizeBehavioralProfile(getInteractions());
  const insights = generateProfileInsights(profileVector, summary, lang, totalAnswers);
  const rarity = computeEstimatedRarity(profileVector);
  const lockedSections = isPl ? LOCKED_SECTIONS_PL : LOCKED_SECTIONS_EN;
  const nextTeaser = getNextDiscoveryTeaser(totalAnswers, isPl);

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
    archetypeDir:       isPl ? 'Kierunek archetypu (wstępny)' : 'Archetype Direction (early)',
    raritySignal:       isPl ? 'Szacunkowa rzadkość' : 'Estimated Rarity',
    nextDiscovery:      isPl ? 'Następne odkrycie'  : 'Next Discovery',
    lockedBelow:        isPl ? 'Zablokowane poniżej' : 'Locked Below',
    unlockButton:       t.profileSnapshot.unlockButton,
    returnDashboard:    t.profileSnapshot.returnDashboard,
    postLoopA:          isPl
      ? 'Twój profil nie jest gotowy. Dopiero zaczął reagować.'
      : 'Your profile is not complete. It just started reacting.',
    postLoopB:          isPl
      ? 'Odpowiadaj dalej, żeby sprawdzić, czy ten wzór się wzmocni, pęknie albo zmieni.'
      : 'Answer more questions to see whether this pattern becomes stronger, breaks, or transforms.',
    continueAnswering:  isPl ? 'Odpowiadaj dalej' : 'Continue answering',
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

        {/* Block 2: Estimated Rarity Signal */}
        <div style={{
          padding: '14px 16px',
          background: 'rgba(45,212,191,0.04)',
          border: '1px solid rgba(45,212,191,0.15)',
          borderRadius: '8px',
          marginBottom: '10px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <p style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--teal-light)', textTransform: 'uppercase' }}>
              {L.raritySignal}
            </p>
            <span style={{
              padding: '2px 6px',
              background: 'rgba(45,212,191,0.1)',
              border: '1px solid rgba(45,212,191,0.2)',
              borderRadius: '20px',
              fontSize: '0.55rem', fontWeight: 700,
              color: 'var(--teal-light)',
              letterSpacing: '0.08em',
            }}>
              {rarity.label}
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {isPl ? rarity.desc_pl : rarity.desc_en}
          </p>
        </div>

        {/* Block 3: Hidden Tension */}
        <InsightBlock label={L.hiddenTension} text={insights.hiddenTension} />

        {/* Block 4: Behavioral Contradiction */}
        <InsightBlock label={L.behavioralContra} text={insights.behavioralContradiction} />

        {/* Block 5: Social Signal */}
        <InsightBlock label={L.socialSignal} text={insights.socialSignal} />

        {/* Block 6: Decision Signal */}
        <InsightBlock label={L.decisionSignal} text={insights.decisionSignal} />

        {/* Block 7: Archetype Direction (marked early/estimated) */}
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

        {/* Block 8: Next Discovery Teaser */}
        <div style={{
          padding: '14px 16px',
          background: 'rgba(124,58,237,0.04)',
          border: '1px dashed rgba(124,58,237,0.2)',
          borderRadius: '8px',
          marginBottom: '18px',
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: '1rem', marginTop: '1px', color: 'var(--accent-light)', opacity: 0.5 }}>→</span>
          <div>
            <p style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--accent-light)', textTransform: 'uppercase', marginBottom: '5px', opacity: 0.7 }}>
              {L.nextDiscovery}
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
              {nextTeaser}
            </p>
          </div>
        </div>

        {/* Block 9: Premium Locked Sections */}
        <SectionLabel style={{ marginTop: '4px' }}>{L.lockedBelow}</SectionLabel>
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

        {/* Post-snapshot loop message */}
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
          style={{ marginBottom: '12px' }}
        >
          {L.unlockButton}
        </button>

        {onContinueAnswering && (
          <button
            className="btn btn-teal"
            onClick={onContinueAnswering}
            style={{ marginBottom: '12px' }}
          >
            {L.continueAnswering}
          </button>
        )}

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
