import { searchReceipts } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Use Node.js runtime for ChromaDB compatibility
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    const receipts = await searchReceipts(query, limit);

    return NextResponse.json({
      query,
      results: receipts,
      count: receipts.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search receipts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
