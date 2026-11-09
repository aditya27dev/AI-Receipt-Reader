import { findReceiptByImageHash } from '@/lib/db';
import { Result } from 'oxide.ts';
import { getSessionUserId } from '@/lib/session';
import { NextRequest } from 'next/server';

const PG_ENABLED = !!process.env.DATABASE_URL;

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    const userId = await getSessionUserId(req);
    if (PG_ENABLED && !userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    let body: { imageHash?: string };
    try {
        body = await req.json();
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const { imageHash } = body;
    if (!imageHash || typeof imageHash !== 'string' || !/^[a-f0-9]{64}$/.test(imageHash)) {
        return new Response(JSON.stringify({ error: 'Missing imageHash' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const result = await Result.safe(findReceiptByImageHash(imageHash, userId));
    if (result.isErr()) {
        return new Response(JSON.stringify({ error: 'Lookup failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    const receipt = result.unwrap();
    return new Response(
        JSON.stringify({ duplicate: receipt !== null, receipt: receipt ?? undefined }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
}
