export interface FeedEvent {
  type: 'dimension_up' | 'rare_signal' | 'card_pick' | 'first_signal';
  label: string;
  timestamp: number;
}

const STORAGE_KEY = 'to99_feed';
const MAX_EVENTS = 5;

export function getFeedEvents(): FeedEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FeedEvent[]) : [];
  } catch {
    return [];
  }
}

export function addFeedEvent(event: Omit<FeedEvent, 'timestamp'>): void {
  try {
    const events = getFeedEvents();
    events.unshift({ ...event, timestamp: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(0, MAX_EVENTS)));
  } catch { /* ignore */ }
}
