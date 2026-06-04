export type TimelineEventType =
  | 'rare_signal'
  | 'fragment_unlocked'
  | 'first_signal'
  | 'twin_stage_changed'
  | 'profile_shift';

export interface TimelineEvent {
  id: string;
  answerNumber: number;
  type: TimelineEventType;
  label: string;
  createdAt: string;
}

const STORAGE_KEY = 'to99_timeline';
const MAX_EVENTS = 10;

export function getTimeline(): TimelineEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TimelineEvent[]) : [];
  } catch {
    return [];
  }
}

export function addTimelineEvent(
  event: Omit<TimelineEvent, 'id' | 'createdAt'>,
): void {
  try {
    const existing = getTimeline();
    // No-op if same answerNumber+type already exists
    const duplicate = existing.some(
      (e) => e.answerNumber === event.answerNumber && e.type === event.type,
    );
    if (duplicate) return;

    const newEvent: TimelineEvent = {
      ...event,
      id: `tl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newEvent, ...existing].slice(0, MAX_EVENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch { /* ignore */ }
}
