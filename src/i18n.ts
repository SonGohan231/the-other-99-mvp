// ─── Language types and storage ──────────────────────────────────────────────

export type Lang = 'en' | 'pl';
export const LANG_KEY = 'to99_lang';

export function getLang(): Lang {
  return (localStorage.getItem(LANG_KEY) as Lang) || 'en';
}

export function setLangStorage(lang: Lang): void {
  localStorage.setItem(LANG_KEY, lang);
}

// ─── Helper: localise a CSV field (e.g. prompt_en → prompt_pl fallback) ──────

export function localizedCsvField(
  item: Record<string, string>,
  base: string,
  lang: Lang
): string {
  if (lang === 'en') {
    const en = item[`${base}_en`];
    if (en && en.trim()) return en.trim();
  }
  return (item[`${base}_pl`] ?? '').trim();
}

// ─── English dictionary ───────────────────────────────────────────────────────

const en = {
  ageGate: {
    description: 'The Other 99 is a psychological experience for adults.',
    intensity: 'Some content may be emotionally intense.',
    button: "I'm 18+ and I'm entering",
    confirm: 'By clicking you confirm you are 18 years or older.',
  },
  auth: {
    googleButton: 'Continue with Google',
    googleConnecting: 'Connecting…',
    googleNotConfigured: 'Google login is not configured yet.',
    orDivider: 'or',
    emailLabel: 'Email — get a login link',
    emailPlaceholder: 'your@email.com',
    sendButton: 'Send link',
    sending: 'Sending…',
    sentTitle: 'Check your inbox.',
    sentBody: 'We sent you a login link to',
    sentNote: 'Click it to enter the app.',
    back: 'Back',
    footer: '18+ app. Registration = acceptance of MVP testing terms.',
    genericError: 'An error occurred. Please try again.',
  },
  dashboard: {
    mainLabel: 'Main menu',
    profileDiscovered: 'Profile discovered',
    // Card 1
    profileReading: 'Profile Reading',
    profileReadingSubtitle: '17 questions. One profile fragment.',
    freeTests: 'Free tests',
    remaining: 'remaining',
    profileAnswers: 'Profile answers',
    status: 'Status',
    profileNotReady: 'Profile not ready',
    profileReady: 'Profile ready',
    startTest: 'Start test',
    noFreeTests: 'No free tests remaining',
    noFreeTestsNote: 'You have completed 3 free tests. Unlock premium to continue.',
    // Card 2
    truthOrDare: 'Truth or Dare',
    truthOrDareSubtitle: 'Online mode. Coming soon.',
    comingSoon: 'Coming soon',
    // Card 3
    myProfile: 'My profile',
    answersLeft: (n: number) => `${n} answer${n === 1 ? '' : 's'} left until your first profile reading.`,
    profileReadyForRead: 'Your first profile reading is ready.',
    gatherMore: 'Gather more answers',
    readProfile: 'Read profile',
    // Card 4
    settings: 'Settings',
    language: 'Language',
    exportSession: '↓ Export session data (JSON)',
    resetSession: '✕ Reset local session',
    logout: '⎋ Log out',
  },
  interaction: {
    profileDiscovered: 'Profile discovered',
    questionOf: (n: number, total: number) => `Question ${n} / ${total}`,
    confirmAnswer: 'Confirm answer',
    rarityLabel: { standard: 'standard', rare: 'rare', epic: 'epic', legendary: 'legendary' } as Record<string, string>,
    typeLabel: { question: 'question', secret: 'secret', dare: 'dare', game: 'game', riddle: 'riddle' } as Record<string, string>,
  },
  reward: {
    heading: 'Your answer',
    showNext: 'Show next',
    blockLabel: {
      community_reveal: 'community',
      community: 'community',
      profile_movement: 'your profile',
      profile: 'your profile',
      next_hook: "what's next",
      hook: "what's next",
      unlock: 'unlocked',
      rarity: 'rarity',
    } as Record<string, string>,
    rarityText: {
      standard: 'A common answer. Every one matters.',
      rare: 'A rare answer — seen in a minority.',
      epic: 'A rare choice. You are entering the realm of the few.',
      legendary: 'An exceptionally rare answer. It left a mark on your profile.',
    } as Record<string, string>,
    profileMovement: (axes: string) => `Your profile is shifting towards: ${axes}.`,
    hiddenFooter: 'New information added to your hidden profile.',
  },
  testSummary: {
    ariaLabel: 'Test summary',
    badge: (n: number) => `Test ${n} complete`,
    title: 'New profile fragment collected.',
    answersInTest: 'Answers in this test',
    totalAnswers: 'Total profile answers',
    profileDiscovered: 'Profile discovered',
    strongestSignal: 'Strongest test signal',
    untilFirstReading: 'Until first reading',
    moreAnswers: (n: number) => `${n} more answer${n === 1 ? '' : 's'}`,
    afterTest: ['Next test will unlock the second profile fragment.', 'One more free test until your first profile reading.', 'Your first profile reading is ready.'],
    lockedNote: 'Full profile reading, Hidden Profile, and Human Twin are locked in this test version.',
    unlockButton: 'Unlock full profile',
    backToMenu: 'Back to menu',
  },
  truthOrDare: {
    ariaLabel: 'Truth or Dare',
    badge: 'Coming soon',
    title: 'Truth or Dare',
    description: 'Social mode with online verification, photos and multiplayer is in development.\n\nOnly profile reading mode is currently available.',
    onlineMode: 'Online mode',
    photoVerification: 'Photo verification',
    back: '← Back',
  },
  myProfile: {
    badgeReady: 'Ready',
    badgeProgress: (a: number) => `${a} / 51`,
    title: 'My profile',
    answersLeft: (n: number) => `You still need ${n} more answer${n === 1 ? '' : 's'} for your first profile reading. Complete another test to gather more data.`,
    readyText: 'Your first profile reading is ready.',
    premiumLocked: 'Full archetype, Hidden Profile and Human Twin are available in premium.',
    back: '← Back',
  },
  premium: {
    badge: 'Coming soon',
    title: 'Full profile coming soon',
    note: 'Premium is not yet active. This screen is for testing interest.',
    thanks: 'Thank you for participating in the MVP test. Your session and answers have been saved locally.',
    back: '← Back',
  },
  configError: {
    badge: 'Configuration required',
    title: 'Missing Supabase environment variables',
    instruction: 'Create a .env.local file in the project directory and add:',
    afterNote: 'Find your keys in the Supabase panel → Project Settings → API. After adding the variables, restart',
    devCmd: 'npm run dev',
  },
  loading: 'Loading…',
  loadError: 'Failed to load content. Please refresh the page.',
};

// ─── Polish dictionary ────────────────────────────────────────────────────────

type T = typeof en;

const pl: T = {
  ageGate: {
    description: 'The Other 99 jest doświadczeniem psychologicznym dla osób dorosłych.',
    intensity: 'Niektóre treści mogą być intensywne emocjonalnie.',
    button: 'Mam 18+ i wchodzę',
    confirm: 'Klikając, potwierdzasz, że masz ukończone 18 lat.',
  },
  auth: {
    googleButton: 'Zaloguj się przez Google',
    googleConnecting: 'Łączenie…',
    googleNotConfigured: 'Logowanie Google nie jest jeszcze skonfigurowane.',
    orDivider: 'lub',
    emailLabel: 'Email — otrzymasz link logowania',
    emailPlaceholder: 'twoj@email.com',
    sendButton: 'Wyślij link logowania',
    sending: 'Wysyłanie…',
    sentTitle: 'Sprawdź skrzynkę e-mail.',
    sentBody: 'Wysłaliśmy link logowania na',
    sentNote: 'Kliknij go, żeby wejść do aplikacji.',
    back: 'Wróć',
    footer: 'Aplikacja 18+. Rejestracja = akceptacja warunków testowania MVP.',
    genericError: 'Wystąpił błąd. Spróbuj ponownie.',
  },
  dashboard: {
    mainLabel: 'Menu główne',
    profileDiscovered: 'Profil odkryty',
    profileReading: 'Odczyt profilu',
    profileReadingSubtitle: '17 pytań. Jeden fragment profilu.',
    freeTests: 'Testy darmowe',
    remaining: 'pozostało',
    profileAnswers: 'Odpowiedzi profilu',
    status: 'Status',
    profileNotReady: 'Profil niegotowy',
    profileReady: 'Profil gotowy do odczytu',
    startTest: 'Rozpocznij test',
    noFreeTests: 'Brak darmowych testów',
    noFreeTestsNote: 'Ukończono 3 darmowe testy. Odblokuj premium, żeby kontynuować.',
    truthOrDare: 'Prawda czy wyzwanie',
    truthOrDareSubtitle: 'Tryb online. Wkrótce.',
    comingSoon: 'Wkrótce',
    myProfile: 'Mój profil',
    answersLeft: (n: number) => `Brakuje jeszcze ${n} odpowiedzi do pierwszego odczytu profilu.`,
    profileReadyForRead: 'Twój pierwszy odczyt profilu jest gotowy.',
    gatherMore: 'Zbierz więcej odpowiedzi',
    readProfile: 'Odczytaj profil',
    settings: 'Ustawienia',
    language: 'Język',
    exportSession: '↓ Eksportuj dane sesji (JSON)',
    resetSession: '✕ Reset lokalnej sesji',
    logout: '⎋ Wyloguj się',
  },
  interaction: {
    profileDiscovered: 'Profil odkryty',
    questionOf: (n: number, total: number) => `Pytanie ${n} / ${total}`,
    confirmAnswer: 'Potwierdź odpowiedź',
    rarityLabel: { standard: 'standard', rare: 'rzadkie', epic: 'epik', legendary: 'legendarne' },
    typeLabel: { question: 'pytanie', secret: 'sekret', dare: 'wyzwanie', game: 'gra', riddle: 'zagadka' },
  },
  reward: {
    heading: 'Twoja odpowiedź',
    showNext: 'Pokaż następne',
    blockLabel: {
      community_reveal: 'społeczność',
      community: 'społeczność',
      profile_movement: 'twój profil',
      profile: 'twój profil',
      next_hook: 'co dalej',
      hook: 'co dalej',
      unlock: 'odblokowano',
      rarity: 'rzadkość',
    },
    rarityText: {
      standard: 'Typowa odpowiedź. Każda jest ważna.',
      rare: 'To rzadka odpowiedź — widuje się ją u mniejszości.',
      epic: 'Rzadki wybór. Wchodzisz w obszar nielicznych.',
      legendary: 'Niezwykle rzadka odpowiedź. Odcisnęła ślad na Twoim profilu.',
    },
    profileMovement: (axes: string) => `Twój profil przesuwa się w stronę: ${axes}.`,
    hiddenFooter: 'Dodano nową informację do ukrytego profilu.',
  },
  testSummary: {
    ariaLabel: 'Podsumowanie testu',
    badge: (n: number) => `Test ${n} ukończony`,
    title: 'Zebrano nowy fragment profilu.',
    answersInTest: 'Odpowiedzi w tym teście',
    totalAnswers: 'Łącznie odpowiedzi profilu',
    profileDiscovered: 'Profil odkryty',
    strongestSignal: 'Najsilniejszy ślad testu',
    untilFirstReading: 'Do pierwszego odczytu',
    moreAnswers: (n: number) => `jeszcze ${n} odpowiedzi`,
    afterTest: [
      'Następny test odblokuje drugi fragment profilu.',
      'Jeszcze jeden darmowy test do pierwszego odczytu profilu.',
      'Pierwszy odczyt profilu jest gotowy.',
    ],
    lockedNote: 'Pełny odczyt profilu, Hidden Profile i Human Twin są zablokowane w tej wersji testowej.',
    unlockButton: 'Odblokuj pełny profil',
    backToMenu: 'Wróć do menu',
  },
  truthOrDare: {
    ariaLabel: 'Prawda czy wyzwanie',
    badge: 'Wkrótce',
    title: 'Prawda czy wyzwanie',
    description: 'Tryb towarzyski z weryfikacją online, zdjęciami i trybem dla wielu graczy jest w przygotowaniu.\n\nNa razie dostępny jest tylko tryb odczytu profilu.',
    onlineMode: 'Tryb online',
    photoVerification: 'Weryfikacja zdjęciami',
    back: '← Wróć',
  },
  myProfile: {
    badgeReady: 'Gotowy',
    badgeProgress: (a: number) => `${a} / 51`,
    title: 'Mój profil',
    answersLeft: (n: number) => `Brakuje jeszcze ${n} odpowiedzi do pierwszego odczytu profilu. Wykonaj kolejny test, żeby zebrać więcej danych.`,
    readyText: 'Twój pierwszy odczyt profilu jest gotowy.',
    premiumLocked: 'Pełny archetyp, Hidden Profile i Human Twin są dostępne w wersji premium.',
    back: '← Wróć',
  },
  premium: {
    badge: 'Wkrótce',
    title: 'Pełny profil w przygotowaniu',
    note: 'Premium nie jest jeszcze aktywne. Ten ekran służy do testowania zainteresowania.',
    thanks: 'Dziękujemy za udział w teście MVP. Twoja sesja i odpowiedzi zostały zapisane lokalnie.',
    back: '← Wróć',
  },
  configError: {
    badge: 'Konfiguracja wymagana',
    title: 'Brakuje zmiennych środowiskowych Supabase',
    instruction: 'Stwórz plik .env.local w katalogu projektu i dodaj:',
    afterNote: 'Klucze znajdziesz w panelu Supabase → Project Settings → API. Po dodaniu zmiennych uruchom ponownie',
    devCmd: 'npm run dev',
  },
  loading: 'Ładowanie…',
  loadError: 'Nie udało się załadować treści. Odśwież stronę.',
};

// ─── Exports ──────────────────────────────────────────────────────────────────

export const translations: Record<Lang, T> = { en, pl };
export type Translations = T;
