import { useState, useEffect, useRef } from 'react';
import { ContentItem } from '../types';

interface Props {
  item: ContentItem;
  testIndex: number;    // 0-based: which question we're on
  testTotal: number;    // 17
  profileProgress: number;
  onAnswer: (answer: string, responseTimeMs: number, changeCount: number) => void;
}

const RARITY_LABELS: Record<string, string> = {
  standard: 'standard', rare: 'rzadkie', epic: 'epik', legendary: 'legendarne',
};

const TYPE_LABELS: Record<string, string> = {
  question: 'pytanie', secret: 'sekret', dare: 'wyzwanie', game: 'gra', riddle: 'zagadka',
};

export default function InteractionScreen({ item, testIndex, testTotal, profileProgress, onAnswer }: Props) {
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
    if (selected !== null && answer !== selected) setChangeCount((c: number) => c + 1);
    setSelected(answer);
  }

  function handleConfirm() {
    if (!selected) return;
    onAnswer(selected, Date.now() - startTimeRef.current, changeCount);
  }

  const questionNum = testIndex + 1;

  return (
    <div className="interaction-screen">
      {/* Status bar */}
      <div className="status-bar" role="status" aria-label={`Pytanie ${questionNum} z ${testTotal}. Profil odkryty ${profileProgress.toFixed(1)}%`}>
        <div className="status-bar-left">
          <span className="status-label">Profil odkryty</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="progress-bar-track" style={{ flex: 1 }}>
              <div
                className="progress-bar-fill"
                style={{ width: `${Math.min(100, (profileProgress / 85) * 100)}%` }}
              />
            </div>
            <span className="status-value">{profileProgress.toFixed(1)}%</span>
          </div>
        </div>
        <span className="status-interaction">
          Pytanie&nbsp;{questionNum}&nbsp;/&nbsp;{testTotal}
        </span>
      </div>

      {/* Content */}
      <div className="interaction-content">
        <div className="content-type-row animate-in">
          <span className={`rarity-badge rarity-${item.rarity_tier}`} aria-label={`Rzadkość: ${RARITY_LABELS[item.rarity_tier] ?? item.rarity_tier}`}>
            {RARITY_LABELS[item.rarity_tier] ?? item.rarity_tier}
          </span>
          <span className="content-type-label">
            {TYPE_LABELS[item.content_type] ?? item.content_type}
          </span>
        </div>

        <div className="prompt-block animate-in" style={{ animationDelay: '0.05s' }}>
          <p className="prompt-text">{item.prompt_pl}</p>
        </div>

        <div className="answers-block animate-in" style={{ animationDelay: '0.1s' }} role="group" aria-label="Opcje odpowiedzi">
          {answers.map((answer, i) => (
            <button
              key={i}
              className={`answer-btn${selected === answer ? ' selected' : ''}`}
              onClick={() => handleSelect(answer)}
              aria-pressed={selected === answer}
            >
              <span
                style={{
                  marginRight: '10px', fontSize: '0.72rem',
                  color: 'var(--text-dim)', fontWeight: 600, minWidth: '16px',
                }}
                aria-hidden="true"
              >
                {String.fromCharCode(65 + i)}
              </span>
              {answer}
            </button>
          ))}
        </div>

        {selected && (
          <div className="animate-in" style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
            <button className="btn btn-teal" onClick={handleConfirm} style={{ maxWidth: '320px' }} aria-label="Potwierdź wybraną odpowiedź">
              Potwierdź odpowiedź
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
