import { type RemoteConfig } from './remoteConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AnnouncementLevel = 'info' | 'maintenance' | 'update';

export interface RemoteAnnouncement {
  enabled: boolean;
  id: string;
  level: AnnouncementLevel;
  title_en: string;
  title_pl: string;
  body_en: string;
  body_pl: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const DISMISSED_ANNOUNCEMENTS_KEY = 'to99_dismissed_announcements_v1';
const MAX_DISMISSED = 50;

const VALID_LEVELS: AnnouncementLevel[] = ['info', 'maintenance', 'update'];

// ─── Parse ────────────────────────────────────────────────────────────────────

export function parseAnnouncement(raw: unknown): RemoteAnnouncement | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.enabled !== 'boolean') return null;
  if (typeof r.id !== 'string' || r.id.trim() === '') return null;
  if (!VALID_LEVELS.includes(r.level as AnnouncementLevel)) return null;
  if (
    typeof r.title_en !== 'string' ||
    typeof r.title_pl !== 'string' ||
    typeof r.body_en !== 'string' ||
    typeof r.body_pl !== 'string'
  ) return null;
  return {
    enabled: r.enabled,
    id: r.id,
    level: r.level as AnnouncementLevel,
    title_en: r.title_en,
    title_pl: r.title_pl,
    body_en: r.body_en,
    body_pl: r.body_pl,
  };
}

// ─── Dismissal ────────────────────────────────────────────────────────────────

export function getDismissedAnnouncements(): string[] {
  try {
    const raw = localStorage.getItem(DISMISSED_ANNOUNCEMENTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string');
  } catch {
    return [];
  }
}

export function isAnnouncementDismissed(id: string): boolean {
  return getDismissedAnnouncements().includes(id);
}

export function dismissAnnouncement(id: string): void {
  try {
    const existing = getDismissedAnnouncements();
    if (existing.includes(id)) return;
    const updated = [id, ...existing].slice(0, MAX_DISMISSED);
    localStorage.setItem(DISMISSED_ANNOUNCEMENTS_KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable — silently skip
  }
}

// ─── Active announcement ──────────────────────────────────────────────────────

export function getActiveAnnouncement(
  config: RemoteConfig,
  dismissedIds: string[],
): RemoteAnnouncement | null {
  const ann = parseAnnouncement(config.announcement);
  if (!ann || !ann.enabled) return null;
  if (dismissedIds.includes(ann.id)) return null;
  return ann;
}
