import { ProfileVector, DimensionKey, getTopDimensions } from '../utils/profileVector';
import { BehavioralSummary } from '../utils/behavioralSignals';
import { computeArchetypeMix } from '../utils/archetypes';
import { getArchetypeBlendName } from './archetypeBlends';

export interface ProfileInsights {
  firstSignal: string;
  hiddenTension: string;
  behavioralContradiction: string;
  socialSignal: string;
  decisionSignal: string;
  archetypeDirection: string;
  archetypeDirectionNote: string;
}

// ─── First Signal ─────────────────────────────────────────────────────────────

const FIRST_SIGNAL_EN: Record<DimensionKey, string> = {
  control:       'You move toward structure before you move toward anything else. The frame has to exist before the step.',
  security:      'You move toward change, but only when you feel you can still control the damage.',
  risk:          'You enter uncertainty faster than most. The gap between "this might go wrong" and "let\'s try" is shorter in you.',
  emotion:       'Your internal responses are stronger than your external choices suggest. The distance between what you feel and what you do is a pattern in itself.',
  change:        'You orient toward transformation as a default, not a reaction. Stability is where you wait, not where you live.',
  independence:  'You operate inside your own frame. External pressure to align creates friction rather than compliance.',
  connection:    'Other people appear in your decisions more than you might admit. Belonging is not a side effect — it is a variable.',
  curiosity:     'You move toward open questions. Fixed answers feel like a door closing. You prefer to keep the door open a little longer.',
};

const FIRST_SIGNAL_PL: Record<DimensionKey, string> = {
  control:       'Zmierzasz ku strukturze, zanim zmierzasz ku czemukolwiek innemu. Rama musi istnieć, zanim zrobisz krok.',
  security:      'Idziesz w stronę zmiany, ale dopiero wtedy, gdy czujesz, że nadal kontrolujesz możliwe straty.',
  risk:          'Wchodzisz w niepewność szybciej niż większość ludzi. Odległość między "to może pójść źle" a "spróbujmy" jest w tobie krótsza.',
  emotion:       'Twoje wewnętrzne reakcje są silniejsze, niż sugerują twoje zewnętrzne wybory. Odległość między tym, co czujesz, a tym, co robisz, to wzorzec sam w sobie.',
  change:        'Zmierzasz ku transformacji jako domyślny tryb, nie jako reakcja. Stabilność to miejsce, gdzie czekasz — nie gdzie żyjesz.',
  independence:  'Działasz we własnej ramie. Zewnętrzna presja, żeby się dostosować, tworzy tarcie, a nie posłuszeństwo.',
  connection:    'Inni ludzie pojawiają się w twoich decyzjach częściej, niż może ci się wydawać. Przynależność to nie efekt uboczny — to zmienna.',
  curiosity:     'Zmierzasz ku otwartym pytaniom. Gotowe odpowiedzi czują się jak zamykające się drzwi. Wolisz trzymać je otwarte trochę dłużej.',
};

// ─── Hidden Tension ───────────────────────────────────────────────────────────

type TensionPair = [DimensionKey, DimensionKey];

const TENSION_PAIRS_EN: Array<{ pair: TensionPair; text: string }> = [
  {
    pair: ['independence', 'connection'],
    text: 'You want freedom, but your answers show sensitivity to what others think. These two things are in permanent negotiation.',
  },
  {
    pair: ['control', 'curiosity'],
    text: 'You value exploration, but within self-imposed limits. The map you draw is always slightly smaller than the territory you want.',
  },
  {
    pair: ['security', 'risk'],
    text: 'You want certainty. You also find safety boring. This tension is not a flaw — it is complexity.',
  },
  {
    pair: ['emotion', 'control'],
    text: 'You feel more than your choices reveal. The gap between internal intensity and external calm is one of your defining patterns.',
  },
  {
    pair: ['change', 'security'],
    text: 'You want freedom. Your answers suggest you do not fully trust chaos. The call toward transformation and the pull toward safety are both present.',
  },
  {
    pair: ['curiosity', 'security'],
    text: 'You are drawn toward new information, but you need it to land somewhere stable. Exploration with limits.',
  },
  {
    pair: ['independence', 'emotion'],
    text: 'You decide alone, but you feel the relational weight of those decisions. Autonomy and sensitivity are both high.',
  },
  {
    pair: ['risk', 'connection'],
    text: 'You are willing to move toward uncertainty, but you want someone to know you did. The risk-taker and the need to be seen coexist.',
  },
];

const TENSION_PAIRS_PL: Array<{ pair: TensionPair; text: string }> = [
  {
    pair: ['independence', 'connection'],
    text: 'Chcesz wolności, ale twoje odpowiedzi pokazują wrażliwość na to, co myślą inni. Te dwie rzeczy są w stałych negocjacjach.',
  },
  {
    pair: ['control', 'curiosity'],
    text: 'Cenisz eksplorację, ale w ramach własnych limitów. Mapa, którą rysujesz, jest zawsze nieco mniejsza niż terytorium, które chcesz.',
  },
  {
    pair: ['security', 'risk'],
    text: 'Chcesz pewności. Jednocześnie bezpieczeństwo cię nudzi. To napięcie to nie wada — to złożoność.',
  },
  {
    pair: ['emotion', 'control'],
    text: 'Czujesz więcej, niż ujawniają twoje wybory. Odległość między wewnętrzną intensywnością a zewnętrznym spokojem to jeden z twoich definiujących wzorców.',
  },
  {
    pair: ['change', 'security'],
    text: 'Chcesz wolności. Twoje odpowiedzi sugerują, że nie do końca ufasz chaosowi. Pociąg ku transformacji i ciążenie ku bezpieczeństwu są jednocześnie obecne.',
  },
  {
    pair: ['curiosity', 'security'],
    text: 'Przyciąga cię nowa informacja, ale potrzebujesz, żeby wylądowała w czymś stabilnym. Eksploracja z limitami.',
  },
  {
    pair: ['independence', 'emotion'],
    text: 'Decydujesz sam, ale czujesz relacyjny ciężar tych decyzji. Autonomia i wrażliwość są jednocześnie wysokie.',
  },
  {
    pair: ['risk', 'connection'],
    text: 'Jesteś gotów zmierzać ku niepewności, ale chcesz, żeby ktoś wiedział, że to zrobiłeś. Ryzykant i potrzeba bycia zauważonym współistnieją.',
  },
];

const TENSION_GENERIC_EN = 'Your profile holds competing pulls that have not yet resolved. The system is still reading which one dominates.';
const TENSION_GENERIC_PL = 'Twój profil zawiera konkurujące ciągnienia, które jeszcze się nie rozwiązały. System nadal odczytuje, które dominuje.';

// ─── Behavioral Contradiction ─────────────────────────────────────────────────

// [decisivenessLabel][avoidanceLabel] → text
const BEHAVIORAL_EN: Record<string, Record<string, string>> = {
  impulsive: {
    direct:     'You answer quickly and directly. The system has not found the hesitation that usually hides the more revealing choice.',
    selective:  'You answer quickly on most things. On a small number you slow down. Those slower answers are the more interesting ones.',
    avoidant:   'You often answer quickly, but slow down dramatically when control or social judgment appears. Fast everywhere except where it matters.',
  },
  decisive: {
    direct:     'You decide without much visible hesitation. The profile you are building moves in clean lines.',
    selective:  'You are decisive but not indiscriminate. There are specific topics where you take longer. The pattern of what causes that pause is readable.',
    avoidant:   'Your answers suggest independence. Your hesitation on certain questions suggests something more careful than that.',
  },
  deliberate: {
    direct:     'You take time on most answers. You do not avoid — you process. These are different things.',
    selective:  'You are deliberate in general. But you rush specific questions. The ones you rush may be more diagnostic than the ones you think about.',
    avoidant:   'You take time on almost everything. On the questions that require social or relational vulnerability, that time increases. The system noticed.',
  },
  hesitant: {
    direct:     'You are slower than average, but once you decide, you do not revisit. The deliberation is internal, not public.',
    selective:  'Your answers suggest independence. Your hesitation suggests caution. These two things are living in the same pattern.',
    avoidant:   'You hesitate broadly and show avoidance on specific topics. The profile your answers are building is more guarded than you may realize.',
  },
};

const BEHAVIORAL_PL: Record<string, Record<string, string>> = {
  impulsive: {
    direct:     'Odpowiadasz szybko i bezpośrednio. System nie znalazł wahania, które zazwyczaj ukrywa bardziej ujawniający wybór.',
    selective:  'Na większość pytań odpowiadasz szybko. Na niewielkiej liczbie zwalniasz. Te wolniejsze odpowiedzi są ciekawsze.',
    avoidant:   'Często odpowiadasz szybko, ale wyraźnie zwalniasz przy pytaniach o kontrolę albo ocenę innych. Szybko wszędzie, tylko nie tam, gdzie to ważne.',
  },
  decisive: {
    direct:     'Decydujesz bez wyraźnego wahania. Profil, który budujesz, porusza się w czystych liniach.',
    selective:  'Jesteś decyzyjny, ale nie bezkrytycznie. Na konkretnych tematach zatrzymujesz się dłużej. Wzorzec tego, co powoduje tę pauzę, jest czytelny.',
    avoidant:   'Twoje odpowiedzi sugerują niezależność. Wahanie przy pewnych pytaniach sugeruje coś ostrożniejszego.',
  },
  deliberate: {
    direct:     'Poświęcasz czas na większość odpowiedzi. Nie unikasz — przetwarzasz. To różne rzeczy.',
    selective:  'Jesteś ogólnie przemyślany. Ale na konkretne pytania odpowiadasz szybko. Te, na które spieszysz, mogą być bardziej diagnostyczne.',
    avoidant:   'Poświęcasz czas na prawie wszystko. Na pytania wymagające społecznej lub relacyjnej wrażliwości ten czas wzrasta. System to zauważył.',
  },
  hesitant: {
    direct:     'Jesteś wolniejszy niż średnia, ale raz podjąwszy decyzję, nie wracasz do niej. Rozwaga jest wewnętrzna, nie publiczna.',
    selective:  'Twoje odpowiedzi sugerują niezależność. Twoje wahanie sugeruje ostrożność. Te dwie rzeczy żyją w tym samym wzorcu.',
    avoidant:   'Wahasz się szeroko i pokazujesz unikanie przy konkretnych tematach. Profil, który budują twoje odpowiedzi, jest bardziej strzeżony, niż możesz zdawać sobie sprawę.',
  },
};

const BEHAVIORAL_FORMING_EN = 'Still forming — the system needs more answers with behavioral data to read this signal.';
const BEHAVIORAL_FORMING_PL = 'Jeszcze się kształtuje — system potrzebuje więcej odpowiedzi z danymi behawioralnymi, żeby odczytać ten sygnał.';

// ─── Social Signal ────────────────────────────────────────────────────────────

function getSocialSignal(v: ProfileVector, lang: 'en' | 'pl'): string {
  const isPl = lang === 'pl';
  const diff = v.connection - v.independence;

  if (diff > 8) {
    return isPl
      ? 'Inni pojawiają się w twoich decyzjach regularnie. Nie zawsze zdajesz sobie z tego sprawę — ale system to widzi.'
      : 'Others appear in your decisions regularly. You may not always notice it — but the system does.';
  }
  if (diff > 4) {
    return isPl
      ? 'Wygląda na to, że potrzebujesz mniej aprobaty niż większość ludzi, ale więcej zrozumienia.'
      : 'You seem to need less approval than most people, but more understanding.';
  }
  if (diff < -8) {
    return isPl
      ? 'Działasz we własnym świecie i rzadko pytasz o pozwolenie. Inni ludzie są obecni, ale nie decyzyjni.'
      : 'You operate in your own world and rarely ask permission. Other people are present but not decisive.';
  }
  if (diff < -4) {
    return isPl
      ? 'Niezależność jest silna w twoim profilu. Relacje istnieją, ale na twoich warunkach.'
      : 'Independence runs strong in your profile. Relationships exist, but on your terms.';
  }
  if (v.emotion > 8) {
    return isPl
      ? 'Twoje sygnały emocjonalne są silne. To nie czyni cię bardziej przewidywalnym — czyni cię bardziej złożonym.'
      : 'Your emotional signals are strong. This does not make you more predictable — it makes you more complex.';
  }
  return isPl
    ? 'Twój wzorzec społeczny nie jest jeszcze dominujący w żadnym kierunku. System nadal go śledzi.'
    : 'Your social pattern is not yet dominant in either direction. The system is still tracking it.';
}

// ─── Decision Signal ─────────────────────────────────────────────────────────

function getDecisionSignal(
  v: ProfileVector,
  summary: BehavioralSummary | null,
  lang: 'en' | 'pl',
): string {
  const isPl = lang === 'pl';
  const fastDecider = summary && summary.avgResponseTimeMs < 3000;
  const highHesitation = summary && summary.avgHesitationMs !== null && summary.avgHesitationMs > 3000;

  if (v.control > 10 && v.risk < 5) {
    return isPl
      ? 'Rzadko wybierasz w ciemno. Nawet spontaniczne odpowiedzi pokazują ukryte filtrowanie.'
      : 'You rarely choose blindly. Even your spontaneous answers show hidden filtering.';
  }
  if (v.risk > 10 && v.control < 5) {
    return isPl
      ? 'Twój próg akceptowalnego ryzyka jest wyższy niż u większości. Niepewność nie jest dla ciebie problemem — jest opcją.'
      : 'Your threshold for acceptable risk is higher than most. Uncertainty is not a problem for you — it is an option.';
  }
  if (fastDecider && v.security < 5) {
    return isPl
      ? 'Często decydujesz szybciej, niż sugeruje twój profil. Szybkość może być siłą albo ominięciem procesu.'
      : 'You often decide faster than your profile suggests. Speed can be a strength or a bypass.';
  }
  if (highHesitation && v.control > 5) {
    return isPl
      ? 'Twoje wahanie przy pewnych pytaniach nie jest powolnością — to filtrowanie. System czyta, co się filtruje.'
      : 'Your hesitation on certain questions is not slowness — it is filtering. The system is reading what gets filtered.';
  }
  if (v.security > 10 && v.change < 5) {
    return isPl
      ? 'Decydujesz w oparciu o to, co znasz. Nowe parametry spowalniają proces.'
      : 'You decide based on what you know. New parameters slow the process.';
  }
  return isPl
    ? 'Twój styl decyzyjny nie jest jeszcze dominujący. System śledzi wzorzec, zanim go nazwie.'
    : 'Your decision style is not yet dominant. The system is tracking the pattern before naming it.';
}

// ─── Archetype Direction ──────────────────────────────────────────────────────

function getArchetypeDirection(
  v: ProfileVector,
  totalAnswers: number,
  lang: 'en' | 'pl',
): { direction: string; note: string } {
  const isPl = lang === 'pl';
  const mix = computeArchetypeMix(v, totalAnswers);
  const primaryId = mix.primary;
  const secondaryId = mix.mix[1]?.id ?? mix.primary;
  const blendName = getArchetypeBlendName(primaryId, secondaryId, lang);

  const direction = isPl
    ? `Najbliższy wyłaniający się archetyp: ${blendName}`
    : `Closest emerging archetype: ${blendName}`;

  const note = isPl
    ? 'To nie jest Twój ostateczny archetyp. To pierwszy kształt, który zaczynają tworzyć Twoje odpowiedzi.'
    : 'This is not your final archetype. It is the first shape your answers are beginning to form.';

  return { direction, note };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function generateProfileInsights(
  vector: ProfileVector,
  summary: BehavioralSummary | null,
  lang: 'en' | 'pl',
  totalAnswers: number,
): ProfileInsights {
  const isPl = lang === 'pl';

  // First Signal
  const top = getTopDimensions(vector, 1);
  const topDim = top[0] as DimensionKey | undefined;
  const firstSignal = topDim
    ? (isPl ? FIRST_SIGNAL_PL[topDim] : FIRST_SIGNAL_EN[topDim])
    : (isPl ? 'Wzorzec jeszcze się kształtuje.' : 'Pattern still forming.');

  // Hidden Tension
  const top2 = getTopDimensions(vector, 2);
  const d1 = top2[0] as DimensionKey | undefined;
  const d2 = top2[1] as DimensionKey | undefined;
  let hiddenTension = isPl ? TENSION_GENERIC_PL : TENSION_GENERIC_EN;
  if (d1 && d2) {
    const pairsToSearch = isPl ? TENSION_PAIRS_PL : TENSION_PAIRS_EN;
    const match = pairsToSearch.find(
      ({ pair }) =>
        (pair[0] === d1 && pair[1] === d2) ||
        (pair[0] === d2 && pair[1] === d1),
    );
    if (match) hiddenTension = match.text;
  }

  // Behavioral Contradiction
  let behavioralContradiction: string;
  if (!summary) {
    behavioralContradiction = isPl ? BEHAVIORAL_FORMING_PL : BEHAVIORAL_FORMING_EN;
  } else {
    const dec = summary.decisivenessLabel;
    const av = summary.avoidanceLabel;
    const table = isPl ? BEHAVIORAL_PL : BEHAVIORAL_EN;
    behavioralContradiction = table[dec]?.[av] ?? (isPl ? BEHAVIORAL_FORMING_PL : BEHAVIORAL_FORMING_EN);
  }

  // Social Signal
  const socialSignal = getSocialSignal(vector, lang);

  // Decision Signal
  const decisionSignal = getDecisionSignal(vector, summary, lang);

  // Archetype Direction
  const { direction: archetypeDirection, note: archetypeDirectionNote } =
    getArchetypeDirection(vector, totalAnswers, lang);

  return {
    firstSignal,
    hiddenTension,
    behavioralContradiction,
    socialSignal,
    decisionSignal,
    archetypeDirection,
    archetypeDirectionNote,
  };
}

// ─── Comparison messages for RewardScreen ────────────────────────────────────

const COMPARISON_EN: Record<DimensionKey, string[]> = {
  control: [
    'This answer added to your control pattern. The system is measuring how consistent it is.',
    'You seem to impose order before moving. This answer added weight to that tendency.',
    'Your answers suggest you build frames before acting. This one confirmed it.',
    'Control appeared in this answer. It is becoming a stable signal.',
  ],
  security: [
    'You chose the more certain option. This pattern is emerging consistently.',
    'Your answers lean toward knowing before acting. This one continued that direction.',
    'Predictability is appearing as a preference. This answer added to that signal.',
    'This answer confirmed your orientation toward the known over the unknown.',
  ],
  risk: [
    'You moved toward the less certain option. The system is tracking this.',
    'Your risk threshold appears higher than average. This answer confirmed it.',
    'Most people chose safety here. You chose possibility.',
    'This answer suggests a tolerance for unknowns. One more answer may confirm the pattern.',
  ],
  curiosity: [
    'You moved toward the unknown again. This is becoming a pattern.',
    'Curiosity is dominating your signal. Your answers keep opening rather than closing.',
    'You leaned toward questions over answers. That is a consistent behavioral signal.',
    'This answer strengthened your exploration tendency.',
  ],
  change: [
    'This answer strengthened your orientation toward transformation.',
    'You keep choosing movement over stability. The system is measuring the pattern.',
    'Change is appearing as a preference, not just a tendency.',
    'Your answers suggest forward orientation. This one confirmed the direction.',
  ],
  independence: [
    'Your answers suggest independence. This one added to that signal.',
    'You seem to decide within your own frame. This answer reinforced it.',
    'Autonomy is emerging as a dominant signal. The system is tracking how it holds.',
    'This answer added to your independence pattern. It is becoming consistent.',
  ],
  connection: [
    'Relational weight is appearing in your answers. This one added to it.',
    'You seem to factor other people into your choices. This answer confirmed the pattern.',
    'Your answers suggest that belonging appears in your decisions.',
    'Connection is becoming a consistent signal. This answer confirmed the direction.',
  ],
  emotion: [
    'Emotional signal is emerging. This answer added weight to it.',
    'Your answers suggest a stronger emotional filter than most. This one confirmed it.',
    'Internal intensity is becoming a consistent signal in your pattern.',
    'This answer strengthened your emotional signal. The system is tracking its stability.',
  ],
};

const COMPARISON_PL: Record<DimensionKey, string[]> = {
  control: [
    'Ta odpowiedź dodała do twojego wzorca kontroli. System mierzy, jak jest konsekwentny.',
    'Wydajesz się narzucać porządek przed działaniem. Ta odpowiedź wzmocniła tę tendencję.',
    'Twoje odpowiedzi sugerują, że budujesz ramy przed działaniem. Ta to potwierdziła.',
    'Kontrola pojawiła się w tej odpowiedzi. Staje się stałym sygnałem.',
  ],
  security: [
    'Wybrałeś bardziej pewną opcję. Ten wzorzec konsekwentnie się pojawia.',
    'Twoje odpowiedzi skłaniają się ku wiedzeniu przed działaniem. Ta kontynuowała ten kierunek.',
    'Przewidywalność pojawia się jako preferencja. Ta odpowiedź dodała do tego sygnału.',
    'Ta odpowiedź potwierdziła twoją orientację na znane zamiast nieznanego.',
  ],
  risk: [
    'Przeszedłeś do mniej pewnej opcji. System to śledzi.',
    'Twój próg ryzyka wydaje się wyższy niż średnia. Ta odpowiedź to potwierdziła.',
    'Większość wybrała tutaj bezpieczeństwo. Ty wybrałeś możliwość.',
    'Ta odpowiedź sugeruje tolerancję na nieznane. Jeszcze jedna może potwierdzić wzorzec.',
  ],
  curiosity: [
    'Znowu poszedłeś w stronę nieznanego. To staje się wzorcem.',
    'Ciekawość dominuje w twoim sygnale. Twoje odpowiedzi wciąż otwierają zamiast zamykać.',
    'Skłoniłeś się ku pytaniom zamiast odpowiedziom. To konsekwentny sygnał behawioralny.',
    'Ta odpowiedź wzmocniła twoją tendencję do eksploracji.',
  ],
  change: [
    'Ta odpowiedź wzmocniła twoją orientację ku transformacji.',
    'Ciągle wybierasz ruch zamiast stabilności. System mierzy wzorzec.',
    'Zmiana pojawia się jako preferencja, nie tylko tendencja.',
    'Twoje odpowiedzi sugerują orientację ku przyszłości. Ta potwierdziła kierunek.',
  ],
  independence: [
    'Twoje odpowiedzi sugerują niezależność. Ta dodała do tego sygnału.',
    'Wydajesz się decydować we własnej ramie. Ta odpowiedź to wzmocniła.',
    'Autonomia wyłania się jako dominujący sygnał. System śledzi, jak się utrzymuje.',
    'Ta odpowiedź dodała do twojego wzorca niezależności. Staje się konsekwentny.',
  ],
  connection: [
    'Relacyjny ciężar pojawia się w twoich odpowiedziach. Ta dodała do niego.',
    'Wydajesz się uwzględniać innych w swoich wyborach. Ta odpowiedź potwierdziła wzorzec.',
    'Twoje odpowiedzi sugerują, że przynależność pojawia się w twoich decyzjach.',
    'Połączenie staje się konsekwentnym sygnałem. Ta odpowiedź potwierdziła kierunek.',
  ],
  emotion: [
    'Sygnał emocjonalny się wyłania. Ta odpowiedź dodała do niego ciężar.',
    'Twoje odpowiedzi sugerują silniejszy filtr emocjonalny niż większość. Ta to potwierdziła.',
    'Wewnętrzna intensywność staje się konsekwentnym sygnałem w twoim wzorcu.',
    'Ta odpowiedź wzmocniła twój sygnał emocjonalny. System śledzi jego stabilność.',
  ],
};

const COMPARISON_GENERIC_EN = [
  'This answer moved your profile. The system is still reading which direction.',
  'The pattern is shifting. One more answer may confirm the direction.',
  'Your answers are building a pattern the system cannot yet fully name.',
  'This answer is registered. The shape it adds to is still forming.',
];

const COMPARISON_GENERIC_PL = [
  'Ta odpowiedź przesunęła twój profil. System nadal odczytuje, w którym kierunku.',
  'Wzorzec się przesuwa. Jeszcze jedna odpowiedź może potwierdzić kierunek.',
  'Twoje odpowiedzi budują wzorzec, którego system jeszcze nie może w pełni nazwać.',
  'Ta odpowiedź jest zarejestrowana. Kształt, do którego dodaje, jeszcze się kształtuje.',
];

export function getComparisonMessage(
  changedAxes: string[],
  totalProfileAnswers: number,
  lang: 'en' | 'pl',
): string {
  const isPl = lang === 'pl';
  const idx = Math.abs(totalProfileAnswers) % 4;

  if (changedAxes.length > 0) {
    const axis = changedAxes[0] as DimensionKey;
    const pool = isPl ? COMPARISON_PL[axis] : COMPARISON_EN[axis];
    if (pool) return pool[idx % pool.length];
  }

  const generic = isPl ? COMPARISON_GENERIC_PL : COMPARISON_GENERIC_EN;
  return generic[idx % generic.length];
}
