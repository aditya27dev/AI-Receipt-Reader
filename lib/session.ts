/**
 * Lightweight server-side auth helper for API routes.
 * Returns the user ID from the current session, or null if:
 *   - No valid session exists
 *   - DATABASE_URL is not configured (PG disabled)
 */

import type { NextRequest } from 'next/server';
import { getAuth } from './auth';

const PG_ENABLED = !!process.env.DATABASE_URL;

export async function getSessionUserId(req: NextRequest): Promise<string | null> {
    if (!PG_ENABLED) return null;
    try {
        const session = await getAuth().api.getSession({ headers: req.headers });
        return session?.user?.id ?? null;
    } catch {
        return null;
    }
}
