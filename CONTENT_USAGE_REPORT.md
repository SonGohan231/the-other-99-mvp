# THE OTHER 99 — Content Usage Audit Report

**Audit date:** 2026-06-06  
**Scope:** Read-only inspection — no code modified  
**Branch:** claude/the-other-99-mvp-hEKqL

---

## Executive Summary

The v2 Pattern Ready database (`questions_all_2650.csv` + `answers_all_5300.csv`) **exists in the repository but is completely unreachable by users at runtime.**

The application runs entirely on three legacy v1 semicolon-delimited CSVs with a different column schema, different axis notation, and a different scoring model. A complete v2 content loader (`csvLoaderV2.ts`) was implemented but **is never imported or called anywhere in the codebase.**

Every insight engine (Pattern, Contradiction, Emerging Archetype, Reveal Dosing) exists only as TypeScript type definitions — zero runtime implementation.

---

## Active Content Pipeline

```
App.tsx
  └── loadContent()          ← src/utils/csvLoader.ts
        ├── /content.csv              (200 rows, semicolon-delimited, v1 schema)
        ├── /content_en_v2.csv        (160 rows, semicolon-delimited, v1 schema)
        └── /content_premium_en_v1.csv (505 rows, semicolon-delimited, v1 schema)
              │
              ▼
        Merge + deduplicate by id
        Filter: must have prompt_pl or prompt_en
              │
              ▼
        selectProfileTestContent()   ← src/utils/contentSelector.ts
              │
              ▼
        17 items selected per quiz session  (TEST_TOTAL = 17, hardcoded in App.tsx:74)
```

### Active files (runtime imports confirmed)

| File | Rows | Delimiter | Schema | Status |
|---|---|---|---|---|
| public/content.csv | 200 | `;` | v1 (pole names) | ACTIVE |
| public/content_en_v2.csv | 160 | `;` | v1 (pole names) | ACTIVE |
| public/content_premium_en_v1.csv | 505 | `;` | v1 (pole names) | ACTIVE |
| **Total pool** | **~865** | | | |

After deduplication, the effective content pool is approximately **700–800 unique items**.  
Per quiz session, exactly **17 items** are selected.

### Legacy schema — what is actually scored

The active CSVs use **old pole-name axis notation**, not the canonical AX01–AX10 system:

```json
{"emotion": 5, "belonging": 3, "guardedness": 2}
{"transformation": 4, "idealism": 3, "consistency": -2}
```

These map to the old 8-dimensional vector — **not** the 10 canonical axes (AX01–AX10).  
`content_contract_status` on all visible rows: `migrated_needs_editorial_review`

---

## v2 Database Status

### Loader status

| File | Exists | Called at runtime | Where defined | Records reachable |
|---|---|---|---|---|
| src/utils/csvLoaderV2.ts | ✓ YES | ✗ NEVER | (orphaned module) | — |
| src/types/contentV2.ts | ✓ YES | type-only | (no runtime code) | — |

`csvLoaderV2.ts` exports `loadContentV2()` which correctly:
- fetches `/v2/questions_all_2650.csv` and `/v2/answers_all_5300.csv`
- parses and joins them on `question_id`
- maps to `ContentItemV2` with AX01–AX10 scoring

**This function is never imported or called in App.tsx or any other source file.**

### v2 CSV file status

| Dataset | File exists in repo | Runtime import | Records reachable by users |
|---|---|---|---|
| questions_all_2650 | ✓ YES (2.3 MB) | ✗ NO | **0** |
| answers_all_5300 | ✓ YES (18 MB) | ✗ NO | **0** |
| remaining_mode_items_800 | ✗ NO | ✗ NO | 0 |
| remaining_mode_answers_2100 | ✗ NO | ✗ NO | 0 |
| micro_games_300 | ✗ NO | ✗ NO | 0 |
| challenges_300 | ✗ NO | ✗ NO | 0 |
| secrets_300 | ✗ NO | ✗ NO | 0 |
| hidden_events | ✗ NO | ✗ NO | 0 |
| pattern_rules | ✗ NO | ✗ NO | 0 |
| contradiction_rules | ✗ NO | ✗ NO | 0 |
| emerging_archetype_templates | ✗ NO | ✗ NO | 0 |
| reveal_dosing_templates | ✗ NO | ✗ NO | 0 |

---

## Content Totals

| Metric | Count |
|---|---|
| Total questions available in repository | ~3,515 (865 legacy + 2,650 v2) |
| Total answers available in repository | 5,300 v2 (+ embedded in legacy CSVs) |
| Total questions currently reachable by users | ~700–800 (legacy pool only) |
| Total questions per quiz session | **17** (hard limit) |
| Total v2 questions reachable | **0** |
| Total v2 answers reachable | **0** |

---

## Engine Status

| System | TypeScript types | Runtime implementation | Connected to quiz | Data source |
|---|---|---|---|---|
| Pattern Engine | ✓ defined | ✗ NONE | ✗ NO | ✗ NONE |
| Contradiction Engine | ✓ defined | ✗ NONE | ✗ NO | ✗ NONE |
| Emerging Archetype Engine | ✓ defined | ✗ NONE | ✗ NO | ✗ NONE |
| Reveal Dosing Engine | ✓ defined | ✗ NONE | ✗ NO | ✗ NONE |
| Hidden Parameters (HP01–HP03) | ✓ defined | ✓ **EXISTS** in src/engine/canonicalHP.ts | ✓ **CONNECTED** | Behavioral events |
| Archetype Blends | ✓ defined | ✓ hardcoded in src/content/ | ✓ partial | Static TS files |

The only active insight computation is `canonicalHP.ts` — it derives HP01, HP02, HP03
from behavioral events (response time, answer changes, question skips). This runs on
behavioral signals, not on content data.

---

## src/engine/ and src/content/ Files

### src/engine/ — what exists

| File | Purpose | Connected to quiz |
|---|---|---|
| canonicalHP.ts | HP01/HP02/HP03 from behavioral events | ✓ YES |

No `patternEngine.ts`, `contradictionEngine.ts`, `emergingArchetype.ts`, `revealDosing.ts`.

### src/content/ — all static TypeScript

| File | Content | Source |
|---|---|---|
| archetypeContent.ts | 12 archetype definitions | Hardcoded |
| archetypeBlends.ts | Archetype blend profiles | Hardcoded |
| milestones.ts | Quiz milestone definitions | Hardcoded |
| profileInsights.ts | Profile insight copy | Hardcoded |
| revealTemplates.ts | 6 reveal copy templates | Hardcoded |

None of these are loaded from v2 CSV files.

---

## Active vs. Legacy vs. Ignored Classification

### ACTIVE at runtime

- `public/content.csv` — v1 questions (legacy schema, old pole names)
- `public/content_en_v2.csv` — v1 questions EN (legacy schema, old pole names)
- `public/content_premium_en_v1.csv` — v1 premium questions (legacy schema)
- `src/content/*.ts` — hardcoded archetype/reveal/milestone content
- `src/engine/canonicalHP.ts` — behavioral HP engine
- `public/seed/semantic-v3/runtime_seed.json` — community vote seed

### IMPLEMENTED BUT DISCONNECTED (orphaned)

- `public/v2/questions_all_2650.csv` — exists, never loaded
- `public/v2/answers_all_5300.csv` — exists, never loaded
- `src/utils/csvLoaderV2.ts` — correct implementation, never imported
- `src/types/contentV2.ts` — type definitions only, no runtime consumption

### NOT YET IN REPOSITORY

- `public/v2/remaining_mode_items_800.csv`
- `public/v2/remaining_mode_answers_2100.csv`
- `public/v2/micro_games_300.csv`
- `public/v2/challenges_300.csv`
- `public/v2/secrets_300.csv`
- `public/v2/hidden_events.csv`
- `public/v2/pattern_rules.csv`
- `public/v2/contradiction_rules.csv`
- `public/v2/emerging_archetype_templates.csv`
- `public/v2/reveal_dosing_templates.csv`

### LEGACY — active but superseded

- `public/content.csv`, `public/content_en_v2.csv`, `public/content_premium_en_v1.csv`
  → These are the **only** questions users see today. They use old pole-name scoring.
  → `content_contract_status = migrated_needs_editorial_review` on all visible rows.
  → Must remain active until Stage 4 import switches the pipeline.

---

## Missing Integrations

| Integration | Required by | Status |
|---|---|---|
| `loadContentV2()` called from App.tsx | Stage 4 | ✗ MISSING |
| `selectProfileTestContent()` adapted for ContentItemV2 | Stage 4 | ✗ MISSING |
| Quiz queue uses AX01–AX10 scoring | Stage 4 | ✗ MISSING |
| Pattern Engine reads pattern_signal_id from loaded questions | Stage 6 | ✗ MISSING |
| Contradiction Engine reads contradiction_pair_id | Stage 7 | ✗ MISSING |
| TIER_1 reveal from `answer_reveal_short_pl/en` shown after each answer | Stage 9 | ✗ MISSING |
| TIER_2 pattern reveal gating | Stage 9 | ✗ MISSING |
| TIER_3 snapshot at 20–30 answers | Stage 9 | ✗ MISSING |

---

## Schema Gap Summary

| Property | Legacy CSVs | v2 CSVs | Gap |
|---|---|---|---|
| Delimiter | `;` (semicolon) | `,` (comma) | Different |
| Axis notation | `emotion`, `belonging`, `transformation` ... | `AX01`–`AX10` | Incompatible |
| Axis count | ~8 pole names | 10 canonical axes | Different |
| Answer reveals | `reward_after_answer_pl` (long form) | `answer_reveal_short_pl/en` + 4 tier fields | Different |
| Pattern metadata | Not present | 6 `pattern_*` columns | Gap |
| Contradiction metadata | Not present | `contradiction_pair_id` | Gap |
| Question ID format | `TO99-XXXX` | `QXXXX` | Different |
| Answer format | `answer_options_pl` pipe-delimited string | Separate answer CSV rows | Different |

The legacy and v2 formats are **incompatible at the data level**. Stage 4 cannot be a
simple flag switch — it requires wiring `csvLoaderV2.ts` into `App.tsx` and adapting
`contentSelector.ts` to understand `ContentItemV2`.

---

## Recommended Next Stage

**Stage 4 (MVP Question Corpus Import) is the immediate blocker.**

The minimum viable Stage 4 work:

1. Import `loadContentV2()` into `App.tsx` (replace or alongside `loadContent()`)
2. Adapt `selectProfileTestContent()` to accept `ContentItemV2` (uses `questionPl/En`, `answers[].labelPl/En`, `answers[].answerRevealShortPl/En`)
3. Wire TIER_1 reveal (`answer_reveal_short_pl/en`) into the reward screen after each answer
4. Filter on `productionStatus` — use only `mvp_ready`, `ready_mvp_v1`, `ready_mvp_v2` (900 questions) for initial launch, or all 2,650 for testing
5. Confirm `TEST_TOTAL` can be raised from 17 toward a longer session (50–100 answers for pattern detection to work)
6. Update `contentSelector.ts` to use AX01–AX10 for category/axis-based selection

Until Stage 4 is complete, the entire v2 database (2,650 questions, 5,300 answers,
all pattern metadata, all TIER_1 reveals) is **completely invisible to users**.

---

## Is Stage 4 Content Import Still Required?

**YES.**

The v2 Pattern Ready database exists in the repository and the loader is correctly
implemented — but neither has ever been connected to the running application.

Every user today answers questions from a 865-row legacy dataset with old pole-name
scoring, no pattern metadata, no TIER_1 reveals, and a hard cap of 17 questions per
session. The 2,650 v2 questions, 5,300 v2 answers, all per-answer TIER_1 reveals,
all pattern signals, and all contradiction pairs are unreachable.

Stage 4 is not optional. It is the connection between the content that exists and
the users who cannot see it.
