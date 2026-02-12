import { createReceiptsTable } from '@/lib/db';
import { NextResponse } from 'next/server';

// Use Node.js runtime for ChromaDB compatibility
export const runtime = 'nodejs';

export async function POST() {
  try {
    await createReceiptsTable();
    return NextResponse.json({ success: true, message: 'Database initialized' });
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
