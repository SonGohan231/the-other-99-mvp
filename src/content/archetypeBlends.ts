import { ArchetypeId } from '../utils/archetypes';

// EN modifier (applied to primary archetype name as "The [modifier] [primary]")
const MODIFIER_EN: Record<ArchetypeId, string> = {
  explorer:   'Restless',
  architect:  'Controlled',
  rebel:      'Burning',
  guardian:   'Protective',
  mirror:     'Quiet',
  strategist: 'Strategic',
  weaver:     'Weaving',
  anchor:     'Soft',
  catalyst:   'Driven',
  observer:   'Watchful',
  alchemist:  'Creative',
  dreamer:    'Dreaming',
};

// PL modifier — precedes the PL primary name
const MODIFIER_PL: Record<ArchetypeId, string> = {
  explorer:   'Niespokojny',
  architect:  'Kontrolowany',
  rebel:      'Płonący',
  guardian:   'Opiekuńczy',
  mirror:     'Cichy',
  strategist: 'Strategiczny',
  weaver:     'Tkający',
  anchor:     'Łagodny',
  catalyst:   'Nieugaszony',
  observer:   'Uważny',
  alchemist:  'Twórczy',
  dreamer:    'Marzyciel',
};

const NAME_EN: Record<ArchetypeId, string> = {
  explorer:   'Explorer',
  architect:  'Architect',
  rebel:      'Rebel',
  guardian:   'Guardian',
  mirror:     'Mirror',
  strategist: 'Strategist',
  weaver:     'Weaver',
  anchor:     'Anchor',
  catalyst:   'Catalyst',
  observer:   'Observer',
  alchemist:  'Alchemist',
  dreamer:    'Dreamer',
};

const NAME_PL: Record<ArchetypeId, string> = {
  explorer:   'Odkrywca',
  architect:  'Architekt',
  rebel:      'Buntownik',
  guardian:   'Strażnik',
  mirror:     'Lustro',
  strategist: 'Strateg',
  weaver:     'Tkacz',
  anchor:     'Kotwica',
  catalyst:   'Iskra',
  observer:   'Obserwator',
  alchemist:  'Alchemik',
  dreamer:    'Marzyciel',
};

// Returns blend name like "The Restless Guardian" (EN) or "Niespokojny Strażnik" (PL)
// primary = higher-percentage archetype, secondary = second-highest
export function getArchetypeBlendName(
  primary: ArchetypeId,
  secondary: ArchetypeId,
  lang: 'en' | 'pl',
): string {
  if (primary === secondary) {
    return lang === 'pl' ? `Czysty ${NAME_PL[primary]}` : `The Pure ${NAME_EN[primary]}`;
  }
  if (lang === 'pl') {
    return `${MODIFIER_PL[secondary]} ${NAME_PL[primary]}`;
  }
  return `The ${MODIFIER_EN[secondary]} ${NAME_EN[primary]}`;
}

// Returns a description of what the blend means
export function getArchetypeBlendDescription(
  primary: ArchetypeId,
  secondary: ArchetypeId,
  lang: 'en' | 'pl',
): string {
  const name = getArchetypeBlendName(primary, secondary, lang);
  if (lang === 'pl') {
    return `${name} — archetyp ${NAME_PL[primary]} z wyraźnym wpływem ${NAME_PL[secondary]}. To nie jest jeszcze twój ostateczny profil.`;
  }
  return `${name} — the ${NAME_EN[primary]} archetype with a clear ${NAME_EN[secondary]} influence. This is not your final profile yet.`;
}
