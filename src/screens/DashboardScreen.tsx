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
}

const RARITY_LABEL_COLOR: Record<string, string> = {
  standard: 'rgba(255,255,255,0.45)',
  rare: '#22d3ee',
  epic: '#a855f7',
  legendary: '#f59e0b',
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
}: Props) {
  const t = useT();
  const [lang, setLang] = useLang();

  void feedEvents;
  void twinFeedEvents;
  void timeline;
  void onTruthOrDare;

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

  return (
    <div className="screen screen--has-bg" style={{ position: 'relative', minHeight: '100dvh' }}>
      <ScreenBackground src="/backgrounds/core/cosmic-nebula.png" dim={0.48} />

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
              className="btn btn-ghost"
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
          <div className="home-hero-glow" />
          {primaryArch ? (
            <>
              <div style={{
                fontSize: '4rem', lineHeight: 1, marginBottom: '14px',
                filter: `drop-shadow(0 0 20px ${primaryArch.color}66)`,
              }}>
                {primaryArch.symbol}
              </div>
              <h1 style={{
                fontSize: 'clamp(1.7rem, 5.5vw, 2.3rem)', fontWeight: 800,
                letterSpacing: '-0.02em', lineHeight: 1.1,
                color: 'var(--text)', textShadow: '0 2px 16px rgba(0,0,0,0.7)',
                marginBottom: '6px',
              }}>
                {primaryArch.name}
              </h1>
              <p style={{ fontSize: '0.78rem', color: primaryArch.color, fontWeight: 600 }}>
                {archetypeMix.confidence}% {lang === 'pl' ? 'pewności' : 'confidence'}
              </p>
              <p style={{
                fontSize: '0.72rem', color: 'var(--text-dim)',
                fontStyle: 'italic', marginTop: '4px', maxWidth: '260px', lineHeight: 1.5,
              }}>
                {primaryArch.coreDrive}
              </p>
            </>
          ) : (
            <>
              <div style={{ fontSize: '3rem', lineHeight: 1, marginBottom: '14px', color: 'var(--text-dim)', opacity: 0.5 }}>
                ◌
              </div>
              <h1 style={{
                fontSize: 'clamp(1.3rem, 4vw, 1.7rem)', fontWeight: 700,
                color: 'var(--text-dim)', letterSpacing: '-0.01em', lineHeight: 1.2,
                textShadow: '0 2px 12px rgba(0,0,0,0.6)', marginBottom: '8px',
              }}>
                {lang === 'pl' ? 'Twój wzorzec się formuje' : 'Your pattern is forming'}
              </h1>
              {answersToArchetype > 0 && (
                <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  {lang === 'pl'
                    ? `${answersToArchetype} odpowiedzi do odkrycia archetypu`
                    : `${answersToArchetype} more answers to reveal your archetype`}
                </p>
              )}
            </>
          )}

          <button
            className="btn btn-primary"
            onClick={onStartTest}
            disabled={!canStartTest}
            style={{
              marginTop: '22px', minWidth: '200px',
              opacity: canStartTest ? 1 : 0.4,
              background: 'linear-gradient(90deg, var(--accent), rgba(124,58,237,0.75))',
              boxShadow: canStartTest ? '0 4px 24px rgba(124,58,237,0.35)' : 'none',
            }}
          >
            {canStartTest
              ? (totalProfileAnswers > 0 ? t.premium.continueDiscovery : t.dashboard.startTest)
              : t.dashboard.noFreeTests}
          </button>

          {!canStartTest && (
            <p style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '8px' }}>
              {t.dashboard.noFreeTestsNote}
            </p>
          )}

          {/* Answer / free-test counter chips */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span style={{
              padding: '3px 10px', borderRadius: '20px', fontSize: '0.62rem', fontWeight: 600,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--text-dim)',
            }}>
              {total_answers} {lang === 'pl' ? 'sygnałów' : 'signals'}
            </span>
            {!isPremium && (
              <span style={{
                padding: '3px 10px', borderRadius: '20px', fontSize: '0.62rem', fontWeight: 600,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                color: freeTestsUsed >= 3 ? 'var(--text-dim)' : 'var(--accent-light)',
              }}>
                {Math.max(0, 3 - freeTestsUsed)}/3 {lang === 'pl' ? 'darmowych' : 'free'}
              </span>
            )}
          </div>
        </section>

        {/* ── 2. Bento Grid ────────────────────── */}
        <section style={{ padding: '0 16px' }}>
          <div className="bento-grid">

            {/* Hidden Profile */}
            <div
              className={`bento-tile ${hiddenUnlocked ? 'bento-tile--accent' : ''}`}
              onClick={hiddenUnlocked ? onHiddenParams : undefined}
              style={{ cursor: hiddenUnlocked ? 'pointer' : 'default' }}
            >
              <span className="bento-tile-label">
                {lang === 'pl' ? 'Ukryty profil' : 'Hidden Profile'}
              </span>
              {hiddenUnlocked ? (
                <>
                  <span className="bento-tile-value" style={{ fontSize: '0.9rem', color: 'var(--accent-light)' }}>
                    {hiddenProfileData.primaryDriver}
                  </span>
                  <span className="bento-tile-sub">
                    {hiddenProfileData.confidence}% {lang === 'pl' ? 'zmapowane' : 'mapped'} →
                  </span>
                </>
              ) : (
                <span className="bento-tile-sub">
                  {lang === 'pl'
                    ? `Odblokuj przy 51 odpowiedziach · ${totalProfileAnswers} do tej pory`
                    : `Unlocks at 51 answers · ${totalProfileAnswers} so far`}
                </span>
              )}
            </div>

            {/* Human Twin */}
            <div className={`bento-tile ${twinDataReady ? 'bento-tile--teal' : ''}`}>
              <span className="bento-tile-label">
                {lang === 'pl' ? 'Ludzki Bliźniak' : 'Human Twin'}
              </span>
              {twinDataReady ? (
                <>
                  <span className="bento-tile-value" style={{ color: 'var(--teal-light)', fontSize: '1.4rem' }}>
                    {humanTwinMatch}%
                  </span>
                  <span className="bento-tile-sub">
                    {lang === 'pl' ? 'wynik podobieństwa' : 'match score'}
                  </span>
                </>
              ) : (
                <span className="bento-tile-sub">
                  {lang === 'pl' ? 'Kalibracja…' : 'Calibrating…'}
                  <br />
                  {5 - totalProfileAnswers} {lang === 'pl' ? 'odpowiedzi' : 'answers needed'}
                </span>
              )}
            </div>

            {/* Rare Signal */}
            <div className="bento-tile">
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

            {/* Shadow */}
            <div className="bento-tile">
              <span className="bento-tile-label">
                {lang === 'pl' ? 'Cień' : 'Shadow'}
              </span>
              {primaryArch ? (
                <span className="bento-tile-value" style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 1.3 }}>
                  {primaryArch.shadow}
                </span>
              ) : (
                <span className="bento-tile-sub">
                  {lang === 'pl' ? 'Formuje się przy 100 odpowiedziach' : 'Forms at 100 answers'}
                </span>
              )}
            </div>

            {/* Relationship Pattern */}
            <div className="bento-tile" onClick={primaryArch ? onFullProfile : undefined} style={{ cursor: primaryArch ? 'pointer' : 'default' }}>
              <span className="bento-tile-label">
                {lang === 'pl' ? 'Wzorzec relacji' : 'Relationship'}
              </span>
              {primaryArch ? (
                <>
                  <span className="bento-tile-value" style={{ fontSize: '0.78rem', lineHeight: 1.3 }}>
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

            {/* Premium Depth */}
            <div
              className={`bento-tile ${isPremium ? 'bento-tile--gold' : ''}`}
              onClick={onPremiumDepth}
              style={{ cursor: onPremiumDepth ? 'pointer' : 'default' }}
            >
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

        {/* ── 3. Discovery Collection ───────────── */}
        <section style={{ padding: '0 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span className="section-eyebrow">
              {lang === 'pl' ? 'Kolekcja odkryć' : 'Discovery Collection'}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-light)', fontWeight: 600 }}>
              {profileFragments.length > 0
                ? `${profileFragments.length} ${lang === 'pl' ? 'fragmentów' : 'found'}`
                : ''}
            </span>
          </div>

          {profileFragments.length === 0 ? (
            <p className="collection-empty">
              {lang === 'pl'
                ? 'Zbierz więcej odpowiedzi, aby odkryć fragmenty profilu.'
                : 'Answer more questions to discover profile fragments.'}
            </p>
          ) : (
            <div className="collection-rail">
              {[...profileFragments].reverse().map((frag) => (
                <div key={frag.id} className={`fragment-card fragment-card--${frag.rarity}`}>
                  <span style={{
                    fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.1em', color: RARITY_LABEL_COLOR[frag.rarity] ?? 'var(--text-dim)',
                  }}>
                    {frag.rarity}
                  </span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
                    {frag.title}
                  </span>
                  <p style={{ fontSize: '0.67rem', color: 'var(--text-dim)', lineHeight: 1.45 }}>
                    {frag.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── 4. Discovery Timeline (milestones) ── */}
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

        {/* ── 5. Galaxy Navigation Map ─────────── */}
        <section style={{ padding: '0 16px' }}>
          <div style={{ marginBottom: '12px' }}>
            <span className="section-eyebrow">
              {lang === 'pl' ? 'Nawigacja' : 'Navigate'}
            </span>
          </div>
          <div className="galaxy-nav">
            {[
              {
                icon: '◎',
                label: lang === 'pl' ? 'Profil' : 'Profile',
                action: onMyProfile,
                locked: false,
              },
              {
                icon: '⬡',
                label: lang === 'pl' ? 'Archetypy' : 'Archetypes',
                action: onArchetypes ?? undefined,
                locked: !archetypeMixUnlocked,
              },
              {
                icon: '◈',
                label: lang === 'pl' ? 'Bliźniak' : 'Twin',
                action: twinDataReady ? onMyProfile : undefined,
                locked: !twinDataReady,
              },
              {
                icon: '◑',
                label: lang === 'pl' ? 'Cień' : 'Shadow',
                action: hiddenUnlocked ? onHiddenParams : undefined,
                locked: !hiddenUnlocked,
              },
              {
                icon: '◇',
                label: lang === 'pl' ? 'Relacje' : 'Relations',
                action: primaryArch ? onFullProfile : undefined,
                locked: !primaryArch,
              },
              {
                icon: '✦',
                label: lang === 'pl' ? 'Premium' : 'Premium',
                action: onPremiumDepth ?? undefined,
                locked: false,
              },
            ].map(({ icon, label, action, locked }) => (
              <button
                key={label}
                className={`galaxy-node ${locked ? 'galaxy-node--locked' : ''}`}
                onClick={locked ? undefined : action}
                disabled={locked}
                aria-label={label}
              >
                <span className="galaxy-node-icon">{icon}</span>
                <span className="galaxy-node-label">{label}</span>
              </button>
            ))}
          </div>
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
                  className="btn btn-primary"
                  onClick={onPremiumDepth}
                  style={{
                    marginTop: '6px', position: 'relative',
                    background: 'linear-gradient(90deg, rgba(245,158,11,0.85), rgba(124,58,237,0.85))',
                  }}
                >
                  {t.premiumBadge.upgrade} →
                </button>
              )}
            </div>
          </section>
        )}

        {/* Profile snapshot CTA (51+ answers, not premium) */}
        {totalProfileAnswers >= 51 && !isPremium && (
          <section style={{ padding: '0 16px' }}>
            <div style={{
              padding: '18px 20px',
              background: 'rgba(124,58,237,0.08)',
              border: '1px solid rgba(124,58,237,0.25)',
              borderRadius: '16px',
              backdropFilter: 'blur(8px)',
            }}>
              <p style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent-light)', textTransform: 'uppercase', marginBottom: '6px' }}>
                {lang === 'pl' ? 'Migawka profilu gotowa' : 'Profile Snapshot Ready'}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text)', marginBottom: '12px', lineHeight: 1.5 }}>
                {lang === 'pl'
                  ? 'System zaczyna widzieć wzorzec.'
                  : 'The system is starting to see a pattern.'}
              </p>
              <button className="btn btn-primary" onClick={onProfileSnapshot} style={{ fontSize: '0.82rem', padding: '10px 20px' }}>
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
              <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {t.dashboard.language}
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {(['en', 'pl'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
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
