import { UserProfile } from '../lib/supabase';
import ScreenBackground from '../components/ScreenBackground';
import { ProfileVector } from '../utils/profileVector';
import { FeedEvent } from '../utils/eventFeed';
import { ProfileFragment } from '../utils/profileFragments';
import { TwinFeedEvent } from '../utils/twinFeed';
import { TimelineEvent } from '../utils/profileTimeline';
import { computeHiddenProfile, isHiddenProfileUnlocked } from '../utils/hiddenProfile';
import { canContinueTest, MILESTONES } from '../utils/premiumProgression';
import { computeArchetypeMix, isArchetypeMixUnlocked, ARCHETYPES } from '../utils/archetypes';
import { useT, useLang } from '../context/LangContext';
import { getProfileConfidence, TIER_COLOR } from '../utils/profileConfidence';
import { getStreak } from '../utils/streak';
import { getDailyMysteryCard } from '../utils/dailyMysteryCard';
import { getUnlockMilestoneText } from '../utils/microReveals';
import { type DailyCardData } from '../online/dailyCard';

interface Props {
  userProfile: UserProfile;
  profileVector: ProfileVector;
  humanTwinMatch: number;
  totalProfileAnswers: number;
  feedEvents: FeedEvent[];
  profileFragments: ProfileFragment[];
  twinFeedEvents: TwinFeedEvent[];
  timeline: TimelineEvent[];
  isPremium: boolean;
  onStartTest: () => void;
  onTruthOrDare: () => void;
  onMyProfile: () => void;
  onExportJson: () => void;
  onResetSession: () => void;
  onLogout: () => void;
  onProfileSnapshot: () => void;
  onFullProfile: () => void;
  onHiddenParams: () => void;
  onAccount?: () => void;
  onPremiumDepth?: () => void;
  onArchetypes?: () => void;
  onGalaxyMap?: () => void;
  onSnapshot51?: () => void;
  onEmergingArchetype?: () => void;
  onContradiction?: () => void;
  onHumanTwin?: () => void;
  dailyCard?: DailyCardData | null;
}

const RARITY_LABEL_COLOR: Record<string, string> = {
  standard: 'rgba(255,255,255,0.38)',
  rare: '#22d3ee',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

const RARITY_ICON: Record<string, string> = {
  standard: '◦',
  rare: '◈',
  epic: '◆',
  legendary: '✦',
};

export default function DashboardScreen({
  userProfile,
  profileVector,
  humanTwinMatch,
  totalProfileAnswers,
  feedEvents,
  profileFragments,
  twinFeedEvents,
  timeline,
  isPremium,
  onStartTest,
  onTruthOrDare,
  onMyProfile,
  onExportJson,
  onResetSession,
  onLogout,
  onProfileSnapshot,
  onFullProfile,
  onHiddenParams,
  onAccount,
  onPremiumDepth,
  onArchetypes,
  onGalaxyMap,
  onSnapshot51,
  onEmergingArchetype,
  onContradiction,
  onHumanTwin,
  dailyCard,
}: Props) {
  const t = useT();
  const [lang, setLang] = useLang();

  const conf          = getProfileConfidence(totalProfileAnswers);
  const signalPct     = Math.min(100, Math.round((totalProfileAnswers / 100) * 100));
  const unlockCount   = Math.min(totalProfileAnswers, 99);
  const streak        = getStreak();
  const dailyMystery  = dailyCard ?? getDailyMysteryCard();
  const milestoneText = getUnlockMilestoneText(totalProfileAnswers);

  void feedEvents;
  void twinFeedEvents;
  void timeline;
  void onTruthOrDare;
  void onMyProfile;

  const { free_profile_tests_used, total_answers } = userProfile;
  const freeTestsUsed = free_profile_tests_used ?? 0;
  const canStartTest = canContinueTest(freeTestsUsed, isPremium);

  const twinDataReady = totalProfileAnswers >= 5;
  const hiddenUnlocked = isHiddenProfileUnlocked(totalProfileAnswers);
  const hiddenProfileData = computeHiddenProfile(profileVector, totalProfileAnswers);

  const archetypeMixUnlocked = isArchetypeMixUnlocked(totalProfileAnswers);
  const archetypeMix = computeArchetypeMix(profileVector, totalProfileAnswers);
  const primaryArch = archetypeMixUnlocked ? ARCHETYPES[archetypeMix.primary] : null;

  const answersToArchetype = Math.max(0, 100 - totalProfileAnswers);
  const reversedFragments = [...profileFragments].reverse();

  return (
    <div className="screen screen--has-bg" style={{ position: 'relative', minHeight: '100dvh' }}>
      <ScreenBackground src="/backgrounds/core/cosmic-nebula.png" dim={0.46} />

      {/* ── Glass Header ─────────────────────────── */}
      <header
        className="dashboard-header--with-bg"
        style={{
          position: 'relative', zIndex: 1,
          padding: '14px 20px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <span style={{
          fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.28em',
          textTransform: 'uppercase', color: 'var(--accent-light)',
        }}>
          The Other 99
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isPremium && (
            <span style={{
              padding: '2px 8px', fontSize: '0.58rem', fontWeight: 700,
              background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: '20px', color: 'var(--gold)', letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              ✦ {t.premiumBadge.active}
            </span>
          )}
          {onAccount && (
            <button
              className="btn btn-ghost tappable"
              onClick={onAccount}
              style={{ padding: '4px 10px', fontSize: '0.72rem' }}
            >
              {userProfile.display_name ?? userProfile.email ?? t.account.statusGuest}
            </button>
          )}
        </div>
      </header>

      <main
        style={{
          position: 'relative', zIndex: 1,
          display: 'flex', flexDirection: 'column', gap: '20px',
          maxWidth: '480px', margin: '0 auto', width: '100%',
          paddingBottom: '40px',
        }}
        aria-label={t.dashboard.mainLabel}
      >

        {/* ── 1. Hero Archetype Section ─────────── */}
        <section className="home-hero animate-in">
          {/* Actual background artwork */}
          <img
            src="/backgrounds/core/purple-glow-background.png"
            alt=""
            aria-hidden
            className="home-hero-artwork"
          />
          <img
            src="/backgrounds/core/floating-particles.png"
            alt=""
            aria-hidden
            className="home-hero-particles"
          />
          <div className="home-hero-overlay" />
          <div className="home-hero-glow" />

          {primaryArch ? (
            <>
              <div style={{
                position: 'relative', zIndex: 1,
                fontSize: '3.8rem', lineHeight: 1, marginBottom: '14px',
                filter: `drop-shadow(0 0 28px ${primaryArch.color}88)`,
              }}>
                {primaryArch.symbol}
              </div>
              <h1 style={{
                position: 'relative', zIndex: 1,
                fontSize: 'clamp(1.7rem, 5.5vw, 2.3rem)', fontWeight: 800,
                letterSpacing: '-0.02em', lineHeight: 1.1,
                color: 'var(--text)', textShadow: '0 2px 20px rgba(0,0,0,0.8)',
                marginBottom: '6px',
              }}>
                {primaryArch.name}
              </h1>
              <p style={{ position: 'relative', zIndex: 1, fontSize: '0.78rem', color: primaryArch.color, fontWeight: 600 }}>
                {archetypeMix.confidence}%{' '}{lang === 'pl' ? 'pewności' : 'confidence'}
              </p>
              <p style={{
                position: 'relative', zIndex: 1,
                fontSize: '0.72rem', color: 'rgba(255,255,255,0.48)',
                fontStyle: 'italic', marginTop: '4px', maxWidth: '260px', lineHeight: 1.55,
              }}>
                {primaryArch.coreDrive}
              </p>
            </>
          ) : (
            <>
              <div style={{
                position: 'relative', zIndex: 1,
                fontSize: '2.8rem', lineHeight: 1, marginBottom: '14px',
                color: 'rgba(255,255,255,0.16)',
              }}>
                ◌
              </div>
              <h1 style={{
                position: 'relative', zIndex: 1,
                fontSize: 'clamp(1.25rem, 4vw, 1.6rem)', fontWeight: 700,
                color: 'rgba(255,255,255,0.5)', letterSpacing: '-0.01em', lineHeight: 1.25,
                textShadow: '0 2px 12px rgba(0,0,0,0.6)', marginBottom: '8px',
              }}>
                {lang === 'pl' ? 'Twój wzorzec się formuje' : 'Your pattern is forming'}
              </h1>
              {answersToArchetype > 0 && (
                <p style={{ position: 'relative', zIndex: 1, fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>
                  {lang === 'pl'
                    ? `${answersToArchetype} odpowiedzi do odkrycia archetypu`
                    : `${answersToArchetype} more answers to reveal your archetype`}
                </p>
              )}
            </>
          )}

          <button
            className="btn btn-primary tappable"
            onClick={onStartTest}
            disabled={!canStartTest}
            style={{
              position: 'relative', zIndex: 1,
              marginTop: '22px', minWidth: '200px',
              opacity: canStartTest ? 1 : 0.4,
              background: canStartTest
                ? 'linear-gradient(90deg, var(--accent), rgba(124,58,237,0.8))'
                : undefined,
              boxShadow: canStartTest ? '0 4px 28px rgba(124,58,237,0.4)' : 'none',
            }}
          >
            {canStartTest
              ? (totalProfileAnswers > 0 ? t.premium.continueDiscovery : t.dashboard.startTest)
              : t.dashboard.noFreeTests}
          </button>

          {!canStartTest && (
            <p style={{ position: 'relative', zIndex: 1, fontSize: '0.68rem', color: 'rgba(255,255,255,0.32)', marginTop: '8px' }}>
              {t.dashboard.noFreeTestsNote}
            </p>
          )}

          <div style={{
            position: 'relative', zIndex: 1,
            display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center',
          }}>
            <span style={{
              padding: '3px 10px', borderRadius: '20px', fontSize: '0.62rem', fontWeight: 600,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
              color: 'rgba(255,255,255,0.40)',
            }}>
              {total_answers} {lang === 'pl' ? 'sygnałów' : 'signals'}
            </span>
            {!isPremium && (
              <span style={{
                padding: '3px 10px', borderRadius: '20px', fontSize: '0.62rem', fontWeight: 600,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
                color: freeTestsUsed >= 3 ? 'rgba(255,255,255,0.22)' : 'var(--accent-light)',
              }}>
                {Math.max(0, 3 - freeTestsUsed)}/3 {lang === 'pl' ? 'darmowych' : 'free'}
              </span>
            )}
            {streak.current > 1 && (
              <span style={{
                padding: '3px 10px', borderRadius: '20px', fontSize: '0.62rem', fontWeight: 600,
                background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                color: 'var(--gold-light)',
              }}>
                🔥 {streak.current}-{lang === 'pl' ? 'dniowa seria' : 'day streak'}
              </span>
            )}
          </div>

          {/* Profile signal + unlock meter */}
          <div style={{
            position: 'relative', zIndex: 1,
            width: '100%', maxWidth: '300px', marginTop: '18px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)' }}>
                {lang === 'pl' ? 'Sygnał profilu' : 'Profile signal'} · {signalPct}%
              </span>
              <span style={{ fontSize: '0.58rem', fontWeight: 700, color: TIER_COLOR[conf.tier] }}>
                {conf.label}
              </span>
            </div>
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ height: '100%', width: `${signalPct}%`, background: TIER_COLOR[conf.tier], borderRadius: '2px', transition: 'width 0.6s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ fontSize: '0.56rem', color: 'rgba(255,255,255,0.22)' }}>
                {lang === 'pl' ? 'Odblokowany profil' : 'Profile unlocked'}
              </span>
              <span style={{ fontSize: '0.56rem', color: 'rgba(255,255,255,0.32)', fontWeight: 600 }}>
                {unlockCount} / 99
              </span>
            </div>
            <div style={{ height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '1px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(unlockCount / 99) * 100}%`, background: 'rgba(255,255,255,0.18)', borderRadius: '1px', transition: 'width 0.6s ease' }} />
            </div>
            {milestoneText && (
              <p style={{ fontSize: '0.56rem', color: 'var(--accent-light)', marginTop: '4px', fontStyle: 'italic' }}>
                {milestoneText}
              </p>
            )}
          </div>
        </section>

        {/* ── 2. Bento Grid ────────────────────── */}
        <section style={{ padding: '0 16px' }}>
          <div className="bento-grid">

            {/* Hidden Profile → forest */}
            <div
              className={`bento-tile ${hiddenUnlocked ? 'bento-tile--accent tappable' : ''}`}
              onClick={hiddenUnlocked ? onHiddenParams : undefined}
              style={{ cursor: hiddenUnlocked ? 'pointer' : 'default' }}
            >
              <div
                className="bento-tile-bg"
                style={{ backgroundImage: 'url(/backgrounds/questions/question-forest.png)' }}
              />
              <span className="bento-tile-label">
                {lang === 'pl' ? 'Ukryty profil' : 'Hidden Profile'}
              </span>
              {hiddenUnlocked ? (
                <>
                  <span className="bento-tile-value" style={{ fontSize: '0.88rem', color: 'var(--accent-light)' }}>
                    {hiddenProfileData.primaryDriver}
                  </span>
                  <span className="bento-tile-sub">
                    {hiddenProfileData.confidence}% {lang === 'pl' ? 'zmapowane →' : 'mapped →'}
                  </span>
                </>
              ) : (
                <span className="bento-tile-sub">
                  {lang === 'pl'
                    ? `51 odpowiedzi · ${totalProfileAnswers} do tej pory`
                    : `51 answers · ${totalProfileAnswers} so far`}
                </span>
              )}
            </div>

            {/* Human Twin → lake */}
            <div
              className={`bento-tile ${twinDataReady ? 'bento-tile--teal tappable' : ''}`}
              onClick={twinDataReady ? onMyProfile : undefined}
              style={{ cursor: twinDataReady ? 'pointer' : 'default' }}
            >
              <div
                className="bento-tile-bg"
                style={{ backgroundImage: 'url(/backgrounds/questions/question-lake.png)' }}
              />
              <span className="bento-tile-label">
                {lang === 'pl' ? 'Ludzki Bliźniak' : 'Human Twin'}
              </span>
              {twinDataReady ? (
                <>
                  <span className="bento-tile-value" style={{ color: 'var(--teal-light)', fontSize: '1.5rem' }}>
                    {humanTwinMatch}%
                  </span>
                  <span className="bento-tile-sub">
                    {lang === 'pl' ? 'szacowane dopasowanie' : 'projected match'}
                  </span>
                </>
              ) : (
                <span className="bento-tile-sub">
                  {lang === 'pl'
                    ? 'Szukam najbliższego dopasowania…'
                    : 'Searching for your closest projected match…'}
                </span>
              )}
            </div>

            {/* Rare Signal → nebula */}
            <div className="bento-tile">
              <div
                className="bento-tile-bg"
                style={{ backgroundImage: 'url(/backgrounds/core/cosmic-nebula.png)', opacity: 0.20 }}
              />
              <span className="bento-tile-label">
                {lang === 'pl' ? 'Rzadki sygnał' : 'Rare Signal'}
              </span>
              {hiddenUnlocked ? (
                <>
                  <span className="bento-tile-value" style={{ fontSize: '0.82rem', lineHeight: 1.3 }}>
                    {hiddenProfileData.rarestSignal}
                  </span>
                  <span className="bento-tile-sub">
                    {hiddenProfileData.rarestSignalPercent.toFixed(1)}%{' '}
                    {lang === 'pl' ? 'użytkowników' : 'of people'}
                  </span>
                </>
              ) : (
                <span className="bento-tile-sub">
                  {lang === 'pl'
                    ? 'Rzadkie sygnały pojawiają się w miarę pogłębiania profilu'
                    : 'Rare signals emerge as your pattern deepens'}
                </span>
              )}
            </div>

            {/* Shadow → fog */}
            <div className="bento-tile">
              <div
                className="bento-tile-bg"
                style={{ backgroundImage: 'url(/backgrounds/questions/question-fog.png)' }}
              />
              <span className="bento-tile-label">
                {lang === 'pl' ? 'Cień' : 'Shadow'}
              </span>
              {primaryArch ? (
                <span className="bento-tile-value" style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.58)', lineHeight: 1.35 }}>
                  {primaryArch.shadow}
                </span>
              ) : (
                <span className="bento-tile-sub">
                  {lang === 'pl' ? 'Formuje się przy 100 odpowiedziach' : 'Forms at 100 answers'}
                </span>
              )}
            </div>

            {/* Relationship → mountains */}
            <div
              className={`bento-tile ${primaryArch ? 'tappable' : ''}`}
              onClick={primaryArch ? onFullProfile : undefined}
              style={{ cursor: primaryArch ? 'pointer' : 'default' }}
            >
              <div
                className="bento-tile-bg"
                style={{ backgroundImage: 'url(/backgrounds/questions/question-mountains.png)' }}
              />
              <span className="bento-tile-label">
                {lang === 'pl' ? 'Wzorzec relacji' : 'Relationship'}
              </span>
              {primaryArch ? (
                <>
                  <span className="bento-tile-value" style={{ fontSize: '0.76rem', lineHeight: 1.35 }}>
                    {primaryArch.relationshipPattern}
                  </span>
                  <span className="bento-tile-sub">→</span>
                </>
              ) : (
                <span className="bento-tile-sub">
                  {lang === 'pl' ? 'Odblokuj z archetypem' : 'Unlocks with archetype'}
                </span>
              )}
            </div>

            {/* Premium Depth → portal */}
            <div
              className={`bento-tile ${isPremium ? 'bento-tile--gold' : ''} tappable`}
              onClick={onPremiumDepth}
              style={{ cursor: onPremiumDepth ? 'pointer' : 'default' }}
            >
              <div
                className="bento-tile-bg"
                style={{
                  backgroundImage: 'url(/backgrounds/core/gateway-portal.png)',
                  opacity: isPremium ? 0.24 : 0.14,
                }}
              />
              <span className="bento-tile-label">
                {isPremium
                  ? (lang === 'pl' ? 'Głębszy profil' : 'Premium Depth')
                  : (lang === 'pl' ? 'Odblokuj więcej' : 'Unlock More')}
              </span>
              {isPremium ? (
                <>
                  <span className="bento-tile-value" style={{ color: 'var(--gold-light)', fontSize: '0.9rem' }}>
                    ✦ {lang === 'pl' ? 'Aktywne' : 'Active'}
                  </span>
                  <span className="bento-tile-sub">
                    {lang === 'pl' ? 'Głęboka analiza →' : 'Deep analysis →'}
                  </span>
                </>
              ) : (
                <span className="bento-tile-sub">
                  {lang === 'pl'
                    ? 'Pełny profil, ukryte parametry →'
                    : 'Full profile, hidden parameters →'}
                </span>
              )}
            </div>

          </div>
        </section>

        {/* ── 2.5. What's Unlocking ────────────── */}
        <section style={{ padding: '0 16px' }}>
          <div style={{ marginBottom: '10px' }}>
            <span className="section-eyebrow">
              {lang === 'pl' ? 'Co się otwiera' : "What's unlocking"}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {[
              { label: lang === 'pl' ? 'Archetyp'         : 'Archetype',        threshold: 10,  color: 'var(--accent-light)' },
              { label: lang === 'pl' ? 'Ukryty profil'    : 'Hidden Profile',   threshold: 51,  color: 'var(--teal-light)'   },
              { label: lang === 'pl' ? 'Ludzki Bliźniak'  : 'Human Twin',       threshold: 25,  color: 'var(--teal-light)'   },
              { label: 'Snapshot 51',                                             threshold: 51,  color: 'var(--gold-light)'   },
              { label: lang === 'pl' ? 'Mapa sprzeczności': 'Contradiction Map', threshold: 10,  color: '#c084fc'             },
            ].map(({ label, threshold, color }) => {
              const pct      = Math.min(100, Math.round((totalProfileAnswers / threshold) * 100));
              const unlocked = totalProfileAnswers >= threshold;
              return (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ fontSize: '0.62rem', color: unlocked ? color : 'var(--text-dim)' }}>{label}</span>
                    <span style={{ fontSize: '0.58rem', fontWeight: 600, color: unlocked ? color : 'var(--text-dim)' }}>
                      {unlocked
                        ? (lang === 'pl' ? 'Odblokowany' : 'Unlocked')
                        : `${totalProfileAnswers} / ${threshold}`}
                    </span>
                  </div>
                  <div style={{ height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '1px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: unlocked ? color : 'rgba(255,255,255,0.12)', borderRadius: '1px', transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 3. Discovery Collection ───────────── */}
        <section style={{ padding: '0 16px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '12px',
          }}>
            <span className="section-eyebrow">
              {lang === 'pl' ? 'Kolekcja odkryć' : 'Discovery Collection'}
            </span>
            {profileFragments.length > 0 && (
              <span style={{ fontSize: '0.68rem', color: 'var(--accent-light)', fontWeight: 600 }}>
                {profileFragments.length} {lang === 'pl' ? 'fragmentów' : 'found'}
              </span>
            )}
          </div>

          {profileFragments.length === 0 ? (
            <p className="collection-empty">
              {lang === 'pl'
                ? 'Zbierz więcej odpowiedzi, aby odkryć fragmenty profilu.'
                : 'Answer more questions to discover profile fragments.'}
            </p>
          ) : (
            <div className="collection-rail">
              {reversedFragments.map((frag, idx) => (
                <div
                  key={frag.id}
                  className={`fragment-card fragment-card--${frag.rarity} tappable${idx === 0 ? ' fragment-card--new' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      color: RARITY_LABEL_COLOR[frag.rarity] ?? 'var(--text-dim)',
                    }}>
                      {RARITY_ICON[frag.rarity] ?? '◦'}
                    </span>
                    <span style={{
                      fontSize: '0.54rem', fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: RARITY_LABEL_COLOR[frag.rarity] ?? 'var(--text-dim)',
                    }}>
                      {frag.rarity}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2,
                  }}>
                    {frag.title}
                  </span>
                  <p style={{
                    fontSize: '0.67rem', color: 'var(--text-dim)', lineHeight: 1.45, marginTop: 'auto',
                  }}>
                    {frag.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── 4. Discovery Path (milestones) ─────── */}
        <section style={{ padding: '0 16px' }}>
          <div style={{ marginBottom: '12px' }}>
            <span className="section-eyebrow">
              {lang === 'pl' ? 'Oś odkryć' : 'Discovery Path'}
            </span>
          </div>
          <div className="milestone-path">
            {MILESTONES.map((m) => {
              const reached = totalProfileAnswers >= m.answers;
              const label = lang === 'pl' ? m.label_pl : m.label;
              return (
                <div key={m.answers} className={`milestone-step ${reached ? 'milestone-step--reached' : ''}`}>
                  <div className={`milestone-dot ${reached ? 'milestone-dot--reached' : ''}`}>
                    {reached ? '✓' : '·'}
                  </div>
                  <span className="milestone-step-label">{label}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Daily Mystery Card ───────────────── */}
        <section style={{ padding: '0 16px' }}>
          <div style={{
            padding: '16px 18px',
            background: 'rgba(124,58,237,0.06)',
            border: '1px solid rgba(124,58,237,0.16)',
            borderRadius: '14px',
            backdropFilter: 'blur(8px)',
          }}>
            <p style={{
              fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: 'var(--accent-light)', marginBottom: '5px',
            }}>
              {dailyMystery.title}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {dailyMystery.body}
            </p>
          </div>
        </section>

        {/* ── 5. Galaxy Map Entry ───────────────── */}
        <section style={{ padding: '0 16px' }}>
          <div style={{ marginBottom: '12px' }}>
            <span className="section-eyebrow">
              {lang === 'pl' ? 'Nawigacja' : 'Navigate'}
            </span>
          </div>
          <button
            className="galaxy-entry-btn"
            onClick={onGalaxyMap}
            aria-label={lang === 'pl' ? 'Otwórz Mapę Galaktyki' : 'Open Galaxy Map'}
          >
            <img
              src="/backgrounds/core/cosmic-nebula.png"
              alt=""
              aria-hidden
              className="galaxy-entry-bg"
            />
            <div className="galaxy-entry-overlay" />
            <div style={{
              position: 'relative', zIndex: 1,
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '0 20px', width: '100%',
            }}>
              <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>⬡</span>
              <div>
                <p style={{
                  fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', marginBottom: '2px',
                }}>
                  {lang === 'pl' ? 'Mapa Galaktyki' : 'Galaxy Map'}
                </p>
                <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.42)' }}>
                  {lang === 'pl'
                    ? 'Zbadaj wszystkie wymiary profilu'
                    : 'Explore all profile dimensions'}
                </p>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: '1.1rem', color: 'rgba(255,255,255,0.35)' }}>
                →
              </span>
            </div>
          </button>

          {(archetypeMixUnlocked || hiddenUnlocked) && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
              {archetypeMixUnlocked && onArchetypes && (
                <button
                  className="tappable"
                  onClick={onArchetypes}
                  style={{
                    padding: '6px 12px', fontSize: '0.65rem', fontWeight: 600,
                    background: 'rgba(168,85,247,0.10)', border: '1px solid rgba(168,85,247,0.28)',
                    borderRadius: '12px', color: 'var(--accent-light)', cursor: 'pointer',
                  }}
                >
                  ⬡ {lang === 'pl' ? 'Archetypy' : 'Archetypes'} →
                </button>
              )}
              {hiddenUnlocked && (
                <button
                  className="tappable"
                  onClick={onHiddenParams}
                  style={{
                    padding: '6px 12px', fontSize: '0.65rem', fontWeight: 600,
                    background: 'rgba(192,132,252,0.10)', border: '1px solid rgba(192,132,252,0.25)',
                    borderRadius: '12px', color: '#c084fc', cursor: 'pointer',
                  }}
                >
                  ◑ {lang === 'pl' ? 'Cień' : 'Shadow'} →
                </button>
              )}
            </div>
          )}

          {/* Intelligence Engines quick-access */}
          {totalProfileAnswers >= 5 && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
              {onEmergingArchetype && (
                <button className="tappable" onClick={onEmergingArchetype} style={{
                  padding: '6px 12px', fontSize: '0.65rem', fontWeight: 600,
                  background: 'rgba(124,58,237,0.10)', border: '1px solid rgba(124,58,237,0.25)',
                  borderRadius: '12px', color: 'var(--accent-light)', cursor: 'pointer',
                }}>
                  ◈ {lang === 'pl' ? 'Archetyp' : 'Archetype'} →
                </button>
              )}
              {onContradiction && (
                <button className="tappable" onClick={onContradiction} style={{
                  padding: '6px 12px', fontSize: '0.65rem', fontWeight: 600,
                  background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)',
                  borderRadius: '12px', color: '#c084fc', cursor: 'pointer',
                }}>
                  ◑ {lang === 'pl' ? 'Złożoność' : 'Complexity'} →
                </button>
              )}
              {onHumanTwin && (
                <button className="tappable" onClick={onHumanTwin} style={{
                  padding: '6px 12px', fontSize: '0.65rem', fontWeight: 600,
                  background: 'rgba(8,145,178,0.08)', border: '1px solid rgba(8,145,178,0.22)',
                  borderRadius: '12px', color: 'var(--teal-light)', cursor: 'pointer',
                }}>
                  ◎ {lang === 'pl' ? 'Bliźniak' : 'Twin'} →
                </button>
              )}
              {onSnapshot51 && totalProfileAnswers >= 25 && (
                <button className="tappable" onClick={onSnapshot51} style={{
                  padding: '6px 12px', fontSize: '0.65rem', fontWeight: 600,
                  background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.22)',
                  borderRadius: '12px', color: 'var(--gold-light)', cursor: 'pointer',
                }}>
                  ✦ {totalProfileAnswers >= 51 ? 'Snapshot 51' : `${51 - totalProfileAnswers} to Snapshot`} →
                </button>
              )}
            </div>
          )}
        </section>

        {/* ── 6. Premium Gateway ───────────────── */}
        {!isPremium && totalProfileAnswers >= 17 && (
          <section style={{ padding: '0 16px' }}>
            <div className="premium-gate animate-in">
              <div className="premium-gate-glow" />
              <p style={{
                fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.18em',
                textTransform: 'uppercase', color: 'var(--gold)', position: 'relative',
              }}>
                {lang === 'pl' ? 'Głębszy profil' : 'Premium Depth'}
              </p>
              <p style={{
                fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)',
                lineHeight: 1.3, maxWidth: '260px', position: 'relative',
              }}>
                {lang === 'pl'
                  ? 'Twój profil jest gotowy na głębszą analizę'
                  : 'Your profile is ready for deeper analysis'}
              </p>
              <p style={{
                fontSize: '0.73rem', color: 'var(--text-dim)', maxWidth: '240px',
                lineHeight: 1.55, position: 'relative',
              }}>
                {t.premiumDepth.subtitle}
              </p>
              {onPremiumDepth && (
                <button
                  className="btn btn-primary tappable"
                  onClick={onPremiumDepth}
                  style={{
                    marginTop: '6px', position: 'relative',
                    background: 'linear-gradient(90deg, rgba(245,158,11,0.85), rgba(124,58,237,0.85))',
                    boxShadow: '0 4px 24px rgba(245,158,11,0.2)',
                  }}
                >
                  {t.premiumBadge.upgrade} →
                </button>
              )}
            </div>
          </section>
        )}

        {/* Profile snapshot CTA */}
        {totalProfileAnswers >= 51 && !isPremium && (
          <section style={{ padding: '0 16px' }}>
            <div style={{
              padding: '18px 20px',
              background: 'rgba(124,58,237,0.07)',
              border: '1px solid rgba(124,58,237,0.22)',
              borderRadius: '16px',
              backdropFilter: 'blur(8px)',
            }}>
              <p style={{
                fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em',
                color: 'var(--accent-light)', textTransform: 'uppercase', marginBottom: '6px',
              }}>
                {lang === 'pl' ? 'Migawka profilu gotowa' : 'Profile Snapshot Ready'}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text)', marginBottom: '12px', lineHeight: 1.5 }}>
                {lang === 'pl'
                  ? 'System zaczyna widzieć wzorzec.'
                  : 'The system is starting to see a pattern.'}
              </p>
              <button
                className="btn btn-primary tappable"
                onClick={onProfileSnapshot}
                style={{ fontSize: '0.82rem', padding: '10px 20px' }}
              >
                {lang === 'pl' ? 'Zobacz migawkę' : 'See Profile Snapshot'}
              </button>
            </div>
          </section>
        )}

        {/* ── Settings Footer ───────────────────── */}
        <section style={{ padding: '0 16px 12px' }}>
          <div style={{
            padding: '16px',
            background: 'rgba(10,10,15,0.65)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            display: 'flex', flexDirection: 'column', gap: '10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                fontSize: '0.62rem', color: 'var(--text-dim)', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                {t.dashboard.language}
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {(['en', 'pl'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className="tappable"
                    style={{
                      padding: '3px 10px', fontSize: '0.7rem', fontWeight: 700,
                      letterSpacing: '0.05em', textTransform: 'uppercase',
                      border: '1px solid',
                      borderColor: lang === l ? 'var(--accent)' : 'var(--border)',
                      borderRadius: '4px',
                      background: lang === l ? 'rgba(124,58,237,0.15)' : 'transparent',
                      color: lang === l ? 'var(--accent-light)' : 'var(--text-dim)',
                      cursor: 'pointer',
                    }}
                    aria-pressed={lang === l}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <button className="debug-btn" onClick={onExportJson} aria-label={t.dashboard.exportSession}>
              {t.dashboard.exportSession}
            </button>
            <button
              className="debug-btn"
              onClick={onResetSession}
              style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.18)' }}
              aria-label={t.dashboard.resetSession}
            >
              {t.dashboard.resetSession}
            </button>
            <button className="debug-btn" onClick={onLogout} aria-label={t.dashboard.logout}>
              {t.dashboard.logout}
            </button>
          </div>
        </section>

      </main>
    </div>
  );
}
