import ScreenBackground from '../components/ScreenBackground';
import { ProfileVector } from '../utils/profileVector';
import { isHiddenProfileUnlocked } from '../utils/hiddenProfile';
import { computeArchetypeMix, isArchetypeMixUnlocked } from '../utils/archetypes';
import { useLang } from '../context/LangContext';

interface Props {
  totalProfileAnswers: number;
  profileVector: ProfileVector;
  isPremium: boolean;
  humanTwinMatch: number;
  onBack: () => void;
  onMyProfile: () => void;
  onArchetypes?: () => void;
  onPremiumDepth?: () => void;
  onHiddenParams?: () => void;
  onFullProfile?: () => void;
}

interface GalaxyNode {
  icon: string;
  label_en: string;
  label_pl: string;
  tagline_en: string;
  tagline_pl: string;
  bgSrc: string;
  action?: () => void;
  locked: boolean;
  accentColor: string;
}

export default function GalaxyMapScreen({
  totalProfileAnswers,
  profileVector,
  isPremium,
  humanTwinMatch,
  onBack,
  onMyProfile,
  onArchetypes,
  onPremiumDepth,
  onHiddenParams,
  onFullProfile,
}: Props) {
  const [lang] = useLang();

  const twinDataReady = totalProfileAnswers >= 5;
  const hiddenUnlocked = isHiddenProfileUnlocked(totalProfileAnswers);
  const archetypeMixUnlocked = isArchetypeMixUnlocked(totalProfileAnswers);
  const archetypeMix = archetypeMixUnlocked ? computeArchetypeMix(profileVector, totalProfileAnswers) : null;

  const nodes: GalaxyNode[] = [
    {
      icon: '◎',
      label_en: 'Profile',
      label_pl: 'Profil',
      tagline_en: 'Your pattern so far',
      tagline_pl: 'Twój wzorzec do tej pory',
      bgSrc: '/backgrounds/questions/question-forest.png',
      action: onMyProfile,
      locked: false,
      accentColor: '#60a5fa',
    },
    {
      icon: '⬡',
      label_en: 'Archetypes',
      label_pl: 'Archetypy',
      tagline_en: archetypeMixUnlocked
        ? `Primary: ${archetypeMix?.primary ?? ''}`
        : '100 answers to unlock',
      tagline_pl: archetypeMixUnlocked
        ? `Główny: ${archetypeMix?.primary ?? ''}`
        : '100 odpowiedzi do odblokowania',
      bgSrc: '/backgrounds/core/deep-stars.png',
      action: archetypeMixUnlocked ? onArchetypes : undefined,
      locked: !archetypeMixUnlocked,
      accentColor: '#a855f7',
    },
    {
      icon: '◈',
      label_en: 'Twin',
      label_pl: 'Bliźniak',
      tagline_en: twinDataReady ? `${humanTwinMatch}% match` : '5 answers to calibrate',
      tagline_pl: twinDataReady ? `${humanTwinMatch}% podobieństwa` : '5 odpowiedzi do kalibracji',
      bgSrc: '/backgrounds/questions/question-lake.png',
      action: twinDataReady ? onMyProfile : undefined,
      locked: !twinDataReady,
      accentColor: '#22d3ee',
    },
    {
      icon: '◑',
      label_en: 'Shadow',
      label_pl: 'Cień',
      tagline_en: hiddenUnlocked ? 'Hidden parameters active' : '51 answers to unlock',
      tagline_pl: hiddenUnlocked ? 'Ukryte parametry aktywne' : '51 odpowiedzi do odblokowania',
      bgSrc: '/backgrounds/questions/question-fog.png',
      action: hiddenUnlocked ? onHiddenParams : undefined,
      locked: !hiddenUnlocked,
      accentColor: '#c084fc',
    },
    {
      icon: '◇',
      label_en: 'Relations',
      label_pl: 'Relacje',
      tagline_en: archetypeMixUnlocked ? 'Your relationship pattern' : 'Unlocks with archetype',
      tagline_pl: archetypeMixUnlocked ? 'Twój wzorzec relacji' : 'Odblokuj z archetypem',
      bgSrc: '/backgrounds/questions/question-mountains.png',
      action: archetypeMixUnlocked ? onFullProfile : undefined,
      locked: !archetypeMixUnlocked,
      accentColor: '#34d399',
    },
    {
      icon: '✦',
      label_en: isPremium ? 'Premium Depth' : 'Unlock More',
      label_pl: isPremium ? 'Głębszy Profil' : 'Odblokuj',
      tagline_en: isPremium ? 'Deep analysis active' : 'Full profile waiting',
      tagline_pl: isPremium ? 'Głęboka analiza aktywna' : 'Pełna analiza czeka',
      bgSrc: '/backgrounds/core/gateway-portal.png',
      action: onPremiumDepth,
      locked: false,
      accentColor: '#f59e0b',
    },
  ];

  return (
    <div className="galaxy-map-screen screen--has-bg">
      <ScreenBackground src="/backgrounds/core/cosmic-nebula.png" dim={0.42} />

      <header className="galaxy-map-header">
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-dim)', fontSize: '1.2rem', padding: '4px 8px',
            lineHeight: 1,
          }}
          aria-label="Back"
        >
          ←
        </button>
        <span style={{
          fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.28em',
          textTransform: 'uppercase', color: 'var(--accent-light)',
        }}>
          {lang === 'pl' ? 'Mapa Galaktyki' : 'Galaxy Map'}
        </span>
      </header>

      <div className="galaxy-map-body">
        <div className="galaxy-map-intro animate-in">
          <p style={{
            fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.12em',
            textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px',
          }}>
            {lang === 'pl' ? 'Twoje wymiary profilu' : 'Your profile dimensions'}
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {lang === 'pl'
              ? 'Dotknij węzła, aby zbadać ten wymiar'
              : 'Tap a node to explore that dimension'}
          </p>
        </div>

        <div className="galaxy-map-grid">
          {nodes.map((node, i) => (
            <button
              key={node.label_en}
              className={`galaxy-map-node ${node.locked ? 'galaxy-map-node--locked' : ''} animate-in`}
              style={{ animationDelay: `${i * 0.07}s`, borderColor: node.locked ? 'rgba(255,255,255,0.07)' : `${node.accentColor}28` }}
              onClick={node.locked ? undefined : node.action}
              disabled={node.locked || !node.action}
              aria-label={lang === 'pl' ? node.label_pl : node.label_en}
            >
              <img
                src={node.bgSrc}
                alt=""
                aria-hidden
                className="galaxy-map-node-img"
                loading="lazy"
              />
              <div
                className="galaxy-map-node-overlay"
                style={{ background: `linear-gradient(to bottom, rgba(10,10,15,0.18) 0%, ${node.accentColor}18 50%, rgba(10,10,15,0.80) 100%)` }}
              />
              {node.locked && (
                <div className="galaxy-map-node-lock">
                  {lang === 'pl' ? 'Zablokowane' : 'Locked'}
                </div>
              )}
              <div className="galaxy-map-node-content">
                <span className="galaxy-map-node-icon" style={{ color: node.accentColor }}>
                  {node.icon}
                </span>
                <h3 className="galaxy-map-node-title">
                  {lang === 'pl' ? node.label_pl : node.label_en}
                </h3>
                <p className="galaxy-map-node-tagline">
                  {lang === 'pl' ? node.tagline_pl : node.tagline_en}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div style={{ textAlign: 'center', padding: '4px 0' }}>
          <p style={{ fontSize: '0.62rem', color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
            {totalProfileAnswers}{' '}
            {lang === 'pl' ? 'sygnałów zebranych' : 'signals collected'}
          </p>
        </div>
      </div>
    </div>
  );
}
