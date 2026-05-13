import { findReceiptByImageHash } from '@/lib/db';
import { Result } from 'oxide.ts';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
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
    if (!imageHash || typeof imageHash !== 'string') {
        return new Response(JSON.stringify({ error: 'Missing imageHash' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const result = await Result.safe(findReceiptByImageHash(imageHash));
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
