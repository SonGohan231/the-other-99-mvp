# Contradiction Coverage Report

**Audit date:** 2026-06-06  
**Questions:** 2,650

---

## Summary

| Metric | Value |
|---|---|
| Questions with contradiction_pair_id | 577 (21.8%) |
| Unique pair IDs | 377 |
| Valid pairs (2 questions each) | 200 ✓ |
| Singleton pairs (1 question only) | 177 ⚠ |
| Large pairs (3+ questions) | 0 |
| system_actions with contradiction + missing pair_id | 0 ✓ |

**Status: WARN — 177 singleton pairs are expected for an incomplete drop.**

---

## Pair Integrity

### Valid Pairs (200)

200 contradiction pairs have exactly 2 questions — both sides of the contradiction
are present in the dataset. These are ready for the contradiction detection engine.

### Singleton Pairs (177) — WARN

177 `contradiction_pair_id` values appear on exactly one question. The paired
question is likely in a future data drop (v5 dataset or remaining_mode batch).

Sample singletons (pair_id → question_id):
- CP001 → Q0020
- CP002 → Q0040
- CP003 → Q0060
- CP004 → Q0080
- CP005 → Q0100
- ... (167 more)

**Action:** No action needed now. When v5 data drops, re-run `npm run audit:contradictions`
to verify singletons resolve to valid pairs.

---

## system_actions Contradiction References

No questions currently reference `contradiction` in `system_actions` without
a corresponding `contradiction_pair_id`. **PASS.**

---

## Axis Distribution in Contradiction Pairs

| Axis | Questions with Pair | % of All Paired |
|---|---|---|
| AX01 | 41 | 7.1% |
| AX02 | 42 | 7.3% |
| AX03 | 41 | 7.1% |
| AX04 | 42 | 7.3% |
| AX05 | 68 | 11.8% |
| AX06 | 69 | 12.0% |
| AX07 | 68 | 11.8% |
| AX08 | 69 | 12.0% |
| AX09 | 68 | 11.8% |
| AX10 | 69 | 12.0% |

Contradiction pairs are concentrated on AX05–AX10 (~60% of paired questions),
with lighter coverage on AX01–AX04 (~29%). This reflects that the more behavioural
and social axes produce more observable contradictions than the more cognitive ones.

---

## Optional Supplemental File

`contradiction_rules.csv` (not yet in repository) will contain explicit
contradiction detection rules with confidence thresholds and reveal text.
The `ContradictionRule` type in `src/types/contentV2.ts` is ready to receive it.

---

## Recommendations

1. **No immediate action** — 177 singleton pairs are expected and will resolve
   when v5 dataset arrives.
2. **Re-audit after v5 drop** — run `npm run audit:contradictions` to verify
   all singletons have resolved.
3. **Consider axis rebalancing** — AX01–AX04 have ~40% fewer contradiction
   pairs per axis than AX05–AX10. Future content could add 20–30 contradiction
   pairs per underrepresented axis.
