# TO99 — CANON FREEZE

**Locked:** 2026-06-06  
**Status:** ACTIVE — do not change without explicit user approval

---

## Canonical 10 Axes (AX01–AX10)

| ID   | Axis pair                     |
|------|-------------------------------|
| AX01 | Curiosity ↔ Security          |
| AX02 | Logic ↔ Emotion               |
| AX03 | Independence ↔ Belonging      |
| AX04 | Observation ↔ Action          |
| AX05 | Present ↔ Future              |
| AX06 | Spontaneity ↔ Control         |
| AX07 | Pragmatism ↔ Idealism         |
| AX08 | Stability ↔ Transformation    |
| AX09 | Nature ↔ Technology           |
| AX10 | Idea Creator ↔ Builder        |

**Builder is NOT a public archetype.** Builder is only the AX10 right-pole.

---

## Canonical 3 Hidden Parameters (HP01–HP03)

| ID   | Parameter                       |
|------|---------------------------------|
| HP01 | Confidence ↔ Hesitation         |
| HP02 | Openness ↔ Guardedness          |
| HP03 | Consistency ↔ Contradiction     |

Hidden parameters are computed from behavioral events (skip, swap, exit, answer change, time-to-select, time-to-submit, session resume).

They are NOT computed from the axis scoring vector directly.

---

## Canonical 12 Public Archetypes

| Code | EN name         | PL name      |
|------|-----------------|--------------|
| A01  | The Alchemist   | Alchemik     |
| A02  | The Observer    | Obserwator   |
| A03  | The Mirror      | Lustro       |
| A04  | The Anchor      | Kotwica      |
| A05  | The Strategist  | Strateg      |
| A06  | The Explorer    | Odkrywca     |
| A07  | The Guardian    | Strażnik     |
| A08  | The Catalyst    | Iskra        |
| A09  | The Architect   | Architekt    |
| A10  | The Rebel       | Buntownik    |
| A11  | The Dreamer     | Marzyciel    |
| A12  | The Weaver      | Tkacz        |

**Catalyst PL public name = "Iskra" (NOT "Katalizator").**  
**Dreamer and Weaver are canonical** (replacing legacy "pathfinder" and "seeker").

---

## Blend Structure

- 12 archetypes × (12 − 1) / 2 = 66 unique blends
- No new blends may be added

---

## Social Statistics Labels

All user-facing social comparison data must carry one of these labels:

- `real` — real community data
- `current_sample` — real data from current user sample
- `estimated` — algorithmically estimated
- `simulated` — simulation-only, not real
- `not_enough_data` — threshold not reached

Never display simulated or estimated data as real community data.

---

## Absolute Do-Nots

- No new public archetypes
- No new hidden parameters
- No new axes
- No horoscope or mystical framing
- No clinical diagnosis language
- No "You are X" language early in profile
- No fake certainty about emerging patterns
- No technical scoring labels (AX01, HP02, etc.) in user-facing UI
- No payment, Stripe, or subscription implementation
- No AI runtime calls (OpenAI, Claude API, Gemini) at runtime
- No Supabase credentials in code (GitHub Secrets only)
