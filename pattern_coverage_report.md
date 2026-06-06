# Pattern Coverage Report

**Audit date:** 2026-06-06  
**Questions:** 2,650 | **Answers:** 5,300

---

## Summary

The v2 dataset achieves **100% pattern engine coverage** across all 2,650 questions
and all 5,300 answers.

---

## Question-Level Pattern Status

| Status | Count | % |
|---|---|---|
| pattern_ready_v2 | 2,650 | 100% |

All questions have `pattern_engine_status = pattern_ready_v2`.
No legacy, disabled, or incomplete entries.

---

## Pattern Metadata Completeness

### Question-level fields (2,650 pattern_ready_v2 questions)

| Field | Present | Missing | Status |
|---|---|---|---|
| pattern_signal_id | 2,650 | 0 | ✓ PASS |
| pattern_axis_direction | 2,650 | 0 | ✓ PASS |
| pattern_confidence_weight | 2,650 | 0 | ✓ PASS |
| pattern_min_occurrences | 2,650 | 0 | ✓ PASS |
| pattern_tags | 2,650 | 0 | ✓ PASS |

### Answer-level fields (5,300 answers)

| Field | Present | % | Status |
|---|---|---|---|
| pattern_signal_id | 5,300 | 100% | ✓ PASS |
| pattern_axis_direction | 5,300 | 100% | ✓ PASS |
| pattern_confidence_weight | 5,300 | 100% | ✓ PASS |
| pattern_min_occurrences | 5,300 | 100% | ✓ PASS |

---

## Pattern Signal IDs

10 unique `pattern_signal_id` values, one per canonical axis:

| Signal ID | Questions |
|---|---|
| AX01_pattern_probe | 306 |
| AX02_pattern_probe | 250 |
| AX03_pattern_probe | 324 |
| AX04_pattern_probe | 234 |
| AX05_pattern_probe | 274 |
| AX06_pattern_probe | 200 |
| AX07_pattern_probe | 356 |
| AX08_pattern_probe | 233 |
| AX09_pattern_probe | 240 |
| AX10_pattern_probe | 233 |

Signal IDs are shared across questions that probe the same axis — this is correct.
The pattern engine accumulates evidence across all questions with the same signal.

---

## Pattern Axis Directions

All 2,650 questions use `bidirectional` axis direction. This means each question
can detect movement toward either pole of its primary axis, depending on the
answer chosen.

| Direction | Count |
|---|---|
| AX07:bidirectional | 356 |
| AX03:bidirectional | 324 |
| AX01:bidirectional | 306 |
| AX05:bidirectional | 274 |
| AX02:bidirectional | 250 |
| AX09:bidirectional | 240 |
| AX04:bidirectional | 234 |
| AX08:bidirectional | 233 |
| AX10:bidirectional | 233 |
| AX06:bidirectional | 200 |

---

## Hidden Signal Coverage

| Status | Count | % |
|---|---|---|
| hidden_signal_deltas_json present | 5,300 | 100% |
| Missing | 0 | 0% |

Full hidden signal (HP01–HP03) coverage at answer level. **PASS.**

---

## WOW Refinement (Reveal Quality)

| Status | Count | % | Notes |
|---|---|---|---|
| replaced_from_wow_pack | 2,400 | 45.3% | Curated high-quality reveals |
| generated_pattern_ready_fields_only | 2,900 | 54.7% | Pattern-ready generated reveals |

The pattern engine has full operational metadata for all 5,300 answers. The
WOW pack curated 2,400 answers specifically for emotional resonance in pattern
reveal moments.

---

## Optional Files (Not Yet in Repository)

The following pattern-related supplemental files are referenced in the spec
but not yet present:

- `pattern_rules.csv` — explicit per-signal pattern detection rules
- `hidden_events.csv` — HP-triggered event payloads
- `emerging_archetype_templates.csv` — axis-threshold archetype emergence templates

Validators skip these gracefully. When added, `PatternRule`, `HiddenEvent`, and
`EmergingArchetypeState` types in `src/types/contentV2.ts` are ready to receive them.
