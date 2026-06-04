import { TestAnswer } from '../types';
import { calcProfileProgress } from '../utils/contentSelector';

interface Props {
  testNumber: number;
  answers: TestAnswer[];
  totalProfileAnswers: number;
  onBack: () => void;
  onUnlockPremium: () => void;
}

const MAX_FREE_TESTS = 3;
const ANSWERS_FOR_READ = 51;

function getStrongestAxis(answers: TestAnswer[]): string | null {
  const axes: Record<string, number> = {};
  for (const ans of answers) {
    if (!ans.axis_delta_json) continue;
    for (const [k, v] of Object.entries(ans.axis_delta_json)) {
      axes[k] = (axes[k] ?? 0) + Math.abs(v);
    }
  }
  if (Object.keys(axes).length === 0) return null;
  return Object.entries(axes).sort(([, a], [, b]) => b - a)[0][0];
}

const POST_TEST_MESSAGES: Record<number, string> = {
  1: 'Następny test odblokuje drugi fragment profilu.',
  2: 'Jeszcze jeden darmowy test do pierwszego odczytu profilu.',
  3: 'Pierwszy odczyt profilu jest gotowy.',
};

export default function TestSummaryScreen({ testNumber, answers, totalProfileAnswers, onBack, onUnlockPremium }: Props) {
  const strongestAxis = getStrongestAxis(answers);
  const missingAnswers = Math.max(0, ANSWERS_FOR_READ - totalProfileAnswers);
  const progress = calcProfileProgress(totalProfileAnswers);
  const isThirdTest = testNumber >= MAX_FREE_TESTS;
  const postMessage = POST_TEST_MESSAGES[testNumber] ?? POST_TEST_MESSAGES[3];

  return (
    <div className="screen-centered" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(8,145,178,0.08) 0%, transparent 65%), var(--bg)' }}>
      <main className="paywall-inner animate-up" style={{ gap: '18px' }} aria-label="Podsumowanie testu">
        <div
          style={{
            padding: '4px 12px',
            background: 'rgba(8,145,178,0.1)',
            border: '1px solid rgba(8,145,178,0.25)',
            borderRadius: '20px',
            fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--teal-light)',
            alignSelf: 'flex-start',
          }}
        >
          Test {testNumber} ukończony
        </div>

        <h1 className="paywall-title">Zebrano nowy fragment profilu.</h1>

        <div className="paywall-stats">
          <div className="paywall-stat">
            <span className="paywall-stat-label">Odpowiedzi w tym teście</span>
            <span className="paywall-stat-value">{answers.length}&nbsp;/&nbsp;17</span>
          </div>
          <div className="paywall-stat">
            <span className="paywall-stat-label">Łącznie odpowiedzi profilu</span>
            <span className="paywall-stat-value">{totalProfileAnswers}&nbsp;/&nbsp;{ANSWERS_FOR_READ}</span>
          </div>
          <div className="paywall-stat">
            <span className="paywall-stat-label">Profil odkryty</span>
            <span className="paywall-stat-value">{progress.toFixed(1)}%</span>
          </div>
          {strongestAxis && (
            <div className="paywall-stat">
              <span className="paywall-stat-label">Najsilniejszy ślad testu</span>
              <span className="paywall-stat-value" style={{ color: 'var(--accent-light)', textTransform: 'capitalize' }}>
                {strongestAxis}
              </span>
            </div>
          )}
          {missingAnswers > 0 && (
            <div className="paywall-stat">
              <span className="paywall-stat-label">Do pierwszego odczytu</span>
              <span className="paywall-stat-value" style={{ color: 'var(--text-muted)' }}>
                jeszcze {missingAnswers} odpowiedzi
              </span>
            </div>
          )}
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.55 }}>
          {postMessage}
        </p>

        {isThirdTest ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', width: '100%' }}>
            <div
              style={{
                padding: '14px 16px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 'var(--radius)',
                fontSize: '0.84rem',
                color: 'var(--text-muted)',
                lineHeight: 1.55,
                textAlign: 'center',
              }}
            >
              Pełny odczyt profilu, Hidden Profile i Human Twin są zablokowane w tej wersji testowej.
            </div>
            <button
              className="btn btn-primary"
              onClick={onUnlockPremium}
              aria-label="Odblokuj pełny profil"
            >
              Odblokuj pełny profil
            </button>
            <button
              className="btn btn-ghost"
              onClick={onBack}
              style={{ maxWidth: '280px' }}
              aria-label="Wróć do menu"
            >
              Wróć do menu
            </button>
          </div>
        ) : (
          <button
            className="btn btn-primary"
            onClick={onBack}
            aria-label="Wróć do menu"
          >
            Wróć do menu
          </button>
        )}
      </main>
    </div>
  );
}
