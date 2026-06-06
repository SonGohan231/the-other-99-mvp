# TO99 — SOURCE MATERIAL AUDIT

**Date:** 2026-06-06  
**Status:** Stage 0 complete

---

## Active Implementation Source

```
TO99_MASTER_DATABASE_v2_PATTERN_READY
```

This is the single authoritative source for content, engine metadata, and rule files.  
All implementation must read from v2 files. Do not request or use older file versions.

---

## v2 Database — Available Files

### Questions and Answers

| File | Rows | Status |
|------|------|--------|
| `questions_all_2650.csv` | 2650 questions | ACTIVE — primary question corpus |
| `answers_all_5300.csv` | 5300 answers | ACTIVE — primary answer corpus |
| `v5_questions_1450.csv` | 1450 questions | ACTIVE — extended v5 corpus (subset of 2650) |
| `v5_answers_2900.csv` | 2900 answers | ACTIVE — extended v5 answers |
| `remaining_mode_items_800.csv` | 800 items | ACTIVE — mode items (dare, secret, game, etc.) |
| `remaining_mode_answers_2100.csv` | 2100 answers | ACTIVE — mode answers |
| `micro_games_300.csv` | 300 items | ACTIVE — micro-game mode |
| `challenges_300.csv` | 300 items | ACTIVE — challenge mode |
| `secrets_300.csv` | 300 items | ACTIVE — secret mode |

### Engine Rules and Templates

| File | Rows | Status |
|------|------|--------|
| `pattern_rules.csv` | 20 rules | ACTIVE — 1 per axis × 2 poles |
| `contradiction_rules.csv` | 200 rules | ACTIVE — complete pairs |
| `emerging_archetype_templates.csv` | 4 templates | ACTIVE — early/forming/stable/dominant |
| `reveal_dosing_templates.csv` | 5 tiers | ACTIVE — TIER_1 through TIER_5 |
| `hidden_events.csv` | 8 events | ACTIVE — behavioral event to HP mapping |

### Specs and Schemas

| File | Purpose |
|------|---------|
| `docs/PATTERN_ENGINE_SPEC.md` | Pattern Engine implementation reference |
| `docs/CONTRADICTION_ENGINE_SPEC.md` | Contradiction Engine implementation reference |
| `docs/EMERGING_ARCHETYPE_SPEC.md` | Emerging Archetype Layer reference |
| `docs/REVEAL_DOSING_SPEC.md` | Reveal Dosing System reference |
| `docs/CONTENT_AUDIT_REPORT.md` | Content audit from v2 build |
| `schemas/final_question_v2.schema.json` | JSON schema for v2 questions |
| `schemas/final_answer_v2.schema.json` | JSON schema for v2 answers |
| `schemas/pattern_rule.schema.json` | Pattern rule schema |
| `schemas/contradiction_rules.json` | Contradiction rule schema |
| `schemas/emerging_archetype_templates.json` | Emerging archetype schema |
| `schemas/reveal_dosing_templates.json` | Reveal dosing schema |
| `CONTENT_MERGE_REPORT.md` | Describes v1→v2 content transformation |

---

## v2 Question Schema (relevant columns)

```
question_id, language_pair_id, source_series, tier, mode,
category_pl, category_en, question_pl, question_en, answer_type,
primary_axis, secondary_axes, archetype_targets, archetype_oppositions,
hidden_signal_targets, sensitivity_level, controversy_level,
social_desirability_risk, rarity_weight, contradiction_pair_id,
safety_label, statistic_source_label, reveal_template_ids,
system_actions, hidden_events_policy, production_status,
pattern_tags, pattern_signal_id, pattern_axis_direction,
pattern_hidden_signal, pattern_confidence_weight, pattern_min_occurrences,
reveal_dosing_policy, pattern_engine_status
```

---

## v2 Answer Schema (relevant columns)

```
answer_id, question_id, source_series, answer_order,
label_pl, label_en, short_label_pl, short_label_en,
axis_deltas_json, archetype_deltas_json, hidden_signal_deltas_json,
rarity_impact, social_desirability_flag,
reveal_pl, reveal_en, statistic_source_label, wow_refinement_status,
answer_reveal_short_pl, answer_reveal_short_en,
pattern_reveal_pl, pattern_reveal_en,
snapshot_reveal_pl, snapshot_reveal_en,
premium_reveal_pl, premium_reveal_en,
reveal_tier, reveal_depth, pattern_tags, pattern_signal_id,
pattern_axis_direction, pattern_hidden_signal,
pattern_confidence_weight, pattern_min_occurrences,
original_long_reveal_pl, original_long_reveal_en
```

Scoring: `axis_deltas_json` uses `{"AX01": -3, "AX04": -1}` format.

---

## Current App CSVs (Legacy Seed Corpus)

The current app reads from:

| File | Rows | Format | Status |
|------|------|--------|--------|
| `public/content.csv` | 200 | semicolon-delimited | Legacy seed corpus |
| `public/content_en_v2.csv` | 160 | semicolon-delimited | Legacy seed corpus |
| `public/content_premium_en_v1.csv` | 505 | semicolon-delimited | Legacy seed corpus |

These files use a DIFFERENT column schema than v2 (`axis_delta_json` vs `axis_deltas_json`, named poles instead of AX01 IDs, no pattern/reveal-dosing metadata). They must NOT be used as the active v2 source. They continue to serve as the active content for the live app until v2 import is complete.

---

## Files to Ignore

Do NOT use:

- `TO99_claude_profile_content_dosing_pack_v1.zip`
- `TO99_merged_mvp_900_database_v1_v2_v3.xlsx`
- `TO99_ready_mvp_300_extension_v4.xlsx`
- Any file not in `TO99_MASTER_DATABASE_v2_PATTERN_READY`

---

## Canon PDFs (Reference Only)

These define product vision and copy guidance. Code is NOT driven by PDFs.

- `TO99_full_lore_universe_EN_PL.pdf`
- `TO99_implementation_blueprint_EN_PL.pdf`
- `TO99_source_summaries_and_connection_map.md`
- `01_research_foundations_EN_PL.pdf`
- `05_hidden_profile_and_premium_EN_PL.pdf`
- `06_dopamine_ux_and_APK_playbook_EN_PL.pdf`
