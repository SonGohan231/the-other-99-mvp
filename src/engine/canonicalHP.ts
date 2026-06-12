import { BehavioralSummary } from '../utils/behavioralSignals';
import { ReturnToSessionEvent } from '../types';

/**
 * Five canonical hidden parameters derived from behavioral events.
 * Scale: -100 (strong second pole) to +100 (strong first pole).
 * 0 = neutral / insufficient data.
 *
 * HP01: Confidence ↔ Hesitation
 *   Sources: confidence_signal, skip_question (HE001), answer_change (HE005),
 *            time_to_submit (HE007), return_to_menu (HE003)
 *
 * HP02: Openness ↔ Guardedness
 *   Sources: avoidance_signal, skip_question (HE001), swap_question (HE002),
 *            return_to_menu (HE003)
 *
 * HP03: Consistency ↔ Contradiction
 *   Sources: contradiction_signal, answer_change (HE005), undo events,
 *            session_resume (HE008), stability_label
 *
 * HP04: Directness ↔ Reflection
 *   Sources: impulsivity_signal, deliberation_signal, first_reaction_time_ms,
 *            answer changes without instability (considered revision)
 *
 * HP05: Stability ↔ Exploration
 *   Sources: instability_signal, stability_label, swap_question (HE002),
 *            exit_to_menu (HE003), session_resume (HE008)
 */
export interface CanonicalHP {
  HP01: number; // Confidence (>0) ↔ Hesitation (<0)
  HP02: number; // Openness (>0) ↔ Guardedness (<0)
  HP03: number; // Consistency (>0) ↔ Contradiction (<0)
  HP04: number; // Directness (>0) ↔ Reflection (<0)
  HP05: number; // Stability (>0) ↔ Exploration (<0)
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Compute canonical HP01–HP05 from behavioral summary.
 * Returns null when there is insufficient behavioral data (< 3 answers).
 */
export function computeCanonicalHP(
  behavioral: BehavioralSummary | null,
  returnEvents: ReturnToSessionEvent[] = [],
): CanonicalHP | null {
  if (!behavioral || behavioral.sampleSize < 3) return null;

  const {
    avgConfidenceSignal,
    avgAvoidanceSignal,
    avgContradictionSignal,
    avgHesitationMs,
    avgImpulsivitySignal,
    avgDeliberationSignal,
    avgInstabilitySignal,
    avgFirstReactionMs,
    skipRatePercent,
    totalAnswerChanges,
    totalUndos,
    totalExits,
    totalSwaps,
    stabilityLabel,
  } = behavioral;

  // HP01: Confidence ↔ Hesitation
  const confidenceBase = avgConfidenceSignal - 50;
  const hesitationFromTime = avgHesitationMs !== null
    ? clamp(avgHesitationMs / 500, 0, 20)
    : 0;
  const hesitationFromSkips = skipRatePercent * 0.5;
  const hesitationFromChanges = clamp(totalAnswerChanges * 5, 0, 20);
  const hesitationFromExits = clamp(totalExits * 3, 0, 10);
  const HP01 = clamp(
    confidenceBase - hesitationFromTime - hesitationFromSkips - hesitationFromChanges - hesitationFromExits,
    -100, 100,
  );

  // HP02: Openness ↔ Guardedness
  const opennessBase = 50 - avgAvoidanceSignal;
  const guardednessFromSkips = skipRatePercent * 0.8;
  const guardednessFromExits = clamp(totalExits * 5, 0, 20);
  const guardednessFromSwaps = clamp(totalSwaps * 5, 0, 15);
  const HP02 = clamp(
    opennessBase - guardednessFromSkips - guardednessFromExits - guardednessFromSwaps,
    -100, 100,
  );

  // HP03: Consistency ↔ Contradiction
  const consistencyBase = 50 - avgContradictionSignal;
  const contradictionFromChanges = clamp(totalAnswerChanges * 6, 0, 25);
  const contradictionFromUndos = clamp(totalUndos * 8, 0, 15);
  const stabilityBonus = stabilityLabel === 'stable' ? 15
    : stabilityLabel === 'volatile' ? -15
    : 0;
  const resumeBonus = clamp(returnEvents.length * 5, 0, 15);
  const HP03 = clamp(
    consistencyBase - contradictionFromChanges - contradictionFromUndos + stabilityBonus + resumeBonus,
    -100, 100,
  );

  // HP04: Directness ↔ Reflection
  // Direct: high impulsivity, low deliberation, fast first reaction
  // Reflective: high deliberation, low impulsivity, slow first reaction
  const directnessBase = (avgImpulsivitySignal - avgDeliberationSignal) / 2; // -50..+50
  const firstReactionAdjust = avgFirstReactionMs !== null
    ? clamp(-(avgFirstReactionMs - 1500) / 300, -15, 10) // slow start → reflective
    : 0;
  // Thoughtful revisions (low instability + some changes) push toward reflection
  const reflectiveRevisions = avgInstabilitySignal < 30 && totalAnswerChanges > 1
    ? clamp(totalAnswerChanges * 3, 0, 12)
    : 0;
  const HP04 = clamp(directnessBase + firstReactionAdjust - reflectiveRevisions, -100, 100);

  // HP05: Stability ↔ Exploration
  // Stable: consistent engagement, few swaps, committed returns
  // Exploratory: frequent swaps/exits, high instability
  const stabilityFromLabel2 = stabilityLabel === 'stable' ? 20
    : stabilityLabel === 'volatile' ? -20
    : 0;
  const exploratoryFromSwaps = -clamp(totalSwaps * 8, 0, 25);
  const exploratoryFromInstability = -clamp(avgInstabilitySignal / 3, 0, 25);
  const stabilityFromReturns = clamp(returnEvents.length * 8, 0, 20);
  const exploratoryFromExits = -clamp(totalExits * 4, 0, 15);
  const HP05 = clamp(
    stabilityFromLabel2 + exploratoryFromSwaps + exploratoryFromInstability + stabilityFromReturns + exploratoryFromExits,
    -100, 100,
  );

  return {
    HP01: Math.round(HP01),
    HP02: Math.round(HP02),
    HP03: Math.round(HP03),
    HP04: Math.round(HP04),
    HP05: Math.round(HP05),
  };
}

export interface HPDisplayItem {
  id: 'HP01' | 'HP02' | 'HP03' | 'HP04' | 'HP05';
  value: number;       // -100 to +100
  positiveLabel: { en: string; pl: string };
  negativeLabel: { en: string; pl: string };
  descEn: string;
  descPl: string;
}

function hpDescription(
  value: number,
  strongPos: string,
  modPos: string,
  neutral: string,
  modNeg: string,
  strongNeg: string,
): string {
  if (value > 50) return strongPos;
  if (value > 15) return modPos;
  if (value >= -15) return neutral;
  if (value >= -50) return modNeg;
  return strongNeg;
}

export function buildHPDisplay(hp: CanonicalHP): HPDisplayItem[] {
  return [
    {
      id: 'HP01',
      value: hp.HP01,
      positiveLabel: { en: 'Confidence', pl: 'Pewność siebie' },
      negativeLabel: { en: 'Hesitation', pl: 'Wahanie' },
      descEn: hpDescription(
        hp.HP01,
        'You commit quickly and without visible doubt. Your answers move in a single direction.',
        'Generally confident. Some questions create a longer pause, but most decisions land fast.',
        'Balanced. Your pattern shows confidence on some topics and hesitation on others.',
        'Noticeable hesitation. You filter before committing — especially on high-stakes questions.',
        'Strong hesitation pattern. Your answers show significant internal filtering before selection.',
      ),
      descPl: hpDescription(
        hp.HP01,
        'Decydujesz szybko i bez widocznych wątpliwości. Twoje odpowiedzi zmierzają w jednym kierunku.',
        'Generalnie pewny siebie. Niektóre pytania tworzą dłuższą pauzę, ale większość decyzji zapada szybko.',
        'Zrównoważony. Twój wzorzec pokazuje pewność przy jednych pytaniach i wahanie przy innych.',
        'Zauważalne wahanie. Filtrujesz przed zaangażowaniem — szczególnie przy pytaniach o wysokiej stawce.',
        'Silny wzorzec wahania. Twoje odpowiedzi pokazują znaczące wewnętrzne filtrowanie przed wyborem.',
      ),
    },
    {
      id: 'HP02',
      value: hp.HP02,
      positiveLabel: { en: 'Openness', pl: 'Otwartość' },
      negativeLabel: { en: 'Guardedness', pl: 'Ostrożność' },
      descEn: hpDescription(
        hp.HP02,
        'You engage with questions directly without visible avoidance. High transparency signal.',
        'Generally open. You engage with most topics without evasion.',
        'Balanced engagement. Some selectivity is present but not dominant.',
        'Selective engagement. You guard against certain question types or categories.',
        'High guardedness. You systematically avoid or deflect from specific content.',
      ),
      descPl: hpDescription(
        hp.HP02,
        'Angażujesz się w pytania bezpośrednio, bez widocznego unikania. Wysoki sygnał przejrzystości.',
        'Generalnie otwarty. Angażujesz się w większość tematów bez unikania.',
        'Zrównoważone zaangażowanie. Pewna selektywność jest obecna, ale nie dominuje.',
        'Selektywne zaangażowanie. Chronisz się przed pewnymi typami lub kategoriami pytań.',
        'Wysoka ostrożność. Systematycznie unikasz lub odchylasz się od określonych treści.',
      ),
    },
    {
      id: 'HP03',
      value: hp.HP03,
      positiveLabel: { en: 'Consistency', pl: 'Spójność' },
      negativeLabel: { en: 'Contradiction', pl: 'Sprzeczność' },
      descEn: hpDescription(
        hp.HP03,
        'Your answers build a coherent pattern. Low internal tension. High signal reliability.',
        'Generally consistent. Minor variations exist but your pattern has a clear direction.',
        'Mixed pattern. Some consistent threads alongside visible contradictions.',
        'Noticeable internal tension. Your answers pull in different directions on similar topics.',
        'High contradiction density. Your pattern contains strong opposing signals.',
      ),
      descPl: hpDescription(
        hp.HP03,
        'Twoje odpowiedzi budują spójny wzorzec. Niskie napięcie wewnętrzne. Wysoka wiarygodność sygnału.',
        'Generalnie spójny. Drobne wahania istnieją, ale twój wzorzec ma wyraźny kierunek.',
        'Mieszany wzorzec. Spójne wątki obok widocznych sprzeczności.',
        'Zauważalne napięcie wewnętrzne. Twoje odpowiedzi ciągną w różnych kierunkach przy podobnych tematach.',
        'Wysoka gęstość sprzeczności. Twój wzorzec zawiera silne sygnały przeciwstawne.',
      ),
    },
    {
      id: 'HP04',
      value: hp.HP04,
      positiveLabel: { en: 'Directness', pl: 'Bezpośredniość' },
      negativeLabel: { en: 'Reflection', pl: 'Refleksyjność' },
      descEn: hpDescription(
        hp.HP04,
        'You answer without visible delay. Your first instinct tends to be your final answer.',
        'Mostly direct. You engage quickly, with occasional longer pauses on specific questions.',
        'Balanced. You sometimes act on instinct, sometimes take time to consider.',
        'You tend to consider before committing. Longer pauses and careful reading are common.',
        'Strong reflection pattern. You read carefully, pause before selecting, and rarely rush.',
      ),
      descPl: hpDescription(
        hp.HP04,
        'Odpowiadasz bez widocznej zwłoki. Twój pierwszy instynkt jest zazwyczaj ostateczną odpowiedzią.',
        'Głównie bezpośredni. Angażujesz się szybko, z okazjonalnymi dłuższymi pauzami przy konkretnych pytaniach.',
        'Zrównoważony. Czasem działasz instynktownie, czasem poświęcasz czas na namysł.',
        'Masz tendencję do rozważania przed zaangażowaniem. Dłuższe pauzy i uważne czytanie są częste.',
        'Silny wzorzec refleksji. Czytasz uważnie, robisz pauzy przed wyborem i rzadko się spieszysz.',
      ),
    },
    {
      id: 'HP05',
      value: hp.HP05,
      positiveLabel: { en: 'Stability', pl: 'Stabilność' },
      negativeLabel: { en: 'Exploration', pl: 'Eksploracja' },
      descEn: hpDescription(
        hp.HP05,
        'You engage with questions in a consistent, committed pattern. Low navigational variability.',
        'Mostly stable. You stay with questions and follow through with limited detours.',
        'Balanced. Some exploration behavior alongside stable engagement.',
        'You tend to explore — swapping, exiting, and returning to revisit your path.',
        'High exploration pattern. Your session shows significant navigational variability and path-switching.',
      ),
      descPl: hpDescription(
        hp.HP05,
        'Angażujesz się w pytania w spójny, zaangażowany wzorzec. Niska zmienność nawigacyjna.',
        'Głównie stabilny. Pozostajesz przy pytaniach i kontynuujesz z ograniczonymi deturami.',
        'Zrównoważony. Pewne zachowanie eksploracyjne obok stabilnego zaangażowania.',
        'Masz tendencję do eksplorowania — wymiany, wychodzenia i powracania do ponownego odwiedzenia swojej ścieżki.',
        'Wysoki wzorzec eksploracji. Twoja sesja pokazuje znaczącą zmienność nawigacyjną i przełączanie ścieżek.',
      ),
    },
  ];
}
