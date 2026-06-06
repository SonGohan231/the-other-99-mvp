import { useState, useEffect } from 'react';
import { useT, useLang } from '../context/LangContext';
import { Lang } from '../i18n';
import { getAppInfo } from '../utils/appVersion';

const THEME_KEY = 'to99_theme';
const REDUCED_MOTION_KEY = 'to99_reduced_motion';

export type Theme = 'dark' | 'light' | 'system';

export function getTheme(): Theme {
  try { return (localStorage.getItem(THEME_KEY) as Theme) || 'dark'; } catch { return 'dark'; }
}

export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
  } catch { /* ignore */ }
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  const resolved = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : theme;

  if (resolved === 'light') {
    root.style.setProperty('--bg', '#f5f4f0');
    root.style.setProperty('--bg-card', '#ffffff');
    root.style.setProperty('--bg-elevated', '#ededea');
    root.style.setProperty('--text', '#1a1a1f');
    root.style.setProperty('--text-muted', '#6b6475');
    root.style.setProperty('--text-dim', '#9a9098');
    root.style.setProperty('--border', 'rgba(0,0,0,0.09)');
    root.style.setProperty('--border-accent', 'rgba(124,58,237,0.25)');
  } else {
    root.style.removeProperty('--bg');
    root.style.removeProperty('--bg-card');
    root.style.removeProperty('--bg-elevated');
    root.style.removeProperty('--text');
    root.style.removeProperty('--text-muted');
    root.style.removeProperty('--text-dim');
    root.style.removeProperty('--border');
    root.style.removeProperty('--border-accent');
  }
}

export function getReducedMotion(): boolean {
  try { return localStorage.getItem(REDUCED_MOTION_KEY) === 'true'; } catch { return false; }
}

export function applyReducedMotion(on: boolean): void {
  document.documentElement.style.setProperty('--anim-duration', on ? '0.01ms' : '');
  if (on) {
    document.documentElement.setAttribute('data-reduced-motion', 'true');
  } else {
    document.documentElement.removeAttribute('data-reduced-motion');
  }
}

interface Props {
  onBack: () => void;
  onExport: () => void;
  onReset: () => void;
}

export default function SettingsScreen({ onBack, onExport, onReset }: Props) {
  const t = useT();
  const [lang, setLang] = useLang();
  const [theme, setThemeState] = useState<Theme>(getTheme);
  const [reducedMotion, setReducedMotionState] = useState<boolean>(getReducedMotion);
  const [debugEnabled, setDebugEnabled] = useState(() => {
    try { return localStorage.getItem('to99_debug_mode') === 'true'; } catch { return false; }
  });
  const appInfo = getAppInfo();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    applyReducedMotion(reducedMotion);
  }, [reducedMotion]);

  function handleTheme(t2: Theme) {
    setTheme(t2);
    setThemeState(t2);
  }

  function handleReducedMotion(on: boolean) {
    try { localStorage.setItem(REDUCED_MOTION_KEY, String(on)); } catch { /* ignore */ }
    applyReducedMotion(on);
    setReducedMotionState(on);
  }

  function handleLang(l: Lang) {
    setLang(l);
  }

  const sectionStyle: React.CSSProperties = {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '0 20px', marginBottom: '12px',
  };
  const rowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '13px 0', borderBottom: '1px solid var(--border)',
    fontSize: '0.85rem', color: 'var(--text)',
  };
  const lastRowStyle = { ...rowStyle, borderBottom: 'none' };
  const sectionLabel: React.CSSProperties = {
    fontSize: '0.68rem', color: 'var(--text-dim)',
    textTransform: 'uppercase', letterSpacing: '0.1em',
    padding: '10px 0 4px',
  };

  function ThemeBtn({ value, label }: { value: Theme; label: string }) {
    return (
      <button
        style={{
          flex: 1, padding: '7px 4px', fontSize: '0.78rem', fontWeight: theme === value ? 600 : 400,
          background: theme === value ? 'var(--accent)' : 'transparent',
          color: theme === value ? '#fff' : 'var(--text-muted)',
          border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.15s',
        }}
        onClick={() => handleTheme(value)}
      >
        {label}
      </button>
    );
  }

  function LangBtn({ value, label }: { value: Lang; label: string }) {
    return (
      <button
        style={{
          flex: 1, padding: '7px 4px', fontSize: '0.78rem', fontWeight: lang === value ? 600 : 400,
          background: lang === value ? 'var(--accent)' : 'transparent',
          color: lang === value ? '#fff' : 'var(--text-muted)',
          border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.15s',
        }}
        onClick={() => handleLang(value)}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="screen-centered" style={{ background: 'var(--bg)', alignItems: 'stretch' }}>
      <div style={{ maxWidth: 480, width: '100%', margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button className="btn btn-ghost" onClick={onBack} style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
            {t.settings.back}
          </button>
          <h1 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            {t.settings.title}
          </h1>
        </div>

        <p style={sectionLabel}>{t.settings.appearanceTitle}</p>
        <div style={sectionStyle}>
          <div style={lastRowStyle}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{t.settings.appearanceTitle}</span>
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '3px' }}>
              <ThemeBtn value="dark" label={t.settings.themeDark} />
              <ThemeBtn value="light" label={t.settings.themeLight} />
              <ThemeBtn value="system" label={t.settings.themeSystem} />
            </div>
          </div>
        </div>

        <p style={sectionLabel}>{t.settings.languageTitle}</p>
        <div style={sectionStyle}>
          <div style={lastRowStyle}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{t.settings.languageTitle}</span>
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '3px' }}>
              <LangBtn value="en" label={t.settings.languageEnglish} />
              <LangBtn value="pl" label={t.settings.languagePolish} />
            </div>
          </div>
        </div>

        <p style={sectionLabel}>{t.settings.accessibilityTitle}</p>
        <div style={sectionStyle}>
          <div style={lastRowStyle}>
            <span>{t.settings.reducedMotion}</span>
            <button
              style={{
                width: 44, height: 24, borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: reducedMotion ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
                transition: 'background 0.2s', position: 'relative',
              }}
              onClick={() => handleReducedMotion(!reducedMotion)}
              role="switch"
              aria-checked={reducedMotion}
            >
              <span style={{
                position: 'absolute', top: 2, left: reducedMotion ? 22 : 2,
                width: 20, height: 20, borderRadius: '50%',
                background: '#fff', transition: 'left 0.2s',
              }} />
            </button>
          </div>
        </div>

        <p style={sectionLabel}>{t.settings.dataTitle}</p>
        <div style={sectionStyle}>
          <div style={rowStyle} onClick={onExport} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onExport()}>
            <span>{t.settings.exportData}</span>
            <span style={{ color: 'var(--text-dim)' }}>↓</span>
          </div>
          <div style={rowStyle} onClick={onReset} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onReset()}>
            <span style={{ color: '#f87171' }}>{t.settings.resetProgress}</span>
            <span style={{ color: 'var(--text-dim)' }}>✕</span>
          </div>
          <div style={lastRowStyle}>
            <span style={{ color: 'var(--text-dim)' }}>{t.settings.deleteAccount}</span>
          </div>
        </div>

        {/* Build Info — always visible */}
        <p style={sectionLabel}>Build Info</p>
        <div style={sectionStyle}>
          <div style={rowStyle}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Version</span>
            <span style={{ color: 'var(--text-dim)', fontFamily: 'monospace', fontSize: '0.72rem' }}>
              {appInfo.version} · {appInfo.commit}
            </span>
          </div>
          <div style={rowStyle}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Built</span>
            <span style={{ color: 'var(--text-dim)', fontFamily: 'monospace', fontSize: '0.72rem' }}>
              {appInfo.buildDate}
            </span>
          </div>
          <div style={rowStyle}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Platform</span>
            <span style={{ color: 'var(--text-dim)', fontFamily: 'monospace', fontSize: '0.72rem' }}>
              {appInfo.platform} / {appInfo.environment}
            </span>
          </div>
          <div style={lastRowStyle}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Supabase</span>
            <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: appInfo.supabaseConfigured ? '#4ade80' : '#f87171' }}>
              {appInfo.supabaseConfigured ? '✓ connected' : '✗ missing'}
            </span>
          </div>
        </div>

        {/* Debug Panel toggle */}
        <div style={{ textAlign: 'center', paddingTop: '4px', paddingBottom: '8px' }}>
          {debugEnabled ? (
            <p style={{ fontSize: '0.65rem', color: 'var(--teal-light)' }}>
              ✓ Debug Panel enabled — look for the DBG button
            </p>
          ) : (
            <button
              onClick={() => {
                try { localStorage.setItem('to99_debug_mode', 'true'); } catch { /* ignore */ }
                setDebugEnabled(true);
                window.location.reload();
              }}
              style={{
                fontSize: '0.65rem', color: 'var(--text-dim)',
                background: 'none', border: 'none', cursor: 'pointer',
                textDecoration: 'underline', padding: '4px 8px',
              }}
            >
              Enable Debug Panel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
