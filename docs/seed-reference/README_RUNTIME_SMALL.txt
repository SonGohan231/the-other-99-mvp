The Other 99 — V3 Runtime Small Seed Package

This is the small runtime/import package.

It replaces the oversized full v3 ZIP for day-to-day implementation.

What is included:
- projected_percentages_early_app_userbase.csv
- projected_percentages_early_app_userbase.json
- projected_percentages_by_scenario_compact.json
- semantic_content_vectors_v3_500.csv
- content_id_mapping_to_real_app_REQUIRED.csv
- archetype_definitions_v3.csv
- calibration_targets_v3.csv
- axis_distribution_summary_v3.csv
- community_votes_semantic_v3_schema_template.sql
- CLAUDE_RUNTIME_SMALL_IMPORT_PROMPT.txt

What is intentionally NOT included:
- 600,000 raw semantic votes
- 27,000 synthetic user rows
- 27,000 user vote profiles

Why:
The app does not need raw synthetic votes at runtime.
It only needs projected percentages and mapping to real content_id.
Real user votes will be saved by the app after launch.

Default scenario:
early_app_userbase_projected

Critical:
Do not show projected seed data as "How others answered".
Use "Projected distribution" until enough real app votes exist.

Critical import rule:
semantic_v3_qXXXX must be mapped to real app content_id before production use.
