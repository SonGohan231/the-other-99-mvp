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
    const contLevel =
      b.avgContradictionSignal > 50 ? (isPl ? 'silne' : 'strong') :
      b.avgContradictionSignal > 25 ? (isPl ? 'umiarkowane' : 'moderate') :
      (isPl ? 'niskie' : 'low');
    const stabilityNote = b.stabilityLabel === 'volatile'
      ? (isPl ? ' Wzorzec decyzyjny jest niestabilny — przepaść poszerza się pod presją.' : ' Your decision pattern is volatile — the gap widens under pressure.')
      : b.stabilityLabel === 'uncertain'
      ? (isPl ? ' Przepaść widoczna jest w momentach niepewności.' : ' The gap shows most in moments of uncertainty.')
      : '';
    line3 = isPl
      ? `Poziom sprzeczności: ${contLevel}.${stabilityNote}`
      : `Contradiction level: ${contLevel}.${stabilityNote}`;
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
  const label = tension > 1.5
    ? (isPl ? 'silna' : 'strong')
    : tension > 0.8
    ? (isPl ? 'umiarkowana' : 'moderate')
    : (isPl ? 'łagodna' : 'mild');

  const line1 = isPl
    ? `Wykryto ${label} sprzeczność wewnętrzną w Twoim wzorcu.`
    : `A ${label} internal contradiction was detected in your pattern.`;

  let line2: string;
  if (b) {
    const contDesc =
      b.avgContradictionSignal > 50
        ? (isPl ? 'Twoje zachowanie regularnie przeczy deklarowanemu kierunkowi.' : 'Your behavior regularly contradicts your stated direction.')
        : b.avgContradictionSignal > 20
        ? (isPl ? 'Sporadyczne sprzeczności behawioralne wykryte w różnych typach pytań.' : 'Periodic behavioral contradictions detected across question types.')
        : (isPl ? 'Twoje wybory behawioralne są w dużej mierze zgodne z kierunkiem profilu.' : 'Your behavioral choices are largely consistent with your profile direction.');
    const changeNote = b.totalAnswerChanges > 3
      ? (isPl
        ? ` Zmieniłeś ${b.totalAnswerChanges} odpowiedzi — każde cofnięcie to punkt konfliktu.`
        : ` You changed ${b.totalAnswerChanges} answers — each reversal marks a conflict point.`)
      : '';
    line2 = contDesc + changeNote;
  } else {
    line2 = isPl
      ? `Szukasz zmiany (${changeVal.toFixed(1)}) jednocześnie zakotwiczając się w bezpieczeństwie (${secVal.toFixed(1)}).`
      : `You seek change (${changeVal.toFixed(1)}) while also anchoring to security (${secVal.toFixed(1)}).`;
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
  const hiddenLabel = isPl
    ? hidden === 'emotionally_driven'
      ? 'przetwarzanie emocjonalne (emocja filtruje decyzje zanim logika je dosięgnie)'
      : 'niezależne kadrowanie (filtrujesz przez autonomię zanim uwzględnisz innych)'
    : hidden === 'emotionally_driven'
      ? 'emotional processing (emotion filters decisions before logic reaches them)'
      : 'independent framing (you filter through autonomy before factoring in others)';

  const line1 = isPl
    ? `Kluczowy ukryty parametr: ${hiddenLabel}.`
    : `Key hidden parameter: ${hiddenLabel}.`;

  let line2: string;
  if (b) {
    const hesMs = b.avgHesitationMs;
    const hesDesc = hesMs !== null
      ? hesMs > 5000
        ? (isPl ? `wysoka długość wahania (średnio ${(hesMs / 1000).toFixed(1)}s po pierwszym dotknięciu)` : `high hesitation window (avg ${(hesMs / 1000).toFixed(1)}s after first touch)`)
        : hesMs > 2000
        ? (isPl ? `umiarkowane wahanie (średnio ${(hesMs / 1000).toFixed(1)}s)` : `moderate hesitation (avg ${(hesMs / 1000).toFixed(1)}s)`)
        : (isPl ? `niskie wahanie (średnio ${(hesMs / 1000).toFixed(1)}s)` : `low hesitation (avg ${(hesMs / 1000).toFixed(1)}s)`)
      : (isPl ? 'brak danych o wahaniu' : 'hesitation data not available');
    line2 = isPl
      ? `Zaangażowanie: ${DECISIVE_PL[b.decisivenessLabel] ?? b.decisivenessLabel} — ${hesDesc}.`
      : `Engagement: ${DECISIVE_EN[b.decisivenessLabel] ?? b.decisivenessLabel} — ${hesDesc}.`;
  } else {
    line2 = isPl
      ? `Indeks ciekawości: ${cur.toFixed(1)} — napędza Twoje wybory na brzegach wzorca.`
      : `Curiosity index: ${cur.toFixed(1)} — this drives your choices at the edges of the pattern.`;
  }

  const line3 = isPl
    ? 'W decyzjach: ten filtr kształtuje, które informacje nieświadomie traktujesz priorytetowo.'
    : 'In decisions: this filter shapes what information you weight more heavily without noticing.';

  const line4 = isPl
    ? 'W relacjach: ten parametr wpływa na to, jak czytasz innych i jakim sygnałom przyznajesz priorytet.'
    : 'In relationships: this parameter influences how you read others and what signals you prioritize.';

  const line5 = isPl
    ? 'Więcej odpowiedzi ujawni, czy parametr jest stabilny, czy się przesuwa.'
    : 'More answers will reveal whether this parameter is stable or in motion.';

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
