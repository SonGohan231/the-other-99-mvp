import { useState } from 'react';
import { ProfileState } from '../types';
import { exportSession, resetSession, getProfileState } from '../utils/storage';

interface Props {
  onReset: () => void;
}

export default function DebugPanel({ onReset }: Props) {
  const [open, setOpen] = useState(false);
  const [profileJson, setProfileJson] = useState<string | null>(null);

  function handleExport() {
    const json = exportSession();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `to99-session-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleReset() {
    if (window.confirm('Reset całej sesji? Tej operacji nie można cofnąć.')) {
      resetSession();
      onReset();
    }
  }

  function handleShowProfile() {
    const state: ProfileState = getProfileState();
    setProfileJson(JSON.stringify(state, null, 2));
  }

  return (
    <>
      {/* Positioned bottom-left to avoid overlapping centered CTAs */}
      <button
        className="debug-toggle"
        onClick={() => setOpen((o: boolean) => !o)}
        aria-label={open ? 'Zamknij debug panel' : 'Otwórz debug panel'}
        aria-expanded={open}
      >
        {open ? '×' : 'DBG'}
      </button>

      {open && (
        <div className="debug-panel" role="complementary" aria-label="Debug panel">
          <p className="debug-panel-title">Debug Panel</p>
          <div className="debug-panel-actions">
            <button className="debug-btn" onClick={handleExport}>↓ Export session JSON</button>
            <button className="debug-btn" onClick={handleShowProfile}>👁 Show profile state</button>
            <button
              className="debug-btn"
              onClick={handleReset}
              style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.25)' }}
            >
              ✕ Reset session
            </button>
          </div>
          {profileJson && (
            <>
              <div className="divider" />
              <pre className="debug-profile">{profileJson}</pre>
            </>
          )}
        </div>
      )}
    </>
  );
}
