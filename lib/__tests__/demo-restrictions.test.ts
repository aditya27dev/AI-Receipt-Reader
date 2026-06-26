/**
 * Demo account restriction tests.
 *
 * Verifies that the demo user (demo@example.com) receives 403 on every write
 * operation, while regular users and read-only operations are unaffected.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { DEMO_USER_EMAIL, isDemoUser } from '../session';

// ─── Mock all external dependencies before importing route handlers ──────────

vi.mock('@/lib/session', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../session')>();
    return {
        ...actual, // keeps real isDemoUser + DEMO_USER_EMAIL
        getSessionUser: vi.fn(),
        getSessionUserId: vi.fn(),
    };
});

vi.mock('@/lib/ratelimit', () => ({
    rateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 19 }),
}));

vi.mock('@/lib/db', () => ({
    deleteReceipt: vi.fn().mockResolvedValue(true),
    updateReceiptMetadata: vi.fn().mockResolvedValue(true),
    saveBudget: vi.fn().mockResolvedValue({ id: 'b1', category: 'groceries', limitAmount: 100, period: 'monthly', createdAt: new Date() }),
    deleteBudget: vi.fn().mockResolvedValue(true),
    getBudgets: vi.fn().mockResolvedValue([]),
    saveReceipt: vi.fn(),
    generateImageHash: vi.fn().mockReturnValue('abc123'),
    findReceiptByImageHash: vi.fn().mockResolvedValue(null),
    saveTransactions: vi.fn(),
}));

vi.mock('@/lib/ai', () => ({
    getVisionModel: vi.fn(),
}));

// ─── Import after mocks are registered ───────────────────────────────────────

import { getSessionUser, getSessionUserId } from '../session';
import { DELETE as deleteReceipt, PUT as putReceipt } from '@/app/api/receipts/[id]/route';
import { GET as getBudgets, POST as postBudget, DELETE as deleteBudget } from '@/app/api/budgets/route';
import { POST as extractReceipt } from '@/app/api/extract-receipt/route';
import { POST as processStatement } from '@/app/api/process-statement/route';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DEMO_USER = { id: 'demo-id', email: DEMO_USER_EMAIL };
const REAL_USER = { id: 'real-user-id', email: 'recruiter@acme.com' };

function req(method: string, path: string, body?: unknown): NextRequest {
    return new NextRequest(`http://localhost${path}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined,
    });
}

const RECEIPT_PARAMS = { params: Promise.resolve({ id: 'receipt-123' }) };

// ─── Unit tests: isDemoUser ───────────────────────────────────────────────────

describe('isDemoUser', () => {
    it('returns true for the demo email', () => {
        expect(isDemoUser(DEMO_USER_EMAIL)).toBe(true);
    });

    it('returns false for a regular email', () => {
        expect(isDemoUser('user@example.com')).toBe(false);
    });

    it('is case-sensitive', () => {
        expect(isDemoUser('Demo@example.com')).toBe(false);
        expect(isDemoUser('DEMO@EXAMPLE.COM')).toBe(false);
    });

    it('returns false for an empty string', () => {
        expect(isDemoUser('')).toBe(false);
    });
});

// ─── Demo user: all writes are blocked ───────────────────────────────────────

describe('Demo user — write operations return 403', () => {
    beforeEach(() => {
        vi.mocked(getSessionUser).mockResolvedValue(DEMO_USER);
        vi.mocked(getSessionUserId).mockResolvedValue(DEMO_USER.id);
    });

    it('DELETE /api/receipts/[id]', async () => {
        const res = await deleteReceipt(req('DELETE', '/api/receipts/receipt-123'), RECEIPT_PARAMS);
        expect(res.status).toBe(403);
        const body = await res.json();
        expect(body.error).toMatch(/read-only/i);
    });

    it('PUT /api/receipts/[id]', async () => {
        const res = await putReceipt(
            req('PUT', '/api/receipts/receipt-123', { merchant_name: 'Hacked' }),
            RECEIPT_PARAMS,
        );
        expect(res.status).toBe(403);
        const body = await res.json();
        expect(body.error).toMatch(/read-only/i);
    });

    it('POST /api/budgets', async () => {
        const res = await postBudget(req('POST', '/api/budgets', { category: 'groceries', limitAmount: 200 }));
        expect(res.status).toBe(403);
        const body = await res.json();
        expect(body.error).toMatch(/read-only/i);
    });

    it('DELETE /api/budgets', async () => {
        const res = await deleteBudget(req('DELETE', '/api/budgets?id=budget-123'));
        expect(res.status).toBe(403);
        const body = await res.json();
        expect(body.error).toMatch(/read-only/i);
    });

    it('POST /api/extract-receipt', async () => {
        const res = await extractReceipt(
            req('POST', '/api/extract-receipt', { image: 'base64data', mimeType: 'image/jpeg' }),
        );
        expect(res.status).toBe(403);
        const body = await res.json();
        expect(body.error).toMatch(/read-only/i);
    });

    it('POST /api/process-statement', async () => {
        const res = await processStatement(
            req('POST', '/api/process-statement', { file: 'base64pdf' }),
        );
        expect(res.status).toBe(403);
        const body = await res.json();
        expect(body.error).toMatch(/read-only/i);
    });
});

// ─── Demo user: reads are allowed ────────────────────────────────────────────

describe('Demo user — read operations pass through', () => {
    beforeEach(() => {
        vi.mocked(getSessionUser).mockResolvedValue(DEMO_USER);
        vi.mocked(getSessionUserId).mockResolvedValue(DEMO_USER.id);
    });

    it('GET /api/budgets returns 200', async () => {
        const res = await getBudgets(req('GET', '/api/budgets'));
        expect(res.status).toBe(200);
    });
});

// ─── Regular user: writes are NOT blocked ────────────────────────────────────

describe('Regular user — writes are not blocked by the demo guard', () => {
    beforeEach(() => {
        vi.mocked(getSessionUser).mockResolvedValue(REAL_USER);
        vi.mocked(getSessionUserId).mockResolvedValue(REAL_USER.id);
    });

    it('DELETE /api/receipts/[id] proceeds (not 403)', async () => {
        const res = await deleteReceipt(req('DELETE', '/api/receipts/receipt-123'), RECEIPT_PARAMS);
        expect(res.status).not.toBe(403);
    });

    it('POST /api/budgets proceeds (not 403)', async () => {
        const res = await postBudget(req('POST', '/api/budgets', { category: 'groceries', limitAmount: 200 }));
        expect(res.status).not.toBe(403);
    });

    it('DELETE /api/budgets proceeds (not 403)', async () => {
        const res = await deleteBudget(req('DELETE', '/api/budgets?id=budget-123'));
        expect(res.status).not.toBe(403);
    });

    it('POST /api/extract-receipt proceeds (not 403)', async () => {
        // Will fail further down (no valid image) but must not be blocked at 403
        const res = await extractReceipt(
            req('POST', '/api/extract-receipt', { image: 'data', mimeType: 'image/jpeg' }),
        );
        expect(res.status).not.toBe(403);
    });
});

// ─── Unauthenticated user: not blocked by demo guard ─────────────────────────

describe('Unauthenticated user — demo guard does not fire for null session', () => {
    beforeEach(() => {
        vi.mocked(getSessionUser).mockResolvedValue(null);
        vi.mocked(getSessionUserId).mockResolvedValue(null);
    });

    it('DELETE /api/receipts/[id] is not blocked at 403', async () => {
        const res = await deleteReceipt(req('DELETE', '/api/receipts/receipt-123'), RECEIPT_PARAMS);
        expect(res.status).not.toBe(403);
    });

    it('POST /api/budgets is not blocked at 403', async () => {
        const res = await postBudget(req('POST', '/api/budgets', { category: 'groceries', limitAmount: 200 }));
        expect(res.status).not.toBe(403);
    });
});
