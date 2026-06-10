/**
 * Drizzle ORM schema — PostgreSQL tables.
 *
 * Better Auth core tables (user, session, account, verification) live alongside
 * the application tables (receipts, bank_transactions, budgets) so that a single
 * `drizzle-kit push` sets up the entire database.
 */

import {
    boolean,
    jsonb,
    numeric,
    pgTable,
    text,
    timestamp,
} from 'drizzle-orm/pg-core';

// ─── Better Auth tables ───────────────────────────────────────────────────────
// Names match Better Auth's defaults so the drizzleAdapter finds them
// automatically. "user" is a reserved word in PostgreSQL but Drizzle quotes it.

export const user = pgTable('user', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').notNull(),
    image: text('image'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
});

export const session = pgTable('session', {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
});

export const verification = pgTable('verification', {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at'),
    updatedAt: timestamp('updated_at'),
});

// ─── Application tables ───────────────────────────────────────────────────────

export const receipts = pgTable('receipts', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
    merchantName: text('merchant_name').notNull(),
    merchantAddress: text('merchant_address').notNull().default(''),
    date: text('date').notNull(),
    time: text('time').notNull().default(''),
    /** JSON array of ReceiptItem objects */
    items: jsonb('items').notNull().default([]),
    subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull().default('0'),
    tax: numeric('tax', { precision: 10, scale: 2 }).notNull().default('0'),
    total: numeric('total', { precision: 10, scale: 2 }).notNull(),
    paymentMethod: text('payment_method').notNull().default('other'),
    currency: text('currency').notNull().default('USD'),
    imageUrl: text('image_url'),
    imageHash: text('image_hash'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const bankTransactions = pgTable('bank_transactions', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
    statementId: text('statement_id'),
    date: text('date').notNull(),
    description: text('description').notNull(),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    category: text('category').notNull().default('other'),
    currency: text('currency').notNull().default('GBP'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const budgets = pgTable('budgets', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
    category: text('category').notNull(),
    limitAmount: numeric('limit_amount', { precision: 10, scale: 2 }).notNull(),
    period: text('period').notNull().default('monthly'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});
