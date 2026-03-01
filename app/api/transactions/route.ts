import { getTransactions, getTransactionSummary } from '@/lib/db';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const [transactions, summary] = await Promise.all([
      getTransactions(500),
      getTransactionSummary(),
    ]);

    return NextResponse.json({ transactions, summary });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
