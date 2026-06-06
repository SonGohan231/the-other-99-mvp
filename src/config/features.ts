// Feature flags — set to true to enable in-progress features.
// These should be false in production until each feature is fully validated.

/** Use v2 comma-delimited content database (2650 questions, 5300 answers).
 *  When false, falls back to legacy semicolon-delimited CSVs in public/. */
export const USE_V2_CONTENT = true;
