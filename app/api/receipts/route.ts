import { getReceipts, getSpendingSummary, getSpendingOverTime } from '@/lib/db';
import { Result } from 'oxide.ts';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const offset = (page - 1) * limit;

  const result = await Result.safe(
    Promise.all([getReceipts(limit, offset), getSpendingSummary(), getSpendingOverTime()])
  );
  if (result.isErr()) return NextResponse.json({ error: 'Failed to fetch receipts' }, { status: 500 });

  const [receipts, summary, spendingOverTime] = result.unwrap();
  return NextResponse.json({ receipts, summary, spendingOverTime, page, limit });
}
