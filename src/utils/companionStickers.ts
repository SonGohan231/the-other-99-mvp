export type CompanionAnimal = 'kitten' | 'puppy' | 'fox' | 'otter' | 'owl' | 'deer';
export type AssetStatus = 'placeholder' | 'needed' | 'ready';

export interface CompanionDef {
  id: string;
  animal: CompanionAnimal;
  unlockAtAnswerCount: number;
  emotionalRole: string;
  animationAssetPath: string;
  stickerAssetPath: string;
  assetStatus: AssetStatus;
  supportiveCopyEn: string;
  supportiveCopyPl: string;
  emoji: string;
}

export const COMPANIONS: CompanionDef[] = [
  { id: 'companion_kitten', animal: 'kitten', unlockAtAnswerCount: 5, emotionalRole: 'curiosity / soft attention', animationAssetPath: '/companions/kitten-loop.webp', stickerAssetPath: '/companions/kitten-sticker.png', assetStatus: 'placeholder', supportiveCopyEn: 'A tiny signal appeared.', supportiveCopyPl: 'Pojawił się mały sygnał.', emoji: '🐱' },
  { id: 'companion_puppy', animal: 'puppy', unlockAtAnswerCount: 12, emotionalRole: 'trust / connection', animationAssetPath: '/companions/puppy-loop.webp', stickerAssetPath: '/companions/puppy-sticker.png', assetStatus: 'placeholder', supportiveCopyEn: 'You found a companion.', supportiveCopyPl: 'Znalazłeś towarzysza.', emoji: '🐶' },
  { id: 'companion_fox', animal: 'fox', unlockAtAnswerCount: 25, emotionalRole: 'intuition / cleverness', animationAssetPath: '/companions/fox-loop.webp', stickerAssetPath: '/companions/fox-sticker.png', assetStatus: 'placeholder', supportiveCopyEn: 'Your map has a new witness.', supportiveCopyPl: 'Twoja mapa ma nowego świadka.', emoji: '🦊' },
  { id: 'companion_owl', animal: 'owl', unlockAtAnswerCount: 51, emotionalRole: 'observation / insight', animationAssetPath: '/companions/owl-loop.webp', stickerAssetPath: '/companions/owl-sticker.png', assetStatus: 'placeholder', supportiveCopyEn: 'This one stayed with you.', supportiveCopyPl: 'Ten pozostał przy tobie.', emoji: '🦉' },
  { id: 'companion_otter', animal: 'otter', unlockAtAnswerCount: 75, emotionalRole: 'playfulness / openness', animationAssetPath: '/companions/otter-loop.webp', stickerAssetPath: '/companions/otter-sticker.png', assetStatus: 'placeholder', supportiveCopyEn: 'A quiet presence joined the signal.', supportiveCopyPl: 'Cicha obecność dołączyła do sygnału.', emoji: '🦦' },
  { id: 'companion_deer', animal: 'deer', unlockAtAnswerCount: 99, emotionalRole: 'sensitivity / calmness', animationAssetPath: '/companions/deer-loop.webp', stickerAssetPath: '/companions/deer-sticker.png', assetStatus: 'placeholder', supportiveCopyEn: 'The last companion arrived.', supportiveCopyPl: 'Ostatni towarzysz przybył.', emoji: '🦌' },
];

const ALBUM_KEY = 'to99_companion_album';

export function getUnlockedCompanions(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(ALBUM_KEY) ?? '[]') as string[]; } catch { return []; }
}

export function unlockCompanion(id: string): void {
  if (typeof window === 'undefined') return;
  const current = getUnlockedCompanions();
  if (!current.includes(id)) localStorage.setItem(ALBUM_KEY, JSON.stringify([...current, id]));
}

export function isCompanionUnlocked(id: string): boolean {
  return getUnlockedCompanions().includes(id);
}

export function getCompanionForAnswerCount(totalAnswers: number): CompanionDef | null {
  return COMPANIONS.find((c) => c.unlockAtAnswerCount <= totalAnswers && !isCompanionUnlocked(c.id)) ?? null;
}

export function getNextCompanion(totalAnswers: number): CompanionDef | null {
  return COMPANIONS.find((c) => c.unlockAtAnswerCount > totalAnswers) ?? null;
}
