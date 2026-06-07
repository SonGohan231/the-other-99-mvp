# Content Contract v3 — 4-Answer Format

## Overview

Questions in The Other 99 follow a structured content contract. Version 3 formalizes the 4-answer format used by v2 content and clarifies per-answer axis delta requirements.

## Answer Structure

Each question must have exactly **4 answer options** in the content pipeline.

### Fields

| Field | Format | Notes |
|-------|--------|-------|
| `prompt_en` | Plain text | The question text shown to the user |
| `answer_options_en` | Pipe-delimited (`A|B|C|D`) | Displayed answer labels |
| `answer_axis_deltas_json` | JSON map: `{ "A": { "AX01": 1 }, "B": { "AX02": -1 }, ... }` | Per-answer canonical axis deltas |
| `axis_target` | Semicolon-delimited axis IDs | Primary axes this question maps to |
| `safety_label` | `safe` / `mild` / `sensitive` / `intimate` / `taboo` / `forbidden` | Content safety classification |
| `content_contract_status` | `draft` / `reviewed` / `approved` | Editorial review state |

### Axis Delta Rules

- Deltas use the canonical 10-axis system: **AX01–AX10**
- Legacy pole names (`curiosity`, `logic`, etc.) are accepted at runtime but new content must use AX codes
- Each answer should affect 1–3 axes maximum
- Delta magnitude: typically ±1 to ±3; ±5 maximum for epic/legendary rarity

### Social Comparison

When a question has been answered by enough users, community distribution data is shown on the reward screen. The system:

1. Uses `getCommunityPercentages(contentId, options)` which combines a semantic seed distribution with real user votes
2. Labels the result as **"Estimated signal"** (source: `simulated`) until real population data reaches statistical significance
3. Never displays absolute numbers — only percentages
4. Never fabricates real statistics; all projections are clearly labeled

### Pattern Insight

After an answer, a post-answer insight is shown based on the dominant axis delta. Rules:

- Text drawn from a curated insight pool per axis direction (positive/negative)
- No archetype names are exposed in insights
- No clinical or diagnostic language
- Confidence: `low` (single axis), `medium` (≥2 axes)

## Validation Checklist

Before approving a question batch:

- [ ] 4 answer options present
- [ ] `answer_axis_deltas_json` covers all 4 options
- [ ] Each option maps to at least 1 AX code
- [ ] `safety_label` set appropriately
- [ ] `prompt_en` reviewed for clarity
- [ ] `next_hook_en` present (tease for next question)
- [ ] `reward_en` present (post-answer reveal copy)
- [ ] `content_contract_status` = `approved`

## Migration from Legacy Format

Legacy questions use `axis_delta_json` (question-level, single delta object). The v2 loader handles both formats at runtime via `getSelectedAnswerDeltas()`, which checks `answer_axis_deltas_json` first and falls back to `axis_delta_json`.

New content must use the v3 per-answer format.
