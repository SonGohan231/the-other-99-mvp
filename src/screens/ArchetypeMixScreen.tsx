import { ProfileVector } from '../utils/profileVector';
import { computeArchetypeMix, isArchetypeMixUnlocked, ARCHETYPES } from '../utils/archetypes';
import { useT, useLang } from '../context/LangContext';
import { ARCHETYPE_CONTENT } from '../content/archetypeContent';

interface Props {
  profileVector: ProfileVector;
  totalAnswers: number;
  onBack: () => void;
}

type DetailKey = 'short_hook' | 'core_drive' | 'strength' | 'shadow' | 'under_pressure' | 'work_pattern' | 'relationship_pattern' | 'hidden_fear';

const DETAIL_KEYS: DetailKey[] = [
  'short_hook',
  'core_drive',
  'strength',
  'shadow',
  'under_pressure',
  'work_pattern',
  'relationship_pattern',
  'hidden_fear',
];

const DETAIL_LABELS_EN: Record<DetailKey, string> = {
  short_hook: 'In One Line',
  core_drive: 'Core Drive',
  strength: 'Strength',
  shadow: 'Shadow',
  under_pressure: 'Under Pressure',
  work_pattern: 'Work Pattern',
  relationship_pattern: 'Relationship Pattern',
  hidden_fear: 'Hidden Fear',
};

const DETAIL_LABELS_PL: Record<DetailKey, string> = {
  short_hook: 'W Jednej Linii',
  core_drive: 'Główny Napęd',
  strength: 'Siła',
  shadow: 'Cień',
  under_pressure: 'Pod Presją',
  work_pattern: 'Wzorzec Pracy',
  relationship_pattern: 'Wzorzec Relacji',
  hidden_fear: 'Ukryty Strach',
};

export default function ArchetypeMixScreen({ profileVector, totalAnswers, onBack }: Props) {
  const t = useT();
  const [lang] = useLang();
  const isPl = lang === 'pl';
  const unlocked = isArchetypeMixUnlocked(totalAnswers);
  const mix = computeArchetypeMix(profileVector, totalAnswers);
  const primaryDef = ARCHETYPES[mix.primary];
  const content = ARCHETYPE_CONTENT[mix.primary];
  const detailLabels = isPl ? DETAIL_LABELS_PL : DETAIL_LABELS_EN;

  function getField(key: DetailKey): string {
    switch (key) {
      case 'short_hook': return isPl ? content.short_hook_pl : content.short_hook_en;
      case 'core_drive': return isPl ? content.core_drive_pl : content.core_drive_en;
      case 'strength': return isPl ? content.strength_pl : content.strength_en;
      case 'shadow': return isPl ? content.shadow_pl : content.shadow_en;
      case 'under_pressure': return isPl ? content.under_pressure_pl : content.under_pressure_en;
      case 'work_pattern': return isPl ? content.work_pattern_pl : content.work_pattern_en;
      case 'relationship_pattern': return isPl ? content.relationship_pattern_pl : content.relationship_pattern_en;
      case 'hidden_fear': return isPl ? content.hidden_fear_pl : content.hidden_fear_en;
    }
  }

  return (
    <div className="screen" style={{ background: 'var(--bg)', minHeight: '100dvh', overflowY: 'auto' }}>
      <main style={{ maxWidth: '480px', margin: '0 auto', width: '100%', padding: '20px 20px 48px', display: 'flex', flexDirection: 'column' }}>

        {/* Back */}
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.82rem', cursor: 'pointer', padding: '0 0 20px 0', textAlign: 'left' }}
        >
          {isPl ? '← Wróć' : '← Back'}
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '4px' }}>
          <h1 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '0.02em' }}>
            {t.archetypes.title.toUpperCase()}
          </h1>
          {unlocked && (
            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
              {t.archetypes.confidence}:{' '}
              <span style={{ color: 'var(--accent-light)', fontWeight: 700 }}>{mix.confidence}%</span>
            </span>
          )}
        </div>
        <div style={{ height: '1px', background: 'var(--border)', marginBottom: '24px' }} />

        {!unlocked ? (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {t.archetypes.forming(Math.max(0, 100 - totalAnswers))}
            </p>
          </div>
        ) : (
          <>
            {/* Mix bars — all 4 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
              {mix.mix.map((arch) => {
                const isPrimary = arch.id === mix.primary;
                const archName = t.archetypes.names[arch.id] ?? arch.name;
                return (
                  <div key={arch.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: isPrimary ? 700 : 400, color: isPrimary ? 'var(--text)' : 'var(--text-muted)' }}>
                          {archName}
                        </span>
                        {isPrimary && (
                          <span style={{
                            fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.08em',
                            textTransform: 'uppercase', color: 'var(--accent-light)',
                            padding: '1px 6px', border: '1px solid rgba(124,58,237,0.3)',
                            borderRadius: '10px', background: 'rgba(124,58,237,0.08)',
                          }}>
                            {isPl ? 'Główny' : 'Primary'}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isPrimary ? 'var(--accent-light)' : 'var(--text-dim)', minWidth: '36px', textAlign: 'right' }}>
                        {arch.pct}%
                      </span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${arch.pct}%`,
                        background: arch.color,
                        borderRadius: '3px',
                        transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
                        boxShadow: isPrimary ? `0 0 8px ${arch.color}55` : 'none',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Primary archetype deep detail */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                <span style={{ fontSize: '2.2rem', color: primaryDef.color, lineHeight: 1 }}>{primaryDef.symbol}</span>
                <div>
                  <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text)', marginBottom: '2px' }}>
                    {t.archetypes.names[mix.primary] ?? primaryDef.name}
                  </p>
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {isPl ? 'Główny archetyp' : 'Primary archetype'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {DETAIL_KEYS.map((key) => (
                  <div key={key} style={{ paddingBottom: '16px', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '5px' }}>
                      {detailLabels[key]}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: key === 'short_hook' ? 'var(--text)' : 'var(--text-muted)', lineHeight: 1.6, fontStyle: key === 'short_hook' ? 'italic' : 'normal' }}>
                      {getField(key)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
