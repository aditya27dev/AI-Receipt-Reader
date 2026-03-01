/**
 * Bank Transaction Schemas
 * Copyright (c) 2026 Aditya Batra - All Rights Reserved
 * Licensed for personal use only - see LICENSE
 */

import { z } from 'zod';

export const bankTransactionSchema = z.object({
  date: z.string().describe('Transaction date in YYYY-MM-DD format'),
  description: z.string().describe('Merchant name or transaction description'),
  amount: z.number().describe('Transaction amount (positive for spending)'),
  category: z.enum([
    'groceries',
    'dining',
    'transportation',
    'entertainment',
    'utilities',
    'healthcare',
    'shopping',
    'travel',
    'bills',
    'transfer',
    'income',
    'other'
  ]).describe('Category of the transaction'),
  currency: z.string().describe('Currency code (e.g., GBP, USD, EUR). Default to GBP.'),
});

export const bankStatementSchema = z.object({
  transactions: z.array(bankTransactionSchema).describe('List of all transactions from the statement'),
  statementPeriod: z.object({
    startDate: z.string().describe('Statement start date. Use empty string if not available.'),
    endDate: z.string().describe('Statement end date. Use empty string if not available.'),
  }).describe('Statement period. Provide start/end dates if available, otherwise use empty strings.'),
  accountNumber: z.string().describe('Last 4 digits of account number if available, otherwise empty string.'),
});

export type BankTransaction = z.infer<typeof bankTransactionSchema>;
export type BankStatement = z.infer<typeof bankStatementSchema>;

// JSON Schema for embedding in AI prompts — single source of truth
export const bankStatementJsonSchema = z.toJSONSchema(bankStatementSchema);
