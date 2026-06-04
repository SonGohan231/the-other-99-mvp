import { TestAnswer } from '../types';
import { ProfileVector, DIMENSIONS, getTopDimensions } from '../utils/profileVector';
import { calcProfileProgress } from '../utils/contentSelector';
import { useT } from '../context/LangContext';

interface Props {
  testNumber: number;
  answers: TestAnswer[];
  totalProfileAnswers: number;
  profileVector: ProfileVector;
  onBack: () => void;
  onUnlockPremium: () => void;
}

const MAX_FREE_TESTS = 3;
const ANSWERS_FOR_READ = 51;

export default function TestSummaryScreen({ testNumber, answers, totalProfileAnswers, profileVector, onBack, onUnlockPremium }: Props) {
  const t = useT();
  const missingAnswers = Math.max(0, ANSWERS_FOR_READ - totalProfileAnswers);
  const progress = calcProfileProgress(totalProfileAnswers);
  const isThirdTest = testNumber >= MAX_FREE_TESTS;
  const afterTestIndex = Math.min(testNumber - 1, t.testSummary.afterTest.length - 1);
  const postMessage = t.testSummary.afterTest[afterTestIndex];

  // First Signal section data
  const isFirstTest = testNumber === 1;
  const topDims = getTopDimensions(profileVector, 3);
  const confidence = Math.min(34, Math.round((totalProfileAnswers / ANSWERS_FOR_READ) * 65 + 10));

  // Use answers to find strongest raw axis for display if vector has no data
  const hasVectorData = DIMENSIONS.some((d) => profileVector[d] > 0);
  const fallbackStrongest: string | null = (() => {
    if (hasVectorData) return null;
    const axes: Record<string, number> = {};
    for (const ans of answers) {
      if (!ans.axis_delta_json) continue;
      for (const [k, v] of Object.entries(ans.axis_delta_json)) {
        axes[k] = (axes[k] ?? 0) + Math.abs(v);
      }
    }
    return Object.entries(axes).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;
  })();

  const displayDims: string[] = hasVectorData
    ? topDims.map((d) => t.dimensions[d] ?? d)
    : fallbackStrongest
    ? [fallbackStrongest.charAt(0).toUpperCase() + fallbackStrongest.slice(1)]
    : [];

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

        {/* First Signal section */}
        {isFirstTest && (
          <div style={{
            width: '100%',
            padding: '16px',
            background: 'rgba(124,58,237,0.08)',
            border: '1px solid rgba(124,58,237,0.25)',
            borderRadius: 'var(--radius)',
            display: 'flex', flexDirection: 'column', gap: '10px',
          }}>
            <div style={{
              display: 'inline-flex',
              alignSelf: 'flex-start',
              padding: '3px 10px',
              background: 'rgba(124,58,237,0.2)',
              border: '1px solid rgba(124,58,237,0.4)',
              borderRadius: '20px',
              fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'var(--accent-light)',
            }}>
              {t.firstSignal.badge}
            </div>

            {displayDims.length > 0 && (
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {t.firstSignal.topLabel}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {displayDims.map((dim) => (
                    <span key={dim} style={{
                      padding: '4px 10px',
                      background: 'rgba(124,58,237,0.15)',
                      border: '1px solid rgba(124,58,237,0.3)',
                      borderRadius: '20px',
                      fontSize: '0.78rem', fontWeight: 700,
                      color: 'var(--accent-light)',
                    }}>
                      {dim}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {t.firstSignal.confidenceLabel}
              </span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-light)' }}>
                {confidence}%
              </span>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
              {t.firstSignal.incomplete}
              {missingAnswers > 0 && (
                <>{' '}{t.firstSignal.moreAnswers(missingAnswers)}</>
              )}
            </p>
          </div>
        )}

        <div className="paywall-stats">
          <div className="paywall-stat">
            <span className="paywall-stat-label">{t.testSummary.answersInTest}</span>
            <span className="paywall-stat-value">{t.testSummary.answersCapture(answers.length)}</span>
          </div>
          <div className="paywall-stat">
            <span className="paywall-stat-label">{t.testSummary.totalAnswers}</span>
            <span className="paywall-stat-value">{totalProfileAnswers}&nbsp;/&nbsp;{ANSWERS_FOR_READ}</span>
          </div>
          <div className="paywall-stat">
            <span className="paywall-stat-label">{t.testSummary.profileDiscovered}</span>
            <span className="paywall-stat-value">{progress.toFixed(1)}%</span>
          </div>
          {missingAnswers > 0 && (
            <div className="paywall-stat">
              <span className="paywall-stat-label">{t.testSummary.untilFirstReading}</span>
              <span className="paywall-stat-value" style={{ color: 'var(--text-muted)' }}>
                {t.testSummary.moreAnswers(missingAnswers)}
              </span>
            </div>
          )}
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.65 }}>
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
