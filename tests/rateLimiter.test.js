import { describe, it, expect } from 'vitest';
import { rateLimiter } from '../src/utils/rateLimiter.js';

describe('Sliding Window Rate Limiter', () => {
  it('allows requests within the limit', () => {
    const key = 'test-user-allowed';
    const first = rateLimiter.isRateLimited(key, 3, 5000);
    expect(first.limited).toBe(false);
    expect(first.remaining).toBe(2);

    const second = rateLimiter.isRateLimited(key, 3, 5000);
    expect(second.limited).toBe(false);
    expect(second.remaining).toBe(1);

    const third = rateLimiter.isRateLimited(key, 3, 5000);
    expect(third.limited).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it('blocks requests exceeding the limit', () => {
    const key = 'test-user-blocked';
    // Consume 2 out of 2
    rateLimiter.isRateLimited(key, 2, 5000);
    rateLimiter.isRateLimited(key, 2, 5000);

    // 3rd attempt must be limited
    const fourth = rateLimiter.isRateLimited(key, 2, 5000);
    expect(fourth.limited).toBe(true);
    expect(fourth.remaining).toBe(0);
    expect(fourth.resetInMs).toBeGreaterThan(0);
  });
});
