const KEY_LAST    = 'to99_streak_last_date';
const KEY_CURRENT = 'to99_streak_current';
const KEY_LONGEST = 'to99_streak_longest';

export interface StreakData {
  current: number;
  longest: number;
  lastDate: string | null;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export function getStreak(): StreakData {
  if (typeof window === 'undefined') return { current: 0, longest: 0, lastDate: null };
  const lastDate = localStorage.getItem(KEY_LAST);
  const current  = parseInt(localStorage.getItem(KEY_CURRENT) ?? '0', 10);
  const longest  = parseInt(localStorage.getItem(KEY_LONGEST) ?? '0', 10);
  return { current, longest, lastDate };
}

export function recordActivity(): StreakData {
  if (typeof window === 'undefined') return { current: 0, longest: 0, lastDate: null };

  const today    = todayStr();
  const lastDate = localStorage.getItem(KEY_LAST);
  let current    = parseInt(localStorage.getItem(KEY_CURRENT) ?? '0', 10);
  let longest    = parseInt(localStorage.getItem(KEY_LONGEST) ?? '0', 10);

  if (lastDate === today) {
    return { current, longest, lastDate };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  current = lastDate === yesterdayStr ? current + 1 : 1;
  longest = Math.max(longest, current);

  localStorage.setItem(KEY_LAST,    today);
  localStorage.setItem(KEY_CURRENT, String(current));
  localStorage.setItem(KEY_LONGEST, String(longest));

  return { current, longest, lastDate: today };
}
