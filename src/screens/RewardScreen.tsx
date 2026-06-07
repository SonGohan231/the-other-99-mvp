import { useMemo, useState, useEffect } from 'react';
import { ContentItem, NextCard, RarityTier } from '../types';
import ScreenBackground from '../components/ScreenBackground';
import { useT } from '../context/LangContext';
import { ProfileFragment } from '../utils/profileFragments';
import { ProfileVector } from '../utils/profileVector';
import { getAxisDisplayName } from '../utils/microReveals';
import { getNextLayerInfo, type RevealResult } from '../utils/revealPacing';
import { computePatternInsight, computeSocialComparison } from '../engine/socialComparison';
import { getCompanionForAnswerCount, unlockCompanion } from '../utils/companionStickers';

interface EvolutionData {
  primaryName: string;
  confidence: string;
  summary: string;
}

interface Props {
  item: ContentItem;
  selectedAnswer: string;
  profileProgress: number;
  testIndex: number;
  testTotal: number;
  totalProfileAnswers: number;
  newFragment?: ProfileFragment | null;
  nextCards: NextCard[];
  profileVector: ProfileVector;
  changedAxes: string[];
  onNext: (card: NextCard | null) => void;
  onChangeAnswer?: () => void;
  canChangeAnswer?: boolean;
  evolutionData?: EvolutionData | null;
  revealResult?: RevealResult | null;
  microFeedback?: string;
  nextTease?: string;
  autoAdvanceEnabled?: boolean;
}

const RARITY_COLORS: Record<RarityTier, string> = {
  standard: 'rgba(156,163,175,0.9)',
  rare: 'rgba(96,165,250,0.9)',
  epic: 'rgba(167,139,250,0.9)',
  legendary: 'rgba(251,191,36,0.9)',
};

function parseAxes(item: ContentItem): { name: string; delta: number }[] {
  if (!item.axis_target) return [];
  const axes = item.axis_target.split(';').map((a) => a.trim()).filter(Boolean).slice(0, 3);
  let deltas: Record<string, number> = {};
  try { if (item.axis_delta_json) deltas = JSON.parse(item.axis_delta_json) as Record<string, number>; } catch { /* ignore */ }
  return axes.map((name) => ({ name, delta: deltas[name] ?? deltas[name.toLowerCase()] ?? 1 }));
}

function parseAnswerOptions(item: ContentItem): string[] {
  const raw = item.answer_options_en || item.answer_options_pl || '';
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch { /* ignore */ }
  return raw.split(/[|;]/).map((x) => x.trim()).filter(Boolean);
}

export default function RewardScreen({
  item,
  selectedAnswer,
  profileProgress,
  testIndex,
  testTotal,
  totalProfileAnswers,
  newFragment,
  nextCards,
  changedAxes,
  onNext,
  onChangeAnswer,
  canChangeAnswer,
  evolutionData,
  revealResult,
  microFeedback = 'Signal captured.',
  nextTease,
  autoAdvanceEnabled = false,
}: Props) {
  const t = useT();
  const [pickedCard, setPickedCard] = useState<number | null>(null);
  const [cardsDismissed, setCardsDismissed] = useState(false);
  const [analyzing, setAnalyzing] = useState(true);
  const [collectedCompanionId, setCollectedCompanionId] = useState<string | null>(null);
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const delay = prefersReducedMotion ? 80 : item.rarity_tier === 'legendary' ? 900 : item.rarity_tier === 'epic' ? 650 : 280;

  useEffect(() => {
    const timer = setTimeout(() => setAnalyzing(false), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const axes = useMemo(() => parseAxes(item), [item]);
  const answerOptions = useMemo(() => parseAnswerOptions(item), [item]);
  const socialComparison = useMemo(
    () => computeSocialComparison(item.id, selectedAnswer, answerOptions),
    [item.id, selectedAnswer, answerOptions],
  );
  const patternInsight = useMemo(
    () => computePatternInsight(axes, item.rarity_tier, totalProfileAnswers),
    [axes, item.rarity_tier, totalProfileAnswers],
  );
  const companion = useMemo(() => getCompanionForAnswerCount(totalProfileAnswers), [totalProfileAnswers, collectedCompanionId]);
  const nextLayer = getNextLayerInfo(totalProfileAnswers);
  const hasCards = nextCards.length > 0;
  const showContinue = !hasCards || cardsDismissed;

  useEffect(() => {
    if (!autoAdvanceEnabled || analyzing || !showContinue) return;
    const timer = setTimeout(() => handleContinue(), 1500);
    return () => clearTimeout(timer);
  });

  function handlePickCard(i: number) {
    if (pickedCard !== null) return;
    setPickedCard(i);
    setTimeout(() => setCardsDismissed(true), 800);
  }

  function handleCollectCompanion() {
    if (!companion) return;
    unlockCompanion(companion.id);
    setCollectedCompanionId(companion.id);
  }

  function handleContinue() {
    if (hasCards && pickedCard !== null) onNext(nextCards[pickedCard]);
    else onNext(null);
  }

  return (
    <div className="reward-screen reward-screen--with-bg" style={{ position: 'relative' }}>
      <ScreenBackground src="/backgrounds/core/deep-stars.png" dim={0.55} />

      <div className="status-bar" role="status" style={{ position: 'relative', zIndex: 1 }}>
        <div className="status-bar-left">
          <span className="status-label">Profile discovered</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="progress-bar-track" style={{ flex: 1 }}>
              <div className="progress-bar-fill" style={{ width: `${Math.min(100, (profileProgress / 85) * 100)}%` }} />
            </div>
            <span className="status-value">{profileProgress.toFixed(1)}%</span>
          </div>
        </div>
        <span className="status-interaction">{testIndex}&nbsp;/&nbsp;{testTotal}</span>
      </div>

      {analyzing ? (
        <div className="reward-analyzing" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16, padding: '40px 20px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <div className="loading-dot" /><div className="loading-dot" style={{ animationDelay: '0.15s' }} /><div className="loading-dot" style={{ animationDelay: '0.3s' }} />
          </div>
          <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>{microFeedback}</p>
        </div>
      ) : (
        <div className="reward-content" style={{ position: 'relative', zIndex: 1 }}>
          {axes.length > 0 && (
            <div className="reward-block animate-in" style={{ paddingBottom: 10 }}>
              <p className="reward-block-label">Profile shift</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {axes.map(({ name, delta }) => (
                  <span key={name} style={{ padding: '3px 10px', background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.22)', borderRadius: 20, fontSize: '0.74rem', color: 'var(--teal-light)', fontWeight: 600 }}>
                    {getAxisDisplayName(name)}&nbsp;{delta > 0 ? `+${delta}` : delta}
                  </span>
                ))}
                {changedAxes.slice(0, 2).map((axis) => <span key={axis} style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.28)' }}>{getAxisDisplayName(axis)}</span>)}
              </div>
            </div>
          )}

          {socialComparison && (
            <div className="reward-block animate-in" style={{ animationDelay: '0.05s' }}>
              <p className="reward-block-label">How others answered · {socialComparison.sourceLabelEn}</p>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: 10 }}>
                Your answer appears in about <strong style={{ color: 'var(--accent-light)' }}>{socialComparison.selectedAnswerPercent}%</strong> of this estimated sample.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {socialComparison.distribution.map((row) => {
                  const selected = row.label === selectedAnswer;
                  return (
                    <div key={row.answerId}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: '0.68rem', color: selected ? 'var(--text)' : 'var(--text-dim)' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.label}</span><span>{row.percent}%</span>
                      </div>
                      <div className="progress-bar-track" style={{ height: 4, marginTop: 4 }}><div className="progress-bar-fill" style={{ width: `${row.percent}%`, background: selected ? 'var(--accent)' : 'rgba(255,255,255,0.18)' }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {patternInsight && (
            <div className="reward-block animate-in" style={{ animationDelay: '0.08s', borderColor: 'rgba(20,184,166,0.18)' }}>
              <p className="reward-block-label" style={{ color: 'var(--teal-light)' }}>Pattern signal</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>{patternInsight.textEn}</p>
            </div>
          )}

          {companion && !collectedCompanionId && (
            <div className="reward-block animate-in" style={{ animationDelay: '0.1s', background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.22)' }}>
              <p className="reward-block-label" style={{ color: 'var(--gold-light)' }}>Signal companion unlocked</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: '2rem' }}>{companion.emoji}</span><div><p style={{ fontSize: '0.86rem', fontWeight: 700 }}>{companion.animal}</p><p style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>{companion.supportiveCopyEn}</p></div></div>
                <button className="btn btn-ghost" onClick={handleCollectCompanion} style={{ width: 'auto', padding: '8px 12px' }}>Collect</button>
              </div>
            </div>
          )}

          {revealResult?.should_show && (
            <div className="animate-in" style={{ padding: '12px 16px', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.16)', borderRadius: 10 }}>
              <p className="reward-block-label">{revealResult.title}</p><p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{revealResult.body}</p>
            </div>
          )}

          {newFragment && <div className="reward-block animate-in"><p className="reward-block-label">Fragment unlocked</p><p style={{ fontWeight: 700 }}>{newFragment.title}</p></div>}
          {evolutionData && showContinue && <div className="reward-block animate-in"><p className="reward-block-label">Profile update · {totalProfileAnswers} answers</p><p style={{ fontWeight: 700 }}>{evolutionData.primaryName}</p><p style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>{evolutionData.summary}</p></div>}

          {hasCards && (
            <div className="animate-in" style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              {nextCards.map((card, i) => <button key={card.id} onClick={() => handlePickCard(i)} disabled={pickedCard !== null} style={{ flex: 1, maxWidth: 110, minHeight: 74, borderRadius: 8, border: `1px solid ${pickedCard === i ? RARITY_COLORS[card.rarityTier] : 'rgba(255,255,255,0.08)'}`, background: 'rgba(255,255,255,0.03)', color: 'var(--text)' }}>{pickedCard === i && cardsDismissed ? card.title : '?'}</button>)}
            </div>
          )}

          {showContinue && nextLayer && <p style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textAlign: 'center' }}>{nextLayer.label} in <span style={{ color: 'var(--accent-light)' }}>{nextLayer.answersLeft} answers</span></p>}
          {showContinue && nextTease && <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.28)', textAlign: 'center', fontStyle: 'italic' }}>{nextTease}</p>}

          {showContinue && (
            <div className="reward-actions animate-in">
              {canChangeAnswer && onChangeAnswer && <button onClick={onChangeAnswer} className="btn btn-ghost" style={{ maxWidth: 320 }}>Change answer</button>}
              <button className="btn btn-primary" onClick={handleContinue} style={{ maxWidth: 320 }} aria-label={t.reward.continueButton}>{t.reward.continueButton}</button>
            </div>
          )}
          <div className="reward-block-hidden-footer" style={{ marginTop: showContinue ? 4 : 16 }}>{t.reward.hiddenFooter}</div>
        </div>
      )}
    </div>
  );
}
