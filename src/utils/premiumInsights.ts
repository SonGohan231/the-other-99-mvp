import { ProfileVector } from './profileVector';
import { BehavioralSummary } from './behavioralSignals';
import { PREMIUM_MODULES } from '../data/premiumModules';

export interface PremiumInsight {
  moduleId: string;
  hasData: boolean;
  lines: string[];
}

type Lang = 'en' | 'pl';

function top(vec: ProfileVector, dims: string[]): string {
  return dims
    .map((d) => ({ d, v: (vec as unknown as Record<string, number>)[d] ?? 0 }))
    .sort((a, b) => b.v - a.v)[0]?.d ?? dims[0];
}

function score(vec: ProfileVector, dims: string[]): number {
  return dims.reduce((sum, d) => sum + Math.abs((vec as unknown as Record<string, number>)[d] ?? 0), 0);
}

// ─── Human-readable labels ────────────────────────────────────────────────────

const DIM_EN: Record<string, string> = {
  control: 'structure and control',
  independence: 'independence',
  security: 'stability and security',
  emotion: 'emotional openness',
  risk: 'risk and disruption',
  curiosity: 'curiosity and exploration',
  change: 'change and transformation',
  connection: 'connection and closeness',
};

const DIM_PL: Record<string, string> = {
  control: 'struktura i kontrola',
  independence: 'niezależność',
  security: 'stabilność i bezpieczeństwo',
  emotion: 'otwartość emocjonalna',
  risk: 'ryzyko i zmiana',
  curiosity: 'ciekawość i eksploracja',
  change: 'zmiana i transformacja',
  connection: 'połączenie i bliskość',
};

const SHADOW_EN: Record<string, string> = {
  control: 'a suppressed pull toward dependency and relying on others',
  independence: 'a suppressed need for external validation — rarely admitted, but present',
  security: 'a suppressed impulse toward risk and disruption — held back by the safety pattern',
};

const SHADOW_PL: Record<string, string> = {
  control: 'stłumiony pociąg do zależności od innych',
  independence: 'stłumioną potrzebę zewnętrznego potwierdzenia — rzadko przyznawaną, ale obecną',
  security: 'stłumiony impuls ku ryzyku i zmianom — powstrzymywany przez wzorzec bezpieczeństwa',
};

const AVOID_EN: Record<string, string> = {
  avoidant: 'You show high avoidance on questions where this shadow becomes most visible.',
  selective: 'You engage selectively — which questions you avoid tells the system where the edge of this shadow is.',
  direct: 'You engage directly even with high-pressure content.',
};

const AVOID_PL: Record<string, string> = {
  avoidant: 'Unikasz pytań, w których ten cień staje się najbardziej widoczny.',
  selective: 'Angażujesz się selektywnie — pytania, których unikasz, mówią systemowi, gdzie leży granica tego cienia.',
  direct: 'Angażujesz się bezpośrednio nawet w treści wywierające presję.',
};

const DECISIVE_EN: Record<string, string> = {
  impulsive: 'Your first instinct dominates — deliberation rarely changes the outcome.',
  decisive: 'Your decision pattern is clean — you commit without visible internal negotiation.',
  deliberate: 'You take time before committing — the pause before choosing is part of your process.',
  hesitant: 'You delay before committing — the system reads what that filtering costs you.',
};

const DECISIVE_PL: Record<string, string> = {
  impulsive: 'Twój pierwszy instynkt dominuje — deliberacja rzadko zmienia wynik.',
  decisive: 'Twój wzorzec decyzyjny jest czysty — zobowiązujesz się bez widocznych wewnętrznych negocjacji.',
  deliberate: 'Dajesz sobie czas przed podjęciem decyzji — pauza przed wyborem jest częścią Twojego procesu.',
  hesitant: 'Opóźniasz decyzje — system odczytuje, czym płacisz za to filtrowanie.',
};

const STABLE_EN: Record<string, string> = {
  volatile: 'Your pattern is in flux — your profile is still being negotiated internally.',
  uncertain: 'Partial stabilization detected — the pattern is settling but not yet fixed.',
  stable: 'Your pattern has solidified — your signals are consistent across sessions.',
};

const STABLE_PL: Record<string, string> = {
  volatile: 'Twój wzorzec jest w ruchu — profil jest nadal wewnętrznie negocjowany.',
  uncertain: 'Wykryto częściową stabilizację — wzorzec się układa, ale jeszcze nie jest ustalony.',
  stable: 'Twój wzorzec się ustabilizował — sygnały są spójne pomiędzy sesjami.',
};

// ─── Module generators (5 lines each, bilingual) ─────────────────────────────

function shadowProfileInsight(vec: ProfileVector, b: BehavioralSummary | null | undefined, lang: Lang): string[] {
  const isPl = lang === 'pl';
  const dominant = top(vec, ['control', 'independence', 'security']);
  const domLabel = isPl ? (DIM_PL[dominant] ?? dominant) : (DIM_EN[dominant] ?? dominant);
  const shadowDesc = isPl ? (SHADOW_PL[dominant] ?? 'stłumiony wzorzec') : (SHADOW_EN[dominant] ?? 'a suppressed pattern');

  const line1 = isPl
    ? `Twój dominujący wzorzec opiera się na: ${domLabel}.`
    : `Your clearest pattern is built around ${domLabel}.`;

  const line2 = isPl
    ? `Pod spodem system wykrywa ${shadowDesc}.`
    : `Beneath it, the system detects ${shadowDesc}.`;

  let line3: string;
  if (b) {
    const avoidLabel = b.avoidanceLabel ?? 'direct';
    line3 = isPl ? AVOID_PL[avoidLabel] : AVOID_EN[avoidLabel];
    if (b.totalUndos > 1) {
      line3 += isPl
        ? ` Cofnąłeś ${b.totalUndos} odpowiedzi — każde cofnięcie to moment, w którym napięcie wypłynęło na powierzchnię.`
        : ` You reversed ${b.totalUndos} answers — each marks a moment where the tension surfaced.`;
    }
  } else {
    line3 = isPl
      ? 'To napięcie między wyrażonym a stłumionym wzorcem kształtuje Twoje decyzje w sposób, którego nie widać wprost.'
      : 'This tension between your expressed and suppressed patterns shapes choices in ways that are not directly visible.';
  }

  const line4 = isPl
    ? 'W relacjach: inni doświadczają Twojego wyrażonego wzorca — rzadko tego, który jest pod spodem.'
    : 'In relationships: others experience your expressed pattern, rarely the one underneath.';

  const line5 = isPl
    ? 'Więcej odpowiedzi pokaże, czy cień rośnie, maleje, czy przybiera nową formę.'
    : 'More answers will show whether the shadow is growing, shrinking, or taking a new shape.';

  return [line1, line2, line3, line4, line5];
}

function maskVsCoreInsight(vec: ProfileVector, b: BehavioralSummary | null | undefined, lang: Lang): string[] {
  const isPl = lang === 'pl';
  const presented = top(vec, ['connection', 'security']);
  const hidden = top(vec, ['independence', 'risk']);
  const presentedLabel = isPl ? (DIM_PL[presented] ?? presented) : (DIM_EN[presented] ?? presented);
  const hiddenLabel = isPl ? (DIM_PL[hidden] ?? hidden) : (DIM_EN[hidden] ?? hidden);

  const line1 = isPl
    ? `Twój profil pokazuje wyraźną przepaść między tym, co prezentujesz, a tym, co Tobą kieruje.`
    : `Your profile shows a visible gap between what you present and what drives you.`;

  const line2 = isPl
    ? `Wyrażasz: ${presentedLabel}. Ukryty sygnał wskazuje na: ${hiddenLabel}.`
    : `Expressed signal: ${presentedLabel}. Underlying drive: ${hiddenLabel}.`;

  let line3: string;
  if (b) {
    const stabilityNote = b.stabilityLabel === 'volatile'
      ? (isPl ? ' Twój wzorzec decyzyjny jest niestabilny — ta przepaść poszerza się pod presją.' : ' Your decision pattern is volatile — this gap widens under pressure.')
      : b.stabilityLabel === 'uncertain'
      ? (isPl ? ' Przepaść jest najbardziej widoczna w momentach niepewności.' : ' The gap is most visible in moments of uncertainty.')
      : '';
    line3 = isPl
      ? b.avgContradictionSignal > 50
        ? `Twoje wybory regularnie zmierzają jednocześnie w dwóch kierunkach.${stabilityNote}`
        : b.avgContradictionSignal > 25
        ? `Czasem wybierasz wartości, które wzajemnie się ograniczają.${stabilityNote}`
        : `Twoje wybory są w dużej mierze spójne z tym, co wyrażasz.${stabilityNote}`
      : b.avgContradictionSignal > 50
        ? `Your choices regularly pull in two different directions at once.${stabilityNote}`
        : b.avgContradictionSignal > 25
        ? `You sometimes choose values that compete with each other.${stabilityNote}`
        : `Your choices are largely consistent with what you present.${stabilityNote}`;
  } else {
    line3 = isPl
      ? 'Przepaść między maską a rdzeniem tworzy wzorzec, który system może teraz odczytywać.'
      : 'The gap between your mask and core creates a pattern the system can now read.';
  }

  const line4 = isPl
    ? 'W pracy: ta przepaść wpływa na to, jak poruszasz się w kwestiach autorytetu i przynależności.'
    : 'In work: this gap affects how you navigate authority and belonging.';

  const line5 = isPl
    ? 'Więcej odpowiedzi nada temu podziałowi ostrzejszy kształt.'
    : 'More answers will make the shape of this split sharper and more specific.';

  return [line1, line2, line3, line4, line5];
}

function contradictionsInsight(vec: ProfileVector, b: BehavioralSummary | null | undefined, lang: Lang): string[] {
  const isPl = lang === 'pl';
  const v = vec as unknown as Record<string, number>;
  const riskVal = v['risk'] ?? 0;
  const secVal = v['security'] ?? 0;
  const changeVal = v['change'] ?? 0;
  const tension = Math.abs(riskVal - secVal);

  const line1 = isPl
    ? tension > 1.5
      ? 'Twoje odpowiedzi pokazują wyraźne napięcie między pragnieniem zmiany a potrzebą bezpieczeństwa.'
      : tension > 0.8
      ? 'Twoje odpowiedzi wskazują na umiarkowane napięcie między stabilnością a ryzykiem.'
      : 'W twoich odpowiedziach widać łagodne oscylowanie między kierunkiem a zakotwiczeniem.'
    : tension > 1.5
      ? 'Your answers show a clear tension between wanting change and needing security.'
      : tension > 0.8
      ? 'Your answers point to a moderate tension between stability and risk.'
      : 'Your answers show a gentle oscillation between direction and anchoring.';

  let line2: string;
  if (b) {
    const contDesc =
      b.avgContradictionSignal > 50
        ? (isPl ? 'Czasem twoje działania zmierzają w innym kierunku niż to, co prezentujesz. System to widzi.' : 'You sometimes move toward values that compete with what you present. The system sees it.')
        : b.avgContradictionSignal > 20
        ? (isPl ? 'W różnych typach pytań pojawiają się konkurujące ze sobą pociągi. To zdarza się częściej, niż ludzie sądzą.' : 'Across different question types, competing pulls show up. This is more common than people realize.')
        : (isPl ? 'Twoje wybory są w dużej mierze spójne — to rzadki poziom wewnętrznego wyrównania.' : 'Your choices are largely consistent — a rare degree of internal alignment.');
    const changeNote = b.totalAnswerChanges > 3
      ? (isPl
        ? ` Zmieniłeś odpowiedź ${b.totalAnswerChanges} razy — każda zmiana to moment, w którym coś wymagało ponownego rozważenia.`
        : ` You reconsidered your answer ${b.totalAnswerChanges} times — each marks a moment where something needed a second look.`)
      : '';
    line2 = contDesc + changeNote;
  } else {
    line2 = isPl
      ? changeVal > 1
        ? 'Szukasz zmiany, jednocześnie szukając stabilnego gruntu. Obie te potrzeby są obecne w twoich odpowiedziach.'
        : 'Twój profil jest zakorzeniony w bezpieczeństwie, ale sporadyczne sygnały zmiany pojawiają się na krawędziach.'
      : changeVal > 1
        ? 'You seek change while also looking for solid ground. Both needs are present in your answers.'
        : 'Your profile is grounded in security, but occasional change signals appear at the edges.';
  }

  const line3 = isPl
    ? 'Twoje wybory pokazują wewnętrzne negocjacje, których większość ludzi u siebie nie dostrzega.'
    : 'Your choices show an internal negotiation that most people do not notice in themselves.';

  const line4 = isPl
    ? 'W decyzjach: możesz zobowiązywać się do jednej strony, jednocześnie po cichu honorując drugą.'
    : 'In decisions: you tend to commit to one side while quietly honoring the other.';

  const line5 = isPl
    ? 'Więcej odpowiedzi pokaże, która strona zyskuje przewagę lub która stała się dominująca.'
    : 'More answers will show which side is gaining ground or which has become dominant.';

  return [line1, line2, line3, line4, line5];
}

function futureSelfInsight(vec: ProfileVector, b: BehavioralSummary | null | undefined, lang: Lang): string[] {
  const isPl = lang === 'pl';
  const future = top(vec, ['change', 'curiosity', 'risk']);
  const futureLabel = isPl ? (DIM_PL[future] ?? future) : (DIM_EN[future] ?? future);

  const line1 = isPl
    ? `Twoje odpowiedzi ciągną w kierunku: ${futureLabel}.`
    : `Your answers are pulling toward: ${futureLabel}.`;

  let line2: string;
  if (b) {
    const decLabel = b.decisivenessLabel ?? 'decisive';
    line2 = isPl ? DECISIVE_PL[decLabel] : DECISIVE_EN[decLabel];
  } else {
    line2 = isPl
      ? 'To nie jest prognoza — to kierunek, w którym wskazują Twoje obecne sygnały behawioralne.'
      : 'This is not a prediction — it is a direction your current behavioral signals point to.';
  }

  const line3 = isPl
    ? 'To nie jest punkt docelowy. To kierunek, który Twój obecny wzorzec sugeruje.'
    : 'This is not where you are — it is a direction your current pattern suggests.';

  const line4 = isPl
    ? 'W pracy: ten kierunek kształtuje środowiska, do których się zbliżasz, i te, z których wyrastasz.'
    : 'In work: this direction shapes what environments you move toward and what you outgrow.';

  const line5 = isPl
    ? 'Więcej odpowiedzi pokaże, czy jest to stabilna trajektoria, czy tymczasowy pociąg.'
    : 'More answers will tell the system whether this is a stable trajectory or a temporary pull.';

  return [line1, line2, line3, line4, line5];
}

function relationshipModeInsight(vec: ProfileVector, b: BehavioralSummary | null | undefined, lang: Lang): string[] {
  const isPl = lang === 'pl';
  const v = vec as unknown as Record<string, number>;
  const conn = v['connection'] ?? 0;
  const sec = v['security'] ?? 0;
  const emo = v['emotion'] ?? 0;

  const style = conn > sec && conn > emo ? 'connector' : sec > conn ? 'stabilizer' : 'emotionally_open';
  const styleLabel = isPl
    ? style === 'connector' ? 'łącznik (cenisz bliskość i wzajemność)'
      : style === 'stabilizer' ? 'stabilizator (cenisz przewidywalność w relacjach)'
      : 'otwarty emocjonalnie (ujawniasz więcej niż inni na Twoim miejscu)'
    : style === 'connector' ? 'connector — you value closeness and reciprocity'
      : style === 'stabilizer' ? 'stabilizer — you value predictability in relationships'
      : 'emotionally open — you disclose more than others would at your position';

  const line1 = isPl
    ? `Twój tryb relacyjny: ${styleLabel}.`
    : `Your relationship mode: ${styleLabel}.`;

  let line2: string;
  if (b) {
    const avoidNote = isPl ? AVOID_PL[b.avoidanceLabel] : AVOID_EN[b.avoidanceLabel];
    const frictionNote =
      b.avgEmotionalFrictionSignal > 50
        ? (isPl ? ' Wykryto wysoki poziom tarcia emocjonalnego w pytaniach intymnych.' : ' High emotional friction detected across intimate questions.')
        : b.avgEmotionalFrictionSignal > 25
        ? (isPl ? ' Umiarkowane tarcie na treściach emocjonalnych.' : ' Moderate friction on emotionally charged content.')
        : '';
    line2 = avoidNote + frictionNote;
  } else {
    line2 = isPl
      ? `Połączenie: ${conn.toFixed(1)}, Bezpieczeństwo: ${sec.toFixed(1)}, Emocja: ${emo.toFixed(1)}.`
      : `Connection: ${conn.toFixed(1)}, Security: ${sec.toFixed(1)}, Emotion: ${emo.toFixed(1)}.`;
  }

  const line3 = isPl
    ? 'Ten wzorzec wpływa na to, jak zarządzasz bliskością, dystansem i tym, co wyzwala wycofanie.'
    : 'This pattern affects how you manage closeness, distance, and what triggers withdrawal.';

  const line4 = isPl
    ? 'W pracy: tryb relacyjny widoczny jest w sposobie, w jaki podchodzisz do współpracy, hierarchii i zaufania.'
    : 'In work: this mode shows in how you handle collaboration, hierarchy, and trust.';

  const line5 = isPl
    ? 'Więcej odpowiedzi pokaże, czy tryb jest spójny, czy zmienia się pod presją emocjonalną.'
    : 'More answers will show whether this mode is consistent or shifts under emotional pressure.';

  return [line1, line2, line3, line4, line5];
}

function humanTwinInsight(vec: ProfileVector, b: BehavioralSummary | null | undefined, lang: Lang): string[] {
  const isPl = lang === 'pl';
  const overall = score(vec, ['control', 'risk', 'curiosity', 'connection']);
  const tier = overall > 4
    ? (isPl ? 'wyraźny' : 'strong')
    : overall > 2
    ? (isPl ? 'umiarkowany' : 'moderate')
    : (isPl ? 'wczesny' : 'early');

  const line1 = isPl
    ? `Szacowany sygnał podobieństwa: ${tier}.`
    : `Estimated similarity signal: ${tier}.`;

  let line2: string;
  if (b) {
    const dec = isPl ? (DECISIVE_PL[b.decisivenessLabel] ?? b.decisivenessLabel) : (DECISIVE_EN[b.decisivenessLabel] ?? b.decisivenessLabel);
    line2 = isPl
      ? `Twój behawioralny odcisk palca obejmuje styl decyzyjny, kształt unikania i wewnętrzną spójność.`
      : `Your behavioral fingerprint covers decision style, avoidance shape, and internal consistency.`;
    void dec;
  } else {
    line2 = isPl
      ? 'Twój behawioralny odcisk palca jest na tyle złożony, że system może wykryć wzorce podobieństwa.'
      : 'Your behavioral fingerprint is complex enough for the system to detect similarity patterns.';
  }

  const line3 = isPl
    ? 'To szacunek oparty na Twoim wzorcu — nie porównanie z prawdziwymi użytkownikami w czasie rzeczywistym.'
    : 'This is an estimate built from your pattern — not matched against real users in real time.';

  const line4 = isPl
    ? 'Wzorzec obejmuje styl podejmowania decyzji, to, czego unikasz, oraz sposób, w jaki zmieniasz zdanie.'
    : 'The pattern captures your decision style, what you avoid, and how you change your mind.';

  const line5 = isPl
    ? 'Więcej odpowiedzi sprecyzuje, jak unikalny staje się ten szacowany profil.'
    : 'More answers will sharpen how specific this estimated profile becomes.';

  return [line1, line2, line3, line4, line5];
}

function hiddenParametersInsight(vec: ProfileVector, b: BehavioralSummary | null | undefined, lang: Lang): string[] {
  const isPl = lang === 'pl';
  const v = vec as unknown as Record<string, number>;
  const emo = v['emotion'] ?? 0;
  const ind = v['independence'] ?? 0;
  const cur = v['curiosity'] ?? 0;

  const hidden = emo > ind ? 'emotionally_driven' : 'independence_framed';

  const line1 = isPl
    ? hidden === 'emotionally_driven'
      ? 'Twoje odpowiedzi pokazują, że emocja działa jako filtr pierwszego stopnia — kształtuje kierunek zanim logika zdąży się włączyć.'
      : 'Twoje odpowiedzi pokazują, że autonomia to twój pierwszorzędny filtr — zanim uwzględnisz wpływ innych, sprawdzasz co mówi twoja niezależność.'
    : hidden === 'emotionally_driven'
      ? 'Your answers show that emotion acts as a first-order filter — shaping direction before logic has a chance to engage.'
      : 'Your answers show that autonomy is your first-order filter — before factoring in others, you check what your independence says.';

  let line2: string;
  if (b) {
    if (b.totalAnswerChanges > 3) {
      line2 = isPl
        ? `Zmieniłeś odpowiedź ${b.totalAnswerChanges} razy. Każda zmiana to moment, w którym dwie wartości ścierały się ze sobą.`
        : `You reconsidered your answer ${b.totalAnswerChanges} times. Each change marks a moment where two competing values surfaced.`;
    } else if (b.decisivenessLabel === 'impulsive') {
      line2 = isPl
        ? 'Twoje pierwsze odczucie zazwyczaj wygrywa. Przestrzeń między pytaniem a wyborem jest wąska.'
        : 'Your first feeling usually wins. The space between reading a question and choosing is narrow.';
    } else if (b.decisivenessLabel === 'deliberate') {
      line2 = isPl
        ? 'Zanim się zdecydujesz, dajesz sobie czas. Ta pauza nie jest wahaniem — to część twojego procesu.'
        : 'Before committing, you take time. That pause is not hesitation — it is part of your process.';
    } else if (b.decisivenessLabel === 'hesitant') {
      line2 = isPl
        ? 'Przy ważnych wyborach zatrzymujesz się dłużej niż inni. System odczytuje, czego szuka to filtrowanie.'
        : 'You tend to pause longer before important choices. The system is reading what that filtering is looking for.';
    } else {
      line2 = isPl
        ? 'Twoje tempo decyzji jest spójne i wyraźne — bez oznak wewnętrznych negocjacji.'
        : 'Your decision pace is consistent and clear — without signs of internal negotiation.';
    }
  } else {
    line2 = cur > 3
      ? (isPl
        ? 'Twoja ciekawość wyraźnie ciągnie cię ku nieznanym krawędziom — to kształtuje, które pytania angażują cię najbardziej.'
        : 'Your curiosity pulls clearly toward unfamiliar edges — it shapes which questions draw you in the most.')
      : cur > 1
      ? (isPl
        ? 'Angażujesz się selektywnie — z wyraźnymi preferencjami tematycznymi i wyraźnymi granicami.'
        : 'You engage selectively — with clear topic preferences and clear limits.')
      : (isPl
        ? 'Twoja ciekawość jest powściągliwa w tym zestawie odpowiedzi. Angażujesz się tam, gdzie czujesz grunt pod nogami.'
        : 'Your curiosity is quiet in this answer set. You engage where you feel grounded.');
  }

  const line3 = isPl
    ? 'W decyzjach: ten filtr działa poniżej progu świadomości — kształtuje priorytety zanim je nazwiesz.'
    : 'In decisions: this filter operates below conscious awareness — shaping priorities before you name them.';

  const line4 = isPl
    ? 'W relacjach: ten wzorzec wpływa na to, co odczytujesz u innych i którym sygnałom ufasz.'
    : 'In relationships: this pattern shapes what you read in others and which signals you trust.';

  const line5 = isPl
    ? 'Więcej odpowiedzi ujawni, czy ten filtr jest stały, czy przesuwa się pod presją.'
    : 'More answers will reveal whether this filter is stable or shifts under pressure.';

  return [line1, line2, line3, line4, line5];
}

function profileEvolutionInsight(vec: ProfileVector, b: BehavioralSummary | null | undefined, lang: Lang): string[] {
  const isPl = lang === 'pl';
  const dominant = top(vec, ['change', 'control', 'security']);
  const domLabel = isPl ? (DIM_PL[dominant] ?? dominant) : (DIM_EN[dominant] ?? dominant);

  const line1 = isPl
    ? `Twój najbardziej aktywny wymiar to: ${domLabel}.`
    : `Your most active dimension is: ${domLabel}.`;

  let line2: string;
  if (b) {
    const stabLabel = b.stabilityLabel ?? 'stable';
    const stabilityDesc = isPl ? STABLE_PL[stabLabel] : STABLE_EN[stabLabel];
    const undoNote = b.totalUndos > 0
      ? (isPl
        ? ` Zarejestrowano ${b.totalUndos} cofnięć — każde to moment rekalibracji.`
        : ` ${b.totalUndos} undo${b.totalUndos > 1 ? 's' : ''} recorded — each marks a recalibration moment.`)
      : '';
    line2 = stabilityDesc + undoNote;
  } else {
    line2 = isPl
      ? 'Twój profil przesunął się w tym kierunku w trakcie wielu sesji odpowiedzi.'
      : 'Your profile has shifted toward this signal across multiple answer sessions.';
  }

  const line3 = isPl
    ? 'To nie jest stała cecha — to aktualny kierunkowy impuls w Twoim profilu.'
    : 'This is not a fixed trait — it is a current directional momentum in your profile.';

  const line4 = isPl
    ? 'W decyzjach: wzorce w ruchu wpływają na wybory inaczej niż te ustabilizowane.'
    : 'In decisions: patterns that are in motion affect choices differently than settled ones.';

  const line5 = isPl
    ? 'Więcej odpowiedzi pokaże, czy ten impuls trwa, czy zmienia kierunek.'
    : 'More answers will show whether this momentum continues or reverses direction.';

  return [line1, line2, line3, line4, line5];
}

// ─── Registry ─────────────────────────────────────────────────────────────────

type InsightGenerator = (vec: ProfileVector, b: BehavioralSummary | null | undefined, lang: Lang) => string[];

const INSIGHTS_LEGACY: Record<string, InsightGenerator> = {
  shadowProfile: (vec, b) => {
    const dominant = top(vec, ['control', 'independence', 'security']);
    const shadow =
      dominant === 'control' ? 'dependency' :
      dominant === 'independence' ? 'need for validation' :
      'impulse toward risk';

    if (b) {
      const avoidDesc =
        b.avoidanceLabel === 'avoidant' ? 'high evasion on sensitive questions' :
        b.avoidanceLabel === 'selective' ? 'selective disclosure under pressure' :
        'direct engagement even on sensitive content';
      const undoNote = b.totalUndos > 1 ? ` You reversed ${b.totalUndos} answers — a tell that surfaces under threat.` : '';
      return [
        `Your dominant signal is ${dominant}.`,
        `Your shadow pattern suggests a suppressed tendency toward ${shadow}.`,
        `Behavioral trace: ${avoidDesc}.${undoNote}`,
      ];
    }

    return [
      `Your dominant signal is ${dominant}.`,
      `Your shadow pattern suggests a suppressed tendency toward ${shadow}.`,
      'This tension between your expressed and suppressed tendencies shapes your choices.',
    ];
  },

  maskVsCore: (vec, b) => {
    const presented = top(vec, ['connection', 'security']);
    const hidden = top(vec, ['independence', 'risk']);

    if (b) {
      const contradictDesc =
        b.avgContradictionSignal > 50 ? 'strong contradictions between stated values and behavioral choices' :
        b.avgContradictionSignal > 25 ? 'moderate inconsistencies between what you say and what you do' :
        'relatively consistent alignment between stated and behavioral signals';
      const stabilityNote =
        b.stabilityLabel === 'volatile' ? ' Your decision pattern is volatile — the gap widens under pressure.' :
        b.stabilityLabel === 'uncertain' ? ' The gap shows in moments of uncertainty.' :
        '';
      return [
        `Presented pattern: high ${presented}.`,
        `Core signal: underlying ${hidden} that rarely surfaces publicly.`,
        `Behavioral read: ${contradictDesc}.${stabilityNote}`,
      ];
    }

    return [
      `Presented pattern: high ${presented}.`,
      `Core signal: underlying ${hidden} that rarely surfaces publicly.`,
      'The gap between your mask and your core creates a pattern the system can now read.',
    ];
  },

  contradictions: (vec, b) => {
    const v = vec as unknown as Record<string, number>;
    const riskVal = v['risk'] ?? 0;
    const secVal = v['security'] ?? 0;
    const changeVal = v['change'] ?? 0;
    const tension = Math.abs(riskVal - secVal);
    const label = tension > 1.5 ? 'strong' : tension > 0.8 ? 'moderate' : 'mild';

    if (b) {
      const behavioralContradiction =
        b.avgContradictionSignal > 50 ? 'Your behavior frequently contradicts your stated axis direction.' :
        b.avgContradictionSignal > 20 ? 'Periodic behavioral contradictions detected across question types.' :
        'Your behavioral choices are largely consistent with your profile direction.';
      const changeNote = b.totalAnswerChanges > 3
        ? ` You changed ${b.totalAnswerChanges} answers — each reversal marks a conflict point.`
        : '';
      return [
        `Contradiction strength: ${label}.`,
        `${behavioralContradiction}${changeNote}`,
        `You seek change (${changeVal.toFixed(1)}) while also anchoring to security (${secVal.toFixed(1)}).`,
      ];
    }

    return [
      `Contradiction strength: ${label}.`,
      `You seek change (${changeVal.toFixed(1)}) while also anchoring to security (${secVal.toFixed(1)}).`,
      'Your choices show an internal negotiation that most people do not notice in themselves.',
    ];
  },

  futureSelf: (vec, b) => {
    const future = top(vec, ['change', 'curiosity', 'risk']);

    if (b) {
      const decisionNote =
        b.decisivenessLabel === 'impulsive' ? 'Your impulsive decision pattern suggests rapid trajectory shifts.' :
        b.decisivenessLabel === 'decisive' ? 'Your decisive pattern indicates committed movement toward this direction.' :
        b.decisivenessLabel === 'deliberate' ? 'Your deliberate style suggests slow but stable evolution.' :
        'Your hesitant pattern may delay this trajectory from solidifying.';
      return [
        `Your profile is pulling toward: ${future}.`,
        decisionNote,
        'This is not a prediction — it is a direction your current behavioral signals point to.',
      ];
    }

    return [
      `Your profile is pulling toward: ${future}.`,
      `This is not a prediction — it is a direction your current behavioral signals point to.`,
      'If this trend continues, your dominant pattern will shift in the next phase.',
    ];
  },

  relationshipMode: (vec, b) => {
    const v = vec as unknown as Record<string, number>;
    const conn = v['connection'] ?? 0;
    const sec = v['security'] ?? 0;
    const emo = v['emotion'] ?? 0;
    const style =
      conn > sec && conn > emo ? 'connector' :
      sec > conn ? 'stabilizer' :
      'emotionally open';

    if (b) {
      const avoidanceNote =
        b.avoidanceLabel === 'avoidant' ? 'You show high resistance to emotionally exposed content.' :
        b.avoidanceLabel === 'selective' ? 'You open up selectively — intimacy is conditional.' :
        'You engage directly even with high-intimacy questions.';
      const frictionNote =
        b.avgEmotionalFrictionSignal > 50 ? ' High emotional friction signals detected across intimate questions.' :
        b.avgEmotionalFrictionSignal > 25 ? ' Moderate friction on emotionally charged content.' :
        '';
      return [
        `Your relationship mode: ${style}.`,
        avoidanceNote + frictionNote,
        `Connection score: ${conn.toFixed(1)}, Security: ${sec.toFixed(1)}, Emotion: ${emo.toFixed(1)}.`,
      ];
    }

    return [
      `Your relationship mode: ${style}.`,
      `Connection score: ${conn.toFixed(1)}, Security: ${sec.toFixed(1)}, Emotion: ${emo.toFixed(1)}.`,
      'This pattern determines how you bond, withdraw, and maintain closeness.',
    ];
  },

  humanTwin: (vec, b) => {
    const overall = score(vec, ['control', 'risk', 'curiosity', 'connection']);
    const tier = overall > 4 ? 'strong' : overall > 2 ? 'moderate' : 'developing';

    if (b) {
      const decLabel = b.decisivenessLabel;
      const stabLabel = b.stabilityLabel;
      const avoidLabel = b.avoidanceLabel;
      return [
        `Twin signal strength: ${tier}.`,
        `Behavioral fingerprint: ${decLabel} / ${stabLabel} / ${avoidLabel}.`,
        'These three axes narrow the behavioral twin search to a rare cluster.',
      ];
    }

    return [
      `Twin signal strength: ${tier}.`,
      `Your behavioral fingerprint is complex enough to detect matching patterns.`,
      'The system is narrowing the search for your closest behavioral twin.',
    ];
  },

  hiddenParameters: (vec, b) => {
    const v = vec as unknown as Record<string, number>;
    const emo = v['emotion'] ?? 0;
    const ind = v['independence'] ?? 0;
    const cur = v['curiosity'] ?? 0;
    const hidden = emo > ind ? 'emotionally driven processing' : 'independent decision framing';

    if (b) {
      const hesMs = b.avgHesitationMs;
      const hesDesc = hesMs !== null
        ? hesMs > 5000 ? `high hesitation (avg ${(hesMs / 1000).toFixed(1)}s after first touch)`
        : hesMs > 2000 ? `moderate hesitation (avg ${(hesMs / 1000).toFixed(1)}s)`
        : `low hesitation (avg ${(hesMs / 1000).toFixed(1)}s)`
        : 'hesitation data not available';
      const frictionLabel =
        b.avgEmotionalFrictionSignal > 60 ? 'high emotional friction' :
        b.avgEmotionalFrictionSignal > 30 ? 'moderate emotional friction' :
        'low emotional friction';
      return [
        `Hidden parameter: ${hidden}.`,
        `Decisiveness: ${b.decisivenessLabel} — ${hesDesc}.`,
        `Emotional load: ${frictionLabel} (signal: ${b.avgEmotionalFrictionSignal}). Curiosity index: ${cur.toFixed(1)}.`,
      ];
    }

    return [
      `Hidden parameter: ${hidden}.`,
      `Curiosity index: ${cur.toFixed(1)} — this drives your edge-case choices.`,
      'These parameters are only visible from your pattern edges, not your main signals.',
    ];
  },

  profileEvolution: (vec, b) => {
    const dominant = top(vec, ['change', 'control', 'security']);

    if (b) {
      const stabilityDesc =
        b.stabilityLabel === 'volatile' ? `volatile — your profile is in flux (instability: ${b.avgInstabilitySignal})` :
        b.stabilityLabel === 'uncertain' ? `uncertain — partial stabilization in progress` :
        `stable — your pattern has solidified`;
      const undoNote = b.totalUndos > 0
        ? ` ${b.totalUndos} undo${b.totalUndos > 1 ? 's' : ''} recorded — each marks a recalibration moment.`
        : '';
      return [
        `Most evolved dimension: ${dominant}.`,
        `Stability read: ${stabilityDesc}.${undoNote}`,
        'Evolution tracking shows whether your patterns are stabilizing or still changing.',
      ];
    }

    return [
      `Most evolved dimension: ${dominant}.`,
      'Your profile has shifted toward this signal across multiple answer sessions.',
      'Evolution tracking shows whether your patterns are stabilizing or still changing.',
    ];
  },
};

const INSIGHTS: Record<string, InsightGenerator> = {
  shadowProfile:    shadowProfileInsight,
  maskVsCore:       maskVsCoreInsight,
  contradictions:   contradictionsInsight,
  futureSelf:       futureSelfInsight,
  relationshipMode: relationshipModeInsight,
  humanTwin:        humanTwinInsight,
  hiddenParameters: hiddenParametersInsight,
  profileEvolution: profileEvolutionInsight,
};

void INSIGHTS_LEGACY; // retained for reference only

export function generatePremiumInsight(
  moduleId: string,
  vec: ProfileVector,
  totalAnswers: number,
  behavioralSummary?: BehavioralSummary | null,
  lang: Lang = 'en',
): PremiumInsight {
  const mod = PREMIUM_MODULES.find((m) => m.id === moduleId);
  if (!mod) return { moduleId, hasData: false, lines: [] };

  if (totalAnswers < mod.minAnswers) {
    return { moduleId, hasData: false, lines: [] };
  }

  const generator = INSIGHTS[moduleId];
  if (!generator) return { moduleId, hasData: false, lines: [] };

  return { moduleId, hasData: true, lines: generator(vec, behavioralSummary, lang) };
}
