import { useT } from '../context/LangContext';
import { ProfileVector } from '../utils/profileVector';
import { generatePremiumInsight } from '../utils/premiumInsights';
import { BehavioralSummary } from '../utils/behavioralSignals';
import { PREMIUM_MODULES } from '../data/premiumModules';

interface Props {
  moduleId: string;
  isPremium: boolean;
  totalAnswers: number;
  profileVector: ProfileVector;
  behavioralSummary?: BehavioralSummary | null;
  onOpen?: (moduleId: string) => void;
}

function ModuleArt({ moduleId }: { moduleId: string }) {
  const s: React.CSSProperties = { width: '100%', height: '100%' };

  if (moduleId === 'shadowProfile') return (
    <svg viewBox="0 0 80 60" style={s} aria-hidden="true">
      <defs><linearGradient id="sg1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#dc2626" stopOpacity="0.6" />
      </linearGradient></defs>
      <ellipse cx="26" cy="30" rx="18" ry="22" fill="url(#sg1)" opacity="0.7" />
      <ellipse cx="54" cy="30" rx="18" ry="22" fill="#1a1a24" opacity="0.9" />
      <line x1="40" y1="8" x2="40" y2="52" stroke="#dc2626" strokeWidth="1.5" strokeOpacity="0.6" />
      <ellipse cx="54" cy="30" rx="6" ry="8" fill="#dc2626" opacity="0.3" />
    </svg>
  );

  if (moduleId === 'maskVsCore') return (
    <svg viewBox="0 0 80 60" style={s} aria-hidden="true">
      <defs><linearGradient id="mg1" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#0891b2" stopOpacity="0.7" />
      </linearGradient></defs>
      <rect x="10" y="12" width="28" height="36" rx="6" fill="url(#mg1)" opacity="0.6" />
      <rect x="14" y="18" width="20" height="6" rx="3" fill="#e8e4dc" opacity="0.2" />
      <rect x="14" y="30" width="14" height="4" rx="2" fill="#e8e4dc" opacity="0.15" />
      <circle cx="58" cy="30" r="16" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.7" />
      <circle cx="58" cy="30" r="8" fill="#f59e0b" opacity="0.3" />
      <circle cx="58" cy="30" r="3" fill="#f59e0b" opacity="0.8" />
    </svg>
  );

  if (moduleId === 'contradictions') return (
    <svg viewBox="0 0 80 60" style={s} aria-hidden="true">
      <line x1="15" y1="10" x2="65" y2="50" stroke="#7c3aed" strokeWidth="2" strokeOpacity="0.8" />
      <line x1="65" y1="10" x2="15" y2="50" stroke="#0891b2" strokeWidth="2" strokeOpacity="0.8" />
      <circle cx="40" cy="30" r="6" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.9" />
      <circle cx="40" cy="30" r="2" fill="#f59e0b" opacity="0.7" />
      <circle cx="15" cy="10" r="3" fill="#7c3aed" opacity="0.7" />
      <circle cx="65" cy="50" r="3" fill="#7c3aed" opacity="0.7" />
      <circle cx="65" cy="10" r="3" fill="#0891b2" opacity="0.7" />
      <circle cx="15" cy="50" r="3" fill="#0891b2" opacity="0.7" />
    </svg>
  );

  if (moduleId === 'futureSelf') return (
    <svg viewBox="0 0 80 60" style={s} aria-hidden="true">
      <defs><linearGradient id="fg1" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0%" stopColor="#0891b2" stopOpacity="0.8" />
        <stop offset="50%" stopColor="#7c3aed" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
      </linearGradient></defs>
      <path d="M10 50 Q25 20 40 15 Q55 10 70 5" stroke="url(#fg1)" strokeWidth="2" fill="none" />
      <path d="M10 50 Q25 30 40 28 Q55 26 70 20" stroke="#0891b2" strokeWidth="1" strokeOpacity="0.4" fill="none" />
      <circle cx="70" cy="5" r="4" fill="#10b981" opacity="0.8" />
      <circle cx="40" cy="15" r="3" fill="#7c3aed" opacity="0.6" />
    </svg>
  );

  if (moduleId === 'relationshipMode') return (
    <svg viewBox="0 0 80 60" style={s} aria-hidden="true">
      <circle cx="22" cy="30" r="12" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeOpacity="0.7" />
      <circle cx="58" cy="30" r="12" fill="none" stroke="#0891b2" strokeWidth="1.5" strokeOpacity="0.7" />
      <ellipse cx="40" cy="30" rx="8" ry="10" fill="#7c3aed" opacity="0.2" />
      <line x1="22" y1="30" x2="58" y2="30" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.5" strokeDasharray="3,2" />
      <circle cx="22" cy="30" r="4" fill="#7c3aed" opacity="0.7" />
      <circle cx="58" cy="30" r="4" fill="#0891b2" opacity="0.7" />
    </svg>
  );

  if (moduleId === 'humanTwin') return (
    <svg viewBox="0 0 80 60" style={s} aria-hidden="true">
      <circle cx="28" cy="22" r="10" fill="none" stroke="#0891b2" strokeWidth="1.5" strokeOpacity="0.8" />
      <circle cx="52" cy="22" r="10" fill="none" stroke="#0891b2" strokeWidth="1.5" strokeOpacity="0.8" />
      <circle cx="28" cy="44" r="6" fill="none" stroke="#7c3aed" strokeWidth="1" strokeOpacity="0.6" />
      <circle cx="52" cy="44" r="6" fill="none" stroke="#7c3aed" strokeWidth="1" strokeOpacity="0.6" />
      <line x1="28" y1="32" x2="28" y2="38" stroke="#22d3ee" strokeWidth="1" strokeOpacity="0.5" />
      <line x1="52" y1="32" x2="52" y2="38" stroke="#22d3ee" strokeWidth="1" strokeOpacity="0.5" />
      <line x1="38" y1="22" x2="42" y2="22" stroke="#f59e0b" strokeWidth="2" strokeOpacity="0.6" />
    </svg>
  );

  if (moduleId === 'hiddenParameters') return (
    <svg viewBox="0 0 80 60" style={s} aria-hidden="true">
      {([12, 20, 28, 36, 44] as number[]).map((y, i) => {
        const w = ([45, 30, 55, 20, 40] as number[])[i];
        return (
          <g key={y}>
            <line x1="10" y1={y} x2="70" y2={y} stroke="#605a6e" strokeWidth="0.5" />
            <rect x="10" y={y - 2} width={w} height="4" rx="2" fill="#7c3aed" opacity={0.3 + i * 0.1} />
            <circle cx={10 + w} cy={y} r="2.5" fill="#22d3ee" opacity="0.8" />
          </g>
        );
      })}
    </svg>
  );

  if (moduleId === 'profileEvolution') return (
    <svg viewBox="0 0 80 60" style={s} aria-hidden="true">
      <defs><linearGradient id="eg1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.4" />
      </linearGradient></defs>
      <circle cx="40" cy="30" r="20" fill="none" stroke="url(#eg1)" strokeWidth="1.5" />
      <circle cx="40" cy="30" r="14" fill="none" stroke="#7c3aed" strokeWidth="1" strokeOpacity="0.5" />
      <circle cx="40" cy="30" r="8" fill="none" stroke="#0891b2" strokeWidth="1" strokeOpacity="0.5" />
      <circle cx="40" cy="30" r="3" fill="#f59e0b" opacity="0.9" />
      <path d="M40 10 L43 16 L40 14 L37 16 Z" fill="#f59e0b" opacity="0.7" />
    </svg>
  );

  return (
    <svg viewBox="0 0 80 60" style={s} aria-hidden="true">
      <circle cx="40" cy="30" r="20" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeOpacity="0.6" />
      <circle cx="40" cy="30" r="4" fill="#7c3aed" opacity="0.8" />
    </svg>
  );
}

export default function PremiumCard({ moduleId, isPremium, totalAnswers, profileVector, behavioralSummary, onOpen }: Props) {
  const t = useT();
  const moduleT = (t.premiumModules as Record<string, { title: string; description: string; preview: string }>)[moduleId];
  if (!moduleT) return null;

  const modDef = PREMIUM_MODULES.find((m) => m.id === moduleId);
  const minAnswers = modDef?.minAnswers ?? 34;
  const hasData = totalAnswers >= minAnswers;
  const isLocked = !isPremium;

  const insight = (!isLocked && hasData) ? generatePremiumInsight(moduleId, profileVector, totalAnswers, behavioralSummary) : null;

  return (
    <div
      style={{
        background: isLocked
          ? 'var(--bg-card)'
          : 'linear-gradient(135deg, var(--bg-elevated) 0%, rgba(124,58,237,0.12) 100%)',
        border: isLocked ? '1px solid var(--border)' : '1px solid rgba(124,58,237,0.4)',
        borderRadius: 'var(--radius)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxShadow: !isLocked ? '0 0 20px rgba(124,58,237,0.1)' : 'none',
      }}
    >
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <div style={{ width: 64, height: 48, flexShrink: 0, opacity: isLocked ? 0.4 : 1 }}>
          <ModuleArt moduleId={moduleId} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isLocked ? 'var(--text-muted)' : 'var(--text)' }}>
              {moduleT.title}
            </span>
            {isLocked && (
              <span style={{
                fontSize: '0.6rem', padding: '2px 6px',
                background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)',
                borderRadius: '20px', color: 'var(--accent-light)', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                {t.premiumDepth.locked}
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {moduleT.description}
          </p>
        </div>
      </div>

      {isLocked ? (
        <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
          {moduleT.preview}
        </p>
      ) : !hasData ? (
        <div style={{
          padding: '10px 12px', background: 'rgba(124,58,237,0.06)',
          borderRadius: 'var(--radius-sm)', border: '1px solid rgba(124,58,237,0.15)',
        }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {t.premiumDepth.insufficientData}
          </p>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            {t.premiumDepth.answersRequired(minAnswers)} · {totalAnswers}/{minAnswers}
          </p>
        </div>
      ) : insight?.lines.length ? (
        <div style={{
          padding: '10px 12px', background: 'rgba(124,58,237,0.08)',
          borderRadius: 'var(--radius-sm)', border: '1px solid rgba(124,58,237,0.2)',
        }}>
          {insight.lines.map((line, i) => (
            <p key={i} style={{
              fontSize: '0.72rem', lineHeight: 1.5,
              color: i === 0 ? 'var(--text)' : 'var(--text-muted)',
              marginBottom: i < insight.lines.length - 1 ? '6px' : 0,
            }}>
              {line}
            </p>
          ))}
        </div>
      ) : null}

      {!isLocked && hasData && onOpen && (
        <button
          className="btn btn-ghost"
          style={{ fontSize: '0.75rem', padding: '6px 14px', alignSelf: 'flex-start', color: 'var(--accent-light)' }}
          onClick={() => onOpen(moduleId)}
        >
          {t.premiumDepth.open}
        </button>
      )}
    </div>
  );
}
