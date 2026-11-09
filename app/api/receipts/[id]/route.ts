import { deleteReceipt, updateReceipt } from '@/lib/db';
import type { ReceiptUpdate } from '@/lib/db';
import { receiptSchema } from '@/lib/schemas';
import { z } from 'zod';
import { getSessionUser, isDemoUser } from '@/lib/session';
import { Result } from 'oxide.ts';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const PG_ENABLED = !!process.env.DATABASE_URL;

// Request body uses snake_case keys (the receipt-history edit form sends these).
// Receipts have no category or notes columns, so those keys are rejected.
const updateBodySchema = z
  .object({
    merchant_name: z.string().trim().min(1).max(200),
    purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
    total: z.number().finite().nonnegative(),
    payment_method: receiptSchema.shape.paymentMethod,
  })
  .partial()
  .strict();

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
  if (PG_ENABLED && !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
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
  const userId = user?.id ?? null;
  if (PG_ENABLED && !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const bodyResult = await Result.safe(request.json() as Promise<Record<string, unknown>>);
  if (bodyResult.isErr()) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

  const parsed = updateBodySchema.safeParse(bodyResult.unwrap());
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid update', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const body = parsed.data;
  const updates: ReceiptUpdate = {
    merchantName: body.merchant_name,
    date: body.purchase_date,
    total: body.total,
    paymentMethod: body.payment_method,
  };
  for (const key of Object.keys(updates) as (keyof ReceiptUpdate)[]) {
    if (updates[key] === undefined) delete updates[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const result = await Result.safe(updateReceipt(id, updates, userId));
  if (result.isErr()) return NextResponse.json({ error: 'Failed to update receipt' }, { status: 500 });
  if (!result.unwrap()) return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });

  return NextResponse.json({ success: true, id, updated: updates });
}
