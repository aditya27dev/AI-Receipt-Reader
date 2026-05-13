import { deleteReceipt } from '@/lib/db';
import { Result } from 'oxide.ts';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Receipt ID is required' }, { status: 400 });
  }

  const result = await Result.safe(deleteReceipt(id));
  if (result.isErr()) return NextResponse.json({ error: 'Failed to delete receipt' }, { status: 500 });
  if (!result.unwrap()) return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });

  return NextResponse.json({ success: true });
}
