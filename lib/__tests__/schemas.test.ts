import { describe, it, expect } from 'vitest';
import { receiptSchema } from '../schemas';
import { bankStatementSchema } from '../transaction-schemas';

describe('receiptSchema', () => {
    it('accepts a valid receipt', () => {
        const valid = {
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
        const result = receiptSchema.safeParse(valid);
        expect(result.success).toBe(true);
    });

    it('rejects a receipt with missing required fields', () => {
        const result = receiptSchema.safeParse({ merchantName: 'Test' });
        expect(result.success).toBe(false);
    });

    it('rejects a receipt with invalid paymentMethod', () => {
        const result = receiptSchema.safeParse({
            merchantName: 'Test',
            merchantAddress: '',
            date: '2024-01-01',
            time: '',
            items: [],
            subtotal: 0,
            tax: 0,
            total: 0,
            paymentMethod: 'bitcoin', // invalid
            currency: 'GBP',
        });
        expect(result.success).toBe(false);
    });
});

describe('bankStatementSchema', () => {
    it('accepts a valid statement', () => {
        const valid = {
            transactions: [
                { date: '2024-01-10', description: 'Sainsburys', amount: 23.45, category: 'groceries', currency: 'GBP' },
            ],
            statementPeriod: { start: '2024-01-01', end: '2024-01-31' },
            accountNumber: '1234',
        };
        const result = bankStatementSchema.safeParse(valid);
        expect(result.success).toBe(true);
    });

    it('rejects a statement with no transactions array', () => {
        const result = bankStatementSchema.safeParse({ accountNumber: '1234' });
        expect(result.success).toBe(false);
    });
});
