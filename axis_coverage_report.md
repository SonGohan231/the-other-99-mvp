# Axis Coverage Report

**Audit date:** 2026-06-06  
**Questions:** 2,650 | **Answers:** 5,300

---

## Summary

All 10 canonical axes (AX01–AX10) have coverage at both question level (primary_axis)
and answer level (axis_deltas_json scoring). No axis is at zero. Distribution is
reasonably balanced with AX07 (13.4%) leading and AX06 (7.5%) lowest.

---

## Primary Axis Coverage (question-level)

| Axis | Questions | % of Total |
|---|---|---|
| AX01 — Curiosity vs. Guardedness | 306 | 11.5% |
| AX02 — Logic vs. Emotion | 250 | 9.4% |
| AX03 — Authenticity vs. Adaptation | 324 | 12.2% |
| AX04 — Independence vs. Belonging | 234 | 8.8% |
| AX05 — Action vs. Hesitation | 274 | 10.3% |
| AX06 — Idealism vs. Pragmatism | 200 | 7.5% |
| AX07 — Stability vs. Transformation | 356 | 13.4% |
| AX08 — Nature vs. Technology | 233 | 8.8% |
| AX09 — Security vs. Thrill | 240 | 9.1% |
| AX10 — Present vs. Future | 233 | 8.8% |

**Coverage: 10/10 axes — PASS**

---

## Answer-Level Axis Delta Coverage

| Axis | Answers | % of Total | Avg \|Δ\| |
|---|---|---|---|
| AX01 | 932 | 17.6% | 2.31 |
| AX02 | 1,180 | 22.3% | 1.85 |
| AX03 | 990 | 18.7% | 2.31 |
| AX04 | 1,032 | 19.5% | 1.91 |
| AX05 | 900 | 17.0% | 2.22 |
| AX06 | 1,032 | 19.5% | 1.78 |
| AX07 | 1,026 | 19.4% | 2.39 |
| AX08 | 1,118 | 21.1% | 1.83 |
| AX09 | 1,234 | 23.3% | 1.78 |
| AX10 | 1,156 | 21.8% | 1.81 |

**All 10 axes: PASS**  
Average delta strength ranges from 1.78 to 2.39 — consistent scoring intensity across axes.

---

## Pattern Axis Directions

All 2,650 questions use `bidirectional` pattern_axis_direction:

| Direction | Count | % |
|---|---|---|
| AX07:bidirectional | 356 | 13.4% |
| AX03:bidirectional | 324 | 12.2% |
| AX01:bidirectional | 306 | 11.5% |
| AX05:bidirectional | 274 | 10.3% |
| AX02:bidirectional | 250 | 9.4% |
| AX09:bidirectional | 240 | 9.1% |
| AX04:bidirectional | 234 | 8.8% |
| AX08:bidirectional | 233 | 8.8% |
| AX10:bidirectional | 233 | 8.8% |
| AX06:bidirectional | 200 | 7.5% |

All pattern probes are bidirectional — scoring can move in either pole direction
depending on the answer chosen.

---

## Unknown Axis Keys

None found. All `axis_deltas_json` entries use only the 10 canonical keys AX01–AX10.

**PASS — no legacy pole names (curiosity, openness, etc.) present in scoring data.**

---

## Notes

- AX06 (Idealism vs. Pragmatism) has slightly lower coverage (7.5% of primary_axis, 19.5% of answer scoring). Within acceptable range.
- AX07 (Stability vs. Transformation) leads in primary coverage (13.4%) and highest average delta strength (2.39) — the most discriminating axis.
- Answer-level coverage differs from primary_axis distribution because many questions score secondary axes via their answer deltas.
