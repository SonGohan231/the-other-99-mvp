import { describe, it, expect, beforeEach, vi } from 'vitest';

const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem:    (k: string) => store[k] ?? null,
  setItem:    (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
});

import {
  emptyCanonicalVector,
  applyCanonicalDeltas,
  loadCanonicalVector,
  saveCanonicalVector,
  clearCanonicalVector,
  projectToLegacy,
} from '../canonicalVector';

describe('canonicalVector', () => {
  beforeEach(() => { Object.keys(store).forEach(k => delete store[k]); });

  it('emptyCanonicalVector has all 10 axes at zero', () => {
    const v = emptyCanonicalVector();
    expect(Object.keys(v)).toHaveLength(10);
    for (const val of Object.values(v)) expect(val).toBe(0);
  });

  // ── v2 AX01–AX10 key resolution ─────────────────────────────────────────────

  it('AX01 delta produces non-zero canonical movement', () => {
    const { next, changed } = applyCanonicalDeltas(emptyCanonicalVector(), { AX01: 3 });
    expect(next.AX01).toBe(3);
    expect(changed).toContain('AX01');
  });

  it('AX09 delta produces non-zero canonical movement', () => {
    const { next, changed } = applyCanonicalDeltas(emptyCanonicalVector(), { AX09: 3 });
    expect(next.AX09).toBe(3);
    expect(changed).toContain('AX09');
  });

  it('AX10 delta produces non-zero canonical movement', () => {
    const { next, changed } = applyCanonicalDeltas(emptyCanonicalVector(), { AX10: 3 });
    expect(next.AX10).toBe(3);
    expect(changed).toContain('AX10');
  });

  it('negative AX01 delta accumulates correctly', () => {
    const { next } = applyCanonicalDeltas(emptyCanonicalVector(), { AX01: -5 });
    expect(next.AX01).toBe(-5);
  });

  it('multiple v2 axes resolved independently', () => {
    const { next } = applyCanonicalDeltas(emptyCanonicalVector(), { AX01: -3, AX04: -1, AX09: 2, AX10: 1 });
    expect(next.AX01).toBe(-3);
    expect(next.AX04).toBe(-1);
    expect(next.AX09).toBe(2);
    expect(next.AX10).toBe(1);
    // Untouched axes stay zero
    expect(next.AX02).toBe(0);
    expect(next.AX05).toBe(0);
  });

  // ── Unknown keys ─────────────────────────────────────────────────────────────

  it('unknown key produces no change', () => {
    const before = emptyCanonicalVector();
    const { next, changed } = applyCanonicalDeltas(before, { unknown_key: 5 });
    expect(changed).toHaveLength(0);
    expect(next).toEqual(before);
  });

  it('zero delta is ignored and not reported as changed', () => {
    const { next, changed } = applyCanonicalDeltas(emptyCanonicalVector(), { AX01: 0 });
    expect(changed).toHaveLength(0);
    expect(next.AX01).toBe(0);
  });

  // ── Legacy named pole mapping ─────────────────────────────────────────────────

  it('legacy "control" maps to AX06 negative', () => {
    const { next } = applyCanonicalDeltas(emptyCanonicalVector(), { control: 3 });
    expect(next.AX06).toBe(-3);
    expect(next.AX01).toBe(0); // no cross-contamination
  });

  it('legacy "curiosity" maps to AX01 positive', () => {
    const { next } = applyCanonicalDeltas(emptyCanonicalVector(), { curiosity: 4 });
    expect(next.AX01).toBe(4);
  });

  it('legacy "security" maps to AX01 negative', () => {
    const { next } = applyCanonicalDeltas(emptyCanonicalVector(), { security: 2 });
    expect(next.AX01).toBe(-2);
  });

  it('legacy "nature" maps to AX09 positive — not squashed into connection', () => {
    const { next } = applyCanonicalDeltas(emptyCanonicalVector(), { nature: 5 });
    expect(next.AX09).toBe(5);
    expect(next.AX03).toBe(0); // connection axis untouched
  });

  it('legacy "builder" maps to AX10 negative — not squashed into independence', () => {
    const { next } = applyCanonicalDeltas(emptyCanonicalVector(), { builder: 3 });
    expect(next.AX10).toBe(-3);
    expect(next.AX03).toBe(0); // independence axis untouched
  });

  it('mixed legacy and v2 deltas in same object', () => {
    const { next } = applyCanonicalDeltas(emptyCanonicalVector(), { control: 2, AX09: 4 });
    expect(next.AX06).toBe(-2); // control → AX06 negative
    expect(next.AX09).toBe(4);  // direct AX09
  });

  // ── changed tracking ──────────────────────────────────────────────────────────

  it('reports each affected axis once even if two keys hit the same axis', () => {
    const { changed } = applyCanonicalDeltas(emptyCanonicalVector(), { security: 2, guardedness: 1 });
    expect(changed.filter(a => a === 'AX01')).toHaveLength(1);
  });

  // ── Persistence ───────────────────────────────────────────────────────────────

  it('saveCanonicalVector / loadCanonicalVector round-trip', () => {
    const v = { ...emptyCanonicalVector(), AX01: 3, AX09: -1, AX10: 7 };
    saveCanonicalVector(v);
    const loaded = loadCanonicalVector();
    expect(loaded.AX01).toBe(3);
    expect(loaded.AX09).toBe(-1);
    expect(loaded.AX10).toBe(7);
    expect(loaded.AX05).toBe(0);
  });

  it('loadCanonicalVector returns empty vector when nothing stored', () => {
    const v = loadCanonicalVector();
    expect(v.AX01).toBe(0);
    expect(Object.keys(v)).toHaveLength(10);
  });

  it('clearCanonicalVector wipes storage', () => {
    saveCanonicalVector({ ...emptyCanonicalVector(), AX01: 5 });
    clearCanonicalVector();
    expect(loadCanonicalVector().AX01).toBe(0);
  });

  // ── Legacy projection ─────────────────────────────────────────────────────────

  it('projectToLegacy maps curiosity correctly', () => {
    const cv = { ...emptyCanonicalVector(), AX01: 5 };
    const leg = projectToLegacy(cv);
    expect(leg.curiosity).toBe(5);
    expect(leg.security).toBe(0); // AX01 positive → not on security side
  });

  it('projectToLegacy: AX09 and AX10 are NOT in the 8D output', () => {
    const cv = { ...emptyCanonicalVector(), AX09: 10, AX10: 10 };
    const leg = projectToLegacy(cv);
    expect('nature_tech' in leg).toBe(false);
    expect('idea_builder' in leg).toBe(false);
    // AX09 and AX10 must not inflate other legacy dimensions
    expect(leg.connection).toBe(0);
    expect(leg.independence).toBe(0);
  });
});
