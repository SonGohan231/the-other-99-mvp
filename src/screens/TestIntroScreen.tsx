import { useT } from '../context/LangContext';
import ScreenBackground from '../components/ScreenBackground';

interface Props {
  testNumber: number;
  onBegin: () => void;
}

export default function TestIntroScreen({ testNumber, onBegin }: Props) {
  const t = useT();
  const idx = Math.min(testNumber - 1, t.testIntro.tests.length - 1);
  const intro = t.testIntro.tests[idx];

  return (
    <div
      className="screen-centered"
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <ScreenBackground src="/backgrounds/core/gateway-portal.png" dim={0.50} />
      <main
        className="auth-inner animate-up test-intro-inner--with-bg"
        style={{ gap: '22px', maxWidth: '360px', position: 'relative', zIndex: 1 }}
        aria-label={intro.title}
      >
        <div className="age-gate-logo">The Other 99</div>

        <div
          style={{
            padding: '4px 12px',
            background: 'rgba(124,58,237,0.1)',
            border: '1px solid rgba(124,58,237,0.25)',
            borderRadius: '20px',
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
            color: 'var(--accent-light)',
            alignSelf: 'center',
          }}
        >
          {intro.title}
        </div>

        <p
          style={{
            fontSize: '0.95rem',
            color: 'var(--text-muted)',
            lineHeight: 1.7,
            textAlign: 'center',
          }}
        >
          {intro.copy}
        </p>

        <button
          className="btn btn-primary"
          onClick={onBegin}
          style={{ maxWidth: '280px', alignSelf: 'center' }}
        >
          {intro.button}
        </button>
      </main>
    </div>
  );
}
