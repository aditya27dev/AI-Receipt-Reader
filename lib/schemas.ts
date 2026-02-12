/**
 * Receipt Data Schemas
 * Copyright (c) 2026 Aditya Batra - All Rights Reserved
 * Licensed for personal use only - see LICENSE
 */

import { z } from 'zod';

// Schema for individual line items on a receipt
export const receiptItemSchema = z.object({
  name: z.string().describe('The name or description of the item'),
  quantity: z.number().describe('Quantity of items purchased. Use 1 if not shown.'),
  unitPrice: z.number().describe('Price per unit. Use 0 if not shown on receipt.'),
  totalPrice: z.number().describe('Total price for this line item'),
  category: z.enum([
    'groceries',
    'dining',
    'transportation',
    'entertainment',
    'utilities',
    'healthcare',
    'shopping',
    'other'
  ]).describe('Category of the expense'),
});

// Main receipt schema for extraction
export const receiptSchema = z.object({
  merchantName: z.string().describe('Name of the merchant/store'),
  merchantAddress: z.string().describe('Address of the merchant. Use empty string if not shown.'),
  date: z.string().describe('Date of purchase in ISO format (YYYY-MM-DD)'),
  time: z.string().describe('Time of purchase in HH:MM format. Use empty string if not shown.'),
  items: z.array(receiptItemSchema).describe('List of items purchased'),
  subtotal: z.number().describe('Subtotal before tax. Use 0 if not shown on receipt.'),
  tax: z.number().describe('Tax amount. Use 0 if not shown on receipt.'),
  total: z.number().describe('Total amount paid'),
  paymentMethod: z.enum(['cash', 'credit', 'debit', 'mobile', 'other']).describe('Payment method. Use "other" if not shown.'),
  currency: z.string().describe('Currency code (e.g., USD, EUR). Default to USD.'),
});

export type Receipt = z.infer<typeof receiptSchema>;
export type ReceiptItem = z.infer<typeof receiptItemSchema>;
