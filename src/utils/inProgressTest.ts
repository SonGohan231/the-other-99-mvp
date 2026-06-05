const KEY = 'to99_in_progress_test';
const VERSION = 1;

export interface InProgressTestState {
  version: number;
  testNumber: number;
  testSessionId: string | null;
  testAnswerIndex: number;
  testContentIds: string[];  // IDs only, not full ContentItem objects
  currentItemId: string | null;
  pendingAnswer: string;
  selectedCard: string | null;
  canUndoAnswer: boolean;
  updatedAt: string;
}

export function saveInProgressTest(state: Omit<InProgressTestState, 'version' | 'updatedAt'>): void {
  try {
    const payload: InProgressTestState = {
      ...state,
      version: VERSION,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch { /* ignore */ }
}

export function loadInProgressTest(): InProgressTestState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as InProgressTestState;
    if (parsed.version !== VERSION) return null;
    return parsed;
  } catch { return null; }
}

export function clearInProgressTest(): void {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

export function hasInProgressTest(): boolean {
  return loadInProgressTest() !== null;
}
