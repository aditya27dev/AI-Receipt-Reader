import { NextRequest } from 'next/server';
import { getAuth } from '@/lib/auth';
import { rateLimit } from '@/lib/ratelimit';
import { getDb } from '@/lib/pg';
import { receipts, bankTransactions, budgets } from '@/lib/pg-schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

const DEMO_EMAIL = 'demo@example.com';
const DEMO_PASSWORD = 'DemoUser123!';
const DEMO_NAME = 'Demo User';

async function seedDemoAccount(userId: string) {
    const db = getDb();

    // Idempotency check — only seed on first creation
    const existing = await db
        .select({ id: receipts.id })
        .from(receipts)
        .where(eq(receipts.userId, userId))
        .limit(1);

    if (existing.length > 0) return;

    const now = new Date();

    await db.insert(receipts).values([
        {
            id: crypto.randomUUID(),
            userId,
            merchantName: 'Tesco Express',
            merchantAddress: '42 High Street, London, EC1A 1BB',
            date: '2026-05-14',
            time: '09:32',
            items: [
                { name: 'Semi-Skimmed Milk 2L', quantity: 2, unitPrice: 0.89, totalPrice: 1.78, category: 'groceries' },
                { name: 'Sourdough Bread', quantity: 1, unitPrice: 1.45, totalPrice: 1.45, category: 'groceries' },
                { name: 'Cheddar Cheese 400g', quantity: 1, unitPrice: 2.75, totalPrice: 2.75, category: 'groceries' },
                { name: 'Free Range Eggs (6)', quantity: 1, unitPrice: 2.10, totalPrice: 2.10, category: 'groceries' },
                { name: 'Chicken Breast 500g', quantity: 2, unitPrice: 3.50, totalPrice: 7.00, category: 'groceries' },
                { name: 'Pasta Sauce', quantity: 2, unitPrice: 1.35, totalPrice: 2.70, category: 'groceries' },
            ],
            subtotal: '19.78',
            tax: '0.00',
            total: '19.78',
            paymentMethod: 'debit',
            currency: 'GBP',
            createdAt: now,
        },
        {
            id: crypto.randomUUID(),
            userId,
            merchantName: 'The Ivy Restaurant',
            merchantAddress: '1-5 West Street, New York, NY 10036',
            date: '2026-05-22',
            time: '19:45',
            items: [
                { name: 'Grilled Salmon', quantity: 1, unitPrice: 28.00, totalPrice: 28.00, category: 'dining' },
                { name: 'Caesar Salad', quantity: 1, unitPrice: 16.00, totalPrice: 16.00, category: 'dining' },
                { name: 'Glass of Merlot', quantity: 2, unitPrice: 12.00, totalPrice: 24.00, category: 'dining' },
            ],
            subtotal: '68.00',
            tax: '6.12',
            total: '74.12',
            paymentMethod: 'credit',
            currency: 'USD',
            createdAt: now,
        },
        {
            id: crypto.randomUUID(),
            userId,
            merchantName: 'Boots Pharmacy',
            merchantAddress: '38 Oxford Street, London, W1D 1AP',
            date: '2026-05-20',
            time: '14:10',
            items: [
                { name: 'Ibuprofen 400mg 24pk', quantity: 1, unitPrice: 3.49, totalPrice: 3.49, category: 'healthcare' },
                { name: 'Vitamin D3 90 Tablets', quantity: 1, unitPrice: 8.99, totalPrice: 8.99, category: 'healthcare' },
                { name: 'Hand Cream 75ml', quantity: 1, unitPrice: 5.82, totalPrice: 5.82, category: 'healthcare' },
            ],
            subtotal: '18.30',
            tax: '0.00',
            total: '18.30',
            paymentMethod: 'debit',
            currency: 'GBP',
            createdAt: now,
        },
        {
            id: crypto.randomUUID(),
            userId,
            merchantName: 'Zara',
            merchantAddress: '333 Oxford Street, London, W1C 2HQ',
            date: '2026-06-01',
            time: '12:55',
            items: [
                { name: 'Linen Blazer', quantity: 1, unitPrice: 59.99, totalPrice: 59.99, category: 'shopping' },
                { name: 'Slim Fit Trousers', quantity: 1, unitPrice: 25.99, totalPrice: 25.99, category: 'shopping' },
            ],
            subtotal: '85.98',
            tax: '0.00',
            total: '85.98',
            paymentMethod: 'credit',
            currency: 'GBP',
            createdAt: now,
        },
    ]);

    const stmtId = `stmt_demo_${userId.slice(0, 8)}`;

    await db.insert(bankTransactions).values([
        {
            id: crypto.randomUUID(),
            userId,
            statementId: stmtId,
            date: '2026-05-14',
            description: 'TESCO EXPRESS LONDON',
            amount: '19.78',
            category: 'groceries',
            currency: 'GBP',
            createdAt: now,
        },
        {
            id: crypto.randomUUID(),
            userId,
            statementId: stmtId,
            date: '2026-05-18',
            description: 'TFL TRAVEL CHARGE',
            amount: '12.40',
            category: 'transportation',
            currency: 'GBP',
            createdAt: now,
        },
        {
            id: crypto.randomUUID(),
            userId,
            statementId: stmtId,
            date: '2026-05-20',
            description: 'BOOTS PHARMACY OXFORD ST',
            amount: '18.30',
            category: 'healthcare',
            currency: 'GBP',
            createdAt: now,
        },
        {
            id: crypto.randomUUID(),
            userId,
            statementId: stmtId,
            date: '2026-05-22',
            description: 'STARBUCKS COVENT GARDEN',
            amount: '8.50',
            category: 'dining',
            currency: 'GBP',
            createdAt: now,
        },
        {
            id: crypto.randomUUID(),
            userId,
            statementId: stmtId,
            date: '2026-06-01',
            description: 'ZARA OXFORD STREET',
            amount: '85.98',
            category: 'shopping',
            currency: 'GBP',
            createdAt: now,
        },
        {
            id: crypto.randomUUID(),
            userId,
            statementId: stmtId,
            date: '2026-06-05',
            description: 'AMAZON PRIME MEMBERSHIP',
            amount: '10.99',
            category: 'shopping',
            currency: 'GBP',
            createdAt: now,
        },
    ]);

    await db.insert(budgets).values([
        {
            id: crypto.randomUUID(),
            userId,
            category: 'groceries',
            limitAmount: '300.00',
            period: 'monthly',
            createdAt: now,
        },
        {
            id: crypto.randomUUID(),
            userId,
            category: 'dining',
            limitAmount: '200.00',
            period: 'monthly',
            createdAt: now,
        },
        {
            id: crypto.randomUUID(),
            userId,
            category: 'shopping',
            limitAmount: '150.00',
            period: 'monthly',
            createdAt: now,
        },
    ]);
}

export async function POST(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
    const rl = await rateLimit(ip, { limit: 20, windowMs: 60_000 });
    if (!rl.success) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const auth = getAuth();

    // Attempt sign-in first (covers repeat visits)
    const signInRes = await auth.api.signInEmail({
        body: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
        asResponse: true,
    });

    if (signInRes.ok) {
        return signInRes;
    }

    // User doesn't exist yet — create it
    const signUpRes = await auth.api.signUpEmail({
        body: { name: DEMO_NAME, email: DEMO_EMAIL, password: DEMO_PASSWORD },
        asResponse: true,
    });

    if (!signUpRes.ok) {
        // Race condition: another request created the user between our sign-in and sign-up
        // Try sign-in one more time
        return auth.api.signInEmail({
            body: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
            asResponse: true,
        });
    }

    // Seed data for the newly created demo user
    try {
        const userData = await signUpRes.clone().json() as { user?: { id: string } };
        if (userData.user?.id) {
            await seedDemoAccount(userData.user.id);
        }
    } catch {
        // Seeding failure is non-fatal — user can still log in to an empty account
    }

    // Return a fresh sign-in response so the client gets proper session cookies
    return auth.api.signInEmail({
        body: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
        asResponse: true,
    });
}
