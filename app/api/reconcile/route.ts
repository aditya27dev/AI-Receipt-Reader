import { getReceipts, getTransactions } from '@/lib/db';
import { reconcile } from '@/lib/reconciliation';
import { Result } from 'oxide.ts';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
    const result = await Result.safe(
        Promise.all([getReceipts(1000), getTransactions(1000)])
    );
    if (result.isErr()) return NextResponse.json({ error: 'Failed to reconcile' }, { status: 500 });

    const [receipts, transactions] = result.unwrap();
    const matches = reconcile(receipts, transactions);
    return NextResponse.json({ matches, count: matches.length });
}
