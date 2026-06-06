import { ProfileState, Interaction } from '../types';
import { CanonicalVector } from './canonicalVector';

export interface ContentDiagnostics {
  use_v2_content: boolean;
  active_content_source: 'legacy' | 'v2' | 'mixed' | 'fallback' | 'unknown';
  questions_loaded: number;
  answers_loaded: number;
  loaded_content_count: number;
  loaded_v2_question_count: number;
  loaded_v2_answer_count: number;
  loaded_legacy_count: number;
  current_content_source: string | null;
  current_content_version: string | null;
  current_source_file: string | null;
  current_question_id: string | null;
  current_answer_ids: string[];
  current_lang: string | null;
  warnings: string[];
}

export const KEYS = {
  AGE_CONFIRMED:  'to99_age_confirmed',
  STARTED:        'to99_started',
  SEEN_IDS:       'to99_seen_content_ids',
  INTERACTIONS:   'to99_interactions',
  PROFILE_STATE:  'to99_profile_state',
  PAYWALL_SHOWN:  'to99_paywall_shown',
};

function getInitialProfileState(): ProfileState {
  return {
    interaction_count: 0,
    profile_progress: 0,
    rarity_points: 0,
    axes: {},
    hidden: {},
    archetype_teasers: [],
    legendary_count: 0,
    paywall_trigger: Math.floor(Math.random() * 6) + 25,
    total_profile_answers: 0,
  };
}

export function isAgeConfirmed(): boolean {
  return localStorage.getItem(KEYS.AGE_CONFIRMED) === 'true';
}

export function confirmAge(): void {
  localStorage.setItem(KEYS.AGE_CONFIRMED, 'true');
}

export function isStarted(): boolean {
  return localStorage.getItem(KEYS.STARTED) === 'true';
}

export function setStarted(): void {
  localStorage.setItem(KEYS.STARTED, 'true');
}

export function getSeenIds(): string[] {
  try { return JSON.parse(localStorage.getItem(KEYS.SEEN_IDS) || '[]'); }
  catch { return []; }
}

export function addSeenId(id: string): void {
  const ids = getSeenIds();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem(KEYS.SEEN_IDS, JSON.stringify(ids));
  }
}

export function addSeenIds(ids: string[]): void {
  const seen = getSeenIds();
  ids.forEach((id) => { if (!seen.includes(id)) seen.push(id); });
  localStorage.setItem(KEYS.SEEN_IDS, JSON.stringify(seen));
}

export function removeSeenId(id: string): void {
  const seen = getSeenIds().filter((s) => s !== id);
  localStorage.setItem(KEYS.SEEN_IDS, JSON.stringify(seen));
}

export function removeLastInteraction(): void {
  const interactions = getInteractions();
  if (interactions.length > 0) {
    interactions.pop();
    localStorage.setItem(KEYS.INTERACTIONS, JSON.stringify(interactions));
  }
}

export function markLastInteractionUndone(contentId: string): void {
  const interactions = getInteractions();
  // Find the most recent interaction for this content id
  for (let i = interactions.length - 1; i >= 0; i--) {
    if (interactions[i].content_id === contentId) {
      const meta = interactions[i].behavioral_metadata;
      if (meta) {
        interactions[i] = {
          ...interactions[i],
          behavioral_metadata: { ...meta, was_undone: true },
        };
      }
      break;
    }
  }
  localStorage.setItem(KEYS.INTERACTIONS, JSON.stringify(interactions));
}

export function getInteractions(): Interaction[] {
  try { return JSON.parse(localStorage.getItem(KEYS.INTERACTIONS) || '[]'); }
  catch { return []; }
}

export function addInteraction(interaction: Interaction): void {
  const interactions = getInteractions();
  interactions.push(interaction);
  localStorage.setItem(KEYS.INTERACTIONS, JSON.stringify(interactions));
}

export function getProfileState(): ProfileState {
  try {
    const raw = localStorage.getItem(KEYS.PROFILE_STATE);
    if (!raw) return getInitialProfileState();
    const parsed = JSON.parse(raw) as ProfileState;
    if (parsed.paywall_trigger == null) parsed.paywall_trigger = Math.floor(Math.random() * 6) + 25;
    if (parsed.total_profile_answers == null) parsed.total_profile_answers = 0;
    return parsed;
  } catch {
    return getInitialProfileState();
  }
}

export function saveProfileState(state: ProfileState): void {
  localStorage.setItem(KEYS.PROFILE_STATE, JSON.stringify(state));
}

export function isPaywallShown(): boolean {
  return localStorage.getItem(KEYS.PAYWALL_SHOWN) === 'true';
}

export function setPaywallShown(): void {
  localStorage.setItem(KEYS.PAYWALL_SHOWN, 'true');
}

export function resetSession(): void {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
}

export function exportSession(): string {
  return JSON.stringify(
    {
      export_version: 2,
      exported_at: new Date().toISOString(),
      age_confirmed: isAgeConfirmed(),
      started: isStarted(),
      seen_content_ids: getSeenIds(),
      interactions: getInteractions(),
      profile_state: getProfileState(),
      paywall_shown: isPaywallShown(),
    },
    null,
    2
  );
}

export function exportFullSession(extras: {
  profileVector?: Record<string, number>;
  canonicalVector?: CanonicalVector | null;
  skipEvents?: unknown[];
  swapEvents?: unknown[];
  exitEvents?: unknown[];
  returnEvents?: unknown[];
  buildInfo?: Record<string, string>;
  contentDiagnostics?: ContentDiagnostics | null;
  // v4 session context
  userId?: string | null;
  lang?: string;
  startedAt?: string | null;
  premiumState?: { unlocked: boolean; source: string | null } | null;
} = {}): string {
  const base = JSON.parse(exportSession());
  return JSON.stringify(
    {
      ...base,
      export_version: 4,
      session_context: {
        user_id: extras.userId ?? null,
        lang: extras.lang ?? null,
        started_at: extras.startedAt ?? null,
        premium_state: extras.premiumState ?? null,
      },
      profile_vector: extras.profileVector ?? null,
      canonical_vector: extras.canonicalVector ?? null,
      behavioral_events: {
        skip: extras.skipEvents ?? [],
        swap: extras.swapEvents ?? [],
        exit: extras.exitEvents ?? [],
        return: extras.returnEvents ?? [],
      },
      build_info: extras.buildInfo ?? null,
      content_diagnostics: extras.contentDiagnostics ?? null,
    },
    null,
    2
  );
}
