import { searchReceipts } from '@/lib/db';
import { getSessionUserId } from '@/lib/session';
import { Result } from 'oxide.ts';
import { rateLimit } from '@/lib/ratelimit';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const rl = await rateLimit(ip, { limit: 100, windowMs: 60_000 });
  if (!rl.success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const userId = await getSessionUserId(req);

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  if (query.length > 200) {
    return NextResponse.json({ error: 'Query too long (max 200 chars)' }, { status: 400 });
  }

  const result = await Result.safe(searchReceipts(query, limit, userId));
  if (result.isErr()) return NextResponse.json({ error: 'Failed to search receipts' }, { status: 500 });

  const receipts = result.unwrap();
  return NextResponse.json({ query, results: receipts, count: receipts.length });
}
