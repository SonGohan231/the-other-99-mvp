# Question Quality Report

**Audit date:** 2026-06-06  
**Questions:** 2,650  
**Answers:** 5,300

---

## Overall Quality

All 2,650 questions pass hard validation:

| Check | Result |
|---|---|
| question_pl present | ✓ 2,650 / 2,650 |
| question_en present | ✓ 2,650 / 2,650 |
| safety_label present | ✓ 2,650 / 2,650 |
| statistic_source_label present | ✓ 2,650 / 2,650 |
| system_actions present | ✓ 2,650 / 2,650 |
| ≥ 2 answers per question | ✓ 2,650 / 2,650 |
| Technical labels in text | ✓ 0 violations |

---

## Production Status

| Status | Count | Notes |
|---|---|---|
| `ready_mvp_v1` | 300 | Cleared for MVP launch |
| `ready_mvp_v2` | 300 | Cleared for MVP launch |
| `mvp_ready` | 300 | Cleared for MVP launch |
| `ready_estimated_beta_required` | 1,750 | Needs copy review before promotion |

**900 questions** are launch-ready. The 1,750 beta_required questions include the
Q1201–Q1650 duplicate-text groups that must receive unique question wording before
being promoted.

---

## Tier Breakdown

| Tier | Count | % |
|---|---|---|
| `premium` | 1,870 | 70.6% |
| `free` | 580 | 21.9% |
| `research_opt_in` | 200 | 7.5% |

Free tier provides ~580 questions for non-paying users. Premium gate at 580 questions.

---

## Top Content Categories (EN)

| Category | Count |
|---|---|
| Consistency and tension | 400 |
| Controversial choices | 300 |
| Transparent product research | 200 |
| Archetype: Mirror | 150 |
| Mask and Core | 144 |
| Pressure | 141 |
| Contradiction | 141 |
| Shadow | 139 |
| Relationships | 136 |
| Archetype: Weaver | 100 |
| Archetype: Catalyst | 100 |
| Archetype: Dreamer | 100 |
| Uncomfortable questions | 100 |
| Daily life | 39 |
| Future | 37 |

---

## Sensitivity & Controversy

### Sensitivity (1–10 scale)

| Band | Count | % |
|---|---|---|
| Low (1–3) | 2,550 | 96.2% |
| Mid (4–7) | 100 | 3.8% |
| High (8–10) | 0 | 0% |

### Controversy (1–10 scale)

| Band | Count | % |
|---|---|---|
| Low (1–3) | 2,350 | 88.7% |
| Mid (4–7) | 300 | 11.3% |
| High (8–10) | 0 | 0% |

Profile: predominantly low-sensitivity questions. No high-sensitivity or high-controversy
questions in the current dataset — appropriate for a broad-audience MVP.

---

## Answers Per Question

All 2,650 questions have exactly **2 answers** (binary-choice format).

---

## Known Issue: Duplicate Question Text (Beta-Required Group)

Questions Q1201–Q1650 share question wording across axis variants. Each group of 10
question templates is repeated ~44–45 times with different `primary_axis` and scoring
but identical user-facing text. These are all tagged `ready_estimated_beta_required`
and must receive unique wording before promotion.

**Action required before beta promotion:** Replace duplicate `question_en` / `question_pl`
text in the Q1201–Q1650 range with axis-specific, unique phrasings.
