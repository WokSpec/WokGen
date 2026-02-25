import { describe, it, expect, beforeEach } from 'vitest';
import { withCircuitBreaker, isCircuitOpen, recordFailure, getCircuitStatus } from '../circuit-breaker';

describe('circuit breaker', () => {
  it('executes function successfully when closed', async () => {
    const result = await withCircuitBreaker('test-cb-success', async () => 'success');
    expect(result).toBe('success');
  });

  it('propagates errors from the wrapped function', async () => {
    await expect(
      withCircuitBreaker('test-cb-error', async () => { throw new Error('fail'); })
    ).rejects.toThrow('fail');
  });

  it('circuit is closed by default', () => {
    expect(isCircuitOpen('test-cb-new')).toBe(false);
  });

  it('opens circuit after too many failures', () => {
    const name = 'test-cb-trip';
    // Record 5 failures to trip the breaker
    for (let i = 0; i < 5; i++) {
      recordFailure(name);
    }
    expect(isCircuitOpen(name)).toBe(true);
    const status = getCircuitStatus(name);
    expect(status.state).toBe('OPEN');
  });

  it('uses fallback when circuit is open', async () => {
    const name = 'test-cb-fallback';
    for (let i = 0; i < 5; i++) {
      recordFailure(name);
    }
    const result = await withCircuitBreaker(
      name,
      async () => { throw new Error('should not call'); },
      async () => 'fallback-result',
    );
    expect(result).toBe('fallback-result');
  });

  it('throws when circuit is open and no fallback provided', async () => {
    const name = 'test-cb-throw';
    for (let i = 0; i < 5; i++) {
      recordFailure(name);
    }
    await expect(
      withCircuitBreaker(name, async () => 'value')
    ).rejects.toThrow(/Circuit breaker OPEN/);
  });
});
