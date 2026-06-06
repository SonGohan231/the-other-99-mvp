import { BehavioralSummary } from '../utils/behavioralSignals';
import { ReturnToSessionEvent } from '../types';

/**
 * Three canonical hidden parameters derived from behavioral events.
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
 */
export interface CanonicalHP {
  HP01: number; // Confidence (>0) ↔ Hesitation (<0)
  HP02: number; // Openness (>0) ↔ Guardedness (<0)
  HP03: number; // Consistency (>0) ↔ Contradiction (<0)
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Compute canonical HP01/HP02/HP03 from behavioral summary.
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
    skipRatePercent,
    totalAnswerChanges,
    totalUndos,
    totalExits,
    totalSwaps,
    stabilityLabel,
  } = behavioral;

  // HP01: Confidence ↔ Hesitation
  // Base on confidence signal (0-100) shifted to -50..+50 center
  const confidenceBase = avgConfidenceSignal - 50;
  const hesitationFromTime = avgHesitationMs !== null
    ? clamp(avgHesitationMs / 500, 0, 20)  // long hesitation → negative
    : 0;
  const hesitationFromSkips = skipRatePercent * 0.5;  // skips → hesitation (HE001)
  const hesitationFromChanges = clamp(totalAnswerChanges * 5, 0, 20);  // changes → hesitation (HE005)
  const hesitationFromExits = clamp(totalExits * 3, 0, 10);  // exits → hesitation (HE003)
  const HP01 = clamp(
    confidenceBase - hesitationFromTime - hesitationFromSkips - hesitationFromChanges - hesitationFromExits,
    -100, 100,
  );

  // HP02: Openness ↔ Guardedness
  // Base on inverse of avoidance signal
  const opennessBase = 50 - avgAvoidanceSignal;
  const guardednessFromSkips = skipRatePercent * 0.8;   // skip_question → guardedness (HE001)
  const guardednessFromExits = clamp(totalExits * 5, 0, 20);  // return_to_menu → avoidance (HE003)
  const guardednessFromSwaps = clamp(totalSwaps * 5, 0, 15);  // swap_question → guardedness (HE002)
  const HP02 = clamp(
    opennessBase - guardednessFromSkips - guardednessFromExits - guardednessFromSwaps,
    -100, 100,
  );

  // HP03: Consistency ↔ Contradiction
  // Base on inverse of contradiction signal
  const consistencyBase = 50 - avgContradictionSignal;
  const contradictionFromChanges = clamp(totalAnswerChanges * 6, 0, 25);  // answer_change → consistency_pressure (HE005)
  const contradictionFromUndos = clamp(totalUndos * 8, 0, 15);  // undo = strong revision signal
  const stabilityBonus = stabilityLabel === 'stable' ? 15
    : stabilityLabel === 'volatile' ? -15
    : 0;
  // session_resume continuity signal (HE008) — returning is a positive consistency signal
  const resumeBonus = clamp(returnEvents.length * 5, 0, 15);
  const HP03 = clamp(
    consistencyBase - contradictionFromChanges - contradictionFromUndos + stabilityBonus + resumeBonus,
    -100, 100,
  );

  return { HP01: Math.round(HP01), HP02: Math.round(HP02), HP03: Math.round(HP03) };
}

export interface HPDisplayItem {
  id: 'HP01' | 'HP02' | 'HP03';
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
  ];
}
