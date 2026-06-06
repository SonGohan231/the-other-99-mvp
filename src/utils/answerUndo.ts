import { ProfileVector } from './profileVector';
import { CanonicalVector } from './canonicalVector';

const UNDO_KEY = 'to99_undo_stack';
const MAX_UNDO_ENTRIES = 3;
export const MAX_CHANGES_PER_ANSWER = 2;

export interface UndoEntry {
  contentId: string;
  selectedAnswer: string;
  axisDeltas: Record<string, number> | null;
  profileVectorSnapshot: ProfileVector;
  canonicalVectorSnapshot?: CanonicalVector;
  answerNumber: number;
  changeCount: number;
  createdAt: string;
}

function loadStack(): UndoEntry[] {
  try {
    return JSON.parse(localStorage.getItem(UNDO_KEY) || '[]') as UndoEntry[];
  } catch {
    return [];
  }
}

function saveStack(stack: UndoEntry[]): void {
  localStorage.setItem(UNDO_KEY, JSON.stringify(stack));
}

export function pushUndoEntry(entry: UndoEntry): void {
  const stack = loadStack();
  stack.push(entry);
  // Keep only last MAX_UNDO_ENTRIES
  const trimmed = stack.slice(-MAX_UNDO_ENTRIES);
  saveStack(trimmed);
}

export function popUndoEntry(): UndoEntry | null {
  const stack = loadStack();
  if (stack.length === 0) return null;
  const entry = stack.pop()!;
  saveStack(stack);
  return entry;
}

export function peekUndoEntry(): UndoEntry | null {
  const stack = loadStack();
  return stack.length > 0 ? stack[stack.length - 1] : null;
}

export function canUndo(): boolean {
  return loadStack().length > 0;
}

export function clearUndoStack(): void {
  localStorage.removeItem(UNDO_KEY);
}
