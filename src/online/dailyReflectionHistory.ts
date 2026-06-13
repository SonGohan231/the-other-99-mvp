import { type DailyCardData } from './dailyCard';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReflectionHistoryEntry {
  date: string;
  card_id: string;
  title: string;
  body: string;
  source: 'remote' | 'cache' | 'local_fallback';
  seen_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const REFLECTION_HISTORY_KEY = 'to99_daily_reflection_history_v1';
export const REFLECTION_HISTORY_MAX = 60;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeCardId(date: string, title: string, body: string): string {
  return `${date}|${title.slice(0, 40)}|${body.slice(0, 40)}`;
}

function isValidEntry(e: unknown): e is ReflectionHistoryEntry {
  if (!e || typeof e !== 'object' || Array.isArray(e)) return false;
  const o = e as Record<string, unknown>;
  return (
    typeof o.date === 'string' &&
    typeof o.card_id === 'string' &&
    typeof o.title === 'string' &&
    typeof o.body === 'string' &&
    typeof o.source === 'string' &&
    typeof o.seen_at === 'string'
  );
}

// ─── API ──────────────────────────────────────────────────────────────────────

export function getReflectionHistory(): ReflectionHistoryEntry[] {
  try {
    const raw = localStorage.getItem(REFLECTION_HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidEntry);
  } catch {
    return [];
  }
}

export function recordDailyCard(card: DailyCardData): void {
  try {
    const history = getReflectionHistory();
    // One entry per calendar day — skip if date already recorded
    if (history.some((e) => e.date === card.date)) return;
    const entry: ReflectionHistoryEntry = {
      date: card.date,
      card_id: makeCardId(card.date, card.title, card.body),
      title: card.title,
      body: card.body,
      source: card.source,
      seen_at: new Date().toISOString(),
    };
    const updated = [entry, ...history].slice(0, REFLECTION_HISTORY_MAX);
    localStorage.setItem(REFLECTION_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable — silently skip
  }
}

export function clearReflectionHistory(): void {
  try {
    localStorage.removeItem(REFLECTION_HISTORY_KEY);
  } catch {
    // silently skip
  }
}
