import { useState } from 'react';
import { ContentItem, ProfileState, BehavioralMetadata, SkipEvent, SwapEvent, ExitToMenuEvent, ReturnToSessionEvent } from '../types';
import { exportFullSession, resetSession } from '../utils/storage';
import { isPremiumUnlocked, unlockPremium, disablePremiumUnlock, enablePremiumPreview, disablePremiumPreview, isPremiumPreviewEnabled } from '../utils/premiumProgression';
import { debugLog, getLogs, getErrors, clearLogs } from '../utils/debugStore';
import { enableTestSession, disableTestSession } from '../utils/testSession';
import { disableGuestMode } from '../utils/guestSession';
import { BehavioralSummary } from '../utils/behavioralSignals';
import { getVoteDebugInfo, resetLocalVotes, exportVoteState, getOrCreateAnonId } from '../utils/communityVotes';
import { localizedCsvField } from '../i18n';
import { useLang } from '../context/LangContext';
import { getAppInfo } from '../utils/appVersion';

interface Props {
  profileState: ProfileState;
  testContent: ContentItem[];
  testAnswerIndex: number;
  currentItem: ContentItem | null;
  totalProfileAnswers: number;
  isTestMode: boolean;
  lastBehavioralMetadata?: BehavioralMetadata | null;
  behavioralSummary?: BehavioralSummary | null;
  onStartTest: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onRefreshProfile: () => void;
  onLogout: () => void;
  onReset: () => void;
  skipEvents?: SkipEvent[];
  swapEvents?: SwapEvent[];
  exitEvents?: ExitToMenuEvent[];
  returnEvents?: ReturnToSessionEvent[];
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
  lastBehavioralMetadata,
  behavioralSummary,
  skipEvents = [],
  swapEvents = [],
  exitEvents = [],
  returnEvents = [],
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
  const [lang] = useLang();
  const inTest = testContent.length > 0 && testAnswerIndex < testContent.length;
  const appInfo = getAppInfo();

  // Compute vote debug info for current item
  const voteDebug = (() => {
    if (!currentItem) return null;
    const fields = currentItem as unknown as Record<string, string>;
    const raw = localizedCsvField(fields, 'answer_options', lang);
    const options = raw.split('|').map((a) => a.trim()).filter(Boolean);
    if (options.length === 0) return null;
    return getVoteDebugInfo(currentItem.id, options);
  })();

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

          {/* APP INFO */}
          <details open>
            <summary style={{ fontSize: '0.72rem', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px 0' }}>App Info</summary>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.9, fontFamily: 'monospace' }}>
              <div><span style={{ color: 'var(--text-dim)' }}>Version:&nbsp;</span>{appInfo.version}</div>
              <div><span style={{ color: 'var(--text-dim)' }}>Commit:&nbsp;</span>{appInfo.commit}</div>
              <div><span style={{ color: 'var(--text-dim)' }}>Build:&nbsp;</span>{appInfo.buildDate}</div>
              <div><span style={{ color: 'var(--text-dim)' }}>Source:&nbsp;</span>{appInfo.deploySource}</div>
              <div><span style={{ color: 'var(--text-dim)' }}>Platform:&nbsp;</span>{appInfo.platform}</div>
              <div><span style={{ color: 'var(--text-dim)' }}>Env:&nbsp;</span>{appInfo.environment}</div>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>Supabase:&nbsp;</span>
                <span style={{ color: appInfo.supabaseConfigured ? '#4ade80' : '#f87171' }}>
                  {appInfo.supabaseConfigured ? '✓ configured' : '✗ missing'}
                </span>
              </div>
            </div>
          </details>

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

          {/* BEHAVIORAL */}
          <details>
            <summary style={{ fontSize: '0.72rem', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px 0' }}>
              Behavioral Signals {behavioralSummary ? `(n=${behavioralSummary.sampleSize})` : '(no data)'}
            </summary>
            {lastBehavioralMetadata && (
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '6px' }}>
                <div style={{ fontSize: '0.64rem', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '2px' }}>Last answer:</div>
                <div>conf: {lastBehavioralMetadata.confidence_signal} | avoid: {lastBehavioralMetadata.avoidance_signal} | imp: {lastBehavioralMetadata.impulsivity_signal}</div>
                <div>delib: {lastBehavioralMetadata.deliberation_signal} | inst: {lastBehavioralMetadata.instability_signal} | friction: {lastBehavioralMetadata.emotional_friction_signal}</div>
                <div>reaction: {lastBehavioralMetadata.first_reaction_time_ms ?? '—'}ms | hesitation: {lastBehavioralMetadata.hesitation_time_ms ?? '—'}ms</div>
                <div>changed: {String(lastBehavioralMetadata.was_answer_changed)} | undone: {String(lastBehavioralMetadata.was_undone)}</div>
              </div>
            )}
            {behavioralSummary ? (
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                <div style={{ fontSize: '0.64rem', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '2px' }}>Aggregates (n={behavioralSummary.sampleSize}):</div>
                <div>decisiveness: <span style={{ color: 'var(--accent-light)' }}>{behavioralSummary.decisivenessLabel}</span></div>
                <div>stability: <span style={{ color: 'var(--accent-light)' }}>{behavioralSummary.stabilityLabel}</span></div>
                <div>avoidance: <span style={{ color: 'var(--accent-light)' }}>{behavioralSummary.avoidanceLabel}</span></div>
                <div>avg conf: {behavioralSummary.avgConfidenceSignal} | avg avoid: {behavioralSummary.avgAvoidanceSignal}</div>
                <div>avg imp: {behavioralSummary.avgImpulsivitySignal} | avg delib: {behavioralSummary.avgDeliberationSignal}</div>
                <div>avg inst: {behavioralSummary.avgInstabilitySignal} | avg friction: {behavioralSummary.avgEmotionalFrictionSignal}</div>
                <div>avg contradiction: {behavioralSummary.avgContradictionSignal}</div>
                <div>changes: {behavioralSummary.totalAnswerChanges} | undos: {behavioralSummary.totalUndos} | skips: {behavioralSummary.totalSkips}</div>
                <div>avg resp: {(behavioralSummary.avgResponseTimeMs / 1000).toFixed(1)}s</div>
              </div>
            ) : (
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Need ≥3 answers with metadata.</div>
            )}
          </details>

          {/* BEHAVIORAL EVENTS */}
          <details>
            <summary style={{ fontSize: '0.72rem', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px 0' }}>
              Behavioral Events (skip:{skipEvents.length} swap:{swapEvents.length} exit:{exitEvents.length} return:{returnEvents.length})
            </summary>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              {skipEvents.length === 0 && swapEvents.length === 0 && exitEvents.length === 0 && returnEvents.length === 0
                ? <div>No behavioral events recorded.</div>
                : <>
                  {skipEvents.slice(-3).map((e, i) => (
                    <div key={i}>skip: {e.question_id} | t={e.time_to_skip_ms}ms | had_sel={String(e.had_selection_before_skip)}</div>
                  ))}
                  {swapEvents.slice(-3).map((e, i) => (
                    <div key={i}>swap: {e.old_question_id}→{e.new_question_id} | t={e.time_to_swap_ms}ms</div>
                  ))}
                  {exitEvents.slice(-3).map((e, i) => (
                    <div key={i}>exit: q={e.question_id} | depth={e.session_depth} | ans={e.answer_count_before_exit}</div>
                  ))}
                  {returnEvents.slice(-3).map((e, i) => (
                    <div key={i}>return: depth={e.session_depth_at_return} | same_q={String(e.same_question_restored)}</div>
                  ))}
                </>
              }
            </div>
          </details>

          {/* COMMUNITY VOTES */}
          <details>
            <summary style={{ fontSize: '0.72rem', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px 0' }}>
              Community Votes {voteDebug ? `(real: ${voteDebug.realVotes})` : '(no item)'}
            </summary>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              <div>Anon ID: <span style={{ color: 'var(--text-dim)', wordBreak: 'break-all' }}>{getOrCreateAnonId().slice(0, 20)}…</span></div>
              {voteDebug ? (
                <>
                  <div>Content: {voteDebug.contentId}</div>
                  <div>Seed source: <span style={{ color: voteDebug.seedSource === 'v3' ? '#86efac' : '#fbbf24' }}>{voteDebug.seedSource === 'v3' ? 'v3 semantic' : 'hash fallback'}</span></div>
                  <div>Mapped: <span style={{ color: voteDebug.isMapped ? '#86efac' : '#f87171' }}>{voteDebug.isMapped ? 'yes' : 'no'}</span></div>
                  {voteDebug.semanticId && <div>Semantic ID: {voteDebug.semanticId}</div>}
                  {voteDebug.semanticTheme && <div>Theme: {voteDebug.semanticTheme}</div>}
                  <div>Scenario: {voteDebug.scenarioId}</div>
                  <div>Seed votes: {voteDebug.seedVotes}</div>
                  <div>Real votes: {voteDebug.realVotes}</div>
                  <div>Total: {voteDebug.totalVotes}</div>
                  <div>Label: <span style={{ color: 'var(--accent-light)' }}>{voteDebug.distributionLabel}</span></div>
                  <div>My vote: {voteDebug.myVote ?? 'none'}</div>
                  <div style={{ marginTop: '4px', fontSize: '0.6rem' }}>
                    {Object.entries(voteDebug.byAnswer).map(([opt, counts]) => (
                      <div key={opt}>{opt}: seed={counts.seed} real={counts.real} total={counts.total}</div>
                    ))}
                  </div>
                </>
              ) : <div>No current item.</div>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '4px' }}>
              <button
                className="debug-btn"
                onClick={() => {
                  const data = exportVoteState();
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = `to99-votes-${Date.now()}.json`; a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export vote state
              </button>
              <button
                className="debug-btn"
                style={{ color: '#f87171', borderColor: 'rgba(239,68,68,0.25)' }}
                onClick={() => {
                  if (window.confirm('Reset all local community votes?')) {
                    resetLocalVotes();
                    window.location.reload();
                  }
                }}
              >
                Reset local votes
              </button>
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
                  const j = exportFullSession({
                    skipEvents, swapEvents, exitEvents, returnEvents,
                    buildInfo: { version: appInfo.version, commit: appInfo.commit, buildDate: appInfo.buildDate },
                  });
                  const b = new Blob([j], { type: 'application/json' });
                  const u = URL.createObjectURL(b);
                  const a = document.createElement('a');
                  a.href = u; a.download = `to99-full-${Date.now()}.json`; a.click();
                  URL.revokeObjectURL(u);
                }}
              >
                Export Full JSON (with events)
              </button>
              <button
                className="debug-btn"
                onClick={() => {
                  const j = exportFullSession({
                    skipEvents, swapEvents, exitEvents, returnEvents,
                    buildInfo: { version: appInfo.version, commit: appInfo.commit, buildDate: appInfo.buildDate },
                  });
                  navigator.clipboard.writeText(j).then(() => alert('Copied to clipboard')).catch(() => alert('Copy failed'));
                }}
              >
                Copy session to clipboard
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
