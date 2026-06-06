# THE OTHER 99 — Content Audit Report (Master)

**Audit date:** 2026-06-06  
**Dataset version:** v2 (pattern_ready_v2)  
**Branch:** claude/the-other-99-mvp-hEKqL

---

## Summary

| Check | Result | Count |
|---|---|---|
| Questions loaded | ✓ PASS | 2,650 |
| Answers loaded | ✓ PASS | 5,300 |
| Duplicate question IDs | ✓ PASS | 0 |
| Duplicate answer IDs | ✓ PASS | 0 |
| Missing PL/EN (questions) | ✓ PASS | 0 |
| Missing PL/EN (answers) | ✓ PASS | 0 |
| Missing safety_label | ✓ PASS | 0 |
| Missing statistic_source_label | ✓ PASS | 0 |
| Missing system_actions | ✓ PASS | 0 |
| Invalid reveal_tier | ✓ PASS | 0 |
| TIER_1 reveal > 200 chars | ✓ PASS | 0 |
| Unknown axis keys in scoring | ✓ PASS | 0 |
| Technical labels in user text | ✓ PASS | 0 |
| Cross-question duplicate reveals | ⚠ WARN | 495 strings |
| Duplicate question text | ⚠ WARN | 50 groups |
| Contradiction singleton pairs | ⚠ WARN | 177 |

**Overall: PASS — 0 hard errors, 3 warnings**

---

## Dataset Composition

### Questions (2,650)

| Production Status | Count | % |
|---|---|---|
| ready_estimated_beta_required | 1,750 | 66% |
| ready_mvp_v1 | 300 | 11% |
| ready_mvp_v2 | 300 | 11% |
| mvp_ready | 300 | 11% |

MVP-ready total: **900 questions** available for launch.  
Beta-required: **1,750 questions** need further review before production deployment.

### Tier Breakdown

| Tier | Count | % |
|---|---|---|
| premium | 1,870 | 71% |
| free | 580 | 22% |
| research_opt_in | 200 | 8% |

### Pattern Engine Status

| Status | Count | % |
|---|---|---|
| pattern_ready_v2 | 2,650 | 100% |

All 2,650 questions are pattern-engine ready. No legacy status values present.

---

## Axis Coverage

All 10 canonical axes (AX01–AX10) are represented in both `primary_axis` (question-level) and `axis_deltas_json` (answer-level scoring). No axis has zero coverage.

| Axis | Questions (primary) | Answers (scoring) | Avg \|Δ\| |
|---|---|---|---|
| AX01 | 306 (11.5%) | 932 (17.6%) | 2.31 |
| AX02 | 250 (9.4%) | 1,180 (22.3%) | 1.85 |
| AX03 | 324 (12.2%) | 990 (18.7%) | 2.31 |
| AX04 | 234 (8.8%) | 1,032 (19.5%) | 1.91 |
| AX05 | 274 (10.3%) | 900 (17.0%) | 2.22 |
| AX06 | 200 (7.5%) | 1,032 (19.5%) | 1.78 |
| AX07 | 356 (13.4%) | 1,026 (19.4%) | 2.39 |
| AX08 | 233 (8.8%) | 1,118 (21.1%) | 1.83 |
| AX09 | 240 (9.1%) | 1,234 (23.3%) | 1.78 |
| AX10 | 233 (8.8%) | 1,156 (21.8%) | 1.81 |

---

## Reveal Copy Quality

| Metric | PL | EN |
|---|---|---|
| Min length | 77 chars | 95 chars |
| Max length | 145 chars | 159 chars |
| Avg length | 99.6 chars | 119.0 chars |
| Missing | 0 | 0 |
| Exceeds 200 chars | 0 | 0 |

100% TIER_1 reveal tier. All reveals within the 200-character hard limit.

---

## Warnings (Non-Blocking)

### W1 — Cross-question duplicate TIER_1 reveals (495 strings)

495 distinct reveal strings appear across multiple questions. This is a systemic
consequence of template-pattern generation (wow_refinement_status). The same
"pattern trace" reveal can apply to multiple questions that score the same axis.
Status: **WARN — acceptable, by design.**

### W2 — Duplicate question text (50 groups, ~1,450 questions)

Questions in the Q1201–Q1650 range share identical `question_en` and `question_pl`
text across axis variants. These are differentiated by `primary_axis` and scoring
but not by user-visible question wording. All have `production_status =
ready_estimated_beta_required` and should be rewritten before beta promotion.
Status: **WARN — must be resolved before promoting from beta_required.**

### W3 — Contradiction singleton pairs (177 of 377 pairs)

177 `contradiction_pair_id` values appear on only one question. The paired question
may be in a future drop (v5 dataset). Status: **WARN — expected for incomplete drops.**

---

## What Is Not Yet in the Repository

The following files are referenced in the spec but are not yet present:

- `v5_questions_1450.csv` / `v5_answers_2900.csv`
- `remaining_mode_items_800.csv` / `remaining_mode_answers_2100.csv`
- `micro_games_300.csv`, `challenges_300.csv`, `secrets_300.csv`
- `hidden_events.csv`, `pattern_rules.csv`, `contradiction_rules.csv`
- `emerging_archetype_templates.csv`, `reveal_dosing_templates.csv`

All validators skip these gracefully when absent.

---

## Validation Commands

```bash
npm run validate:full          # Hard validator — exits 1 on any FAIL
npm run audit:questions        # Question bank breakdown
npm run audit:axes             # Axis coverage
npm run audit:duplicates       # Duplicate IDs and content
npm run audit:reveals          # Reveal length and dosing
npm run audit:patterns         # Pattern engine coverage
npm run audit:contradictions   # Contradiction pair integrity
npm run audit:all              # Run all 6 reporters sequentially
```
