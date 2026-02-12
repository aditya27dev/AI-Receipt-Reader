import { getReceipts, getSpendingSummary, getSpendingOverTime } from '@/lib/db';
import { NextResponse } from 'next/server';

// Use Node.js runtime for ChromaDB compatibility
export const runtime = 'nodejs';

export async function GET() {
  try {
    const [receipts, summary, spendingOverTime] = await Promise.all([
      getReceipts(50),
      getSpendingSummary(),
      getSpendingOverTime(),
    ]);

    return NextResponse.json({
      receipts,
      summary,
      spendingOverTime,
    });
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch receipts' },
      { status: 500 }
    );
  }
}
