class RateLimiter {
  constructor() {
    this.limits = new Map();
    // Periodically prune expired limits every 5 minutes to prevent memory leak
    this.cleanupInterval = setInterval(() => this.prune(), 5 * 60 * 1000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  isRateLimited(key, maxLimit, windowMs) {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetTime) {
      this.limits.set(key, { count: 1, resetTime: now + windowMs });
      return { limited: false, remaining: maxLimit - 1, resetInMs: windowMs };
    }

    if (entry.count >= maxLimit) {
      return {
        limited: true,
        remaining: 0,
        resetInMs: Math.max(0, entry.resetTime - now),
      };
    }

    entry.count += 1;
    return {
      limited: false,
      remaining: maxLimit - entry.count,
      resetInMs: Math.max(0, entry.resetTime - now),
    };
  }

  prune() {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

export const rateLimiter = new RateLimiter();
