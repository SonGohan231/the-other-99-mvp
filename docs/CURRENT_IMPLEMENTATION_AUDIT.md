# TO99 — CURRENT IMPLEMENTATION AUDIT

**Date:** 2026-06-06  
**Commit:** ed10905  
**Stage:** 0 (Pre-implementation audit)

---

## Summary

The current app is a working MVP SPA (React 18 + Vite 5 + TypeScript + Supabase). Session persistence, behavioral event recording, and content validation are solid. The scoring engine and hidden parameter system are functional but structurally misaligned with the v2 canonical specification. The insight engines (Pattern, Contradiction, Emerging Archetype, Reveal Dosing) do not exist.

---

## Where Things Live

### Content / Questions
- **Source:** `public/content.csv`, `public/content_en_v2.csv`, `public/content_premium_en_v1.csv`
- **Format:** Semicolon-delimited, 865 unique rows total, now with v2 contract fields
- **Loader:** `src/utils/csvLoader.ts` (PapaParse, header mode)
- **Type:** `ContentItem` in `src/types.ts`

### Scoring
- **Engine:** `src/utils/profileVector.ts` — `applyDeltas()`, `emptyVector()`, `loadVector()`
- **Profile Vector:** 8 named dimensions: `{control, security, risk, emotion, change, independence, connection, curiosity}`
- **Storage:** localStorage key `to99_profile_vector`
- **⚠ CONFLICT:** v2 database uses `axis_deltas_json` with keys `AX01`–`AX10`. Current `AXIS_MAP` does not include `AX01`, `AX02` etc. V2 content would score as zero without changes.

### Archetypes
- **Source:** `src/utils/archetypes.ts`
- **IDs:** 12 archetypes — `explorer, architect, rebel, guardian, mirror, strategist, weaver, anchor, catalyst, observer, alchemist, dreamer` ✓
- **Canon marker:** `// canon_version: TO99_ARCHETYPE_CANON_1.0` ✓
- **No legacy IDs:** 'seeker', 'pathfinder' not present ✓
- **Catalyst PL name:** Uses "Iskra" ✓
- **Blends:** `src/content/archetypeBlends.ts` — 66 pairs ✓
- **Blend engine:** `computeArchetypeMix()` in archetypes.ts ✓

### Hidden Parameters
- **Source:** `src/utils/hiddenParameters.ts`
- **Current behavior:** Computes 12 custom behavioral parameters (Control Under Uncertainty, Decision Latency, etc.)
- **⚠ CONFLICT:** Canon specifies exactly 3 hidden parameters: HP01 Confidence↔Hesitation, HP02 Openness↔Guardedness, HP03 Consistency↔Contradiction. Current implementation computes 12 that don't map to canon HP names. These 12 are derived from the 8D vector, not from behavioral events.
- **Screen:** `src/screens/HiddenParametersScreen.tsx` — shows 12 parameters to users ✓ (works, just misnamed vs canon)

### Behavioral Events
- **Storage:** `src/utils/inProgressTest.ts` — `InProgressTestState` with `skipEvents`, `swapEvents`, `exitEvents`, `returnEvents`
- **Persistence:** localStorage, version 3, 7-day expiry ✓
- **Event types:** `SkipEvent`, `SwapEvent`, `ExitToMenuEvent`, `ReturnToSessionEvent` in `src/types.ts` ✓
- **Computation:** `src/utils/behavioralSignals.ts` — `computeBehavioralMetadata()`, `summarizeBehavioralProfile()` ✓
- **Wired to summary:** All 5 call sites pass event queues ✓
- **⚠ GAP:** v2 spec maps behavioral events to HP01/HP02/HP03 specifically. Current code feeds raw behavioral signals but does NOT update canonical HP scores.

### Session State
- **Storage:** `src/utils/inProgressTest.ts` (localStorage, v3)
- **Persisted:** testNumber, sessionId, testAnswerIndex, testContentIds, currentItemId, pendingAnswer, pendingSelection, selectedCard, canUndoAnswer, nextCardIds, all event queues ✓
- **7-day expiry, v2→v3 migration** ✓
- **Additional storage:** `src/utils/storage.ts` — interactions, answers, profile state

### Reveal / Reward
- **Current flow:** 5-phase state machine: `question → saved → analyzing → comparing → insight`
- **Phase text:** Static strings from `src/i18n.ts` + `src/content/revealTemplates.ts`
- **⚠ GAP:** V2 specifies 5 reveal tiers (TIER_1–TIER_5) triggered at different answer counts. Current app only has the answer-level 5-phase reveal (≈ TIER_1 only). Tiers 2–5 are not implemented.
- **⚠ GAP:** V2 answers carry `answer_reveal_short_pl/en` (TIER_1 copy). Current app uses generic i18n strings, not per-answer reveal copy from the database.

### Social Stats
- **Labels:** `estimated` used in CSVs ✓
- **Computation:** `src/utils/communityVotes.ts` — `submitVote()`, `getDistributionLabel()` ✓
- **`DistributionLabel`:** 4 values — `'Estimated distribution' | 'Early community signal' | 'Community distribution' | 'Not enough data yet'` ✓
- **⚠ PARTIAL:** Labels are correct in vote system but not consistently propagated everywhere.

### Profile Snapshot
- **Screen:** `src/screens/ProfileSnapshotScreen.tsx` — exists
- **Trigger:** Manual (reached from test summary or debug)
- **⚠ GAP:** V2 spec requires automatic snapshot at 51 answers. No 51-answer trigger exists.

### Human Twin
- **Computation:** `calcHumanTwinMatch()` in profileVector.ts — placeholder (math formula, not vector similarity)
- **⚠ GAP:** V2 spec requires vector similarity, answer overlap, archetype mix similarity. Current is a stub.

### Debug Panel
- **Screen:** `src/screens/DebugPanel.tsx` ✓
- **Features:** Behavioral event counts, export full JSON, copy session, view events ✓
- **⚠ GAP:** V2 spec requires: force 51 snapshot, force 85 milestone, force 100 radar, unlock premium, simulate refresh/background/resume.

### Pattern Engine
- **Status:** ❌ NOT IMPLEMENTED
- **V2 data:** 20 pattern rules in `pattern_rules.csv`

### Contradiction Engine
- **Status:** ❌ NOT IMPLEMENTED
- **V2 data:** 200 contradiction rules in `contradiction_rules.csv`

### Emerging Archetype Layer
- **Status:** ❌ NOT IMPLEMENTED
- **V2 data:** 4 templates in `emerging_archetype_templates.csv`

### Reveal Dosing System
- **Status:** ❌ NOT IMPLEMENTED (TIER_1 only, statically)
- **V2 data:** 5-tier dosing rules in `reveal_dosing_templates.csv`

---

## Confirmed Canon-Correct Items

| Item | Status |
|------|--------|
| 10 axes validated in content | ✓ |
| 12 archetypes (correct IDs) | ✓ |
| No 'seeker' or 'pathfinder' | ✓ |
| Canon marker in archetypes.ts | ✓ |
| Catalyst = "Iskra" | ✓ |
| Session persistence v3 | ✓ |
| Behavioral event queues | ✓ |
| CI pipeline (tsc + build + validate) | ✓ |
| Content validation script | ✓ |
| v2 contract fields in CSVs | ✓ |
| safety_label, reveal_template_id | ✓ |
| No credentials in code | ✓ |
| Honest social stat labels | ✓ |

---

## Critical Conflicts (Must Fix Before v2 Import)

### CONFLICT 1 — Scoring axis ID mismatch
**Severity:** BLOCKER for v2 content import

- Current: `axis_delta_json` keys are named poles (`curiosity`, `security`, etc.)
- V2: `axis_deltas_json` keys are canonical IDs (`AX01`, `AX02`, etc.)
- `AXIS_MAP` in `profileVector.ts` does not include AX01–AX10 keys
- Loading v2 content without this fix would silently produce zero scoring

**Fix:** Extend `AXIS_MAP` to map `AX01`→`curiosity`, `AX02`→`emotion`, etc.  
OR redesign `ProfileVector` to use AX01–AX10 keys directly (larger change, Stage 5).

### CONFLICT 2 — Hidden Parameters are not HP01/HP02/HP03
**Severity:** MAJOR (canon mismatch, not a blocker for P1/P2)

- Current: 12 custom parameters computed from 8D vector
- Canon: 3 parameters (HP01, HP02, HP03) computed from behavioral events
- `hidden_events.csv` explicitly maps each event to HP01/HP02/HP03 deltas

**Fix:** Add canonical HP computation layer in Stage 5, fed by behavioral events.  
Current 12-parameter system can remain as the implementation detail for display until then.

### CONFLICT 3 — Content schema mismatch
**Severity:** BLOCKER for v2 content import

- Current CSVs: semicolon-delimited, `prompt_pl`, `prompt_en`, `answer_options_pl`
- V2: comma-delimited, separate `questions` and `answers` CSVs, `question_pl`, `label_pl`, etc.
- `csvLoader.ts` cannot load v2 format without changes

**Fix:** Stage 2 / Stage 4 — create new loader for v2 format.  
Existing legacy CSVs remain active until import is complete.

### CONFLICT 4 — No per-answer reveal copy
**Severity:** MAJOR (affects reveal quality from TIER_1 onward)

- Current: generic i18n reveal text per rarity tier
- V2: per-answer `answer_reveal_short_pl/en` (TIER_1), `pattern_reveal_pl/en` (TIER_2), etc.

**Fix:** Stage 9 — implement Reveal Dosing System reading per-answer copy.

---

## Files Likely to Change in Later Stages

| File | Stage | Expected Change |
|------|-------|----------------|
| `src/utils/profileVector.ts` | 2/5 | Add AX01–AX10 to AXIS_MAP or redesign |
| `src/utils/hiddenParameters.ts` | 5 | Add canonical HP01/HP02/HP03 computation |
| `src/utils/csvLoader.ts` | 4 | Add v2 CSV loader (separate questions/answers) |
| `src/types.ts` | 2 | Add v2 types (QuestionItem, AnswerOption, etc.) |
| `src/screens/InteractionScreen.tsx` | 9 | Use per-answer reveal copy from v2 |
| `src/screens/RewardScreen.tsx` | 9 | Connect to Reveal Dosing System |
| `src/screens/DebugPanel.tsx` | 12 | Add force-milestone actions |
| `src/screens/ProfileSnapshotScreen.tsx` | 10 | Wire 51-answer trigger |
| `scripts/validate-content.mjs` | 3 | Extend for v2 schema fields |
| `supabase/schema.sql` | 5/11 | Add social_stats, profile_vectors tables |

---

## New Files to Create in Later Stages

| File | Stage |
|------|-------|
| `src/engine/patternEngine.ts` | 6 |
| `src/engine/contradictionEngine.ts` | 7 |
| `src/engine/emergingArchetype.ts` | 8 |
| `src/engine/revealDosing.ts` | 9 |
| `src/engine/canonicalHP.ts` | 5 |
| `src/content/patternRules.json` | 6 |
| `src/content/contradictionRules.json` | 7 |
| `src/content/emergingArchetypeTemplates.json` | 8 |
| `src/content/revealDosingTemplates.json` | 9 |
| `src/types/patterns.ts` | 2/6 |
| `src/types/contradictions.ts` | 2/7 |
| `src/types/revealDosing.ts` | 2/9 |
| `docs/DATA_CONTRACT_V2.md` | 2 |
