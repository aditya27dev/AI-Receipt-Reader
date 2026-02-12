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
  currency: z.string().default('GBP').describe('Currency code (e.g., GBP, USD, EUR)'),
});

export const bankStatementSchema = z.object({
  transactions: z.array(bankTransactionSchema).describe('List of all transactions from the statement'),
  statementPeriod: z.object({
    startDate: z.string().describe('Statement start date'),
    endDate: z.string().describe('Statement end date'),
  }).optional(),
  accountNumber: z.string().optional().describe('Last 4 digits of account number if available'),
});

export type BankTransaction = z.infer<typeof bankTransactionSchema>;
export type BankStatement = z.infer<typeof bankStatementSchema>;
