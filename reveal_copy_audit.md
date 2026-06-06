# Reveal Copy Audit

**Audit date:** 2026-06-06  
**Answers audited:** 5,300

---

## TIER_1 Reveal Length

TIER_1 reveals are shown after every answer. The hard cap is 200 characters.

### Polish (answer_reveal_short_pl)

| Metric | Value |
|---|---|
| Min | 77 chars |
| Max | 145 chars |
| Average | 99.6 chars |
| Missing | 0 |
| Exceeds 200 chars | 0 ✓ |

### English (answer_reveal_short_en)

| Metric | Value |
|---|---|
| Min | 95 chars |
| Max | 159 chars |
| Average | 119.0 chars |
| Missing | 0 |
| Exceeds 200 chars | 0 ✓ |

**Both languages: PASS — all reveals within 200-character limit.**

---

## Length Distribution (EN)

| Range | Answers | % |
|---|---|---|
| 0 (missing) | 0 | 0.0% |
| 1–80 chars | 0 | 0.0% |
| 81–120 chars | 3,476 | 65.6% |
| 121–160 chars | 1,824 | 34.4% |
| 161–200 chars | 0 | 0.0% |
| > 200 chars | 0 | 0.0% |

100% of reveals fall in the 81–160 char range. This is the optimal zone for
a quick, punchy post-answer reveal that feels satisfying without feeling like a wall of text.

---

## Reveal Tier Distribution

| Tier | Count | % |
|---|---|---|
| TIER_1 | 5,300 | 100% |

All 5,300 answers are TIER_1. Higher tiers (TIER_2 pattern reveal, TIER_3 snapshot,
TIER_5 premium) are structured in dedicated columns (`pattern_reveal_pl/en`,
`snapshot_reveal_pl/en`, `premium_reveal_pl/en`) but are not yet active in production.

---

## Reveal Dosing Policy (questions)

All 2,650 questions share the same dosing policy:

> TIER_1 short answer reveal; TIER_2 pattern after 3-5 repeats; TIER_3 mini snapshot after 20-30 answers; TIER_4 profile snapshot at 51; TIER_5 premium depth.

This is the expected v2 uniform policy. Per-question dosing overrides will come in
`reveal_dosing_templates.csv` (not yet in repository).

---

## WOW Refinement Status

| Status | Count | % |
|---|---|---|
| generated_pattern_ready_fields_only | 2,900 | 54.7% |
| replaced_from_wow_pack | 2,400 | 45.3% |

45.3% of answers have manually curated "WOW pack" reveals — higher quality copy
selected for emotional impact. 54.7% are generated pattern-ready reveals.

---

## Cross-Question Duplicate Reveals

495 distinct TIER_1 reveal strings (EN) appear across more than one question.
This is by design: when multiple questions probe the same axis and pattern signal,
they legitimately share the same "what this means about you" reveal text.

**Status: WARN — non-blocking, acceptable by design.**

Example shared reveals:
- *"I check the ground while leaving room for a second layer"* → 24 questions
- *"I follow the unknown without losing movement"* → 6 questions
- *"I check the ground without losing impulse"* → 2 questions

---

## Higher-Tier Reveal Status

| Field | Populated | % |
|---|---|---|
| pattern_reveal_pl/en | Structured | present in columns |
| snapshot_reveal_pl/en | Structured | present in columns |
| premium_reveal_pl/en | Structured | present in columns |
| original_long_reveal_pl/en | Source archive | present in columns |

Higher-tier reveals exist in the CSV columns but are not yet activated in the
runtime reveal engine. The runtime currently only reads `answer_reveal_short_pl/en`.
