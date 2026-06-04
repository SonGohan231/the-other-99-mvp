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
    communityTitle: 'How others answered',
    communityShifted: 'Your answer shifted the pattern.',
    communityMajority: 'You landed in the majority.',
    communityMinority: 'You are with the minority.',
    communitySplit: 'This split is unusually close.',
    continueToResult: 'Continue',
  },
  dimensions: {
    control: 'Control',
    security: 'Security',
    risk: 'Risk',
    emotion: 'Emotion',
    change: 'Change',
    independence: 'Independence',
    connection: 'Connection',
    curiosity: 'Curiosity',
  } as Record<string, string>,
  signalMap: {
    title: 'Signal Map',
    empty: 'Answer questions to build your profile.',
  },
  humanTwin: {
    label: 'Human Twin Match',
    subtext: 'Pattern similarity across all users.',
  },
  firstSignal: {
    badge: 'FIRST SIGNAL DETECTED',
    topLabel: 'Dominant dimensions:',
    confidenceLabel: 'Confidence',
    incomplete: 'This reading is incomplete.',
    moreAnswers: (n: number): string => `${n} more answers required for full profile.`,
  },
  cardNames: {
    question: 'Hidden Question',
    secret: 'Dark Mirror',
    dare: 'Pattern Break',
    game: 'Social Mirror',
    riddle: 'Signal Trace',
  } as Record<string, string>,
  cardSelectedLabel: (name: string): string => `${name} selected`,
  feed: {
    title: 'Recent Discoveries',
    empty: 'No discoveries yet.',
    dimensionUp: (dim: string): string => `${dim} increased`,
    rareSignal: 'Rare signal detected',
    cardPick: (name: string): string => `${name} chosen`,
    firstSignal: 'First signal unlocked',
  },
  milestones: {
    title: 'Profile Milestones',
    items: [
      { answers: 17, label: 'First Signal', description: 'Initial pattern detected.' },
      { answers: 34, label: 'Pattern Forming', description: 'Behavioral profile emerging.' },
      { answers: 51, label: 'Profile Reading', description: 'Full profile available.' },
      { answers: 68, label: 'Hidden Profile', description: 'Hidden dimensions revealed.' },
      { answers: 85, label: 'Human Twin', description: 'Maximum twin match unlocked.' },
    ] as { answers: number; label: string; description: string }[],
  },
  fragments: {
    title: 'Profile Fragments',
    discovered: (n: number): string => `${n} fragment${n === 1 ? '' : 's'} discovered`,
    empty: 'No fragments yet.',
    lockedHint: 'More fragments unlock as your profile becomes clearer.',
    rarityLabel: { standard: 'signal', rare: 'rare signal', epic: 'rare pattern', legendary: 'rare event' } as Record<string, string>,
  },
  twinFeed: {
    title: 'Human Twin',
    stages: {
      no_match: 'No match yet',
      weak_candidate: 'Weak candidate',
      potential_overlap: 'Potential overlap',
      possible_twin: 'Possible twin',
      strong_match: 'Strong match pattern',
      twin_candidate: 'Human Twin candidate',
    } as Record<string, string>,
    events: {
      similarity_increased: 'Similarity increased.',
      candidate_detected: 'Potential overlap detected.',
      overlap_found: 'New overlap detected.',
      confidence_improved: 'Twin confidence improved.',
      rare_match: 'A rare behavioral overlap appeared.',
    } as Record<string, string>,
    microcopy: {
      no_match: 'We are still looking.',
      weak_candidate: 'Potential match detected.',
      potential_overlap: 'Pattern similarity increasing.',
      possible_twin: 'Twin confidence improving.',
      strong_match: 'The system is narrowing the search.',
      twin_candidate: 'Strong match signal detected.',
    } as Record<string, string>,
  },
  timeline: {
    title: 'Discovery Timeline',
    answer: (n: number): string => `Answer #${n}`,
    events: {
      rare_signal: 'Rare signal discovered',
      fragment_unlocked: 'Fragment unlocked',
      first_signal: 'First Signal generated',
      twin_stage_changed: 'Human Twin confidence increased',
      profile_shift: 'Profile shifted',
    } as Record<string, string>,
    empty: 'Your timeline is empty.',
  },
  hiddenProfile: {
    title: 'Hidden Profile',
    badge: 'LOCKED',
    confidence: 'Confidence',
    primaryDriver: 'Primary Driver',
    secondaryDriver: 'Secondary Driver',
    decisionStyle: 'Decision Style',
    socialPattern: 'Social Pattern',
    rarestSignal: 'Rarest Signal',
    lockedLabel: 'Locked',
    lockedSectionHint: 'Unlocks with more answers.',
    answersLeft: (n: number): string => `${n} answer${n === 1 ? '' : 's'} left until Hidden Profile preview.`,
    readyBadge: 'Hidden Profile preview ready.',
    previewTitle: 'YOUR HIDDEN PROFILE',
    onlyPercent: (pct: number): string => `Only ${pct.toFixed(1)}% of users generated this signal.`,
  },
  reward: {
    heading: 'Your answer',
    showNext: 'Show next',
    profileSection: 'Your Profile',
    profileShifts: 'Slightly shifts into:',
    unlockedSection: 'Unlocked',
    testProgress: 'Test progress',
    profileReading: 'Profile reading',
    answersLeftInTest: (n: number) => `${n} answer${n === 1 ? '' : 's'} left in this reading`,
    cardPickerTitle: 'What will you reveal next?',
    chooseOne: 'Choose one',
    continueButton: 'Continue',
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
    rarityPercent: (pct: number): string =>
      pct < 20
        ? `Only ${pct.toFixed(1)}% generated this signal.`
        : pct < 40
        ? `This answer appears in ${pct.toFixed(0)}% of profiles.`
        : `Less common than ${(100 - pct).toFixed(0)}% of answers.`,
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
    communityTitle: 'Jak inni odpowiedzieli',
    communityShifted: 'Twoja odpowiedź przesunęła wzorzec.',
    communityMajority: 'Jesteś w większości.',
    communityMinority: 'Jesteś w mniejszości.',
    communitySplit: 'Ten podział jest wyjątkowo bliski.',
    continueToResult: 'Dalej',
  },
  dimensions: {
    control: 'Kontrola',
    security: 'Bezpieczeństwo',
    risk: 'Ryzyko',
    emotion: 'Emocje',
    change: 'Zmiana',
    independence: 'Niezależność',
    connection: 'Połączenie',
    curiosity: 'Ciekawość',
  },
  signalMap: {
    title: 'Mapa sygnałów',
    empty: 'Odpowiadaj na pytania, żeby zbudować profil.',
  },
  humanTwin: {
    label: 'Dopasowanie bliźniaka',
    subtext: 'Podobieństwo wzorca względem wszystkich użytkowników.',
  },
  firstSignal: {
    badge: 'WYKRYTO PIERWSZY SYGNAŁ',
    topLabel: 'Dominujące wymiary:',
    confidenceLabel: 'Pewność',
    incomplete: 'Ten odczyt jest niekompletny.',
    moreAnswers: (n: number): string => `Wymagane jest jeszcze ${n} odpowiedzi do pełnego profilu.`,
  },
  cardNames: {
    question: 'Ukryte pytanie',
    secret: 'Ciemne lustro',
    dare: 'Przełom wzorca',
    game: 'Zwierciadło społeczne',
    riddle: 'Ślad sygnału',
  },
  cardSelectedLabel: (name: string): string => `Wybrano: ${name}`,
  feed: {
    title: 'Ostatnie odkrycia',
    empty: 'Brak odkryć.',
    dimensionUp: (dim: string): string => `${dim} wzrósł`,
    rareSignal: 'Wykryto rzadki sygnał',
    cardPick: (name: string): string => `Wybrano: ${name}`,
    firstSignal: 'Odblokowano pierwszy sygnał',
  },
  milestones: {
    title: 'Kamienie milowe profilu',
    items: [
      { answers: 17, label: 'Pierwszy sygnał', description: 'Wykryto wstępny wzorzec.' },
      { answers: 34, label: 'Wzorzec się tworzy', description: 'Wyłania się profil behawioralny.' },
      { answers: 51, label: 'Odczyt profilu', description: 'Pełny profil dostępny.' },
      { answers: 68, label: 'Ukryty profil', description: 'Ujawniono ukryte wymiary.' },
      { answers: 85, label: 'Bliźniak człowieka', description: 'Odblokowano maksymalne dopasowanie.' },
    ],
  },
  fragments: {
    title: 'Fragmenty profilu',
    discovered: (n: number): string => `Odkryto ${n} ${n === 1 ? 'fragment' : 'fragmentów'}`,
    empty: 'Brak fragmentów.',
    lockedHint: 'Więcej fragmentów odblokuje się wraz z rozwojem profilu.',
    rarityLabel: { standard: 'sygnał', rare: 'rzadki sygnał', epic: 'rzadki wzorzec', legendary: 'rzadkie zdarzenie' } as Record<string, string>,
  },
  twinFeed: {
    title: 'Bliźniak człowieka',
    stages: {
      no_match: 'Brak dopasowania',
      weak_candidate: 'Słaby kandydat',
      potential_overlap: 'Potencjalne pokrycie',
      possible_twin: 'Możliwy bliźniak',
      strong_match: 'Silny wzorzec dopasowania',
      twin_candidate: 'Kandydat na bliźniaka',
    } as Record<string, string>,
    events: {
      similarity_increased: 'Podobieństwo wzrosło.',
      candidate_detected: 'Wykryto potencjalne pokrycie.',
      overlap_found: 'Wykryto nowe pokrycie.',
      confidence_improved: 'Pewność bliźniaka wzrosła.',
      rare_match: 'Pojawiło się rzadkie pokrycie behawioralne.',
    } as Record<string, string>,
    microcopy: {
      no_match: 'Nadal szukamy.',
      weak_candidate: 'Wykryto potencjalne dopasowanie.',
      potential_overlap: 'Podobieństwo wzorców rośnie.',
      possible_twin: 'Pewność bliźniaka poprawia się.',
      strong_match: 'System zawęża poszukiwania.',
      twin_candidate: 'Wykryto silny sygnał dopasowania.',
    } as Record<string, string>,
  },
  timeline: {
    title: 'Oś czasu odkryć',
    answer: (n: number): string => `Odpowiedź #${n}`,
    events: {
      rare_signal: 'Odkryto rzadki sygnał',
      fragment_unlocked: 'Odblokowano fragment',
      first_signal: 'Wygenerowano pierwszy sygnał',
      twin_stage_changed: 'Pewność bliźniaka wzrosła',
      profile_shift: 'Profil się przesunął',
    } as Record<string, string>,
    empty: 'Twoja oś czasu jest pusta.',
  },
  hiddenProfile: {
    title: 'Ukryty profil',
    badge: 'ZABLOKOWANE',
    confidence: 'Pewność',
    primaryDriver: 'Główny czynnik',
    secondaryDriver: 'Drugi czynnik',
    decisionStyle: 'Styl decyzji',
    socialPattern: 'Wzorzec społeczny',
    rarestSignal: 'Najrzadszy sygnał',
    lockedLabel: 'Zablokowane',
    lockedSectionHint: 'Odblokowuje się z kolejnymi odpowiedziami.',
    answersLeft: (n: number): string => `Jeszcze ${n} ${n === 1 ? 'odpowiedź' : 'odpowiedzi'} do podglądu ukrytego profilu.`,
    readyBadge: 'Podgląd ukrytego profilu gotowy.',
    previewTitle: 'TWÓJ UKRYTY PROFIL',
    onlyPercent: (pct: number): string => `Tylko ${pct.toFixed(1)}% użytkowników wygenerowało ten sygnał.`,
  },
  reward: {
    heading: 'Twoja odpowiedź',
    showNext: 'Pokaż następne',
    profileSection: 'Twój profil',
    profileShifts: 'Lekko przesuwa się w stronę:',
    unlockedSection: 'Odblokowano',
    testProgress: 'Postęp testu',
    profileReading: 'Odczyt profilu',
    answersLeftInTest: (n: number) => `jeszcze ${n} odpowiedzi w tym teście`,
    cardPickerTitle: 'Co odkryjesz następne?',
    chooseOne: 'Wybierz jedną',
    continueButton: 'Dalej',
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
    rarityPercent: (n: number): string =>
      n < 20
        ? `Tylko ${n.toFixed(1)}% wygenerowało ten sygnał.`
        : n < 40
        ? `Ta odpowiedź pojawia się w ${n.toFixed(0)}% profili.`
        : `Rzadziej niż ${(100 - n).toFixed(0)}% odpowiedzi.`,
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
