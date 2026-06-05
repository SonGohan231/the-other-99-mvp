import { useState } from 'react';
import { ContentItem, ProfileState } from '../types';
import { exportSession, resetSession } from '../utils/storage';
import { isPremiumUnlocked, unlockPremium, disablePremiumUnlock, enablePremiumPreview, disablePremiumPreview, isPremiumPreviewEnabled } from '../utils/premiumProgression';
import { debugLog, getLogs, getErrors, clearLogs } from '../utils/debugStore';
import { enableTestSession, disableTestSession } from '../utils/testSession';
import { disableGuestMode } from '../utils/guestSession';

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
  onSkipQuestion?: () => void;
  onSkipToQuestion?: (n: number) => void;
  onCompleteTest?: () => void;
  onSeedAnswers?: (n: number) => void;
  onForceSnapshot?: () => void;
  onResetPremiumModal?: () => void;
  onForcePremiumModule?: (moduleId: string) => void;
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
  onSkipQuestion,
  onSkipToQuestion,
  onCompleteTest,
  onSeedAnswers,
  onForceSnapshot,
  onResetPremiumModal,
  onForcePremiumModule,
}: Props) {
  const [open, setOpen] = useState(false);
  const inTest = testContent.length > 0 && testAnswerIndex < testContent.length;

  return (
    <>
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

          {/* SESSION */}
          <details open>
            <summary style={{ fontSize: '0.72rem', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px 0' }}>Session</summary>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
              <div>Mode: {isTestMode ? 'LOCAL TEST' : 'Supabase'}</div>
              <div>Answers: {totalProfileAnswers}</div>
              <div>Profile progress: {profileState.profile_progress.toFixed(1)}%</div>
              <div>Rarity pts: {profileState.rarity_points.toFixed(0)}</div>
            </div>
          </details>

          {/* CURRENT TEST */}
          <details>
            <summary style={{ fontSize: '0.72rem', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px 0' }}>Current Test</summary>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
              <div>Q index: {testAnswerIndex} / {testContent.length}</div>
              <div>Current: {currentItem?.id ?? 'none'}</div>
              <div>Progress: {testContent.length > 0 ? Math.round(testAnswerIndex / testContent.length * 100) : 0}%</div>
              <div>Queue ({testContent.length}): {testContent.slice(0, 5).map(i => i.id).join(', ')}{testContent.length > 5 ? '…' : ''}</div>
            </div>
          </details>

          {/* ACTIONS */}
          <details open>
            <summary style={{ fontSize: '0.72rem', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px 0' }}>Actions</summary>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '4px' }}>
              <button className="debug-btn" onClick={onStartTest}>&#9654; Start test</button>

              {inTest && onSkipQuestion && (
                <button className="debug-btn" onClick={onSkipQuestion}>&#9197; Skip question</button>
              )}
              {inTest && onSkipToQuestion && (
                <button
                  className="debug-btn"
                  onClick={() => {
                    const raw = window.prompt(`Jump to question (1–${testContent.length}):`, String(testAnswerIndex + 2));
                    const n = parseInt(raw ?? '', 10);
                    if (!isNaN(n) && n >= 1 && n <= testContent.length) {
                      onSkipToQuestion(n);
                    }
                  }}
                >
                  &#9197; Skip to Q&hellip;
                </button>
              )}
              {inTest && onCompleteTest && (
                <button className="debug-btn" onClick={onCompleteTest}>&#9193; Complete test</button>
              )}

              {canUndo && <button className="debug-btn" onClick={onUndo}>&#8617; Undo last answer</button>}

              {onSeedAnswers && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', alignSelf: 'center', marginRight: '2px' }}>Seed:</span>
                  {[5, 17, 34, 51].map((n) => (
                    <button
                      key={n}
                      className="debug-btn"
                      style={{ flex: 1, minWidth: 0 }}
                      onClick={() => { onSeedAnswers(n); debugLog('seed_answers', { n }); }}
                    >
                      +{n}
                    </button>
                  ))}
                </div>
              )}

              {onForceSnapshot && (
                <button className="debug-btn" onClick={onForceSnapshot}>Force snapshot</button>
              )}

              <button
                className="debug-btn"
                onClick={() => {
                  if (isPremiumPreviewEnabled()) { disablePremiumPreview(); } else { enablePremiumPreview(); }
                  window.location.reload();
                }}
              >
                {isPremiumPreviewEnabled() ? 'Disable premium preview' : 'Force premium preview'}
              </button>

              <button
                className="debug-btn"
                onClick={() => {
                  if (isPremiumUnlocked(null)) { disablePremiumUnlock(); } else { unlockPremium(); }
                  window.location.reload();
                }}
              >
                {isPremiumUnlocked(null) ? 'Lock premium' : 'Unlock premium'}
              </button>

              {onResetPremiumModal && (
                <button className="debug-btn" onClick={onResetPremiumModal}>Reset premium modal</button>
              )}

              {onForcePremiumModule && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', alignSelf: 'center', width: '100%', marginBottom: '2px' }}>Force module:</span>
                  {(['shadowProfile','maskVsCore','contradictions','futureSelf','relationshipMode','humanTwin','hiddenParameters','profileEvolution'] as const).map((id) => (
                    <button
                      key={id}
                      className="debug-btn"
                      style={{ fontSize: '0.6rem', padding: '3px 6px' }}
                      onClick={() => onForcePremiumModule(id)}
                    >
                      {id.replace(/([A-Z])/g, ' $1').trim()}
                    </button>
                  ))}
                </div>
              )}

              {onSeedAnswers && (
                <button
                  className="debug-btn"
                  onClick={() => { onSeedAnswers(85); debugLog('seed_answers', { n: 85 }); }}
                >
                  Seed +85
                </button>
              )}

              <button className="debug-btn" onClick={onRefreshProfile}>Refresh profile</button>

              <button
                className="debug-btn"
                onClick={() => {
                  const j = exportSession();
                  const b = new Blob([j], { type: 'application/json' });
                  const u = URL.createObjectURL(b);
                  const a = document.createElement('a');
                  a.href = u; a.download = `to99-${Date.now()}.json`; a.click();
                  URL.revokeObjectURL(u);
                }}
              >
                Export JSON
              </button>

              <button
                className="debug-btn"
                onClick={() => {
                  if (window.confirm('Enable test session?')) { enableTestSession(); window.location.reload(); }
                }}
              >
                Enable test session
              </button>

              <button
                className="debug-btn"
                style={{ color: '#f87171', borderColor: 'rgba(239,68,68,0.25)' }}
                onClick={() => {
                  if (window.confirm('Reset guest/test session and all local data?')) {
                    disableGuestMode(); disableTestSession(); resetSession(); window.location.reload();
                  }
                }}
              >
                Reset guest/test session
              </button>

              <button
                className="debug-btn"
                onClick={() => { clearLogs(); debugLog('logs_cleared'); onReset(); }}
              >
                Clear logs + reload
              </button>

              <button className="debug-btn" onClick={onLogout}>Logout</button>
            </div>
          </details>

          {/* LOGS */}
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
