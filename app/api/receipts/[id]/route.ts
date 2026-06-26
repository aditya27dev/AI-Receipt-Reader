import { deleteReceipt, updateReceiptMetadata } from '@/lib/db';
import { getSessionUser, isDemoUser } from '@/lib/session';
import { Result } from 'oxide.ts';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const DEMO_READONLY = () =>
  NextResponse.json({ error: 'Demo account is read-only' }, { status: 403 });

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Receipt ID is required' }, { status: 400 });
  }

  const user = await getSessionUser(request);
  if (user && isDemoUser(user.email)) return DEMO_READONLY();
  const userId = user?.id ?? null;
  const result = await Result.safe(deleteReceipt(id, userId));
  if (result.isErr()) return NextResponse.json({ error: 'Failed to delete receipt' }, { status: 500 });
  if (!result.unwrap()) return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });

  return NextResponse.json({ success: true });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Receipt ID is required' }, { status: 400 });

  const user = await getSessionUser(request);
  if (user && isDemoUser(user.email)) return DEMO_READONLY();

  const bodyResult = await Result.safe(request.json() as Promise<Record<string, unknown>>);
  if (bodyResult.isErr()) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

  const updates = bodyResult.unwrap();
  // Sanitise: only allow known scalar metadata fields
  const allowed = ['merchant_name', 'purchase_date', 'total', 'category', 'payment_method', 'notes'];
  const metadataUpdate: Record<string, string | number> = {};
  for (const key of allowed) {
    if (key in updates) {
      const v = updates[key];
      if (typeof v === 'string' || typeof v === 'number') {
        metadataUpdate[key] = v;
      }
    }
  }

  if (Object.keys(metadataUpdate).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const collectionResult = await Result.safe(updateReceiptMetadata(id, metadataUpdate));
  if (collectionResult.isErr() || !collectionResult.unwrap()) {
    return NextResponse.json({ error: 'Failed to update receipt' }, { status: 500 });
  }

  return NextResponse.json({ success: true, id, updated: metadataUpdate });
}
