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
    // Profile progress header
    profileHiddenLabel: 'Your hidden profile is still unknown.',
    profileSeenSubtext: (pct: number) => `The system has only seen ${pct.toFixed(0)}% of you.`,
    profileDiscovered: 'Profile discovered',
    // Card 1 — Profile Reading
    profileReading: 'Profile Reading',
    profileReadingSubtitle: '17 questions. One hidden signal.',
    profileReadingSupporting: 'Every answer moves the system closer to your first profile pattern.',
    freeTests: 'Free readings left',
    remaining: 'remaining',
    profileAnswers: 'Signals collected',
    status: 'Status',
    statusLabel: (n: number): string =>
      n >= 51 ? 'Reading ready' : n >= 34 ? 'Pattern forming' : n >= 17 ? 'First signal detected' : 'Not enough data',
    profileNotReady: 'Not enough data',
    profileReady: 'Reading ready',
    startTestLabel: (n: number): string =>
      n === 0 ? 'Start first reading' : n === 1 ? 'Continue profile reading' : 'Unlock final free signal',
    startTest: 'Start reading',
    noFreeTests: 'No free readings remaining',
    noFreeTestsNote: 'You have completed 3 free readings. Unlock premium to continue.',
    // Card 2
    truthOrDare: 'Truth or Dare',
    truthOrDareSubtitle: 'Social mode. Coming later.',
    truthOrDareSubtext: 'Built for online challenges, private truths and proof-based dares.',
    comingSoon: 'Coming soon',
    // Card 3
    myProfile: 'My profile',
    answersLeft: (n: number) => `Only ${n} answer${n === 1 ? '' : 's'} left before your first profile reading.`,
    answersLeftSubtext: 'The system is looking for patterns in your choices, timing and contradictions.',
    profileReadyForRead: 'Your first profile reading is ready.',
    profileReadyLocked: 'Full archetype, Hidden Profile and Human Twin are locked in this MVP.',
    gatherMore: 'Gather more answers',
    readProfile: 'Read profile',
    // Card 4
    settings: 'Settings',
    language: 'Language',
    exportSession: '↓ Export session data (JSON)',
    resetSession: '✕ Reset local session',
    logout: '⎋ Log out',
  },
  testIntro: {
    tests: [
      {
        title: 'First Signal',
        copy: 'Answer 17 questions. The system will not tell you who you are yet — only what it started to notice.',
        button: 'Begin',
      },
      {
        title: 'Pattern Forming',
        copy: 'Your second reading looks for repetition, hesitation and emotional direction.',
        button: 'Continue',
      },
      {
        title: 'Reading Threshold',
        copy: 'After this test, your first profile reading becomes available.',
        button: 'Start final free test',
      },
    ] as { title: string; copy: string; button: string }[],
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
      community_reveal: 'How others answered',
      community: 'How others answered',
      profile_movement: 'Your profile',
      profile: 'Your profile',
      next_hook: 'Next signal',
      hook: 'Next signal',
      unlock: 'Unlocked',
      rarity: 'Rarity',
    } as Record<string, string>,
    rarityText: {
      standard: 'Common signal. Every answer matters.',
      rare: 'Uncommon signal — seen in a minority.',
      epic: 'Rare signal. You are entering the realm of the few.',
      legendary: 'High-impact signal. This answer left a mark on your profile.',
    } as Record<string, string>,
    communityReveal: (n: number) =>
      n >= 50 ? `${n}% of users answered similarly.` : `Only ${n}% chose the same answer.`,
    profileMovement: (axes: string) => `Your profile shifted toward: ${axes}.`,
    hiddenFooter: 'New hidden-profile data added.',
  },
  testSummary: {
    ariaLabel: 'Test summary',
    badge: (n: number) => `Test ${n} complete`,
    title: 'New profile fragment collected.',
    answersInTest: 'Answers captured',
    answersCapture: (n: number) => `${n}/17`,
    totalAnswers: 'Total profile signals',
    profileDiscovered: 'Profile discovered',
    strongestSignal: 'Strongest signal',
    untilFirstReading: 'Until first reading',
    moreAnswers: (n: number) => `${n} answer${n === 1 ? '' : 's'} left`,
    afterTest: [
      'The system has seen enough to detect a first signal, but not enough to read the pattern.',
      'Your answers are starting to form a recognizable profile shape.',
      'Your first profile reading is ready.',
    ] as string[],
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
    answersLeft: (n: number) => `Only ${n} answer${n === 1 ? '' : 's'} left before your first profile reading. Complete another test to gather more data.`,
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
    profileHiddenLabel: 'Twój ukryty profil nadal jest nieznany.',
    profileSeenSubtext: (pct: number) => `System widział dotąd ${pct.toFixed(0)}% Ciebie.`,
    profileDiscovered: 'Profil odkryty',
    profileReading: 'Odczyt profilu',
    profileReadingSubtitle: '17 pytań. Jeden ukryty sygnał.',
    profileReadingSupporting: 'Każda odpowiedź przybliża system do pierwszego wzorca Twojego profilu.',
    freeTests: 'Pozostałe darmowe odczyty',
    remaining: 'pozostało',
    profileAnswers: 'Zebrane sygnały',
    status: 'Status',
    statusLabel: (n: number) =>
      n >= 51 ? 'Odczyt gotowy' : n >= 34 ? 'Wzorzec się tworzy' : n >= 17 ? 'Wykryto pierwszy sygnał' : 'Niewystarczające dane',
    profileNotReady: 'Profil niegotowy',
    profileReady: 'Profil gotowy do odczytu',
    startTestLabel: (n: number) =>
      n === 0 ? 'Zacznij pierwszy odczyt' : n === 1 ? 'Kontynuuj odczyt profilu' : 'Odblokuj ostatni darmowy sygnał',
    startTest: 'Rozpocznij odczyt',
    noFreeTests: 'Brak darmowych odczytów',
    noFreeTestsNote: 'Ukończono 3 darmowe odczyty. Odblokuj premium, żeby kontynuować.',
    truthOrDare: 'Prawda czy wyzwanie',
    truthOrDareSubtitle: 'Tryb towarzyski. Wkrótce.',
    truthOrDareSubtext: 'Stworzone do wyzwań online, prywatnych prawd i zadań opartych na dowodach.',
    comingSoon: 'Wkrótce',
    myProfile: 'Mój profil',
    answersLeft: (n: number) => `Brakuje jeszcze ${n} odpowiedzi do pierwszego odczytu profilu.`,
    answersLeftSubtext: 'System szuka wzorców w Twoich wyborach, tempie i sprzecznościach.',
    profileReadyForRead: 'Twój pierwszy odczyt profilu jest gotowy.',
    profileReadyLocked: 'Pełny archetyp, Hidden Profile i Human Twin są zablokowane w tym MVP.',
    gatherMore: 'Zbierz więcej odpowiedzi',
    readProfile: 'Odczytaj profil',
    settings: 'Ustawienia',
    language: 'Język',
    exportSession: '↓ Eksportuj dane sesji (JSON)',
    resetSession: '✕ Reset lokalnej sesji',
    logout: '⎋ Wyloguj się',
  },
  testIntro: {
    tests: [
      {
        title: 'Pierwszy sygnał',
        copy: 'Odpowiedz na 17 pytań. System jeszcze nie powie Ci, kim jesteś — tylko co zaczął dostrzegać.',
        button: 'Zacznij',
      },
      {
        title: 'Wzorzec się tworzy',
        copy: 'Twój drugi odczyt szuka powtórzeń, wahań i kierunku emocjonalnego.',
        button: 'Kontynuuj',
      },
      {
        title: 'Próg odczytu',
        copy: 'Po tym teście Twój pierwszy odczyt profilu stanie się dostępny.',
        button: 'Zacznij ostatni darmowy test',
      },
    ],
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
      community_reveal: 'Jak inni odpowiedzieli',
      community: 'Jak inni odpowiedzieli',
      profile_movement: 'Twój profil',
      profile: 'Twój profil',
      next_hook: 'Kolejny sygnał',
      hook: 'Kolejny sygnał',
      unlock: 'Odblokowano',
      rarity: 'Rzadkość',
    },
    rarityText: {
      standard: 'Typowy sygnał. Każda odpowiedź ma znaczenie.',
      rare: 'Nieczęsty sygnał — widuje się go u mniejszości.',
      epic: 'Rzadki sygnał. Wchodzisz w obszar nielicznych.',
      legendary: 'Sygnał o dużym wpływie. Ta odpowiedź odcisnęła ślad na Twoim profilu.',
    },
    communityReveal: (n: number) =>
      n >= 50 ? `${n}% użytkowników odpowiedziało podobnie.` : `Tylko ${n}% wybrało tę samą odpowiedź.`,
    profileMovement: (axes: string) => `Twój profil przesunął się w stronę: ${axes}.`,
    hiddenFooter: 'Dodano nową informację do ukrytego profilu.',
  },
  testSummary: {
    ariaLabel: 'Podsumowanie testu',
    badge: (n: number) => `Test ${n} ukończony`,
    title: 'Zebrano nowy fragment profilu.',
    answersInTest: 'Zebrane odpowiedzi',
    answersCapture: (n: number) => `${n}/17`,
    totalAnswers: 'Łącznie sygnałów profilu',
    profileDiscovered: 'Profil odkryty',
    strongestSignal: 'Najsilniejszy sygnał',
    untilFirstReading: 'Do pierwszego odczytu',
    moreAnswers: (n: number) => `jeszcze ${n} odpowiedzi`,
    afterTest: [
      'System widział wystarczająco, by wykryć pierwszy sygnał, ale za mało, by odczytać wzorzec.',
      'Twoje odpowiedzi zaczynają tworzyć rozpoznawalny kształt profilu.',
      'Twój pierwszy odczyt profilu jest gotowy.',
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
