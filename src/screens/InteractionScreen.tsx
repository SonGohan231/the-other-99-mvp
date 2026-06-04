import { useState, useEffect, useRef } from 'react';
import { ContentItem } from '../types';

interface Props {
  item: ContentItem;
  interactionNum: number;
  profileProgress: number;
  onAnswer: (answer: string, responseTimeMs: number, changeCount: number) => void;
}

const RARITY_LABELS: Record<string, string> = {
  standard: 'standard',
  rare: 'rzadkie',
  epic: 'epik',
  legendary: 'legendarne',
};

const TYPE_LABELS: Record<string, string> = {
  question: 'pytanie',
  secret: 'sekret',
  dare: 'wyzwanie',
  game: 'gra',
  riddle: 'zagadka',
};

export default function InteractionScreen({
  item,
  interactionNum,
  profileProgress,
  onAnswer,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [changeCount, setChangeCount] = useState(0);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
    setSelected(null);
    setChangeCount(0);
  }, [item.id]);

  const answers = item.answer_options_pl
    .split('|')
    .map((a) => a.trim())
    .filter(Boolean);

  function handleSelect(answer: string) {
    if (selected !== null && answer !== selected) {
      setChangeCount((c: number) => c + 1);
    }
    setSelected(answer);
  }

  function handleConfirm() {
    if (!selected) return;
    const elapsed = Date.now() - startTimeRef.current;
    onAnswer(selected, elapsed, changeCount);
  }

  const progress = Math.min(profileProgress, 34);

  return (
    <div className="interaction-screen">
      {/* Status bar */}
      <div className="status-bar">
        <div className="status-bar-left">
          <span className="status-label">Profil odkryty</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="progress-bar-track" style={{ flex: 1 }}>
              <div
                className="progress-bar-fill"
                style={{ width: `${(progress / 34) * 100}%` }}
              />
            </div>
            <span className="status-value">{progress.toFixed(1)}%</span>
          </div>
        </div>
        <span className="status-interaction">
          {interactionNum}&nbsp;/&nbsp;30
        </span>
      </div>

      {/* Content */}
      <div className="interaction-content">
        <div className="content-type-row animate-in">
          <span
            className={`rarity-badge rarity-${item.rarity_tier}`}
          >
            {RARITY_LABELS[item.rarity_tier] ?? item.rarity_tier}
          </span>
          <span className="content-type-label">
            {TYPE_LABELS[item.content_type] ?? item.content_type}
          </span>
        </div>

        <div className="prompt-block animate-in" style={{ animationDelay: '0.05s' }}>
          <p className="prompt-text">{item.prompt_pl}</p>
        </div>

        <div className="answers-block animate-in" style={{ animationDelay: '0.1s' }}>
          {answers.map((answer, i) => (
            <button
              key={i}
              className={`answer-btn${selected === answer ? ' selected' : ''}`}
              onClick={() => handleSelect(answer)}
            >
              <span
                style={{
                  marginRight: '10px',
                  fontSize: '0.72rem',
                  color: 'var(--text-dim)',
                  fontWeight: 600,
                  minWidth: '16px',
                }}
              >
                {String.fromCharCode(65 + i)}
              </span>
              {answer}
            </button>
          ))}
        </div>

        {selected && (
          <div
            className="animate-in"
            style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}
          >
            <button className="btn btn-teal" onClick={handleConfirm} style={{ maxWidth: '320px' }}>
              Potwierdź odpowiedź
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
