// ─── Types ────────────────────────────────────────────────────────────────────

export interface RemoteConfigDailyCardItem {
  title: string;
  body: string;
}

export interface RemoteConfigDailyCard {
  seed_offset: number;
  cards: RemoteConfigDailyCardItem[];
}

export interface RemoteConfigFeatureFlags {
  daily_card_enabled: boolean;
  daily_card_show_on_dashboard: boolean;
}

export interface RemoteConfigAnnouncement {
  enabled: boolean;
  id: string;
  level: string;
  title_en: string;
  title_pl: string;
  body_en: string;
  body_pl: string;
}

export interface RemoteConfig {
  version: 'online_b1_remote_config_v1';
  feature_flags: RemoteConfigFeatureFlags;
  daily_card: RemoteConfigDailyCard;
  announcement?: RemoteConfigAnnouncement;
}

interface CachedRemoteConfig extends RemoteConfig {
  _cached_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const REMOTE_CONFIG_VERSION = 'online_b1_remote_config_v1' as const;
export const REMOTE_CONFIG_TIMEOUT_MS = 2500;
export const REMOTE_CONFIG_CACHE_KEY = 'to99_remote_config_v1';
export const DEFAULT_REMOTE_CONFIG_URL = 'https://the-other-99-mvp.vercel.app/remote/app-config.json';

// ─── Local fallback (used when fetch fails and no cache exists) ───────────────

export const LOCAL_FALLBACK_CONFIG: RemoteConfig = {
  version: 'online_b1_remote_config_v1',
  feature_flags: {
    daily_card_enabled: true,
    daily_card_show_on_dashboard: true,
  },
  daily_card: {
    seed_offset: 0,
    cards: [
      { title: 'A small question for today.',      body: 'What have you been meaning to notice about yourself that you keep setting aside?' },
      { title: "Today's reflection is ready.",     body: 'When something bothers you, do you usually address it quickly or let it settle?' },
      { title: 'One quiet signal to notice today.', body: 'What kind of decision have you been finding easier than expected lately?' },
      { title: 'A small question for today.',      body: 'Is there something you value in others that you find difficult to ask for yourself?' },
      { title: "Today's reflection is ready.",     body: 'What gives you energy that you rarely make time for?' },
      { title: 'One quiet signal to notice today.', body: 'When you imagine your best day, what does it look like in the first hour?' },
      { title: 'A small question for today.',      body: 'What have you changed your mind about in the past year?' },
      { title: "Today's reflection is ready.",     body: 'Which of your habits serves you, and which one are you quietly tolerating?' },
      { title: 'One quiet signal to notice today.', body: 'What do you tend to explain to people before they even ask?' },
      { title: 'A small question for today.',      body: 'What does the version of you from five years ago not know about you yet?' },
      { title: "Today's reflection is ready.",     body: 'When do you feel most like yourself — and when do you feel furthest from it?' },
      { title: 'One quiet signal to notice today.', body: 'What are you curious about that feels too small to mention?' },
      { title: 'A small question for today.',      body: 'What would you do differently if no one was watching, but you still knew?' },
      { title: "Today's reflection is ready.",     body: 'What kind of friction do you find yourself seeking out rather than avoiding?' },
      { title: 'One quiet signal to notice today.', body: 'What part of your life is moving in a direction you have not fully named yet?' },
    ],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getConfigUrl(): string {
  try {
    const env = (import.meta as { env?: Record<string, string> }).env;
    return env?.VITE_TO99_REMOTE_CONFIG_URL ?? DEFAULT_REMOTE_CONFIG_URL;
  } catch {
    return DEFAULT_REMOTE_CONFIG_URL;
  }
}

function validateConfig(raw: unknown): RemoteConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('remote config: not an object');
  }
  const r = raw as Record<string, unknown>;
  if (r.version !== REMOTE_CONFIG_VERSION) {
    throw new Error(`remote config: unexpected version "${String(r.version)}"`);
  }
  const ff = r.feature_flags;
  if (!ff || typeof ff !== 'object') throw new Error('remote config: missing feature_flags');
  const dc = r.daily_card;
  if (!dc || typeof dc !== 'object') throw new Error('remote config: missing daily_card');
  const dco = dc as Record<string, unknown>;
  if (!Array.isArray(dco.cards) || dco.cards.length === 0) {
    throw new Error('remote config: daily_card.cards must be a non-empty array');
  }
  for (const card of dco.cards as unknown[]) {
    if (!card || typeof card !== 'object') throw new Error('remote config: invalid card entry');
    const c = card as Record<string, unknown>;
    if (typeof c.title !== 'string' || typeof c.body !== 'string') {
      throw new Error('remote config: card missing title or body string');
    }
  }
  if (typeof dco.seed_offset !== 'number') {
    throw new Error('remote config: daily_card.seed_offset must be a number');
  }
  return raw as RemoteConfig;
}

// ─── Cache ────────────────────────────────────────────────────────────────────

export function getCachedRemoteConfig(): RemoteConfig | null {
  try {
    const raw = localStorage.getItem(REMOTE_CONFIG_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedRemoteConfig;
    return validateConfig(parsed);
  } catch {
    return null;
  }
}

function saveToCache(config: RemoteConfig): void {
  try {
    const toStore: CachedRemoteConfig = { ...config, _cached_at: new Date().toISOString() };
    localStorage.setItem(REMOTE_CONFIG_CACHE_KEY, JSON.stringify(toStore));
  } catch {
    // localStorage unavailable — silently skip
  }
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

export type RemoteConfigSource = 'remote' | 'cache' | 'local_fallback';

export interface RemoteConfigResult {
  config: RemoteConfig;
  source: RemoteConfigSource;
}

export async function fetchRemoteConfig(
  overrideUrl?: string,
  overrideTimeoutMs?: number,
): Promise<RemoteConfigResult> {
  const url = overrideUrl ?? getConfigUrl();
  const timeoutMs = overrideTimeoutMs ?? REMOTE_CONFIG_TIMEOUT_MS;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      // No credentials, no cookies, no user identifiers
      credentials: 'omit',
    });
    clearTimeout(timer);

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const raw: unknown = await resp.json();
    const config = validateConfig(raw);
    saveToCache(config);
    return { config, source: 'remote' };
  } catch {
    clearTimeout(timer);
    const cached = getCachedRemoteConfig();
    if (cached) return { config: cached, source: 'cache' };
    return { config: LOCAL_FALLBACK_CONFIG, source: 'local_fallback' };
  }
}

export function getEffectiveRemoteConfig(): RemoteConfigResult {
  const cached = getCachedRemoteConfig();
  if (cached) return { config: cached, source: 'cache' };
  return { config: LOCAL_FALLBACK_CONFIG, source: 'local_fallback' };
}
