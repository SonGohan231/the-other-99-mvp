import { useState } from 'react';
import { ContentItem, ContentBias, ContentType, RarityTier } from '../types';
import { useT, useLang } from '../context/LangContext';
import { localizedCsvField } from '../i18n';
import { getCommunityPercentages } from '../utils/communityStats';
import { ProfileFragment } from '../utils/profileFragments';

interface Props {
  item: ContentItem;
  selectedAnswer: string;
  profileProgress: number;
  testIndex: number;
  testTotal: number;
  totalProfileAnswers: number;
  newFragment?: ProfileFragment | null;
  onNext: (bias: ContentBias | null) => void;
}

// ─── Card picker ──────────────────────────────────────────────────────────────

interface Card {
  content_type: ContentType;
  rarity_tier: RarityTier;
  label: string;
}

// Fallback type names (used only for aria-label when t not yet available)
const TYPE_NAMES: Record<ContentType, string> = {
  question: 'Hidden Question',
  secret: 'Dark Mirror',
  dare: 'Pattern Break',
  game: 'Social Mirror',
  riddle: 'Signal Trace',
};

const RARITY_COLORS: Record<RarityTier, string> = {
  standard: 'rgba(156,163,175,0.9)',
  rare: 'rgba(96,165,250,0.9)',
  epic: 'rgba(167,139,250,0.9)',
  legendary: 'rgba(251,191,36,0.9)',
};

function generateCards(contentId: string): Card[] {
  // Deterministic but varied card selection
  const h = contentId.split('').reduce((a, c) => Math.imul(31, a) + c.charCodeAt(0), 0) >>> 0;
  const types: ContentType[] = ['question', 'secret', 'dare', 'game', 'riddle'];
  const rarities: RarityTier[] = ['standard', 'rare', 'epic', 'legendary'];

  const pick = (arr: string[], seed: number) => arr[seed % arr.length];

  const cards: Card[] = [
    {
      content_type: pick(types, h) as ContentType,
      rarity_tier: pick(rarities, (h >>> 3) % 4) as RarityTier,
      label: '',
    },
    {
      content_type: pick(types, (h + 2) % types.length) as ContentType,
      rarity_tier: pick(rarities, (h >>> 6) % 4) as RarityTier,
      label: '',
    },
    {
      content_type: pick(types, (h + 4) % types.length) as ContentType,
      rarity_tier: pick(rarities, (h >>> 9) % 4) as RarityTier,
      label: '',
    },
  ];

  return cards.map((c) => ({ ...c, label: `${TYPE_NAMES[c.content_type]} — ${c.rarity_tier}` }));
}

// ─── Axis chip ────────────────────────────────────────────────────────────────

function parseAxes(item: ContentItem): { name: string; delta: number }[] {
  if (!item.axis_target) return [];
  const axes = item.axis_target.split(';').map((a) => a.trim()).filter(Boolean).slice(0, 3);

  let deltas: Record<string, number> = {};
  try {
    if (item.axis_delta_json) deltas = JSON.parse(item.axis_delta_json) as Record<string, number>;
  } catch { /* ignore */ }

  return axes.map((name) => ({ name, delta: deltas[name] ?? deltas[name.toLowerCase()] ?? 1 }));
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RewardScreen({
  item,
  selectedAnswer,
  profileProgress,
  testIndex,
  testTotal,
  totalProfileAnswers,
  newFragment,
  onNext,
}: Props) {
  const t = useT();
  const [lang] = useLang();
  const [pickedCard, setPickedCard] = useState<number | null>(null);
  const [cardsDismissed, setCardsDismissed] = useState(false);

  const axes = parseAxes(item);
  const cards = generateCards(item.id);
  const answersLeftInTest = Math.max(0, testTotal - testIndex);
  const ANSWERS_FOR_READ = 51;
  const profileSignals = Math.min(totalProfileAnswers, ANSWERS_FOR_READ);

  // Community percentage for rarity display
  const fields = item as unknown as Record<string, string>;
  const answerOptionsRaw = localizedCsvField(fields, 'answer_options', lang);
  const answerOptions = answerOptionsRaw.split('|').map((a) => a.trim()).filter(Boolean);
  const communityPct = getCommunityPercentages(item.id, answerOptions).find((p) => p.option === selectedAnswer)?.pct ?? 0;

  function handlePickCard(i: number) {
    if (pickedCard !== null) return;
    setPickedCard(i);
    setTimeout(() => setCardsDismissed(true), 800);
  }

  function handleContinue() {
    const bias: ContentBias | null = pickedCard !== null
      ? {
          content_type: cards[pickedCard].content_type,
          rarity_tier: cards[pickedCard].rarity_tier,
          label: t.cardNames[cards[pickedCard].content_type] ?? TYPE_NAMES[cards[pickedCard].content_type],
        }
      : null;
    onNext(bias);
  }

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

      <div className="reward-content">

        {/* ── Your Profile ── */}
        {axes.length > 0 && (
          <div className="reward-block rb-profile animate-in">
            <p className="reward-block-label">{t.reward.profileSection}</p>
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
          </div>
        )}

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
        <div className="animate-in" style={{ animationDelay: '0.18s', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', textAlign: 'center' }}>
            {t.reward.cardPickerTitle}
          </p>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textAlign: 'center', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {pickedCard === null ? t.reward.chooseOne : ''}
          </p>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {cards.map((card, i) => {
              const isPicked = pickedCard === i;
              const isEliminated = pickedCard !== null && !isPicked;

              return (
                <button
                  key={i}
                  onClick={() => handlePickCard(i)}
                  disabled={pickedCard !== null}
                  aria-label={isPicked ? card.label : 'Hidden card'}
                  style={{
                    flex: 1,
                    maxWidth: '110px',
                    minHeight: '80px',
                    borderRadius: '8px',
                    border: `1px solid ${isPicked ? RARITY_COLORS[card.rarity_tier] : 'rgba(255,255,255,0.08)'}`,
                    background: isPicked
                      ? `rgba(${card.rarity_tier === 'legendary' ? '251,191,36' : card.rarity_tier === 'epic' ? '167,139,250' : card.rarity_tier === 'rare' ? '96,165,250' : '156,163,175'}, 0.08)`
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
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: RARITY_COLORS[card.rarity_tier], textTransform: 'capitalize' }}>
                        {card.rarity_tier}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)', textAlign: 'center', lineHeight: 1.2 }}>
                        {t.cardNames[card.content_type] ?? TYPE_NAMES[card.content_type]}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Continue button — appears after card is revealed */}
        {cardsDismissed && (
          <div className="reward-actions animate-in">
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
        <div className="reward-block-hidden-footer" style={{ marginTop: cardsDismissed ? '4px' : '16px' }}>
          {t.reward.hiddenFooter}
        </div>
      </div>
    </div>
  );
}
