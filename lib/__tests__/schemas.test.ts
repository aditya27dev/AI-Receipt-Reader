import { describe, it, expect } from 'vitest';
import { receiptSchema } from '../schemas';
import { bankStatementSchema } from '../transaction-schemas';

// ── receiptSchema ───────────────────────────────────────────────────────────

describe('receiptSchema', () => {
    const baseReceipt = {
        merchantName: 'Tesco',
        merchantAddress: '1 High St',
        date: '2024-01-15',
        time: '14:30',
        items: [
            { name: 'Milk', category: 'groceries', quantity: 2, unitPrice: 0.75, totalPrice: 1.5 },
        ],
        subtotal: 1.5,
        tax: 0,
        total: 1.5,
        paymentMethod: 'credit',
        currency: 'GBP',
    };

    it('accepts a valid receipt', () => {
        expect(receiptSchema.safeParse(baseReceipt).success).toBe(true);
    });

    it('accepts all valid payment methods', () => {
        const methods = ['cash', 'credit', 'debit', 'other'] as const;
        for (const paymentMethod of methods) {
            expect(receiptSchema.safeParse({ ...baseReceipt, paymentMethod }).success).toBe(true);
        }
    });

    it('rejects an unknown payment method', () => {
        expect(receiptSchema.safeParse({ ...baseReceipt, paymentMethod: 'bitcoin' }).success).toBe(false);
    });

    it('accepts common currency codes', () => {
        const currencies = ['GBP', 'USD', 'EUR', 'JPY', 'CAD'];
        for (const currency of currencies) {
            expect(receiptSchema.safeParse({ ...baseReceipt, currency }).success).toBe(true);
        }
    });

    it('rejects a receipt with missing required fields', () => {
        expect(receiptSchema.safeParse({ merchantName: 'Test' }).success).toBe(false);
    });

    it('accepts an empty items array', () => {
        expect(receiptSchema.safeParse({ ...baseReceipt, items: [] }).success).toBe(true);
    });

    it('accepts all valid item category values', () => {
        const categories = ['groceries', 'dining', 'transportation', 'entertainment', 'utilities', 'healthcare', 'shopping', 'other'] as const;
        for (const category of categories) {
            const result = receiptSchema.safeParse({
                ...baseReceipt,
                items: [{ name: 'Item', category, quantity: 1, unitPrice: 5, totalPrice: 5 }],
            });
            expect(result.success).toBe(true);
        }
    });

    it('rejects an item with an unknown category', () => {
        const result = receiptSchema.safeParse({
            ...baseReceipt,
            items: [{ name: 'Item', category: 'luxury', quantity: 1, unitPrice: 5, totalPrice: 5 }],
        });
        expect(result.success).toBe(false);
    });

    it('accepts zero values for numeric fields', () => {
        expect(receiptSchema.safeParse({ ...baseReceipt, subtotal: 0, tax: 0, total: 0 }).success).toBe(true);
    });
});

// ── bankStatementSchema ─────────────────────────────────────────────────────

describe('bankStatementSchema', () => {
    const baseStatement = {
        transactions: [
            { date: '2024-01-10', description: 'Sainsburys', amount: 23.45, category: 'groceries', currency: 'GBP' },
        ],
        statementPeriod: { startDate: '2024-01-01', endDate: '2024-01-31' },
        accountNumber: '1234',
    };

    it('accepts a valid statement', () => {
        expect(bankStatementSchema.safeParse(baseStatement).success).toBe(true);
    });

    it('accepts a statement with empty statementPeriod dates', () => {
        expect(bankStatementSchema.safeParse({
            ...baseStatement,
            statementPeriod: { startDate: '', endDate: '' },
        }).success).toBe(true);
    });

    it('rejects a statement with no transactions array', () => {
        expect(bankStatementSchema.safeParse({ accountNumber: '1234' }).success).toBe(false);
    });

    it('accepts all valid transaction category values', () => {
        const categories = ['groceries', 'dining', 'transportation', 'entertainment', 'utilities', 'healthcare', 'shopping', 'travel', 'bills', 'transfer', 'income', 'other'] as const;
        const transactions = categories.map((category, i) => ({
            date: '2024-01-10',
            description: `Transaction ${i}`,
            amount: 10,
            category,
            currency: 'GBP',
        }));
        expect(bankStatementSchema.safeParse({ ...baseStatement, transactions }).success).toBe(true);
    });

    it('rejects a transaction with an unknown category', () => {
        const result = bankStatementSchema.safeParse({
            ...baseStatement,
            transactions: [
                { date: '2024-01-10', description: 'Test', amount: 10, category: 'luxury', currency: 'GBP' },
            ],
        });
        expect(result.success).toBe(false);
    });

    it('rejects a transaction missing amount', () => {
        const result = bankStatementSchema.safeParse({
            ...baseStatement,
            transactions: [
                { date: '2024-01-10', description: 'Test', category: 'groceries', currency: 'GBP' },
            ],
        });
        expect(result.success).toBe(false);
    });

    it('accepts negative amounts (refunds / credits)', () => {
        const result = bankStatementSchema.safeParse({
            ...baseStatement,
            transactions: [
                { date: '2024-01-10', description: 'Refund', amount: -15.0, category: 'other', currency: 'GBP' },
            ],
        });
        expect(result.success).toBe(true);
    });
});

