/**
 * PostgreSQL data-access layer (Drizzle ORM).
 *
 * All functions accept an optional `userId` so that data is automatically
 * scoped per user in multi-user deployments. Pass `null` / `undefined` for
 * anonymous / single-user use.
 */

import { desc, eq, and, isNull, ilike } from 'drizzle-orm';
import { getDb } from './pg';
import * as schema from './pg-schema';
import type { Receipt, ReceiptItem } from './schemas';
import type { BankTransaction } from './transaction-schemas';

// ─── Shared return shapes (mirrors lib/db.ts StoredXxx interfaces) ────────────

export interface PgStoredReceipt extends Receipt {
    id: string;
    createdAt: Date;
    imageUrl?: string;
    imageHash?: string;
}

export interface PgStoredTransaction extends BankTransaction {
    id: string;
    createdAt: Date;
    statementId?: string;
}

export interface PgBudget {
    id: string;
    category: string;
    limitAmount: number;
    period: 'monthly';
    createdAt: Date;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nanoid() {
    return Math.random().toString(36).slice(2, 11);
}

function rowToReceipt(row: typeof schema.receipts.$inferSelect): PgStoredReceipt {
    return {
        id: row.id,
        merchantName: row.merchantName,
        merchantAddress: row.merchantAddress,
        date: row.date,
        time: row.time,
        items: (row.items as ReceiptItem[]) ?? [],
        subtotal: parseFloat(row.subtotal ?? '0'),
        tax: parseFloat(row.tax ?? '0'),
        total: parseFloat(row.total),
        paymentMethod: row.paymentMethod as Receipt['paymentMethod'],
        currency: row.currency,
        imageUrl: row.imageUrl ?? undefined,
        imageHash: row.imageHash ?? undefined,
        createdAt: row.createdAt,
    };
}

function rowToTransaction(
    row: typeof schema.bankTransactions.$inferSelect,
): PgStoredTransaction {
    return {
        id: row.id,
        date: row.date,
        description: row.description,
        amount: parseFloat(row.amount),
        category: row.category as BankTransaction['category'],
        currency: row.currency,
        statementId: row.statementId ?? undefined,
        createdAt: row.createdAt,
    };
}

// ─── Receipts ─────────────────────────────────────────────────────────────────

export async function saveReceiptPg(
    receipt: Receipt,
    userId: string | null,
    imageUrl?: string,
    imageHash?: string,
): Promise<PgStoredReceipt> {
    const db = getDb();
    const id = `receipt_${Date.now()}_${nanoid()}`;
    const createdAt = new Date();

    await db.insert(schema.receipts).values({
        id,
        userId: userId ?? null,
        merchantName: receipt.merchantName,
        merchantAddress: receipt.merchantAddress,
        date: receipt.date,
        time: receipt.time,
        items: receipt.items,
        subtotal: receipt.subtotal.toString(),
        tax: receipt.tax.toString(),
        total: receipt.total.toString(),
        paymentMethod: receipt.paymentMethod,
        currency: receipt.currency,
        imageUrl: imageUrl ?? null,
        imageHash: imageHash ?? null,
        createdAt,
    });

    return { id, ...receipt, imageUrl, imageHash, createdAt };
}

export async function getReceiptsPg(
    userId: string | null,
    limit = 50,
    offset = 0,
): Promise<PgStoredReceipt[]> {
    const db = getDb();
    const rows = await db
        .select()
        .from(schema.receipts)
        .where(userId ? eq(schema.receipts.userId, userId) : undefined)
        .orderBy(desc(schema.receipts.createdAt))
        .limit(limit)
        .offset(offset);

    return rows.map(rowToReceipt);
}

export async function findReceiptByHashPg(
    imageHash: string,
): Promise<PgStoredReceipt | null> {
    const db = getDb();
    const rows = await db
        .select()
        .from(schema.receipts)
        .where(eq(schema.receipts.imageHash, imageHash))
        .limit(1);

    return rows.length > 0 ? rowToReceipt(rows[0]) : null;
}

export async function deleteReceiptPg(
    id: string,
    userId: string | null,
): Promise<boolean> {
    const db = getDb();
    const condition = userId
        ? and(eq(schema.receipts.id, id), eq(schema.receipts.userId, userId))
        : eq(schema.receipts.id, id);

    const result = await db.delete(schema.receipts).where(condition);
    return (result as unknown as { rowCount?: number })?.rowCount !== 0;
}

export async function getSpendingSummaryPg(userId: string | null) {
    const receipts = await getReceiptsPg(userId, 1000);
    const map = new Map<string, { totalSpent: number; count: number }>();
    for (const r of receipts) {
        for (const item of r.items) {
            const cur = map.get(item.category) ?? { totalSpent: 0, count: 0 };
            map.set(item.category, {
                totalSpent: cur.totalSpent + item.totalPrice,
                count: cur.count + 1,
            });
        }
    }
    return Array.from(map.entries())
        .map(([category, d]) => ({ category, totalSpent: d.totalSpent, count: d.count }))
        .sort((a, b) => b.totalSpent - a.totalSpent);
}

export async function getSpendingOverTimePg(userId: string | null, days = 30) {
    const receipts = await getReceiptsPg(userId, 1000);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const map = new Map<string, number>();
    for (const r of receipts) {
        if (new Date(r.date) >= cutoff) {
            map.set(r.date, (map.get(r.date) ?? 0) + r.total);
        }
    }
    return Array.from(map.entries())
        .map(([date, total]) => ({ date, total }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

// ─── Bank transactions ────────────────────────────────────────────────────────

export async function saveTransactionsPg(
    transactions: BankTransaction[],
    statementId: string | undefined,
    userId: string | null,
): Promise<string[]> {
    if (transactions.length === 0) return [];
    const db = getDb();
    const now = new Date();
    const ids = transactions.map(() => `txn_${Date.now()}_${nanoid()}`);

    await db.insert(schema.bankTransactions).values(
        transactions.map((t, i) => ({
            id: ids[i],
            userId: userId ?? null,
            statementId: statementId ?? null,
            date: t.date,
            description: t.description,
            amount: t.amount.toString(),
            category: t.category,
            currency: t.currency,
            createdAt: now,
        })),
    );

    return ids;
}

export async function getTransactionsPg(
    userId: string | null,
    limit = 100,
    offset = 0,
): Promise<PgStoredTransaction[]> {
    const db = getDb();
    const rows = await db
        .select()
        .from(schema.bankTransactions)
        .where(userId ? eq(schema.bankTransactions.userId, userId) : undefined)
        .orderBy(desc(schema.bankTransactions.date))
        .limit(limit)
        .offset(offset);

    return rows.map(rowToTransaction);
}

export async function getTransactionSummaryPg(userId: string | null) {
    const transactions = await getTransactionsPg(userId, 1000);
    const map = new Map<string, { totalSpent: number; count: number }>();
    for (const t of transactions) {
        if (t.amount > 0 && t.category !== 'income' && t.category !== 'transfer') {
            const cur = map.get(t.category) ?? { totalSpent: 0, count: 0 };
            map.set(t.category, { totalSpent: cur.totalSpent + t.amount, count: cur.count + 1 });
        }
    }
    return Array.from(map.entries())
        .map(([category, d]) => ({ category, totalSpent: d.totalSpent, count: d.count }))
        .sort((a, b) => b.totalSpent - a.totalSpent);
}

export async function deleteTransactionPg(
    id: string,
    userId: string | null,
): Promise<boolean> {
    const db = getDb();
    const condition = userId
        ? and(eq(schema.bankTransactions.id, id), eq(schema.bankTransactions.userId, userId))
        : eq(schema.bankTransactions.id, id);

    const result = await db.delete(schema.bankTransactions).where(condition);
    return (result as unknown as { rowCount?: number })?.rowCount !== 0;
}

// ─── Budgets ──────────────────────────────────────────────────────────────────

export async function saveBudgetPg(
    category: string,
    limitAmount: number,
    userId: string | null,
): Promise<PgBudget> {
    const db = getDb();

    // Upsert: delete any existing budget for this category + user first
    const condition = userId
        ? and(eq(schema.budgets.category, category), eq(schema.budgets.userId, userId))
        : eq(schema.budgets.category, category);
    await db.delete(schema.budgets).where(condition);

    const id = `budget_${Date.now()}_${nanoid()}`;
    const createdAt = new Date();

    await db.insert(schema.budgets).values({
        id,
        userId: userId ?? null,
        category,
        limitAmount: limitAmount.toString(),
        period: 'monthly',
        createdAt,
    });

    return { id, category, limitAmount, period: 'monthly', createdAt };
}

export async function getBudgetsPg(userId: string | null): Promise<PgBudget[]> {
    const db = getDb();
    const rows = await db
        .select()
        .from(schema.budgets)
        .where(userId ? eq(schema.budgets.userId, userId) : undefined)
        .orderBy(desc(schema.budgets.createdAt));

    return rows.map((r) => ({
        id: r.id,
        category: r.category,
        limitAmount: parseFloat(r.limitAmount),
        period: 'monthly' as const,
        createdAt: r.createdAt,
    }));
}

export async function deleteBudgetPg(
    id: string,
    userId: string | null,
): Promise<boolean> {
    const db = getDb();
    const condition = userId
        ? and(eq(schema.budgets.id, id), eq(schema.budgets.userId, userId))
        : eq(schema.budgets.id, id);

    const result = await db.delete(schema.budgets).where(condition);
    return (result as unknown as { rowCount?: number })?.rowCount !== 0;
}

export async function searchReceiptsPg(
    query: string,
    limit: number,
    userId: string | null,
): Promise<PgStoredReceipt[]> {
    const db = getDb();
    const pattern = `%${query}%`;
    const textMatch = ilike(schema.receipts.merchantName, pattern);
    const condition = userId
        ? and(textMatch, eq(schema.receipts.userId, userId))
        : and(textMatch, isNull(schema.receipts.userId));

    const rows = await db
        .select()
        .from(schema.receipts)
        .where(condition)
        .orderBy(desc(schema.receipts.createdAt))
        .limit(limit);

    return rows.map(rowToReceipt);
}
