import { useState } from 'react';
import { ContentItem, ProfileState } from '../types';
import { exportSession } from '../utils/storage';
import { isPremiumUnlocked, unlockPremium, disablePremiumUnlock } from '../utils/premiumProgression';
import { debugLog, getLogs, getErrors, clearLogs } from '../utils/debugStore';
import { enableTestSession } from '../utils/testSession';

interface Props {
  profileState: ProfileState;
  testContent: ContentItem[];
  testAnswerIndex: number;
  currentItem: ContentItem | null;
  totalProfileAnswers: number;
  isTestMode: boolean;
  onStartTest: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onRefreshProfile: () => void;
  onLogout: () => void;
  onReset: () => void;
}

export default function DebugPanel({
  profileState,
  testContent,
  testAnswerIndex,
  currentItem,
  totalProfileAnswers,
  isTestMode,
  onStartTest,
  onUndo,
  canUndo,
  onRefreshProfile,
  onLogout,
  onReset,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Positioned bottom-left to avoid overlapping centered CTAs */}
      <button
        className="debug-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-label={`DBG debug panel ${open ? '(close)' : '(open)'}`}
        aria-expanded={open}
      >
        {open ? '×' : 'DBG'}
      </button>

      {open && (
        <aside className="debug-panel" aria-label="Developer debug panel">
          <p className="debug-panel-title">
            Debug Panel{' '}
            {isTestMode && <span style={{ color: '#22d3ee', fontSize: '0.65rem' }}>TEST MODE</span>}
          </p>

          {/* SESSION section */}
          <details open>
            <summary style={{ fontSize: '0.72rem', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px 0' }}>Session</summary>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
              <div>Mode: {isTestMode ? 'LOCAL TEST' : 'Supabase'}</div>
              <div>Answers: {totalProfileAnswers}</div>
              <div>Profile progress: {profileState.profile_progress.toFixed(1)}%</div>
              <div>Rarity pts: {profileState.rarity_points.toFixed(0)}</div>
            </div>
          </details>

          {/* TEST section */}
          <details>
            <summary style={{ fontSize: '0.72rem', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px 0' }}>Current Test</summary>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
              <div>Q index: {testAnswerIndex} / {testContent.length}</div>
              <div>Current: {currentItem?.id ?? 'none'}</div>
              <div>Progress: {testContent.length > 0 ? Math.round(testAnswerIndex / testContent.length * 100) : 0}%</div>
              <div>Queue ({testContent.length}): {testContent.slice(0, 5).map(i => i.id).join(', ')}{testContent.length > 5 ? '…' : ''}</div>
            </div>
          </details>

          {/* ACTIONS section */}
          <details open>
            <summary style={{ fontSize: '0.72rem', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px 0' }}>Actions</summary>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '4px' }}>
              <button className="debug-btn" onClick={onStartTest}>▶ Start test</button>
              {canUndo && <button className="debug-btn" onClick={onUndo}>↩ Undo last answer</button>}
              <button className="debug-btn" onClick={onRefreshProfile}>↻ Refresh profile</button>
              <button
                className="debug-btn"
                onClick={() => {
                  const j = exportSession();
                  const b = new Blob([j], { type: 'application/json' });
                  const u = URL.createObjectURL(b);
                  const a = document.createElement('a');
                  a.href = u;
                  a.download = `to99-${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(u);
                }}
              >
                ↓ Export JSON
              </button>
              <button
                className="debug-btn"
                onClick={() => {
                  if (isPremiumUnlocked(null)) {
                    disablePremiumUnlock();
                  } else {
                    unlockPremium();
                  }
                  window.location.reload();
                }}
              >
                {isPremiumUnlocked(null) ? '🔓 Lock premium' : '🔑 Unlock premium'}
              </button>
              <button
                className="debug-btn"
                onClick={() => {
                  if (window.confirm('Enable test mode?')) {
                    enableTestSession();
                    window.location.reload();
                  }
                }}
              >
                🧪 Enable test session
              </button>
              <button
                className="debug-btn"
                onClick={() => {
                  clearLogs();
                  debugLog('logs_cleared');
                  window.location.reload();
                }}
              >
                🧹 Clear logs
              </button>
              <button
                className="debug-btn"
                style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.25)' }}
                onClick={onReset}
              >
                ✕ Reset session
              </button>
              <button className="debug-btn" onClick={onLogout}>← Logout</button>
            </div>
          </details>

          {/* LOGS section */}
          <details>
            <summary style={{ fontSize: '0.72rem', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px 0' }}>
              Logs ({getLogs().length})
            </summary>
            <pre style={{ fontSize: '0.6rem', color: 'var(--text-dim)', maxHeight: '120px', overflowY: 'auto', lineHeight: 1.5 }}>
              {getLogs().slice(-10).map(l => `${l.ts.slice(11, 19)} ${l.msg}`).join('\n') || 'No logs.'}
            </pre>
          </details>

          {getErrors().length > 0 && (
            <details open>
              <summary style={{ fontSize: '0.72rem', color: '#f87171', cursor: 'pointer', padding: '4px 0' }}>
                Errors ({getErrors().length})
              </summary>
              <pre style={{ fontSize: '0.6rem', color: '#f87171', maxHeight: '80px', overflowY: 'auto', lineHeight: 1.5 }}>
                {getErrors().slice(-5).map(e => `${e.ts.slice(11, 19)} ${e.msg}`).join('\n')}
              </pre>
            </details>
          )}
        </aside>
      )}
    </>
  );
}
