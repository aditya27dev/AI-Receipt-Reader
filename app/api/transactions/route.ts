import { getTransactions, getTransactionSummary } from '@/lib/db';
import { Result } from 'oxide.ts';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
  const offset = (page - 1) * limit;

  const result = await Result.safe(
    Promise.all([getTransactions(limit, offset), getTransactionSummary()])
  );
  if (result.isErr()) return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });

  const [transactions, summary] = result.unwrap();
  return NextResponse.json({ transactions, summary, page, limit });
}
