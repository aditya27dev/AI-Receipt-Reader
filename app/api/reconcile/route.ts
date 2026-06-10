import { getReceipts, getTransactions } from '@/lib/db';
import { reconcile } from '@/lib/reconciliation';
import { getSessionUserId } from '@/lib/session';
import { Result } from 'oxide.ts';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    const userId = await getSessionUserId(req);
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await Result.safe(
        Promise.all([getReceipts(1000, 0, userId), getTransactions(1000, 0, userId)])
    );
    if (result.isErr()) return NextResponse.json({ error: 'Failed to reconcile' }, { status: 500 });

    const [receipts, transactions] = result.unwrap();
    const matches = reconcile(receipts, transactions);
    return NextResponse.json({ matches, count: matches.length });
}
