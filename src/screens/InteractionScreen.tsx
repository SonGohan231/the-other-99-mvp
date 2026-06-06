import { useState, useEffect, useRef } from 'react';
import { ContentItem } from '../types';
import { useT, useLang } from '../context/LangContext';
import { localizedCsvField } from '../i18n';
import { submitVote, VoteResult, getDistributionLabel } from '../utils/communityVotes';

interface Props {
  item: ContentItem;
  testIndex: number;
  testTotal: number;
  profileProgress: number;
  selectedCard?: string | null;
  userId?: string | null;
  onAnswer: (answer: string, responseTimeMs: number, changeCount: number, firstReactionMs: number | null) => void;
  onUndo?: () => void;
  canUndo?: boolean;
  onSkip?: (timeOnQuestionMs: number, hadSelection: boolean, selectedAnswer: string | null) => void;
  onExitToMenu?: (timeOnQuestionMs: number, hadSelection: boolean, phase: string, selectedAnswer: string | null) => void;
  onSwap?: (timeOnQuestionMs: number, hadSelection: boolean, selectedAnswer: string | null) => void;
  initialSelected?: string | null;
}

// Reveal state machine: question → saved → analyzing → comparing → insight
type Phase = 'question' | 'saved' | 'analyzing' | 'comparing' | 'insight';

// Timings (ms) — reduced by ~80% if prefers-reduced-motion
const T_SAVED     = 200;
const T_ANALYZING = 600;
const T_COMPARING = 650;
const T_INSIGHT   = 900;

export default function InteractionScreen({
  item,
  testIndex,
  testTotal,
  profileProgress: _profileProgress,
  selectedCard,
  userId,
  onAnswer,
  onUndo,
  canUndo,
  onSkip,
  onExitToMenu,
  onSwap,
  initialSelected,
}: Props) {
  const t = useT();
  const [lang] = useLang();
  const [selected, setSelected] = useState<string | null>(null);
  const [changeCount, setChangeCount] = useState(0);
  const [phase, setPhase] = useState<Phase>('question');
  const [voteResult, setVoteResult] = useState<VoteResult | null>(null);
  const [barsVisible, setBarsVisible] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const answerTimeRef = useRef<number>(0);
  const changeCountRef = useRef<number>(0);
  const firstReactionRef = useRef<number | null>(null);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motionScale = prefersReducedMotion ? 0.15 : 1;

  useEffect(() => {
    startTimeRef.current = Date.now();
    setSelected(initialSelected ?? null);
    setChangeCount(0);
    setPhase('question');
    setVoteResult(null);
    setBarsVisible(false);
    firstReactionRef.current = null;
  }, [item.id]); // eslint-disable-line react-hooks/exhaustive-deps

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

    // Submit vote synchronously before reveal sequence
    const result = submitVote(item.id, selected, answers, userId ?? null);
    setVoteResult(result);

    // Start reveal state machine: saved → analyzing → comparing → insight
    setPhase('saved');

    const t1 = T_SAVED * motionScale;
    const t2 = t1 + T_ANALYZING * motionScale;
    const t3 = t2 + T_COMPARING * motionScale;
    const t4 = t3 + T_INSIGHT * motionScale;

    const id1 = setTimeout(() => setPhase('analyzing'), t1);
    const id2 = setTimeout(() => { setPhase('comparing'); setBarsVisible(true); }, t2);
    const id3 = setTimeout(() => setPhase('insight'), t3);

    // Cleanup if item changes before sequence completes
    return () => { clearTimeout(id1); clearTimeout(id2); clearTimeout(id3); void t4; };
  }

  function handleContinue() {
    if (!selected) return;
    onAnswer(selected, answerTimeRef.current, changeCountRef.current, firstReactionRef.current);
  }

  const questionNum = testIndex + 1;
  const rarityLabel = t.interaction.rarityLabel[item.rarity_tier] ?? item.rarity_tier;
  const typeLabel = t.interaction.typeLabel[item.content_type] ?? item.content_type;

  const communityPercs = voteResult?.percs ?? [];
  const rawDistributionLabel = voteResult
    ? voteResult.distributionLabel
    : getDistributionLabel(0);
  const distributionLabel = t.interaction.distributionLabels?.[rawDistributionLabel] ?? rawDistributionLabel;

  function getCommunityMicrocopy(): string {
    if (!selected || communityPercs.length === 0) return t.interaction.communityShifted;
    const selectedPct = communityPercs.find((p) => p.option === selected)?.pct ?? 0;
    const maxPct = Math.max(...communityPercs.map((p) => p.pct));
    if (Math.abs(selectedPct - (100 - selectedPct)) <= 8) return t.interaction.communitySplit;
    if (selectedPct === maxPct) return t.interaction.communityMajority;
    return t.interaction.communityMinority;
  }

  function getInsightCopy(): string {
    const r = item.rarity_tier;
    if (r === 'legendary') return t.interaction.reveal.insightLegendary;
    if (r === 'epic') return t.interaction.reveal.insightEpic;
    if (r === 'rare') return t.interaction.reveal.insightRare;
    return t.interaction.reveal.insight;
  }

  // Is the reveal sequence running?
  const isRevealPhase = phase !== 'question';
  const showDistribution = phase === 'comparing' || phase === 'insight';
  const showContinue = phase === 'insight';

  function handleSkip() {
    const elapsed = Date.now() - startTimeRef.current;
    onSkip?.(elapsed, selected !== null, selected);
  }

  function handleExitToMenu() {
    const elapsed = Date.now() - startTimeRef.current;
    onExitToMenu?.(elapsed, selected !== null, phase, selected);
  }

  function handleSwap() {
    const elapsed = Date.now() - startTimeRef.current;
    onSwap?.(elapsed, selected !== null, selected);
  }

  return (
    <div className="interaction-screen" style={{ position: 'relative' }}>
      {/* Top-left: Back/Undo or Exit */}
      {phase === 'question' && (
        <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px', zIndex: 10 }}>
          {canUndo && onUndo && (
            <button
              onClick={onUndo}
              style={{ fontSize: '0.72rem', color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
              aria-label="Go back to previous question"
            >
              ← {t.interaction.reveal?.saved ? 'Back' : 'Back'}
            </button>
          )}
          {onExitToMenu && (
            <button
              onClick={handleExitToMenu}
              style={{ fontSize: '0.72rem', color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
              aria-label={t.interaction.exitToMenu}
            >
              {t.interaction.exitToMenu}
            </button>
          )}
        </div>
      )}
      {/* Top-right: Swap + Skip */}
      {phase === 'question' && (onSwap || onSkip) && (
        <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '6px', zIndex: 10 }}>
          {onSwap && (
            <button
              onClick={handleSwap}
              style={{ fontSize: '0.72rem', color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
              aria-label={t.interaction.swapQuestion}
            >
              ⇄ {t.interaction.swapQuestion}
            </button>
          )}
          {onSkip && (
            <button
              onClick={handleSkip}
              style={{ fontSize: '0.72rem', color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
              aria-label={t.interaction.skipQuestion}
            >
              {t.interaction.skipQuestion} →
            </button>
          )}
        </div>
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
              disabled={isRevealPhase && selected !== answer}
              style={{
                opacity: isRevealPhase && selected !== answer ? 0.3 : 1,
                cursor: isRevealPhase ? 'default' : 'pointer',
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

        {/* Confirm button (question phase only) */}
        {phase === 'question' && selected && (
          <div className="animate-in" style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
            <button className="btn btn-teal" onClick={handleConfirm} style={{ maxWidth: '320px' }} aria-label={t.interaction.confirmAnswer}>
              {t.interaction.confirmAnswer}
            </button>
          </div>
        )}

        {/* ── Reveal state machine ──────────────────────────────── */}
        {isRevealPhase && (
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Phase microcopy strip */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '10px 16px',
              background: phase === 'insight'
                ? 'rgba(124,58,237,0.08)'
                : 'rgba(255,255,255,0.03)',
              border: `1px solid ${phase === 'insight' ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: '10px',
              transition: 'background 0.4s ease, border-color 0.4s ease',
            }}>
              {(phase === 'saved' || phase === 'analyzing') && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <div className="loading-dot" style={{ width: '5px', height: '5px' }} />
                  <div className="loading-dot" style={{ width: '5px', height: '5px', animationDelay: '0.15s' }} />
                  <div className="loading-dot" style={{ width: '5px', height: '5px', animationDelay: '0.3s' }} />
                </div>
              )}
              {phase === 'comparing' && (
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-light)', opacity: 0.6 }}>◈</span>
              )}
              {phase === 'insight' && (
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-light)' }}>◈</span>
              )}
              <p style={{
                fontSize: '0.78rem',
                fontWeight: phase === 'insight' ? 600 : 400,
                color: phase === 'insight' ? 'var(--text)' : 'var(--text-dim)',
                fontStyle: phase === 'saved' || phase === 'analyzing' ? 'italic' : 'normal',
                margin: 0,
                transition: 'color 0.3s ease',
              }}>
                {phase === 'saved' && t.interaction.reveal.saved}
                {phase === 'analyzing' && t.interaction.reveal.analyzing}
                {phase === 'comparing' && distributionLabel}
                {phase === 'insight' && getInsightCopy()}
              </p>
            </div>

            {/* Distribution bars (shown from 'comparing' onward) */}
            {showDistribution && (
              <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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

                {/* Community microcopy */}
                {phase === 'insight' && (
                  <p className="animate-in" style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', fontStyle: 'italic' }}>
                    {getCommunityMicrocopy()}
                  </p>
                )}

                {/* Projection disclaimer */}
                {(voteResult?.realVotes ?? 0) < 30 && (
                  <p style={{ fontSize: '0.62rem', color: 'var(--text-dim)', textAlign: 'center', fontStyle: 'italic', opacity: 0.55 }}>
                    {t.interaction.communityDisclaimer}
                  </p>
                )}
              </div>
            )}

            {/* Continue button (insight phase only) */}
            {showContinue && (
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
