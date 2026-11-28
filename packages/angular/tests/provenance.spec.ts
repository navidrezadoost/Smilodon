/**
 * S4 — pure unit tests for the provenance classifier (`provenance.ts`).
 *
 * The classifier is the safety-critical decision that separates a genuine user
 * edit (must call `onChange`) from a programmatic mutation (must not). These
 * tests pin every branch without any DOM.
 */
import { describe, expect, it } from 'vitest';
import { classifyChange, SELECTION_KEYS } from '../src/provenance';

describe('classifyChange', () => {
  it('returns programmatic when nothing happened (no gesture, no history)', () => {
    expect(classifyChange({ userInputSeq: 0, lastUserSeq: 0 })).toBe('programmatic');
  });

  it('returns user when a gesture occurred after the last consumed one', () => {
    expect(classifyChange({ userInputSeq: 1, lastUserSeq: 0 })).toBe('user');
    expect(classifyChange({ userInputSeq: 5, lastUserSeq: 4 })).toBe('user');
  });

  it('returns programmatic when the only gesture was already consumed (stale)', () => {
    // Same gesture count on both sides: the pending gesture was consumed by a
    // prior change, so this change is not a fresh user edit.
    expect(classifyChange({ userInputSeq: 3, lastUserSeq: 3 })).toBe('programmatic');
  });

  it('hard-vetoes to programmatic inside a programmatic application, even with a pending gesture', () => {
    expect(
      classifyChange({ userInputSeq: 9, lastUserSeq: 1, programmaticApplication: true }),
    ).toBe('programmatic');
  });

  it('is monotonic/order-safe: a bigger last than current is still programmatic', () => {
    // Defensive: lastUserSeq should never exceed current, but if it somehow did
    // the safe direction is suppression, never a false user edit.
    expect(classifyChange({ userInputSeq: 2, lastUserSeq: 5 })).toBe('programmatic');
  });
});

describe('SELECTION_KEYS', () => {
  it('contains the selection-performing keys and excludes navigation keys', () => {
    expect(SELECTION_KEYS.has('Enter')).toBe(true);
    expect(SELECTION_KEYS.has(' ')).toBe(true);
    expect(SELECTION_KEYS.has('a')).toBe(true);
    expect(SELECTION_KEYS.has('ArrowDown')).toBe(false);
    expect(SELECTION_KEYS.has('Escape')).toBe(false);
  });
});
