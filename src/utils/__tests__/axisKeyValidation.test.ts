import { describe, it, expect } from 'vitest';
import { validateAxisDeltaJson, VALID_AXIS_KEYS, CANONICAL_AXIS_IDS } from '../axisKeyValidation';

describe('axisKeyValidation', () => {
  // ── VALID_AXIS_KEYS set ─────────────────────────────────────────────────────

  it('VALID_AXIS_KEYS includes all 10 canonical axis IDs', () => {
    for (const ax of ['AX01','AX02','AX03','AX04','AX05','AX06','AX07','AX08','AX09','AX10']) {
      expect(VALID_AXIS_KEYS.has(ax)).toBe(true);
    }
  });

  it('CANONICAL_AXIS_IDS has exactly 10 entries', () => {
    expect(CANONICAL_AXIS_IDS.size).toBe(10);
  });

  it('VALID_AXIS_KEYS includes every legacy pole name from POLE_MAP', () => {
    const legacyPoles = [
      'curiosity', 'openness', 'security', 'guardedness',
      'logic', 'observation', 'pattern', 'emotion', 'authenticity', 'present',
      'independence', 'connection', 'belonging', 'social',
      'action', 'courage',
      'future', 'change',
      'risk', 'thrill', 'adventure', 'danger', 'spontaneity', 'control',
      'pragmatism', 'idealism', 'contradiction',
      'stability', 'consistency', 'hesitation', 'resilience', 'transformation',
      'nature', 'technology',
      'creator', 'idea_creator', 'builder',
    ];
    for (const pole of legacyPoles) {
      expect(VALID_AXIS_KEYS.has(pole), `Expected "${pole}" in VALID_AXIS_KEYS`).toBe(true);
    }
  });

  // ── validateAxisDeltaJson: valid inputs ────────────────────────────────────

  it('valid v2 keys pass', () => {
    const r = validateAxisDeltaJson('{"AX01": 3, "AX09": -1, "AX10": 2}');
    expect(r.valid).toBe(true);
    expect(r.unknownKeys).toHaveLength(0);
    expect(r.errors).toHaveLength(0);
  });

  it('valid legacy pole keys pass', () => {
    const r = validateAxisDeltaJson('{"curiosity": 2, "control": -1, "nature": 3}');
    expect(r.valid).toBe(true);
    expect(r.unknownKeys).toHaveLength(0);
  });

  it('mixed v2 + legacy keys pass', () => {
    const r = validateAxisDeltaJson('{"AX01": -3, "courage": 1, "idea_creator": 2}');
    expect(r.valid).toBe(true);
    expect(r.unknownKeys).toHaveLength(0);
  });

  // ── validateAxisDeltaJson: unknown keys fail ────────────────────────────────

  it('completely unknown axis key fails validation', () => {
    const r = validateAxisDeltaJson('{"unknown_axis": 5}');
    expect(r.valid).toBe(false);
    expect(r.unknownKeys).toContain('unknown_axis');
  });

  it('AX11 is not a valid canonical key', () => {
    const r = validateAxisDeltaJson('{"AX11": 3}');
    expect(r.valid).toBe(false);
    expect(r.unknownKeys).toContain('AX11');
  });

  it('typo in key name fails', () => {
    const r = validateAxisDeltaJson('{"curiousity": 2}'); // extra 'i'
    expect(r.valid).toBe(false);
    expect(r.unknownKeys).toContain('curiousity');
  });

  it('multiple unknown keys all reported', () => {
    const r = validateAxisDeltaJson('{"AX01": 1, "bad_key": 2, "another_bad": 3}');
    expect(r.valid).toBe(false);
    expect(r.unknownKeys).toContain('bad_key');
    expect(r.unknownKeys).toContain('another_bad');
    expect(r.unknownKeys).not.toContain('AX01');
  });

  // ── validateAxisDeltaJson: structural failures ──────────────────────────────

  it('empty string fails', () => {
    const r = validateAxisDeltaJson('');
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('plain text fails', () => {
    const r = validateAxisDeltaJson('curiosity');
    expect(r.valid).toBe(false);
  });

  it('empty JSON object fails', () => {
    const r = validateAxisDeltaJson('{}');
    expect(r.valid).toBe(false);
  });

  it('non-numeric value fails', () => {
    const r = validateAxisDeltaJson('{"AX01": "high"}');
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('invalid JSON fails', () => {
    const r = validateAxisDeltaJson('{AX01: 3}');
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });
});
