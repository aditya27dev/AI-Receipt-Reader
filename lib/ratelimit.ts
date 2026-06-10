/**
 * Rate limiter.
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 * are set (production / Vercel). Falls back to in-memory for local dev.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ─── Upstash path ─────────────────────────────────────────────────────────────

function createUpstashLimiter(limit: number, windowMs: number) {
    const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    return new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, `${windowMs}ms`),
        prefix: 'rl',
    });
}

// ─── In-memory fallback (local dev, single-instance only) ────────────────────

interface Entry {
    count: number;
    resetAt: number;
}

const store = new Map<string, Entry>();

setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
        if (now > entry.resetAt) store.delete(key);
    }
}, 60_000);

function inMemoryRateLimit(
    identifier: string,
    options: { limit: number; windowMs: number },
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

// ─── Public API ───────────────────────────────────────────────────────────────

const UPSTASH_ENABLED =
    !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

// Cache limiter instances keyed by "limit:windowMs" to avoid recreating per request
const limiterCache = new Map<string, Ratelimit>();

export async function rateLimit(
    identifier: string,
    options: { limit: number; windowMs: number },
): Promise<{ success: boolean; remaining: number }> {
    if (!UPSTASH_ENABLED) {
        return inMemoryRateLimit(identifier, options);
    }

    const key = `${options.limit}:${options.windowMs}`;
    if (!limiterCache.has(key)) {
        limiterCache.set(key, createUpstashLimiter(options.limit, options.windowMs));
    }
    const limiter = limiterCache.get(key)!;
    const result = await limiter.limit(identifier);
    return { success: result.success, remaining: result.remaining };
}
