/**
 * Reveal template definitions for the 5-phase reward reveal sequence.
 * Each template_id maps to phase-specific microcopy for EN and PL.
 *
 * Phases: question → saved → analyzing → comparing → insight
 *
 * Templates are keyed by reveal_template_id from content CSVs.
 * InsightCopy is the only phase that varies meaningfully by template;
 * saved/analyzing use the same loading copy across all templates.
 */

export interface RevealTemplate {
  id: string;
  insightCopy: {
    en: string;
    pl: string;
  };
}

const templates: RevealTemplate[] = [
  {
    id: 'reveal_standard',
    insightCopy: {
      en: 'Your answer is now part of the pattern.',
      pl: 'Twoja odpowiedź stała się częścią wzorca.',
    },
  },
  {
    id: 'reveal_rare',
    insightCopy: {
      en: 'This question reaches somewhere most people avoid.',
      pl: 'To pytanie sięga miejsc, których większość unika.',
    },
  },
  {
    id: 'reveal_epic',
    insightCopy: {
      en: 'Few questions cut this deep. Your pattern is forming.',
      pl: 'Niewiele pytań sięga tak głęboko. Twój wzorzec się kształtuje.',
    },
  },
  {
    id: 'reveal_legendary',
    insightCopy: {
      en: 'This is the edge of the profile. What you said here matters.',
      pl: 'To granica profilu. To, co tu powiedziałeś, ma znaczenie.',
    },
  },
  {
    id: 'reveal_sensitive',
    insightCopy: {
      en: 'Sensitive territory. Your response reveals something real.',
      pl: 'Wrażliwy obszar. Twoja odpowiedź ujawnia coś prawdziwego.',
    },
  },
  {
    id: 'reveal_open',
    insightCopy: {
      en: 'Open questions leave the most honest trace.',
      pl: 'Otwarte pytania zostawiają najbardziej szczery ślad.',
    },
  },
];

const templateMap = new Map<string, RevealTemplate>(
  templates.map((t) => [t.id, t]),
);

export function getRevealTemplate(id: string | undefined): RevealTemplate | null {
  if (!id) return null;
  return templateMap.get(id) ?? null;
}
