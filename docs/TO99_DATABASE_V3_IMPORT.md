# TO99 database v2 ready to add

Generated: 2026-06-07 13:47 UTC

## Contents

- `TO99_main_content.csv` — flat import file: 2400 unique content items, exactly 4 answers each, A01-A12 percentage split per answer.
- `TO99_questions_master.csv` — question-level metadata.
- `TO99_answers_long.csv` — answer-level table with one row per answer.
- `to99_content_bundle.json` — full JSON bundle for app import.
- `TO99_database_v2_ready_to_add.xlsx` — review workbook with master sheets.
- `TO99_license_audit.csv` — source registry and license/audit status.
- `TO99_QA_Internal.csv` — internal 0-10 QA scoring. Do not expose to users.
- `TO99_validation_summary.csv` — validation checks.
- `TO99_database_schema.csv` — schema documentation.

## Validation

- Questions: 2400
- Answers: 9600
- Answers per question: exactly 4
- Archetype percentage split: A01-A12 sums to 100 for every answer
- All archetypes have positive share in every answer
- Categories are internal: `user_visible_category=false`
- PL/EN: complete
- QA score min: 8.3
- QA score avg: 8.98

## Import recommendation for GitHub repo

Suggested repo placement:

```text
src/content/to99/TO99_main_content.csv
src/content/to99/to99_content_bundle.json
src/content/to99/TO99_license_audit.csv
src/content/to99/TO99_database_schema.csv
```

Implementation notes:

1. Import `TO99_main_content.csv` or `to99_content_bundle.json`.
2. Validate every item has exactly 4 answers.
3. Validate `answer_N_A01_pct ... answer_N_A12_pct` sums to 100.
4. Keep `internal_category` hidden from user UI.
5. Use `social_label_default` honestly. This dataset does not contain live community data, so do not render it as real population stats.
6. Respect `source_license_status`:
   - `candidate_ready`: low-risk candidate, still cite/source-review before publishing.
   - `audit_required`: import only after legal/source audit, or keep as internal.
   - `research_only`: use as inspiration only unless cleared.
   - `inspiration_only`: do not copy as external-data claim.

## Important product boundary

The Other 99 is not a clinical diagnostic tool, horoscope, tarot system, or medical/mental-health assessment. The dataset is designed as self-discovery content using progressive profile mapping, hidden behavioral signals, and honest estimated comparison labels.
