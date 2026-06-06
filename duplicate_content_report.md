# Duplicate Content Report

**Audit date:** 2026-06-06  
**Questions:** 2,650 | **Answers:** 5,300

---

## Duplicate IDs

| Check | Result |
|---|---|
| Duplicate question_id | ✓ PASS — 0 found |
| Duplicate answer_id | ✓ PASS — 0 found |

No ID collisions anywhere in the dataset.

---

## Duplicate Question Text

### Findings

50 groups of questions share identical `question_en` / `question_pl` text.
Each group contains approximately 44–45 questions differing only in `primary_axis`
and answer scoring.

All affected questions are in the Q1201–Q1650 range and have
`production_status = ready_estimated_beta_required`.

**Status: WARN — non-blocking because they are all tagged beta_required.**

### Sample Duplicate Groups

| Question Text (EN, truncated) | Affected IDs |
|---|---|
| "when someone expects a quick decision..." | Q1201, Q1211, Q1221 ... (×45) |
| "when the conversation looks calm on the surface..." | Q1202, Q1212, Q1222 ... (×45) |
| "if you must choose between a convenient answer..." | Q1203, Q1213, Q1223 ... (×45) |
| "in a situation where before an important step..." | Q1204, Q1214, Q1224 ... (×44) |
| "when after a small success, you feel the more important question..." | Q1205, Q1215, Q1225 ... (×45) |
| ... | 45 more groups |

### Root Cause

The beta_required batch uses 10 question templates repeated across axis variants,
resulting in 10 × ~45 = ~450 questions with shared wording. The differentiation
is in axis scoring only, not in user-visible text.

### Required Action (Before Beta Promotion)

Each question in the Q1201–Q1650 range must receive a unique `question_en` and
`question_pl` phrasing that reflects its specific axis focus before being promoted
from `ready_estimated_beta_required` to any `mvp_ready` or `ready_mvp_*` status.

---

## Duplicate Answer Labels

5,300 answers use a relatively small vocabulary of answer labels. Many short
labels ("Yes / No", "I choose X / I choose Y") naturally repeat.

| Label (EN) | Occurrences | Notes |
|---|---|---|
| "i choose feasibility" | 216 | Shared option across question variants |
| "i choose meaning" | 216 | Shared option across question variants |
| "i protect autonomy" | 184 | Shared option |
| "i check the bond" | 184 | Shared option |
| "i secure the ground" | 166 | Shared option |

**Status: EXPECTED — shared option labels are a deliberate design choice for
binary-choice questions where the same verb+object can apply to many scenarios.**

---

## Duplicate TIER_1 Reveals (Cross-Question)

### Findings

495 distinct TIER_1 reveal strings appear across more than one question_id.

| Metric | Value |
|---|---|
| Unique reveal strings shared cross-question | 495 |
| Most shared single reveal | 24 questions |
| Average sharing factor | ~2.4 questions per shared reveal |

### Root Cause

Multiple questions probe the same axis and generate the same "pattern trace" reveal
because the underlying psychological insight is identical across question contexts.

### Status

**WARN — acceptable by design.** Template-pattern reveals are a feature, not a bug.
The pattern engine is designed to detect the same signal across different question
contexts — so the associated reveal text being shared is consistent and correct.

No action required.
