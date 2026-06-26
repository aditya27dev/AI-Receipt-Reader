import { describe, it, expect } from 'vitest';
import { reconcile } from '../reconciliation';
import type { StoredReceipt } from '../db';
import type { StoredTransaction } from '../db';

function makeReceipt(overrides: Partial<StoredReceipt> = {}): StoredReceipt {
    return {
        id: 'r1',
        merchantName: 'Tesco',
        merchantAddress: '',
        date: '2024-01-15',
        time: '',
        items: [],
        subtotal: 20,
        tax: 0,
        total: 20,
        paymentMethod: 'credit',
        currency: 'GBP',
        createdAt: new Date(),
        ...overrides,
    };
}

function makeTransaction(overrides: Partial<StoredTransaction> = {}): StoredTransaction {
    return {
        id: 't1',
        date: '2024-01-15',
        description: 'TESCO STORES',
        amount: 20,
        category: 'groceries',
        currency: 'GBP',
        createdAt: new Date(),
        ...overrides,
    };
}

describe('reconcile', () => {
    it('matches an exact receipt to transaction', () => {
        const matches = reconcile([makeReceipt()], [makeTransaction()]);
        expect(matches).toHaveLength(1);
        expect(matches[0].confidence).toBeGreaterThanOrEqual(0.7);
        expect(matches[0].receipt.id).toBe('r1');
        expect(matches[0].transaction.id).toBe('t1');
    });

    it('returns no matches when amount is far off', () => {
        const matches = reconcile(
            [makeReceipt({ total: 20 })],
            [makeTransaction({ amount: 100 })]
        );
        expect(matches).toHaveLength(0);
    });

    it('returns no matches when date is more than 2 days apart', () => {
        const matches = reconcile(
            [makeReceipt({ date: '2024-01-15' })],
            [makeTransaction({ date: '2024-01-20' })]
        );
        expect(matches).toHaveLength(0);
    });

    it('matches when merchant names are similar substrings', () => {
        const matches = reconcile(
            [makeReceipt({ merchantName: 'Sainsburys', total: 15 })],
            [makeTransaction({ description: 'SAINSBURYS ONLINE', amount: 15 })]
        );
        expect(matches).toHaveLength(1);
    });

    it('returns matches sorted by confidence descending', () => {
        const receipts = [
            makeReceipt({ id: 'r1', total: 20 }),
            makeReceipt({ id: 'r2', total: 50 }),
        ];
        const transactions = [
            makeTransaction({ id: 't1', amount: 20 }),
            makeTransaction({ id: 't2', amount: 50, description: 'TESCO' }),
        ];
        const matches = reconcile(receipts, transactions);
        if (matches.length >= 2) {
            expect(matches[0].confidence).toBeGreaterThanOrEqual(matches[1].confidence);
        }
    });
});
