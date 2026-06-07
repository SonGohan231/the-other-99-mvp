import { useState, useEffect, useRef } from 'react';
import { ContentItem } from '../types';
import { useT, useLang } from '../context/LangContext';
import { localizedCsvField } from '../i18n';
import { submitVote, VoteResult, getDistributionLabel } from '../utils/communityVotes';
import QuestionBackground from '../components/QuestionBackground';
import { resolveInsightCopy } from '../utils/insightCopyResolver';
import { getQuestionBg, preloadBg } from '../utils/questionBackgrounds';

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
  answerRevealShorts?: Record<string, { pl: string; en: string }>;
}

type Phase = 'question' | 'saved' | 'analyzing' | 'comparing' | 'insight';

const T_SAVED = 200;
const T_ANALYZING = 600;
const T_COMPARING = 650;

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
  answerRevealShorts,
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
  const timersRef = useRef<number[]>([]);

  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motionScale = prefersReducedMotion ? 0.15 : 1;

  const bgSrc = getQuestionBg(item);
  useEffect(() => { preloadBg(bgSrc); }, [bgSrc]);

  function clearTimers() {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }

  useEffect(() => {
    clearTimers();
    startTimeRef.current = Date.now();
    setSelected(initialSelected ?? null);
    setChangeCount(0);
    setPhase('question');
    setVoteResult(null);
    setBarsVisible(false);
    firstReactionRef.current = null;
    return clearTimers;
  }, [item.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fields = item as unknown as Record<string, string>;
  const promptText = localizedCsvField(fields, 'prompt', lang);
  const answerOptionsRaw = localizedCsvField(fields, 'answer_options', lang);
  const answers = answerOptionsRaw.split('|').map((a) => a.trim()).filter(Boolean);

  function handleSelect(answer: string) {
    if (phase !== 'question') return;
    if (firstReactionRef.current === null) firstReactionRef.current = Date.now() - startTimeRef.current;
    if (selected !== null && answer !== selected) setChangeCount((c) => c + 1);
    setSelected(answer);
  }

  function handleConfirm() {
    if (!selected || phase !== 'question') return;
    clearTimers();
    answerTimeRef.current = Date.now() - startTimeRef.current;
    changeCountRef.current = changeCount;
    const result = submitVote(item.id, selected, answers, userId ?? null);
    setVoteResult(result);
    setPhase('saved');
    setBarsVisible(false);

    const t1 = T_SAVED * motionScale;
    const t2 = t1 + T_ANALYZING * motionScale;
    const t3 = t2 + T_COMPARING * motionScale;
    timersRef.current = [
      window.setTimeout(() => setPhase('analyzing'), t1),
      window.setTimeout(() => { setPhase('comparing'); setBarsVisible(true); }, t2),
      window.setTimeout(() => setPhase('insight'), t3),
    ];
  }

  function handleChangeAnswerInline() {
    clearTimers();
    setPhase('question');
    setVoteResult(null);
    setBarsVisible(false);
  }

  function handleContinue() {
    if (!selected) return;
    onAnswer(selected, answerTimeRef.current, changeCountRef.current, firstReactionRef.current);
  }

  const questionNum = testIndex + 1;
  const rarityLabel = t.interaction.rarityLabel[item.rarity_tier] ?? item.rarity_tier;
  const typeLabel = t.interaction.typeLabel[item.content_type] ?? item.content_type;
  const communityPercs = voteResult?.percs ?? [];
  const rawDistributionLabel = voteResult ? voteResult.distributionLabel : getDistributionLabel(0);
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
    return resolveInsightCopy({
      selectedAnswer: selected,
      answerRevealShorts,
      revealTemplateId: item.reveal_template_id,
      rarityTier: item.rarity_tier,
      lang,
      fallbacks: {
        insightLegendary: t.interaction.reveal.insightLegendary,
        insightEpic: t.interaction.reveal.insightEpic,
        insightRare: t.interaction.reveal.insightRare,
        insight: t.interaction.reveal.insight,
      },
    });
  }

  const isRevealPhase = phase !== 'question';
  const showDistribution = phase === 'comparing' || phase === 'insight';
  const showContinue = phase === 'insight';

  function handleSkip() { onSkip?.(Date.now() - startTimeRef.current, selected !== null, selected); }
  function handleExitToMenu() { onExitToMenu?.(Date.now() - startTimeRef.current, selected !== null, phase, selected); }
  function handleSwap() { onSwap?.(Date.now() - startTimeRef.current, selected !== null, selected); }

  const toolButtonStyle = {
    padding: '7px 10px',
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(8,10,24,0.52)',
    color: 'rgba(255,255,255,0.70)',
    fontSize: '0.66rem',
    fontWeight: 650,
    letterSpacing: '0.02em',
    cursor: 'pointer',
    backdropFilter: 'blur(12px)',
  } as const;

  return (
    <div className="interaction-screen interaction-screen--with-bg" style={{ position: 'relative', overflow: 'hidden' }}>
      <QuestionBackground src={bgSrc} />

      <div className="status-bar" role="status" aria-label={`${t.interaction.questionOf(questionNum, testTotal)}`}>
        <div className="status-bar-left">
          <span className="status-label">{t.interaction.testProgressLabel ?? 'Test Progress'}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="progress-bar-track" style={{ flex: 1 }}>
              <div className="progress-bar-fill" style={{ width: `${Math.round((questionNum / testTotal) * 100)}%` }} />
            </div>
            <span className="status-value">{questionNum}&nbsp;/&nbsp;{testTotal}</span>
          </div>
        </div>
        <span className="status-interaction">{t.interaction.questionOf(questionNum, testTotal)}</span>
      </div>

      <div className="interaction-content">
        {phase === 'question' && (
          <div className="animate-in" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
            {canUndo && onUndo && <button type="button" onClick={onUndo} style={toolButtonStyle}>Back</button>}
            {onExitToMenu && <button type="button" onClick={handleExitToMenu} style={toolButtonStyle}>Menu</button>}
            {onSwap && <button type="button" onClick={handleSwap} style={toolButtonStyle}>Swap</button>}
            {onSkip && <button type="button" onClick={handleSkip} style={toolButtonStyle}>Skip</button>}
          </div>
        )}

        {selectedCard && phase === 'question' && (
          <div className="animate-in" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--accent-light)' }}>✦</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent-light)', letterSpacing: '0.04em' }}>{t.cardSelectedLabel(selectedCard)}</span>
          </div>
        )}

        <div className="content-type-row animate-in">
          <span className={`rarity-badge rarity-${item.rarity_tier}`} aria-label={rarityLabel}>{rarityLabel}</span>
          <span className="content-type-label">{typeLabel}</span>
        </div>

        <div className="prompt-block animate-blur-in" style={{ animationDelay: '0.05s' }}>
          <p className="prompt-text">{promptText}</p>
        </div>

        <div className="answers-block animate-in" style={{ animationDelay: '0.1s' }} role="group" aria-label="answers">
          {answers.map((answer, i) => (
            <button
              key={i}
              className={`answer-btn${selected === answer ? ' selected' : ''}`}
              onClick={() => handleSelect(answer)}
              aria-pressed={selected === answer}
              disabled={isRevealPhase && selected !== answer}
              style={{ opacity: isRevealPhase && selected !== answer ? 0.3 : 1, cursor: isRevealPhase ? 'default' : 'pointer', position: 'relative' }}
            >
              <span style={{ marginRight: 10, fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600, minWidth: 16 }} aria-hidden="true">{String.fromCharCode(65 + i)}</span>
              {answer}
            </button>
          ))}
        </div>

        {phase === 'question' && selected && (
          <div className="animate-in" style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
            <button className="btn btn-teal" onClick={handleConfirm} style={{ maxWidth: 320 }} aria-label={t.interaction.confirmAnswer}>{t.interaction.confirmAnswer}</button>
          </div>
        )}

        {isRevealPhase && (
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '10px 16px', background: phase === 'insight' ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${phase === 'insight' ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 10 }}>
              {(phase === 'saved' || phase === 'analyzing') && <div style={{ display: 'flex', gap: 4 }}><div className="loading-dot" style={{ width: 5, height: 5 }} /><div className="loading-dot" style={{ width: 5, height: 5, animationDelay: '0.15s' }} /><div className="loading-dot" style={{ width: 5, height: 5, animationDelay: '0.3s' }} /></div>}
              {(phase === 'comparing' || phase === 'insight') && <span style={{ fontSize: '0.75rem', color: 'var(--accent-light)' }}>◈</span>}
              <p style={{ fontSize: '0.78rem', fontWeight: phase === 'insight' ? 600 : 400, color: phase === 'insight' ? 'var(--text)' : 'var(--text-dim)', fontStyle: phase === 'saved' || phase === 'analyzing' ? 'italic' : 'normal', margin: 0 }}>
                {phase === 'saved' && t.interaction.reveal.saved}
                {phase === 'analyzing' && t.interaction.reveal.analyzing}
                {phase === 'comparing' && distributionLabel}
                {phase === 'insight' && getInsightCopy()}
              </p>
            </div>

            {showDistribution && (
              <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {communityPercs.map(({ option, pct }, i) => {
                  const isSelected = option === selected;
                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: isSelected ? 'var(--text)' : 'var(--text-muted)', fontWeight: isSelected ? 600 : 400 }}>{option}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isSelected ? 'var(--accent-light)' : 'var(--text-muted)', minWidth: 36, textAlign: 'right' }}>{barsVisible ? `${pct}%` : ''}</span>
                      </div>
                      <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 3, width: barsVisible ? `${pct}%` : '0%', transition: 'width 0.7s cubic-bezier(0.4, 0, 0.2, 1)', background: isSelected ? 'linear-gradient(90deg, var(--accent), var(--accent-light))' : 'rgba(255,255,255,0.18)', boxShadow: isSelected ? '0 0 6px rgba(124,58,237,0.4)' : 'none' }} />
                      </div>
                    </div>
                  );
                })}
                {phase === 'insight' && <p className="animate-in" style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', fontStyle: 'italic' }}>{getCommunityMicrocopy()}</p>}
                {(voteResult?.realVotes ?? 0) < 30 && <p style={{ fontSize: '0.62rem', color: 'var(--text-dim)', textAlign: 'center', fontStyle: 'italic', opacity: 0.55 }}>{t.interaction.communityDisclaimer}</p>}
              </div>
            )}

            {showContinue && (
              <div className="animate-in" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.25fr)', gap: 10 }}>
                <button type="button" onClick={handleChangeAnswerInline} className="btn btn-ghost" style={{ minHeight: 46 }}>Change answer</button>
                <button type="button" className="btn btn-primary" onClick={handleContinue} style={{ minHeight: 46 }}>{t.interaction.continueToResult}</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
