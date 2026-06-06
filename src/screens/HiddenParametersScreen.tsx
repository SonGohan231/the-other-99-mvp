import { ProfileVector } from '../utils/profileVector';
import { computeHiddenParameters, ParameterLevel } from '../utils/hiddenParameters';
import { getInteractions } from '../utils/storage';
import { summarizeBehavioralProfile } from '../utils/behavioralSignals';
import { useLang } from '../context/LangContext';

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

// Human-readable display names replacing technical labels
const DISPLAY_NAMES_EN: Record<string, string> = {
  p1:  'How you handle uncertainty',
  p2:  'How fast you actually decide',
  p3:  'How you receive new information',
  p4:  'How you change when observed',
  p5:  'What you show vs. what you feel',
  p6:  'How much you trust established patterns',
  p7:  'Your actual risk permission',
  p8:  'Your orientation toward the future',
  p9:  'How much people appear in your decisions',
  p10: 'How fixed your self-concept is',
  p11: 'Internal tensions in your answers',
  p12: 'How stable your pattern is over time',
};

const DISPLAY_NAMES_PL: Record<string, string> = {
  p1:  'Jak radzisz sobie z niepewnością',
  p2:  'Jak szybko naprawdę decydujesz',
  p3:  'Jak odbierasz nowe informacje',
  p4:  'Jak się zmieniasz, gdy cię obserwują',
  p5:  'Co pokazujesz vs. co czujesz',
  p6:  'Ile ufasz sprawdzonym wzorcom',
  p7:  'Twoja rzeczywista granica akceptacji ryzyka',
  p8:  'Twoja orientacja na przyszłość',
  p9:  'Ile ludzie pojawiają się w twoich decyzjach',
  p10: 'Jak stałe jest twoje poczucie tożsamości',
  p11: 'Wewnętrzne napięcia w twoich odpowiedziach',
  p12: 'Jak stały jest twój wzorzec w czasie',
};

export default function HiddenParametersScreen({ profileVector, onBack }: Props) {
  const [lang] = useLang();
  const isPl = lang === 'pl';
  const params = computeHiddenParameters(profileVector);
  const summary = summarizeBehavioralProfile(getInteractions());
  const displayNames = isPl ? DISPLAY_NAMES_PL : DISPLAY_NAMES_EN;

  const HEADER = isPl ? 'UKRYTE PARAMETRY' : 'HIDDEN PARAMETERS';
  const SUBTITLE = isPl
    ? 'Sygnały behawioralne wywiedzione z twoich odpowiedzi.'
    : 'Behavioral signals derived from your answers.';
  const BETWEEN_LINES = isPl
    ? 'Co Twoje odpowiedzi zdradzają między wierszami'
    : 'What your answers reveal between the lines';
  const BACK = isPl ? '← Wróć' : '← Back';

  return (
    <div className="screen" style={{ background: 'var(--bg)', minHeight: '100dvh', overflowY: 'auto' }}>
      <main style={{ maxWidth: '480px', margin: '0 auto', width: '100%', padding: '20px 20px 48px', display: 'flex', flexDirection: 'column', gap: '0' }}>

        {/* Back */}
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.82rem', cursor: 'pointer', padding: '0 0 20px 0', textAlign: 'left' }}>
          {BACK}
        </button>

        {/* Header */}
        <h1 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '0.02em', marginBottom: '6px' }}>
          {HEADER}
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '24px', lineHeight: 1.5, fontStyle: 'italic' }}>
          {SUBTITLE}
        </p>

        <div style={{ height: '1px', background: 'var(--border)', marginBottom: '8px' }} />

        {/* Behavioral summary section */}
        {summary && (
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent-light)', textTransform: 'uppercase', marginBottom: '10px' }}>
              {BETWEEN_LINES}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Decisiveness */}
              <div style={{ padding: '10px 12px', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: '7px' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                  {isPl
                    ? getDecisivenessInsightPl(summary.decisivenessLabel, summary.avgResponseTimeMs)
                    : getDecisivenessInsightEn(summary.decisivenessLabel, summary.avgResponseTimeMs)}
                </p>
              </div>
              {/* Avoidance */}
              <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '7px' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                  {isPl
                    ? getAvoidanceInsightPl(summary.avoidanceLabel, summary.totalSkips)
                    : getAvoidanceInsightEn(summary.avoidanceLabel, summary.totalSkips)}
                </p>
              </div>
              {/* Contradiction */}
              {summary.avgContradictionSignal > 15 && (
                <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '7px' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                    {isPl
                      ? 'Twoje odpowiedzi zawierają zauważalne sprzeczności wewnętrzne. To nie jest wada — to złożoność.'
                      : 'Your answers contain noticeable internal contradictions. This is not a flaw — it is complexity.'}
                  </p>
                </div>
              )}
              {/* Speed vs hesitation */}
              {summary.avgHesitationMs !== null && summary.avgHesitationMs > 2000 && (
                <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '7px' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                    {isPl
                      ? 'Twoje wahanie przed wyboremem jest dłuższe niż czas samej odpowiedzi. System odczytuje, co to filtruje.'
                      : 'Your hesitation before committing is longer than the act of answering. The system is reading what that filters.'}
                  </p>
                </div>
              )}
            </div>
            <div style={{ height: '1px', background: 'var(--border)', marginTop: '20px', marginBottom: '20px' }} />
          </div>
        )}

        {/* Parameter list */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {params.map((p) => (
            <div key={p.id} style={{ padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>
                  {displayNames[p.id] ?? p.name}
                </span>
                <span style={{
                  fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: levelColor(p.level), padding: '2px 6px',
                  border: `1px solid ${levelColor(p.level)}`, borderRadius: '4px', opacity: 0.8,
                }}>
                  {isPl ? LEVEL_PL[p.level] : p.level}
                </span>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ height: '100%', width: `${p.value}%`, background: barColor(p.level), borderRadius: '2px', transition: 'width 0.6s ease' }} />
              </div>
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

const LEVEL_PL: Record<ParameterLevel, string> = {
  Low:    'Niski',
  Medium: 'Średni',
  High:   'Wysoki',
};

function getDecisivenessInsightEn(label: string, avgMs: number): string {
  const speed = avgMs < 3000 ? 'fast' : avgMs < 8000 ? 'moderate' : 'slow';
  if (label === 'impulsive' && speed === 'fast') return 'You often decide faster than your profile suggests. Speed can be a strength or a bypass.';
  if (label === 'impulsive') return 'Your first instinct usually wins. The internal deliberation, if any, is not visible in your timing.';
  if (label === 'decisive') return 'You make decisions without visible hesitation. The profile your answers build moves in clean lines.';
  if (label === 'deliberate') return 'You take time. The pause before deciding is part of your process — not a delay.';
  return 'You hesitate before committing. This is not indecision — it is filtering.';
}

function getDecisivenessInsightPl(label: string, avgMs: number): string {
  const speed = avgMs < 3000 ? 'fast' : avgMs < 8000 ? 'moderate' : 'slow';
  if (label === 'impulsive' && speed === 'fast') return 'Często decydujesz szybciej, niż sugeruje twój profil. Szybkość może być siłą albo ominięciem procesu.';
  if (label === 'impulsive') return 'Twój pierwszy instynkt zazwyczaj wygrywa. Wewnętrzna deliberacja, jeśli istnieje, nie jest widoczna w twoim tempie.';
  if (label === 'decisive') return 'Podejmujesz decyzje bez widocznego wahania. Profil, który budują twoje odpowiedzi, porusza się w czystych liniach.';
  if (label === 'deliberate') return 'Poświęcasz czas. Pauza przed decyzją jest częścią twojego procesu — nie opóźnieniem.';
  return 'Wahasz się przed zaangażowaniem. To nie jest niezdecydowanie — to filtrowanie.';
}

function getAvoidanceInsightEn(label: string, skips: number): string {
  if (label === 'avoidant') return `You avoided ${skips} question${skips !== 1 ? 's' : ''}. The questions you do not answer are part of your pattern too.`;
  if (label === 'selective') return 'You engage with most questions but selectively avoid specific ones. The system is reading which category causes that.';
  return 'You answered directly without significant avoidance. This is itself a signal.';
}

function getAvoidanceInsightPl(label: string, skips: number): string {
  if (label === 'avoidant') return `Unikałeś ${skips} pytań. Pytania, na które nie odpowiadasz, też są częścią twojego wzorca.`;
  if (label === 'selective') return 'Angażujesz się w większość pytań, ale selektywnie unikasz konkretnych. System odczytuje, która kategoria to powoduje.';
  return 'Odpowiadałeś bezpośrednio bez istotnego unikania. To samo w sobie jest sygnałem.';
}
