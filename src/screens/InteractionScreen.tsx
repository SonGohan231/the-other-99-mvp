import { useState, useEffect, useRef } from 'react';
import { ContentItem } from '../types';
import { useT, useLang } from '../context/LangContext';
import { localizedCsvField } from '../i18n';
import { registerVote } from '../utils/communityStats';

interface Props {
  item: ContentItem;
  testIndex: number;
  testTotal: number;
  profileProgress: number;
  selectedCard?: string | null;
  onAnswer: (answer: string, responseTimeMs: number, changeCount: number, firstReactionMs: number | null) => void;
  onUndo?: () => void;
  canUndo?: boolean;
}

type Phase = 'question' | 'community';

export default function InteractionScreen({ item, testIndex, testTotal, profileProgress: _profileProgress, selectedCard, onAnswer, onUndo, canUndo }: Props) {
  const t = useT();
  const [lang] = useLang();
  const [selected, setSelected] = useState<string | null>(null);
  const [changeCount, setChangeCount] = useState(0);
  const [phase, setPhase] = useState<Phase>('question');
  const [communityPercs, setCommunityPercs] = useState<{ option: string; pct: number }[]>([]);
  const [barsVisible, setBarsVisible] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const answerTimeRef = useRef<number>(0);
  const changeCountRef = useRef<number>(0);
  const firstReactionRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = Date.now();
    setSelected(null);
    setChangeCount(0);
    setPhase('question');
    setCommunityPercs([]);
    setBarsVisible(false);
    firstReactionRef.current = null;
  }, [item.id]);

  const fields = item as unknown as Record<string, string>;
  const promptText = localizedCsvField(fields, 'prompt', lang);
  const answerOptionsRaw = localizedCsvField(fields, 'answer_options', lang);
  const answers = answerOptionsRaw.split('|').map((a) => a.trim()).filter(Boolean);

  function handleSelect(answer: string) {
    if (firstReactionRef.current === null) {
      firstReactionRef.current = Date.now() - startTimeRef.current;
    }
    if (selected !== null && answer !== selected) setChangeCount((c) => c + 1);
    setSelected(answer);
  }

  function handleConfirm() {
    if (!selected || phase !== 'question') return;
    answerTimeRef.current = Date.now() - startTimeRef.current;
    changeCountRef.current = changeCount;

    // Register vote and compute percentages BEFORE showing community
    const updatedVotes = registerVote(item.id, selected, answers);
    const total = Math.max(1, Object.values(updatedVotes).reduce((a, b) => a + b, 0));
    const percs = answers.map((o) => ({ option: o, pct: Math.round(((updatedVotes[o] ?? 0) / total) * 100) }));
    setCommunityPercs(percs);

    setPhase('community');

    // Animate bars in after 600ms
    setTimeout(() => setBarsVisible(true), 600);
  }

  function handleContinue() {
    if (!selected) return;
    onAnswer(selected, answerTimeRef.current, changeCountRef.current, firstReactionRef.current);
  }

  const questionNum = testIndex + 1;
  const rarityLabel = t.interaction.rarityLabel[item.rarity_tier] ?? item.rarity_tier;
  const typeLabel = t.interaction.typeLabel[item.content_type] ?? item.content_type;

  // Community copy
  function getCommunityMicrocopy(): string {
    if (!selected || communityPercs.length === 0) return t.interaction.communityShifted;
    const selectedPct = communityPercs.find((p) => p.option === selected)?.pct ?? 0;
    const maxPct = Math.max(...communityPercs.map((p) => p.pct));
    if (Math.abs(selectedPct - (100 - selectedPct)) <= 8) return t.interaction.communitySplit;
    if (selectedPct === maxPct) return t.interaction.communityMajority;
    return t.interaction.communityMinority;
  }

  return (
    <div className="interaction-screen" style={{ position: 'relative' }}>
      {/* Back / Undo button */}
      {canUndo && onUndo && (
        <button
          onClick={onUndo}
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            fontSize: '0.72rem',
            color: 'var(--text-dim)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            zIndex: 10,
          }}
          aria-label="Go back to previous question"
        >
          ← Back
        </button>
      )}
      {/* Status bar */}
      <div className="status-bar" role="status" aria-label={`${t.interaction.questionOf(questionNum, testTotal)}`}>
        <div className="status-bar-left">
          <span className="status-label">{t.interaction.testProgressLabel ?? 'Test Progress'}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="progress-bar-track" style={{ flex: 1 }}>
              <div className="progress-bar-fill" style={{ width: `${Math.round((questionNum / testTotal) * 100)}%` }} />
            </div>
            <span className="status-value">{questionNum}&nbsp;/&nbsp;{testTotal}</span>
          </div>
        </div>
        <span className="status-interaction">
          {t.interaction.questionOf(questionNum, testTotal)}
        </span>
      </div>

      {/* Content */}
      <div className="interaction-content">

        {/* Card selection banner */}
        {selectedCard && phase === 'question' && (
          <div className="animate-in" style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '7px 12px',
            background: 'rgba(124,58,237,0.1)',
            border: '1px solid rgba(124,58,237,0.25)',
            borderRadius: '8px',
            marginBottom: '4px',
          }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--accent-light)' }}>✦</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent-light)', letterSpacing: '0.04em' }}>
              {t.cardSelectedLabel(selectedCard)}
            </span>
          </div>
        )}

        <div className="content-type-row animate-in">
          <span className={`rarity-badge rarity-${item.rarity_tier}`} aria-label={rarityLabel}>
            {rarityLabel}
          </span>
          <span className="content-type-label">{typeLabel}</span>
        </div>

        <div className="prompt-block animate-in" style={{ animationDelay: '0.05s' }}>
          <p className="prompt-text">{promptText}</p>
        </div>

        {/* Answer options */}
        <div className="answers-block animate-in" style={{ animationDelay: '0.1s' }} role="group" aria-label="answers">
          {answers.map((answer, i) => (
            <button
              key={i}
              className={`answer-btn${selected === answer ? ' selected' : ''}`}
              onClick={() => phase === 'question' && handleSelect(answer)}
              aria-pressed={selected === answer}
              disabled={phase === 'community' && selected !== answer}
              style={{
                opacity: phase === 'community' && selected !== answer ? 0.3 : 1,
                cursor: phase === 'community' ? 'default' : 'pointer',
                position: 'relative',
              }}
            >
              <span style={{ marginRight: '10px', fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600, minWidth: '16px' }} aria-hidden="true">
                {String.fromCharCode(65 + i)}
              </span>
              {answer}
            </button>
          ))}
        </div>

        {/* Confirm button (question phase) */}
        {phase === 'question' && selected && (
          <div className="animate-in" style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
            <button className="btn btn-teal" onClick={handleConfirm} style={{ maxWidth: '320px' }} aria-label={t.interaction.confirmAnswer}>
              {t.interaction.confirmAnswer}
            </button>
          </div>
        )}

        {/* Community phase */}
        {phase === 'community' && (
          <div className="animate-in" style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-dim)', textAlign: 'center' }}>
              {t.interaction.communityTitle}
            </p>

            {/* Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {communityPercs.map(({ option, pct }, i) => {
                const isSelected = option === selected;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: isSelected ? 'var(--text)' : 'var(--text-muted)', fontWeight: isSelected ? 600 : 400 }}>
                        {option}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isSelected ? 'var(--accent-light)' : 'var(--text-muted)', minWidth: '36px', textAlign: 'right' }}>
                        {barsVisible ? `${pct}%` : ''}
                      </span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          borderRadius: '3px',
                          width: barsVisible ? `${pct}%` : '0%',
                          transition: 'width 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                          background: isSelected
                            ? 'linear-gradient(90deg, var(--accent), var(--accent-light))'
                            : 'rgba(255,255,255,0.18)',
                          boxShadow: isSelected ? '0 0 6px rgba(124,58,237,0.4)' : 'none',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {barsVisible && (
              <p className="animate-in" style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textAlign: 'center', fontStyle: 'italic' }}>
                {getCommunityMicrocopy()}
              </p>
            )}

            {barsVisible && (
              <p style={{ fontSize: '0.62rem', color: 'var(--text-dim)', textAlign: 'center', fontStyle: 'italic', opacity: 0.6 }}>
                {t.interaction.communityDisclaimer ?? 'Projected estimate — not yet real user data'}
              </p>
            )}

            {barsVisible && (
              <div className="animate-in" style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleContinue}
                  style={{ maxWidth: '320px' }}
                >
                  {t.interaction.continueToResult}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
