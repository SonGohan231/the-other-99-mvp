# TO99 — SPRINT STAGE PLAN

**Date:** 2026-06-06  
**Current state:** Stage 0 complete  
**Next:** Stage 1 (waiting for confirmation)

---

## Stage map

| Stage | Name | Priority | Dependencies | Status |
|-------|------|----------|--------------|--------|
| 0 | Canon Freeze + Audit | P0 | — | ✓ DONE |
| 1 | Stability + Session Persistence | P1 | Stage 0 | NEXT |
| 2 | Data Contract V2 | P2 | Stage 0 | |
| 3 | Content Validator + Audit | P2 | Stage 2 | |
| 4 | MVP Content Import Path | P2 | Stage 3 | |
| 5 | Scoring Engine + Behavioral Events | P3 | Stage 4 | |
| 6 | Pattern Engine | P4 | Stage 5 | |
| 7 | Contradiction Engine | P4 | Stage 5 | |
| 8 | Emerging Archetype Layer | P4 | Stage 6+7 | |
| 9 | Reveal Dosing + Reward Reveal | P4 | Stage 5 | |
| 10 | Profile Snapshot + Paywall | P5 | Stage 9 | |
| 11 | Honest Social Stats + Human Twin | P5 | Stage 5 | |
| 12 | Debug Panel | P6 | Stage 5 | |
| 13 | Premium UI + Visual Polish | P6 | Stage 10 | |
| 14 | APK, Audio, Haptics, Privacy | P6 | Stage 13 | |

---

## STAGE 1 — Exact Implementation Plan

**Goal:** App must not lose user progress. Confirm existing persistence is solid and close any gaps.

### Current state assessment

Session persistence is already significantly implemented:
- `InProgressTestState` v3 in localStorage (7-day expiry, v2→v3 migration) ✓
- `testContentIds[]`, `currentItemId`, `testAnswerIndex`, `pendingSelection` persisted ✓
- `skipEvents`, `swapEvents`, `exitEvents`, `returnEvents` persisted ✓
- Profile vector in `to99_profile_vector` localStorage key ✓
- Interactions/answers stored separately in `to99_session` via storage.ts ✓

### Remaining gaps to fix

1. **Missing: `queueSeed` / `selectedAnswerDraft` in canonical form**
   - `testContentIds` is saved (full queue) but no explicit `queueSeed`
   - `pendingSelection` saves pre-confirm selection — equivalent of `selectedAnswerDraft` ✓
   - Action: Verify these match the Stage 1 spec requirements; add `queueSeed` if missing

2. **Missing: `userId` in persisted session**
   - Current `InProgressTestState` does not persist `userId`
   - Needed for: cross-device sync awareness, Supabase resume
   - Action: Add `userId?: string | null` to `InProgressTestState`

3. **Missing: `lang` in persisted session**
   - Language not persisted in test state (only in LangContext)
   - If user changes language mid-session on a new load, quiz could load wrong locale
   - Action: Add `lang: string` to `InProgressTestState`

4. **Missing: `startedAt` / `lastSavedAt` timestamps**
   - `updatedAt` exists but `startedAt` is not tracked
   - Action: Add `startedAt: string` recorded on first save

5. **Missing: `premiumState` in session snapshot**
   - Premium unlock status not part of persisted test state
   - Action: Add `premiumState?: { unlocked: boolean }` to `InProgressTestState`

6. **Verify: refresh + resume returns to exact question**
   - `currentItemId` is saved; App.tsx must use it to restore `currentItem`
   - Action: Code trace to confirm App.tsx correctly restores from `currentItemId`

7. **Verify: back navigation does not corrupt scoring**
   - `canUndoAnswer` persists; undo mechanism via `answerUndo.ts` exists
   - Action: Code trace to confirm undo resets vector delta correctly

8. **Verify: session snapshot exportable**
   - `exportFullSession()` in storage.ts exists ✓
   - Action: Confirm export includes `userId`, `lang`, `startedAt`

### Files to inspect and possibly modify

- `src/utils/inProgressTest.ts` — Add `userId`, `lang`, `startedAt`, `premiumState` fields
- `src/App.tsx` — Confirm resume logic uses `currentItemId` to restore position
- `src/utils/storage.ts` — Confirm export includes full state
- `src/screens/DebugPanel.tsx` — Confirm session export button works

### Acceptance criteria

- Progress bar shows correct question position after refresh
- Back navigation restores correct state without scoring corruption
- Skip / swap does not corrupt scoring
- Refresh during reveal phase restores to the question (not mid-reveal)
- Session snapshot JSON includes userId, lang, startedAt, all event queues
- `npm run validate:content` ✓
- `npx tsc --noEmit` ✓
- `npm run build` ✓

---

## STAGE 2 — Exact Implementation Plan (summary)

**Goal:** One formal TypeScript data contract matching v2 database schema.

Key tasks:
1. Create `src/types/content.ts` with `QuestionItem`, `AnswerOption`, `ScoringDelta`
2. Create `src/types/patterns.ts` with `PatternRule`, `PatternSignal`
3. Create `src/types/contradictions.ts` with `ContradictionRule`
4. Create `src/types/revealDosing.ts` with `RevealTier`, `RevealDosingTemplate`
5. Extend `AXIS_MAP` in profileVector.ts to accept `AX01`–`AX10` keys
6. Create `docs/DATA_CONTRACT_V2.md`

**Do not migrate content yet.** Define types first.

---

## STAGE 3 — Exact Implementation Plan (summary)

**Goal:** Validator covers all v2 schema fields.

Key tasks:
1. Extend `scripts/validate-content.mjs` to validate v2 question/answer fields
2. Add reveal tier validation (TIER_1 length check)
3. Add pattern metadata completeness check
4. Produce `CONTENT_AUDIT_REPORT.md`

---

## STAGE 4 — Exact Implementation Plan (summary)

**Goal:** Production-safe v2 content import.

Key tasks:
1. Create v2 CSV loader (`src/utils/csvLoaderV2.ts`)
2. Import `questions_all_2650.csv` + `answers_all_5300.csv` into app-readable format
3. Preserve all pattern/reveal metadata during import
4. Mark current 865-row CSVs as `legacy_seed_corpus`
5. Validate imported content with updated validator

---

## STAGE 5 — Exact Implementation Plan (summary)

**Goal:** Scoring engine outside UI, canonical HP01–HP03.

Key tasks:
1. Add `AX01`–`AX10` keys to `AXIS_MAP`
2. Create `src/engine/canonicalHP.ts` — compute HP01/HP02/HP03 from behavioral events using `hidden_events.csv` mapping
3. Extract scoring logic from UI into pure engine functions
4. Update profile vector storage to support AX01–AX10
5. Wire HP engine into `HiddenParametersScreen.tsx`

---

## STAGES 6–14 — Summary

Implemented only after prior stages are stable:

- **Stage 6:** Pattern Engine (`src/engine/patternEngine.ts`, `src/content/patternRules.json`)
- **Stage 7:** Contradiction Engine (`src/engine/contradictionEngine.ts`, `src/content/contradictionRules.json`)
- **Stage 8:** Emerging Archetype Layer (`src/engine/emergingArchetype.ts`)
- **Stage 9:** Reveal Dosing System — 5-tier reveal with per-answer copy from v2
- **Stage 10:** 51-answer Profile Snapshot trigger + paywall value
- **Stage 11:** Honest social stats + vector similarity Human Twin
- **Stage 12:** Debug panel force-milestone actions
- **Stage 13:** Premium UI polish (no technical labels)
- **Stage 14:** APK, audio, haptics, privacy screen
