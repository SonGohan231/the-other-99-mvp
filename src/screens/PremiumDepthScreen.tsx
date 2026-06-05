import { useT } from '../context/LangContext';
import { ProfileVector } from '../utils/profileVector';
import { BehavioralSummary } from '../utils/behavioralSignals';
import PremiumCard from '../components/PremiumCard';
import { PREMIUM_MODULES } from '../data/premiumModules';

interface Props {
  isPremium: boolean;
  totalAnswers: number;
  profileVector: ProfileVector;
  behavioralSummary?: BehavioralSummary | null;
  onBack: () => void;
  onUpgrade: () => void;
}

export default function PremiumDepthScreen({ isPremium, totalAnswers, profileVector, behavioralSummary, onBack, onUpgrade }: Props) {
  const t = useT();

  return (
    <div className="screen-centered" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.08) 0%, transparent 60%), var(--bg)', alignItems: 'stretch' }}>
      <div style={{ maxWidth: 520, width: '100%', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <button className="btn btn-ghost" onClick={onBack} style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
            {t.premiumDepth.back}
          </button>
          <div>
            <h1 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              {t.premiumDepth.title}
            </h1>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {t.premiumDepth.subtitle}
            </p>
          </div>
          {isPremium && (
            <span style={{
              marginLeft: 'auto', padding: '3px 10px',
              background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: '20px', fontSize: '0.65rem', fontWeight: 700,
              color: 'var(--gold)', letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              {t.premiumBadge.active}
            </span>
          )}
        </div>

        {!isPremium && (
          <div style={{
            padding: '14px 16px', marginBottom: '16px',
            background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: 'var(--radius)',
          }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
              {t.premiumDepth.lockedHint}
            </p>
            <button className="btn btn-primary" onClick={onUpgrade} style={{ fontSize: '0.8rem', padding: '8px 16px' }}>
              {t.premiumDepth.upgradePrompt}
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {PREMIUM_MODULES.map((mod) => (
            <PremiumCard
              key={mod.id}
              moduleId={mod.id}
              isPremium={isPremium}
              totalAnswers={totalAnswers}
              profileVector={profileVector}
              behavioralSummary={behavioralSummary}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
