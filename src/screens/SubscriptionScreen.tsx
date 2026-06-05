import { useT } from '../context/LangContext';
import { enablePremiumPreview } from '../utils/premiumProgression';

interface Props {
  isPremium: boolean;
  isDebugMode: boolean;
  onBack: () => void;
  onActivated?: () => void;
}

export default function SubscriptionScreen({ isPremium, isDebugMode, onBack, onActivated }: Props) {
  const t = useT();

  const MODULE_IDS = [
    'shadowProfile', 'maskVsCore', 'contradictions', 'futureSelf',
    'relationshipMode', 'humanTwin', 'hiddenParameters', 'profileEvolution',
  ];

  function handleDebugActivate() {
    enablePremiumPreview();
    onActivated?.();
    window.location.reload();
  }

  return (
    <div className="screen-centered" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.1) 0%, transparent 60%), var(--bg)', alignItems: 'stretch' }}>
      <div style={{ maxWidth: 480, width: '100%', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-ghost" onClick={onBack} style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
            {t.subscription.back}
          </button>
        </div>

        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{
            display: 'inline-block', padding: '4px 14px', marginBottom: '12px',
            background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700,
            color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            {isPremium ? t.premiumBadge.active : 'Premium'}
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
            {t.subscription.title}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {t.subscription.subtitle}
          </p>
        </div>

        {isPremium ? (
          <div style={{
            padding: '16px 20px', background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius)', textAlign: 'center',
          }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--gold)', fontWeight: 600 }}>
              {t.subscription.alreadyPremium}
            </p>
          </div>
        ) : (
          <>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                {t.subscription.benefitsTitle}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {MODULE_IDS.map((id) => {
                  const mod = (t.premiumModules as Record<string, { title: string; description: string }>)[id];
                  return mod ? (
                    <div key={id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{ color: 'var(--gold)', marginTop: '1px', fontSize: '0.8rem' }}>✦</span>
                      <div>
                        <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>{mod.title}</p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{mod.description}</p>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>

            {isDebugMode ? (
              <button
                className="btn btn-primary"
                onClick={handleDebugActivate}
                style={{ background: 'var(--gold)', color: '#1a1a1f', fontWeight: 700 }}
              >
                {t.subscription.ctaDebug}
              </button>
            ) : (
              <button className="btn btn-primary" disabled style={{ opacity: 0.6 }}>
                {t.subscription.ctaComingSoon}
              </button>
            )}

            <p style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textAlign: 'center' }}>
              {t.subscription.note}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
