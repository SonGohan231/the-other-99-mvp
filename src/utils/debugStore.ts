const LOG_KEY = 'to99_debug_logs';
const ERR_KEY = 'to99_debug_errors';
const MAX_ENTRIES = 100;

export interface LogEntry {
  ts: string;
  msg: string;
  data?: unknown;
}

function appendToKey(key: string, entry: LogEntry): void {
  try {
    const raw = localStorage.getItem(key);
    const arr: LogEntry[] = raw ? JSON.parse(raw) : [];
    arr.push(entry);
    if (arr.length > MAX_ENTRIES) arr.splice(0, arr.length - MAX_ENTRIES);
    localStorage.setItem(key, JSON.stringify(arr));
  } catch { /* ignore */ }
}

export function debugLog(msg: string, data?: unknown): void {
  const entry: LogEntry = { ts: new Date().toISOString(), msg, data };
  appendToKey(LOG_KEY, entry);
}

export function debugError(msg: string, err?: unknown): void {
  const entry: LogEntry = { ts: new Date().toISOString(), msg, data: err instanceof Error ? err.message : String(err ?? '') };
  appendToKey(ERR_KEY, entry);
}

export function getLogs(): LogEntry[] {
  try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch { return []; }
}

export function getErrors(): LogEntry[] {
  try { return JSON.parse(localStorage.getItem(ERR_KEY) || '[]'); } catch { return []; }
}

export function clearLogs(): void {
  try { localStorage.removeItem(LOG_KEY); localStorage.removeItem(ERR_KEY); } catch { /* ignore */ }
}
