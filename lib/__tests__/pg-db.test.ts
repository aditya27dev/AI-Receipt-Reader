/**
 * Tests for pg-db.ts with the database mocked out.
 *
 * We mock `lib/pg` so no real DB connection is required.
 * Each test creates a minimal Drizzle-compatible mock that returns
 * canned data, allowing us to test mapping logic in isolation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock lib/pg ──────────────────────────────────────────────────────────────

const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockDelete = vi.fn();
const mockUpdate = vi.fn();

const mockDb = {
    select: mockSelect,
    insert: mockInsert,
    delete: mockDelete,
    update: mockUpdate,
};

vi.mock('../pg', () => ({
    getDb: () => mockDb,
}));

// ── Import after mocking ─────────────────────────────────────────────────────

import {
    getReceiptsPg,
    getBudgetsPg,
    getTransactionsPg,
} from '../pg-db';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeDbReceipt(overrides: Record<string, unknown> = {}) {
    return {
        id: 'r1',
        merchantName: 'Tesco',
        merchantAddress: '1 High St',
        date: '2024-01-15',
        time: '14:30',
        items: [{ name: 'Milk', category: 'groceries', quantity: 1, unitPrice: 1, totalPrice: 1 }],
        subtotal: '20.00',
        tax: '0.00',
        total: '20.00',
        paymentMethod: 'credit',
        currency: 'GBP',
        imageUrl: null,
        imageHash: null,
        userId: null,
        createdAt: new Date('2024-01-15T10:00:00Z'),
        ...overrides,
    };
}

function makeDbBudget(overrides: Record<string, unknown> = {}) {
    return {
        id: 'b1',
        category: 'groceries',
        limitAmount: '200.00',
        period: 'monthly',
        userId: null,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        ...overrides,
    };
}

function makeDbTransaction(overrides: Record<string, unknown> = {}) {
    return {
        id: 't1',
        date: '2024-01-10',
        description: 'Sainsburys',
        amount: '23.45',
        category: 'groceries',
        currency: 'GBP',
        statementId: null,
        userId: null,
        createdAt: new Date('2024-01-10T09:00:00Z'),
        ...overrides,
    };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('getReceiptsPg', () => {
    beforeEach(() => vi.clearAllMocks());

    it('maps DB rows to PgStoredReceipt objects', async () => {
        const chainMock = {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            orderBy: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            offset: vi.fn().mockResolvedValue([makeDbReceipt()]),
        };
        mockSelect.mockReturnValue(chainMock);

        const results = await getReceiptsPg(null, 10, 0);
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe('r1');
        expect(results[0].merchantName).toBe('Tesco');
        expect(results[0].total).toBe(20);
        expect(results[0].currency).toBe('GBP');
        expect(results[0].createdAt).toBeInstanceOf(Date);
    });

    it('returns empty array when no rows', async () => {
        const chainMock = {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            orderBy: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            offset: vi.fn().mockResolvedValue([]),
        };
        mockSelect.mockReturnValue(chainMock);

        const results = await getReceiptsPg(null, 10, 0);
        expect(results).toHaveLength(0);
    });
});

describe('getBudgetsPg', () => {
    beforeEach(() => vi.clearAllMocks());

    it('maps DB rows to Budget objects', async () => {
        const chainMock = {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            orderBy: vi.fn().mockResolvedValue([makeDbBudget()]),
        };
        mockSelect.mockReturnValue(chainMock);

        const results = await getBudgetsPg(null);
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe('b1');
        expect(results[0].category).toBe('groceries');
        expect(results[0].limitAmount).toBe(200);
        expect(results[0].period).toBe('monthly');
    });
});

describe('getTransactionsPg', () => {
    beforeEach(() => vi.clearAllMocks());

    it('maps DB rows to StoredTransaction objects', async () => {
        const chainMock = {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            orderBy: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            offset: vi.fn().mockResolvedValue([makeDbTransaction()]),
        };
        mockSelect.mockReturnValue(chainMock);

        const results = await getTransactionsPg(null, 10, 0);
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe('t1');
        expect(results[0].description).toBe('Sainsburys');
        expect(results[0].amount).toBe(23.45);
        expect(results[0].category).toBe('groceries');
    });
});
