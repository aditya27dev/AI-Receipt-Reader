/**
 * In-memory rate limiter.
 * Suitable for single-instance portfolio deployments.
 * For multi-instance prod, swap for @upstash/ratelimit.
 */

interface Entry {
    count: number;
    resetAt: number;
}

const store = new Map<string, Entry>();

// Periodically clean up expired entries to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
        if (now > entry.resetAt) store.delete(key);
    }
}, 60_000);

export function rateLimit(
    identifier: string,
    options: { limit: number; windowMs: number }
): { success: boolean; remaining: number } {
    const now = Date.now();
    const entry = store.get(identifier);

    if (!entry || now > entry.resetAt) {
        store.set(identifier, { count: 1, resetAt: now + options.windowMs });
        return { success: true, remaining: options.limit - 1 };
    }

    if (entry.count >= options.limit) {
        return { success: false, remaining: 0 };
    }

    entry.count++;
    return { success: true, remaining: options.limit - entry.count };
}
