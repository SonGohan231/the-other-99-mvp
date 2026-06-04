import { TestAnswer } from '../types';
import { calcProfileProgress } from '../utils/contentSelector';
import { useT } from '../context/LangContext';

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

export default function TestSummaryScreen({ testNumber, answers, totalProfileAnswers, onBack, onUnlockPremium }: Props) {
  const t = useT();
  const strongestAxis = getStrongestAxis(answers);
  const missingAnswers = Math.max(0, ANSWERS_FOR_READ - totalProfileAnswers);
  const progress = calcProfileProgress(totalProfileAnswers);
  const isThirdTest = testNumber >= MAX_FREE_TESTS;
  const afterTestIndex = Math.min(testNumber - 1, t.testSummary.afterTest.length - 1);
  const postMessage = t.testSummary.afterTest[afterTestIndex];

  return (
    <div className="screen-centered" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(8,145,178,0.08) 0%, transparent 65%), var(--bg)' }}>
      <main className="paywall-inner animate-up" style={{ gap: '18px' }} aria-label={t.testSummary.ariaLabel}>
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
          {t.testSummary.badge(testNumber)}
        </div>

        <h1 className="paywall-title">{t.testSummary.title}</h1>

        <div className="paywall-stats">
          <div className="paywall-stat">
            <span className="paywall-stat-label">{t.testSummary.answersInTest}</span>
            <span className="paywall-stat-value">{answers.length}&nbsp;/&nbsp;17</span>
          </div>
          <div className="paywall-stat">
            <span className="paywall-stat-label">{t.testSummary.totalAnswers}</span>
            <span className="paywall-stat-value">{totalProfileAnswers}&nbsp;/&nbsp;{ANSWERS_FOR_READ}</span>
          </div>
          <div className="paywall-stat">
            <span className="paywall-stat-label">{t.testSummary.profileDiscovered}</span>
            <span className="paywall-stat-value">{progress.toFixed(1)}%</span>
          </div>
          {strongestAxis && (
            <div className="paywall-stat">
              <span className="paywall-stat-label">{t.testSummary.strongestSignal}</span>
              <span className="paywall-stat-value" style={{ color: 'var(--accent-light)', textTransform: 'capitalize' }}>
                {strongestAxis}
              </span>
            </div>
          )}
          {missingAnswers > 0 && (
            <div className="paywall-stat">
              <span className="paywall-stat-label">{t.testSummary.untilFirstReading}</span>
              <span className="paywall-stat-value" style={{ color: 'var(--text-muted)' }}>
                {t.testSummary.moreAnswers(missingAnswers)}
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
              {t.testSummary.lockedNote}
            </div>
            <button
              className="btn btn-primary"
              onClick={onUnlockPremium}
              aria-label={t.testSummary.unlockButton}
            >
              {t.testSummary.unlockButton}
            </button>
            <button
              className="btn btn-ghost"
              onClick={onBack}
              style={{ maxWidth: '280px' }}
              aria-label={t.testSummary.backToMenu}
            >
              {t.testSummary.backToMenu}
            </button>
          </div>
        ) : (
          <button
            className="btn btn-primary"
            onClick={onBack}
            aria-label={t.testSummary.backToMenu}
          >
            {t.testSummary.backToMenu}
          </button>
        )}
      </main>
    </div>
  );
}
