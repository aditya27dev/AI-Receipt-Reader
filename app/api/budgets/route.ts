import { getBudgets, saveBudget, deleteBudget } from '@/lib/db';
import { getSessionUserId, getSessionUser, isDemoUser } from '@/lib/session';
import { Result } from 'oxide.ts';
import { NextRequest, NextResponse } from 'next/server';

const DEMO_READONLY = () =>
    NextResponse.json({ error: 'Demo account is read-only' }, { status: 403 });

const PG_ENABLED = !!process.env.DATABASE_URL;

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    const userId = await getSessionUserId(req);
    if (PG_ENABLED && !userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const result = await Result.safe(getBudgets(userId));
    if (result.isErr()) return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 });
    return NextResponse.json({ budgets: result.unwrap() });
}

export async function POST(req: NextRequest) {
    const postUser = await getSessionUser(req);
    if (postUser && isDemoUser(postUser.email)) return DEMO_READONLY();
    const userId = postUser?.id ?? null;
    if (PG_ENABLED && !userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { category?: string; limitAmount?: number };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { category, limitAmount } = body;

    if (!category || typeof category !== 'string' || category.trim().length === 0) {
        return NextResponse.json({ error: 'Missing or invalid category' }, { status: 400 });
    }
    if (typeof limitAmount !== 'number' || limitAmount <= 0) {
        return NextResponse.json({ error: 'limitAmount must be a positive number' }, { status: 400 });
    }

    const result = await Result.safe(saveBudget(category.trim(), limitAmount, userId));
    if (result.isErr()) return NextResponse.json({ error: 'Failed to save budget' }, { status: 500 });
    return NextResponse.json({ budget: result.unwrap() }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
    const deleteUser = await getSessionUser(req);
    if (deleteUser && isDemoUser(deleteUser.email)) return DEMO_READONLY();
    const userId = deleteUser?.id ?? null;
    if (PG_ENABLED && !userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    const result = await Result.safe(deleteBudget(id, userId));
    if (result.isErr()) return NextResponse.json({ error: 'Failed to delete budget' }, { status: 500 });
    return NextResponse.json({ success: result.unwrap() });
}
