import { useState, useEffect } from 'react';
import ScreenBackground from '../components/ScreenBackground';

interface Props {
  categories: string[];
  questionsAnswered: number;
  testTotal: number;
  onPick: (category: string) => void;
}

export default function CategoryPickerScreen({
  categories,
  questionsAnswered,
  testTotal,
  onPick,
}: Props) {
  const [picked, setPicked] = useState<string | null>(null);
  const questionsRemaining = testTotal - questionsAnswered;

  useEffect(() => {
    setPicked(null);
  }, [categories]);

  function handlePick(cat: string) {
    if (picked) return;
    setPicked(cat);
    setTimeout(() => onPick(cat), 320);
  }

  return (
    <div
      className="screen-centered"
      style={{ background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}
    >
      <ScreenBackground src="/backgrounds/core/deep-stars.png" dim={0.6} />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 420,
          width: '100%',
          padding: '48px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '32px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <p
            style={{
              fontSize: '0.62rem',
              color: 'var(--text-dim)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '10px',
            }}
          >
            {questionsRemaining} {questionsRemaining === 1 ? 'question' : 'questions'} remaining
          </p>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)', margin: 0, lineHeight: 1.3 }}>
            What do you want to explore next?
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
          {categories.map((cat) => {
            const isPicked = picked === cat;
            const isEliminated = picked !== null && !isPicked;

            return (
              <button
                key={cat}
                onClick={() => handlePick(cat)}
                disabled={picked !== null}
                style={{
                  width: '100%',
                  padding: '20px 22px',
                  borderRadius: '12px',
                  border: `1px solid ${isPicked ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.09)'}`,
                  background: isPicked
                    ? 'rgba(124,58,237,0.14)'
                    : 'rgba(255,255,255,0.03)',
                  color: isEliminated ? 'var(--text-dim)' : 'var(--text)',
                  fontSize: '1rem',
                  fontWeight: isPicked ? 700 : 500,
                  cursor: picked !== null ? 'default' : 'pointer',
                  textAlign: 'left',
                  opacity: isEliminated ? 0.25 : 1,
                  transform: isEliminated ? 'scale(0.97)' : 'scale(1)',
                  transition: 'all 0.25s ease',
                  lineHeight: 1.4,
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <p
          style={{
            fontSize: '0.65rem',
            color: 'var(--text-dim)',
            textAlign: 'center',
            opacity: 0.5,
            maxWidth: 300,
            lineHeight: 1.5,
          }}
        >
          Your profile shapes which questions appear in each category.
        </p>
      </div>
    </div>
  );
}
