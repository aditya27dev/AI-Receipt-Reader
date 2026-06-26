/**
 * Lightweight server-side auth helper for API routes.
 * Returns the user ID from the current session, or null if:
 *   - No valid session exists
 *   - DATABASE_URL is not configured (PG disabled)
 */

import type { NextRequest } from 'next/server';
import { getAuth } from './auth';

const PG_ENABLED = !!process.env.DATABASE_URL;

export const DEMO_USER_EMAIL = 'demo@example.com';

export function isDemoUser(email: string): boolean {
    return email === DEMO_USER_EMAIL;
}

export async function getSessionUserId(req: NextRequest): Promise<string | null> {
    if (!PG_ENABLED) return null;
    try {
        const session = await getAuth().api.getSession({ headers: req.headers });
        return session?.user?.id ?? null;
    } catch {
        return null;
    }
}

export async function getSessionUser(req: NextRequest): Promise<{ id: string; email: string } | null> {
    if (!PG_ENABLED) return null;
    try {
        const session = await getAuth().api.getSession({ headers: req.headers });
        if (!session?.user) return null;
        return { id: session.user.id, email: session.user.email };
    } catch {
        return null;
    }
}
