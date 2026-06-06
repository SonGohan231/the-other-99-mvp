export interface MilestoneContent {
  answers: number;
  label_en: string;
  label_pl: string;
  description_en: string;
  description_pl: string;
  signal_en: string;
  signal_pl: string;
}

export const MILESTONE_CONTENT: MilestoneContent[] = [
  {
    answers: 51,
    label_en: 'First Profile Fragment',
    label_pl: 'Pierwszy Fragment Profilu',
    description_en: 'The system has enough to show one clear pattern.',
    description_pl: 'System ma wystarczająco danych, aby pokazać jeden wyraźny wzorzec.',
    signal_en: 'Your profile is not complete. It just started reacting.',
    signal_pl: 'Twój profil nie jest gotowy. Dopiero zaczął reagować.',
  },
  {
    answers: 85,
    label_en: 'Pattern Stabilizing',
    label_pl: 'Wzorzec Się Ustabilizowuje',
    description_en: 'Early patterns are holding. The system is watching for contradictions.',
    description_pl: 'Wczesne wzorce się utrzymują. System szuka sprzeczności.',
    signal_en: 'Answer more questions to see whether this pattern becomes stronger, breaks, or transforms.',
    signal_pl: 'Odpowiadaj dalej, żeby sprawdzić, czy ten wzór się wzmocni, pęknie albo zmieni.',
  },
  {
    answers: 100,
    label_en: 'Archetype Direction',
    label_pl: 'Kierunek Archetypu',
    description_en: 'The closest emerging archetype is now visible.',
    description_pl: 'Najbliższy wyłaniający się archetyp jest teraz widoczny.',
    signal_en: 'This is not your final archetype. It is the first shape your answers are beginning to form.',
    signal_pl: 'To nie jest Twój ostateczny archetyp. To pierwszy kształt, który zaczynają tworzyć Twoje odpowiedzi.',
  },
  {
    answers: 150,
    label_en: 'Archetype Blend',
    label_pl: 'Miks Archetypów',
    description_en: 'Your primary and secondary archetypes are now forming a blend.',
    description_pl: 'Twoje pierwotne i wtórne archetypy tworzą teraz miks.',
    signal_en: 'Two archetypes are pulling at your pattern. One is dominant. One is not finished.',
    signal_pl: 'Dwa archetypy ciągną twój wzorzec. Jeden dominuje. Drugi nie jest skończony.',
  },
  {
    answers: 250,
    label_en: 'Deep Tension',
    label_pl: 'Głębokie Napięcie',
    description_en: 'The system has found competing patterns inside your answers.',
    description_pl: 'System znalazł konkurujące wzorce w twoich odpowiedziach.',
    signal_en: 'The contradiction in your pattern is becoming readable. This is rare.',
    signal_pl: 'Sprzeczność w twoim wzorze staje się czytelna. To rzadkie.',
  },
  {
    answers: 500,
    label_en: 'Rare Pattern',
    label_pl: 'Rzadki Wzorzec',
    description_en: 'Your answer volume has produced a statistically unusual profile.',
    description_pl: 'Twoja liczba odpowiedzi wygenerowała statystycznie nietypowy profil.',
    signal_en: 'Estimated fewer than 3% of users reach this answer depth.',
    signal_pl: 'Szacuje się, że mniej niż 3% użytkowników osiąga tę głębokość odpowiedzi.',
  },
];

export function getMilestoneContent(answers: number): MilestoneContent | null {
  return [...MILESTONE_CONTENT].reverse().find((m) => answers >= m.answers) ?? null;
}

export function getNextMilestoneContent(answers: number): MilestoneContent | null {
  return MILESTONE_CONTENT.find((m) => m.answers > answers) ?? null;
}
