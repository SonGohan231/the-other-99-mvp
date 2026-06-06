# Content Quality Report — The Other 99

**Generated:** 2026-06-06T04:51:12.095Z
**Canon version:** TO99_ARCHETYPE_CANON_1.0
**Contract status assigned:** `migrated_needs_editorial_review`
**Total rows migrated:** 865

## Files Migrated

| File | Rows |
|------|------|
| content.csv | 200 |
| content_en_v2.csv | 160 |
| content_premium_en_v1.csv | 505 |

## v2 Fields Added

All rows now carry the following v2 content contract fields:

| Field | Value / Source |
|-------|----------------|
| `canon_version` | `TO99_ARCHETYPE_CANON_1.0` (static) |
| `safety_label` | Inferred from `max(darkness_level, intimacy_level)` |
| `statistic_source_label` | `estimated` (all migrated rows) |
| `allowed_actions` | `answer,confirm_answer,skip_question,swap_question,exit_to_menu` |
| `reveal_template_id` | Derived from `rarity_tier` |
| `sensitivity_level` | `round((max(darkness,intimacy) + psychological_intensity) / 2)` |
| `controversy_level` | `round((darkness_level + intimacy_level) / 2)` |
| `content_contract_status` | `migrated_needs_editorial_review` |

## Safety Label Distribution

| Safety Label | Count |
|--------------|-------|
| sensitive | 719 |
| mild | 146 |

## Reveal Template Distribution

| Template ID | Count |
|-------------|-------|
| reveal_standard | 336 |
| reveal_rare | 326 |
| reveal_epic | 151 |
| reveal_legendary | 52 |

## Editorial Action Required

All rows have `content_contract_status = migrated_needs_editorial_review`.

Editorial tasks per row:
- Review inferred `safety_label` for accuracy
- Review `controversy_level` and `sensitivity_level`
- Confirm `allowed_actions` are appropriate for the content type
- Update `content_contract_status` to `reviewed` after manual check
- Update `statistic_source_label` to `community` once real distribution data is collected

## Axis Coverage

All axis coverage validated by `npm run validate:content`.
Minimum 15 questions per canonical axis (AX01–AX10) enforced.
