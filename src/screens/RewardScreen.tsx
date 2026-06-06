import { useState, useEffect } from 'react';
import { ContentItem, NextCard, RarityTier } from '../types';
import ScreenBackground from '../components/ScreenBackground';
import { useT, useLang } from '../context/LangContext';
import { ProfileFragment } from '../utils/profileFragments';
import { ProfileVector } from '../utils/profileVector';
import { getAxisDisplayName } from '../utils/microReveals';
import { getNextLayerInfo, type RevealResult } from '../utils/revealPacing';

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
  try {
    if (item.axis_delta_json) deltas = JSON.parse(item.axis_delta_json) as Record<string, number>;
  } catch { /* ignore */ }
  return axes.map((name) => ({ name, delta: deltas[name] ?? deltas[name.toLowerCase()] ?? 1 }));
}

export default function RewardScreen({
  item,
  selectedAnswer: _selectedAnswer,
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
  const [lang] = useLang();
  const [pickedCard, setPickedCard] = useState<number | null>(null);
  const [cardsDismissed, setCardsDismissed] = useState(false);
  const [analyzing, setAnalyzing] = useState(true);
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const delay = prefersReducedMotion ? 80 : (item.rarity_tier === 'legendary' ? 900 : item.rarity_tier === 'epic' ? 650 : 280);

  useEffect(() => {
    const timer = setTimeout(() => setAnalyzing(false), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  // Auto-advance after reward is fully shown
  useEffect(() => {
    if (!autoAdvanceEnabled || analyzing) return;
    const hasCards = nextCards.length > 0;
    const showContinue = !hasCards || cardsDismissed;
    if (!showContinue) return;
    const timer = setTimeout(() => handleContinue(), 1500);
    return () => clearTimeout(timer);
  });

  const axes = parseAxes(item);
  const hasCards = nextCards.length > 0;
  const showContinue = !hasCards || cardsDismissed;
  const nextLayer = getNextLayerInfo(totalProfileAnswers);

  void lang; // selectedAnswer kept for future use

  function handlePickCard(i: number) {
    if (pickedCard !== null) return;
    setPickedCard(i);
    setTimeout(() => setCardsDismissed(true), 800);
  }

  function handleContinue() {
    if (hasCards && pickedCard !== null) {
      onNext(nextCards[pickedCard]);
    } else {
      onNext(null);
    }
  }

  return (
    <div className="reward-screen reward-screen--with-bg" style={{ position: 'relative' }}>
      <ScreenBackground src="/backgrounds/core/deep-stars.png" dim={0.55} />

      {/* Status bar */}
      <div className="status-bar" role="status" style={{ position: 'relative', zIndex: 1 }}>
        <div className="status-bar-left">
          <span className="status-label">{t.interaction.profileDiscovered}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="progress-bar-track" style={{ flex: 1 }}>
              <div className="progress-bar-fill" style={{ width: `${Math.min(100, (profileProgress / 85) * 100)}%` }} />
            </div>
            <span className="status-value">{profileProgress.toFixed(1)}%</span>
          </div>
        </div>
        <span className="status-interaction">{testIndex}&nbsp;/&nbsp;{testTotal}</span>
      </div>

      {analyzing ? (
        /* ── Analyzing phase: instant micro feedback ── */
        <div
          className="reward-analyzing"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '16px', padding: '40px 20px', position: 'relative', zIndex: 1 }}
        >
          <div style={{ display: 'flex', gap: '6px' }}>
            <div className="loading-dot" />
            <div className="loading-dot" style={{ animationDelay: '0.15s' }} />
            <div className="loading-dot" style={{ animationDelay: '0.3s' }} />
          </div>
          <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
            {microFeedback}
          </p>
        </div>
      ) : (
      <div className="reward-content" style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Profile movement pulse: axis chips ── */}
        {axes.length > 0 && (
          <div className="reward-block animate-in" style={{ animationDelay: '0s', paddingBottom: '10px' }}>
            <p style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '8px' }}>
              Profile shift
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {axes.map(({ name, delta }) => (
                <span
                  key={name}
                  style={{
                    padding: '3px 10px',
                    background: delta > 0 ? 'rgba(20,184,166,0.08)' : 'rgba(124,58,237,0.08)',
                    border: `1px solid ${delta > 0 ? 'rgba(20,184,166,0.22)' : 'rgba(124,58,237,0.22)'}`,
                    borderRadius: '20px',
                    fontSize: '0.74rem',
                    color: delta > 0 ? 'var(--teal-light)' : 'var(--accent-light)',
                    fontWeight: 600,
                  }}
                >
                  {getAxisDisplayName(name)}&nbsp;{delta > 0 ? `+${delta}` : delta}
                </span>
              ))}
              {changedAxes.length > 0 && changedAxes.filter(a => !axes.map(x => x.name).includes(a)).slice(0, 2).map((axis) => (
                <span
                  key={axis}
                  style={{
                    padding: '3px 10px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '20px',
                    fontSize: '0.68rem',
                    color: 'rgba(255,255,255,0.25)',
                  }}
                >
                  {getAxisDisplayName(axis)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Micro / Milestone reveal ── */}
        {revealResult?.should_show && (
          <div
            className={`animate-in${revealResult.intensity === 'milestone' ? ' reward-reveal--epic' : ''}`}
            style={{
              animationDelay: '0.08s',
              padding: '12px 16px',
              background: revealResult.intensity === 'milestone'
                ? 'rgba(245,158,11,0.06)'
                : 'rgba(124,58,237,0.06)',
              border: `1px solid ${revealResult.intensity === 'milestone' ? 'rgba(245,158,11,0.2)' : 'rgba(124,58,237,0.16)'}`,
              borderRadius: '10px',
            }}
          >
            <p style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: revealResult.intensity === 'milestone' ? 'var(--gold-light)' : 'var(--accent-light)', marginBottom: '4px' }}>
              {revealResult.title}
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {revealResult.body}
            </p>
          </div>
        )}

        {/* ── Fragment unlock notification ── */}
        {newFragment && (
          <div className="reward-block animate-in" style={{ animationDelay: '0.12s', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)' }}>
            <p className="reward-block-label" style={{ color: 'var(--accent-light)' }}>Fragment unlocked</p>
            <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>{newFragment.title}</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'capitalize' }}>{newFragment.rarity} signal</p>
          </div>
        )}

        {/* ── Profile evolution card — every 5 answers ── */}
        {evolutionData && showContinue && (
          <div className="animate-blur-in" style={{
            animationDelay: '0.1s',
            padding: '14px 16px',
            background: 'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(8,145,178,0.06) 100%)',
            border: '1px solid rgba(124,58,237,0.22)',
            borderRadius: '12px',
          }}>
            <p style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent-light)', marginBottom: '6px' }}>
              Profile update · {totalProfileAnswers} answers
            </p>
            <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>{evolutionData.primaryName}</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>{evolutionData.summary}</p>
          </div>
        )}

        {/* ── Card picker ── */}
        {hasCards && (
          <div className="animate-in" style={{ animationDelay: '0.14s', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textAlign: 'center', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {pickedCard === null ? t.reward.chooseOne : ''}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {nextCards.map((card, i) => {
                const isPicked = pickedCard === i;
                const isEliminated = pickedCard !== null && !isPicked;
                return (
                  <button
                    key={card.id}
                    onClick={() => handlePickCard(i)}
                    disabled={pickedCard !== null}
                    aria-label={isPicked ? card.title : 'Hidden card'}
                    style={{
                      flex: 1, maxWidth: '110px', minHeight: '80px',
                      borderRadius: '8px',
                      border: `1px solid ${isPicked ? RARITY_COLORS[card.rarityTier] : 'rgba(255,255,255,0.08)'}`,
                      background: isPicked
                        ? `rgba(${card.rarityTier === 'legendary' ? '251,191,36' : card.rarityTier === 'epic' ? '167,139,250' : card.rarityTier === 'rare' ? '96,165,250' : '156,163,175'}, 0.08)`
                        : 'rgba(255,255,255,0.03)',
                      opacity: isEliminated ? 0 : 1,
                      transform: isEliminated ? 'scale(0.8)' : 'scale(1)',
                      transition: 'all 0.4s ease',
                      cursor: pickedCard !== null ? 'default' : 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: '6px', padding: '10px 6px', color: 'var(--text)',
                    }}
                  >
                    {!isPicked || !cardsDismissed ? (
                      <>
                        <span style={{ fontSize: '1.2rem', opacity: 0.3 }}>?</span>
                        {isPicked && !cardsDismissed && <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', opacity: 0.7 }}>…</span>}
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: RARITY_COLORS[card.rarityTier], textTransform: 'capitalize' }}>{card.rarityTier}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)', textAlign: 'center', lineHeight: 1.2 }}>{card.title}</span>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.2 }}>{card.subtitle}</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Curiosity gap meter ── */}
        {showContinue && nextLayer && (
          <p style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.5 }}>
            {nextLayer.label} in{' '}
            <span style={{ color: 'var(--accent-light)', fontWeight: 600 }}>
              {nextLayer.answersLeft} {nextLayer.answersLeft === 1 ? 'answer' : 'answers'}
            </span>
          </p>
        )}

        {/* ── Next tease ── */}
        {showContinue && nextTease && (
          <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.28)', textAlign: 'center', fontStyle: 'italic', lineHeight: 1.5 }}>
            {nextTease}
          </p>
        )}

        {/* ── Action buttons ── */}
        {showContinue && (
          <div className="reward-actions animate-in">
            {canChangeAnswer && onChangeAnswer && (
              <button
                onClick={onChangeAnswer}
                style={{
                  background: 'none',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: 'var(--text-dim)',
                  fontSize: '0.78rem',
                  padding: '8px 20px',
                  cursor: 'pointer',
                  maxWidth: '320px',
                  width: '100%',
                }}
              >
                Change answer
              </button>
            )}
            <button
              className="btn btn-primary"
              onClick={handleContinue}
              style={{ maxWidth: '320px' }}
              aria-label={t.reward.continueButton}
            >
              {t.reward.continueButton}
            </button>
          </div>
        )}

        {/* Hidden profile footer */}
        <div className="reward-block-hidden-footer" style={{ marginTop: showContinue ? '4px' : '16px' }}>
          {t.reward.hiddenFooter}
        </div>
      </div>
      )}
    </div>
  );
}
