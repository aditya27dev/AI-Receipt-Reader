import { getReceipts, getTransactions } from '@/lib/db';
import { getSessionUserId } from '@/lib/session';
import { Result } from 'oxide.ts';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    const userId = await getSessionUserId(req);
    if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') ?? 'json'; // 'csv' | 'json'
    const type = searchParams.get('type') ?? 'receipts'; // 'receipts' | 'transactions'

    if (!['csv', 'json'].includes(format)) {
        return new Response(JSON.stringify({ error: 'Invalid format. Use csv or json.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    if (!['receipts', 'transactions'].includes(type)) {
        return new Response(JSON.stringify({ error: 'Invalid type. Use receipts or transactions.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    if (type === 'receipts') {
        const result = await Result.safe(getReceipts(10000, 0, userId));
        if (result.isErr()) return new Response(JSON.stringify({ error: 'Export failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        const receipts = result.unwrap();

        if (format === 'json') {
            return new Response(JSON.stringify(receipts, null, 2), {
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Disposition': 'attachment; filename="receipts.json"',
                },
            });
        }

        const rows = receipts.map(r => [
            r.id,
            r.date,
            r.merchantName,
            r.total.toString(),
            r.currency,
            r.paymentMethod,
            r.createdAt.toISOString(),
        ]);
        const csv = [
            ['id', 'date', 'merchant', 'total', 'currency', 'paymentMethod', 'createdAt'],
            ...rows,
        ]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        return new Response(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename="receipts.csv"',
            },
        });
    }

    // transactions
    const txResult = await Result.safe(getTransactions(10000, 0, userId));
    if (txResult.isErr()) return new Response(JSON.stringify({ error: 'Export failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    const transactions = txResult.unwrap();

    if (format === 'json') {
        return new Response(JSON.stringify(transactions, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': 'attachment; filename="transactions.json"',
            },
        });
    }

    const rows = transactions.map(t => [
        t.id,
        t.date,
        t.description,
        t.amount.toString(),
        t.currency,
        t.category,
        t.createdAt.toISOString(),
    ]);
    const csv = [
        ['id', 'date', 'description', 'amount', 'currency', 'category', 'createdAt'],
        ...rows,
    ]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    return new Response(csv, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="transactions.csv"',
        },
    });
}
