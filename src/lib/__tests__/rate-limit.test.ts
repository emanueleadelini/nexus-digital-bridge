import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkRateLimit, refundRateLimit, resetRateLimit } from '../rate-limit.ts';

describe('rate-limit', () => {
  it('permette fino al limite nella finestra', () => {
    const key = `test-basic-${Date.now()}`;
    assert.equal(checkRateLimit(key, { limit: 2, windowMs: 60_000 }).allowed, true);
    assert.equal(checkRateLimit(key, { limit: 2, windowMs: 60_000 }).allowed, true);
    const third = checkRateLimit(key, { limit: 2, windowMs: 60_000 });
    assert.equal(third.allowed, false);
    assert.equal(third.remaining, 0);
    resetRateLimit(key);
  });

  it('refund restituisce una tacca consumata', () => {
    const key = `test-refund-${Date.now()}`;
    checkRateLimit(key, { limit: 1, windowMs: 60_000 });
    assert.equal(checkRateLimit(key, { limit: 1, windowMs: 60_000 }).allowed, false);
    refundRateLimit(key);
    assert.equal(checkRateLimit(key, { limit: 1, windowMs: 60_000 }).allowed, true);
    resetRateLimit(key);
  });
});
