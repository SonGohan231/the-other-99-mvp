export type TwinEventType =
  | 'similarity_increased'
  | 'candidate_detected'
  | 'overlap_found'
  | 'confidence_improved'
  | 'rare_match';

export interface TwinFeedEvent {
  id: string;
  type: TwinEventType;
  scoreBefore: number;
  scoreAfter: number;
  createdAt: string;
}

const STORAGE_KEY = 'to99_twin_feed';
const MAX_EVENTS = 5;

export function getTwinStage(
  score: number,
): 'no_match' | 'weak_candidate' | 'potential_overlap' | 'possible_twin' | 'strong_match' | 'twin_candidate' {
  if (score >= 80) return 'twin_candidate';
  if (score >= 60) return 'strong_match';
  if (score >= 40) return 'possible_twin';
  if (score >= 25) return 'potential_overlap';
  if (score >= 10) return 'weak_candidate';
  return 'no_match';
}

export function getTwinFeedEvents(): TwinFeedEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TwinFeedEvent[]) : [];
  } catch {
    return [];
  }
}

export function addTwinFeedEvent(event: Omit<TwinFeedEvent, 'id' | 'createdAt'>): void {
  try {
    const existing = getTwinFeedEvents();
    const newEvent: TwinFeedEvent = {
      ...event,
      id: `twin_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newEvent, ...existing].slice(0, MAX_EVENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch { /* ignore */ }
}

export function checkAndAddTwinEvent(
  oldScore: number,
  newScore: number,
  rarity: string,
): boolean {
  if (rarity === 'legendary' || rarity === 'epic') {
    addTwinFeedEvent({ type: 'rare_match', scoreBefore: oldScore, scoreAfter: newScore });
    return true;
  }
  if (getTwinStage(newScore) !== getTwinStage(oldScore)) {
    addTwinFeedEvent({ type: 'candidate_detected', scoreBefore: oldScore, scoreAfter: newScore });
    return true;
  }
  if (newScore >= oldScore + 3) {
    addTwinFeedEvent({ type: 'similarity_increased', scoreBefore: oldScore, scoreAfter: newScore });
    return true;
  }
  if (newScore >= oldScore + 1) {
    addTwinFeedEvent({ type: 'confidence_improved', scoreBefore: oldScore, scoreAfter: newScore });
    return true;
  }
  return false;
}
