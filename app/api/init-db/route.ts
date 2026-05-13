import { createReceiptsTable } from '@/lib/db';
import { Result } from 'oxide.ts';
import { NextResponse } from 'next/server';

// Use Node.js runtime for ChromaDB compatibility
export const runtime = 'nodejs';

export async function POST() {
  const result = await Result.safe(createReceiptsTable());
  if (result.isErr()) return NextResponse.json({ error: 'Failed to initialize database' }, { status: 500 });
  return NextResponse.json({ success: true, message: 'Database initialized' });
}
