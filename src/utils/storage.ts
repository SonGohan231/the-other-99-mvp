import { ProfileState, Interaction } from '../types';

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
      age_confirmed: isAgeConfirmed(),
      started: isStarted(),
      seen_content_ids: getSeenIds(),
      interactions: getInteractions(),
      profile_state: getProfileState(),
      paywall_shown: isPaywallShown(),
      exported_at: new Date().toISOString(),
    },
    null,
    2
  );
}
