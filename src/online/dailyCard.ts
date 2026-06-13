import { type RemoteConfig, LOCAL_FALLBACK_CONFIG } from './remoteConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DailyCardSource = 'remote' | 'cache' | 'local_fallback';

export interface DailyCardData {
  version: 'online_b1_daily_card_v1';
  title: string;
  body: string;
  date: string;
  source: DailyCardSource;
}

// ─── Hash ─────────────────────────────────────────────────────────────────────

function hashKey(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = ((h * 31) + key.charCodeAt(i)) >>> 0;
  }
  return h;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export function computeDailyCard(
  dateStr: string,
  config: RemoteConfig | null,
  source: DailyCardSource = 'local_fallback',
): DailyCardData {
  const effectiveConfig = config ?? LOCAL_FALLBACK_CONFIG;
  const { cards, seed_offset } = effectiveConfig.daily_card;

  const safeCards = Array.isArray(cards) && cards.length > 0 ? cards : LOCAL_FALLBACK_CONFIG.daily_card.cards;
  const safeSeedOffset = Number.isFinite(seed_offset) ? seed_offset : 0;

  const key = `${dateStr}:${safeSeedOffset}`;
  const idx = hashKey(key) % safeCards.length;
  const card = safeCards[idx];

  return {
    version: 'online_b1_daily_card_v1',
    title: card.title,
    body: card.body,
    date: dateStr,
    source: config ? source : 'local_fallback',
  };
}

export function getTodayDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}
