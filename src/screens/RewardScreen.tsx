import { useState, useEffect } from 'react';
import { ContentItem, NextCard, RarityTier } from '../types';
import { useT, useLang } from '../context/LangContext';
import { localizedCsvField } from '../i18n';
import { getCommunityPercentages } from '../utils/communityStats';
import { ProfileFragment } from '../utils/profileFragments';
import { ProfileVector } from '../utils/profileVector';
import ProfileRadarChart from '../components/ProfileRadarChart';

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
  selectedAnswer,
  profileProgress,
  testIndex,
  testTotal,
  totalProfileAnswers,
  newFragment,
  nextCards,
  profileVector,
  changedAxes,
  onNext,
  onChangeAnswer,
  canChangeAnswer,
}: Props) {
  const t = useT();
  const [lang] = useLang();
  const [pickedCard, setPickedCard] = useState<number | null>(null);
  const [cardsDismissed, setCardsDismissed] = useState(false);
  const [showRadar, setShowRadar] = useState(true);
  const [analyzing, setAnalyzing] = useState(true);
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const delay = prefersReducedMotion ? 80 : (item.rarity_tier === 'legendary' ? 1200 : item.rarity_tier === 'epic' ? 900 : 380);

  useEffect(() => {
    const timer = setTimeout(() => setAnalyzing(false), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const axes = parseAxes(item);
  const answersLeftInTest = Math.max(0, testTotal - testIndex);
  const ANSWERS_FOR_READ = 51;
  const profileSignals = Math.min(totalProfileAnswers, ANSWERS_FOR_READ);

  const fields = item as unknown as Record<string, string>;
  const answerOptionsRaw = localizedCsvField(fields, 'answer_options', lang);
  const answerOptions = answerOptionsRaw.split('|').map((a) => a.trim()).filter(Boolean);
  const communityPct = getCommunityPercentages(item.id, answerOptions).find((p) => p.option === selectedAnswer)?.pct ?? 0;

  const hasCards = nextCards.length > 0;

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

  // If no cards, auto-show continue button
  const showContinue = !hasCards || cardsDismissed;

  return (
    <div className="reward-screen">
      {/* Status bar */}
      <div className="status-bar" role="status">
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '16px', padding: '40px 20px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <div className="loading-dot" />
            <div className="loading-dot" style={{ animationDelay: '0.15s' }} />
            <div className="loading-dot" style={{ animationDelay: '0.3s' }} />
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
            {(() => {
              const msgs = ['Analyzing your pattern…', 'Detecting a signal…', 'Mapping this choice…'];
              return msgs[Math.abs(item.id.charCodeAt(0)) % msgs.length];
            })()}
          </p>
        </div>
      ) : (
      <div className="reward-content">

        {/* ── Your Profile (radar chart + axis chips) ── */}
        <div className="reward-block rb-profile animate-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <p className="reward-block-label">{t.reward.profileSection}</p>
            {axes.length > 0 && (
              <button
                onClick={() => setShowRadar((v) => !v)}
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--text-dim)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px 6px',
                }}
              >
                {showRadar ? 'Show as list' : 'Show chart'}
              </button>
            )}
          </div>

          {showRadar ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <ProfileRadarChart
                vector={profileVector}
                size={120}
                variant="mini"
                highlightedAxes={changedAxes}
              />
              {changedAxes.length > 0 && (
                <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textAlign: 'center' }}>
                  {t.reward.profileShifts} {changedAxes.join(', ')}
                </p>
              )}
            </div>
          ) : null}

          {(!showRadar && axes.length > 0) && (
            <>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '10px' }}>
                {t.reward.profileShifts}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {axes.map(({ name, delta }) => (
                  <span
                    key={name}
                    style={{
                      padding: '4px 10px',
                      background: 'rgba(124,58,237,0.12)',
                      border: '1px solid rgba(124,58,237,0.3)',
                      borderRadius: '20px',
                      fontSize: '0.78rem',
                      color: 'var(--accent-light)',
                      fontWeight: 600,
                    }}
                  >
                    {name} {delta > 0 ? `+${delta}` : delta}
                  </span>
                ))}
              </div>
            </>
          )}

          {/* Supplementary chips (always shown, dim) */}
          {axes.length > 0 && showRadar && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px', justifyContent: 'center' }}>
              {axes.map(({ name, delta }) => (
                <span
                  key={name}
                  style={{
                    padding: '2px 8px',
                    background: 'rgba(124,58,237,0.06)',
                    border: '1px solid rgba(124,58,237,0.15)',
                    borderRadius: '20px',
                    fontSize: '0.68rem',
                    color: 'rgba(167,139,250,0.5)',
                  }}
                >
                  {name} {delta > 0 ? `+${delta}` : delta}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Rarity signal ── */}
        <div className="reward-block rb-rarity animate-in" style={{ animationDelay: '0.05s' }}>
          <p className="reward-block-label">{t.reward.blockLabel['rarity']}</p>
          <p className="reward-block-text">{t.reward.rarityPercent(communityPct)}</p>
        </div>

        {/* ── Unlocked ── */}
        <div className="reward-block rb-unlock animate-in" style={{ animationDelay: '0.1s' }}>
          <p className="reward-block-label">{t.reward.unlockedSection}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
            {/* Test progress */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.reward.testProgress}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)' }}>{testIndex}&nbsp;/&nbsp;{testTotal}</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '2px', width: `${(testIndex / testTotal) * 100}%`, background: 'var(--teal-light)', transition: 'width 0.5s ease' }} />
              </div>
            </div>
            {/* Profile reading */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.reward.profileReading}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)' }}>{profileSignals}&nbsp;/&nbsp;{ANSWERS_FOR_READ}</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '2px', width: `${(profileSignals / ANSWERS_FOR_READ) * 100}%`, background: 'var(--accent-light)', transition: 'width 0.5s ease' }} />
              </div>
            </div>
            {answersLeftInTest > 0 && (
              <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                {t.reward.answersLeftInTest(answersLeftInTest)}
              </p>
            )}
          </div>
        </div>

        {/* ── Fragment unlock notification ── */}
        {newFragment && (
          <div className="reward-block animate-in" style={{ animationDelay: '0.15s', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)' }}>
            <p className="reward-block-label" style={{ color: 'var(--accent-light)' }}>Fragment unlocked</p>
            <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
              {newFragment.title}
            </p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'capitalize' }}>
              {newFragment.rarity} signal
            </p>
          </div>
        )}

        {/* ── Card picker ── */}
        {hasCards && (
          <div className="animate-in" style={{ animationDelay: '0.18s', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', textAlign: 'center' }}>
              {t.reward.cardPickerTitle}
            </p>
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
                      flex: 1,
                      maxWidth: '110px',
                      minHeight: '80px',
                      borderRadius: '8px',
                      border: `1px solid ${isPicked ? RARITY_COLORS[card.rarityTier] : 'rgba(255,255,255,0.08)'}`,
                      background: isPicked
                        ? `rgba(${card.rarityTier === 'legendary' ? '251,191,36' : card.rarityTier === 'epic' ? '167,139,250' : card.rarityTier === 'rare' ? '96,165,250' : '156,163,175'}, 0.08)`
                        : 'rgba(255,255,255,0.03)',
                      opacity: isEliminated ? 0 : 1,
                      transform: isEliminated ? 'scale(0.8)' : 'scale(1)',
                      transition: 'all 0.4s ease',
                      cursor: pickedCard !== null ? 'default' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px 6px',
                      color: 'var(--text)',
                    }}
                  >
                    {!isPicked || !cardsDismissed ? (
                      <>
                        <span style={{ fontSize: '1.2rem', opacity: 0.3 }}>?</span>
                        {isPicked && !cardsDismissed && (
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', opacity: 0.7 }}>…</span>
                        )}
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: RARITY_COLORS[card.rarityTier], textTransform: 'capitalize' }}>
                          {card.rarityTier}
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)', textAlign: 'center', lineHeight: 1.2 }}>
                          {card.title}
                        </span>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.2 }}>
                          {card.subtitle}
                        </span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Continue/Change button */}
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
