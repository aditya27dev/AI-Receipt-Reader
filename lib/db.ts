/**
 * ChromaDB Integration Layer
 * Copyright (c) 2026 Aditya Batra - All Rights Reserved
 * Licensed for personal use only - see LICENSE
 */

import { ChromaClient } from 'chromadb';
import { Receipt } from './schemas';
import { BankTransaction } from './transaction-schemas';
import CryptoJS from 'crypto-js';

export interface StoredReceipt extends Receipt {
  id: string;
  createdAt: Date;
  imageUrl?: string;
  imageHash?: string;
}

export interface StoredTransaction extends BankTransaction {
  id: string;
  createdAt: Date;
  statementId?: string;
}

const COLLECTION_NAME = 'receipts';
const TRANSACTIONS_COLLECTION_NAME = 'bank_transactions';

// Initialize ChromaDB client
function getChromaClient() {
  const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';
  const url = new URL(chromaUrl);
  return new ChromaClient({
    host: url.hostname,
    port: parseInt(url.port) || 8000,
  });
}

// Generate embedding for receipt text using OpenAI
async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI embedding failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// Create receipt text for embedding
function createReceiptText(receipt: Receipt): string {
  const itemsText = receipt.items
    .map(item => `${item.name} (${item.category}): $${item.totalPrice}`)
    .join(', ');
  
  return `Receipt from ${receipt.merchantName} on ${receipt.date}. Items: ${itemsText}. Total: $${receipt.total}`;
}

// Initialize ChromaDB collection
export async function createReceiptsTable() {
  const client = getChromaClient();
  
  try {
    // Try to delete existing collection if it exists
    try {
      await client.deleteCollection({ name: COLLECTION_NAME });
      console.log('Deleted existing collection');
    } catch {
      // Collection doesn't exist, that's fine
    }
    
    // Create new collection without embedding function (we provide embeddings manually)
    await client.createCollection({
      name: COLLECTION_NAME,
      metadata: { description: 'Receipt storage with embeddings' },
    });
    console.log('Collection created');
  } catch (error) {
    console.error('Error creating collection:', error);
    throw error;
  }
}

// Helper to ensure collection exists and is properly configured
async function getReceiptsCollection(client: ReturnType<typeof getChromaClient>) {
  try {
    // Try to get the collection
    const collection = await client.getCollection({ name: COLLECTION_NAME });
    return collection;
  } catch {
    // Collection doesn't exist, create it
    return await client.createCollection({
      name: COLLECTION_NAME,
      metadata: { description: 'Receipt storage with embeddings' },
    });
  }
}

// Helper to ensure transactions collection exists
async function getTransactionsCollection(client: ReturnType<typeof getChromaClient>) {
  try {
    const collection = await client.getCollection({ name: TRANSACTIONS_COLLECTION_NAME });
    return collection;
  } catch {
    return await client.createCollection({
      name: TRANSACTIONS_COLLECTION_NAME,
      metadata: { description: 'Bank transaction storage with embeddings' },
    });
  }
}

// Save a receipt to ChromaDB
export async function saveReceipt(receipt: Receipt, imageUrl?: string, imageHash?: string): Promise<StoredReceipt> {
  const client = getChromaClient();
  
  // Get or create collection - we provide embeddings manually via OpenAI
  const collection = await getReceiptsCollection(client);

  const id = `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const createdAt = new Date();
  
  // Generate embedding for semantic search
  const receiptText = createReceiptText(receipt);
  const embedding = await generateEmbedding(receiptText);
  
  // Store receipt with metadata
  await collection.add({
    ids: [id],
    embeddings: [embedding],
    metadatas: [{
      merchantName: receipt.merchantName,
      merchantAddress: receipt.merchantAddress,
      date: receipt.date,
      time: receipt.time,
      subtotal: receipt.subtotal.toString(),
      tax: receipt.tax.toString(),
      total: receipt.total.toString(),
      paymentMethod: receipt.paymentMethod,
      currency: receipt.currency,
      imageUrl: imageUrl || '',
      imageHash: imageHash || '',
      createdAt: createdAt.toISOString(),
      itemsJson: JSON.stringify(receipt.items),
    }],
    documents: [receiptText],
  });
  
  return {
    id,
    ...receipt,
    createdAt,
    imageUrl,
    imageHash,
  };
}

// Generate hash from image buffer for duplicate detection
export function generateImageHash(buffer: Buffer): string {
  return CryptoJS.SHA256(CryptoJS.lib.WordArray.create(new Uint8Array(buffer))).toString();
}

// Check if a receipt with the same image hash already exists
export async function findReceiptByImageHash(imageHash: string): Promise<StoredReceipt | null> {
  const client = getChromaClient();
  
  try {
    const collection = await getReceiptsCollection(client);
    
    // Get all receipts and filter by imageHash
    const results = await collection.get({});
    
    if (!results.ids || results.ids.length === 0) {
      return null;
    }
    
    // Find receipt with matching hash
    const index = results.metadatas?.findIndex(
      (metadata) => (metadata as Record<string, string>)?.imageHash === imageHash
    );
    
    if (index === -1 || index === undefined) {
      return null;
    }
    
    const metadata = results.metadatas?.[index] as Record<string, string>;
    const items = JSON.parse(metadata?.itemsJson || '[]');
    
    return {
      id: results.ids[index],
      merchantName: metadata?.merchantName || '',
      merchantAddress: metadata?.merchantAddress || '',
      date: metadata?.date || '',
      time: metadata?.time || '',
      items,
      subtotal: metadata?.subtotal ? parseFloat(metadata.subtotal) : 0,
      tax: metadata?.tax ? parseFloat(metadata.tax) : 0,
      total: parseFloat(metadata?.total || '0'),
      paymentMethod: (metadata?.paymentMethod as 'cash' | 'credit' | 'debit' | 'mobile' | 'other') || 'other',
      currency: metadata?.currency || 'USD',
      imageUrl: metadata?.imageUrl || undefined,
      imageHash: metadata?.imageHash || undefined,
      createdAt: new Date(metadata?.createdAt || Date.now()),
    };
  } catch (error) {
    console.error('Error finding receipt by hash:', error);
    return null;
  }
}

// Get all receipts from ChromaDB
export async function getReceipts(limit = 50): Promise<StoredReceipt[]> {
  const client = getChromaClient();
  
  // Get or create collection - we provide embeddings manually
  const collection = await getReceiptsCollection(client);

  const results = await collection.get({
    limit,
  });
  
  if (!results.ids || results.ids.length === 0) {
    return [];
  }
  
  return results.ids.map((id, index) => {
    const metadata = results.metadatas?.[index] as Record<string, string> | undefined;
    const items = JSON.parse(metadata?.itemsJson || '[]');
    
    return {
      id,
      merchantName: metadata?.merchantName || '',
      merchantAddress: metadata?.merchantAddress || '',
      date: metadata?.date || '',
      time: metadata?.time || '',
      items,
      subtotal: metadata?.subtotal ? parseFloat(metadata.subtotal) : 0,
      tax: metadata?.tax ? parseFloat(metadata.tax) : 0,
      total: parseFloat(metadata?.total || '0'),
      paymentMethod: (metadata?.paymentMethod as 'cash' | 'credit' | 'debit' | 'mobile' | 'other') || 'other',
      currency: metadata?.currency || 'USD',
      imageUrl: metadata?.imageUrl || undefined,
      imageHash: metadata?.imageHash || undefined,
      createdAt: new Date(metadata?.createdAt || Date.now()),
    };
  }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// Get spending summary by category
export async function getSpendingSummary() {
  const receipts = await getReceipts(1000); // Get more receipts for analysis
  
  const categoryMap = new Map<string, { totalSpent: number; count: number }>();
  
  receipts.forEach(receipt => {
    receipt.items.forEach(item => {
      const existing = categoryMap.get(item.category) || { totalSpent: 0, count: 0 };
      categoryMap.set(item.category, {
        totalSpent: existing.totalSpent + item.totalPrice,
        count: existing.count + 1,
      });
    });
  });
  
  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      totalSpent: data.totalSpent,
      count: data.count,
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent);
}

// Get spending over time (last 30 days)
export async function getSpendingOverTime() {
  const receipts = await getReceipts(1000);
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const dateMap = new Map<string, number>();
  
  receipts.forEach(receipt => {
    const receiptDate = new Date(receipt.date);
    if (receiptDate >= thirtyDaysAgo) {
      const dateStr = receipt.date;
      const existing = dateMap.get(dateStr) || 0;
      dateMap.set(dateStr, existing + receipt.total);
    }
  });
  
  return Array.from(dateMap.entries())
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Semantic search for receipts
export async function searchReceipts(query: string, limit = 10): Promise<StoredReceipt[]> {
  const client = getChromaClient();
  
  // Get or create collection - we provide embeddings manually
  const collection = await getReceiptsCollection(client);
  
  const queryEmbedding = await generateEmbedding(query);
  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: limit,
  });
  
  if (!results.ids || results.ids[0].length === 0) {
    return [];
  }
  
  return results.ids[0].map((id, index) => {
    const metadata = results.metadatas?.[0][index] as Record<string, string>;
    const items = JSON.parse(metadata?.itemsJson || '[]');
    
    return {
      id,
      merchantName: metadata?.merchantName || '',
      merchantAddress: metadata?.merchantAddress || '',
      date: metadata?.date || '',
      time: metadata?.time || '',
      items,
      subtotal: metadata?.subtotal ? parseFloat(metadata.subtotal) : 0,
      tax: metadata?.tax ? parseFloat(metadata.tax) : 0,
      total: parseFloat(metadata?.total || '0'),
      paymentMethod: (metadata?.paymentMethod as 'cash' | 'credit' | 'debit' | 'mobile' | 'other') || 'other',
      currency: metadata?.currency || 'USD',
      imageUrl: metadata?.imageUrl || undefined,
      imageHash: metadata?.imageHash || undefined,
      createdAt: new Date(metadata?.createdAt || Date.now()),
    };
  });
}

// Delete a receipt by ID
export async function deleteReceipt(id: string): Promise<boolean> {
  const client = getChromaClient();
  
  try {
    const collection = await getReceiptsCollection(client);
    
    await collection.delete({
      ids: [id],
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting receipt:', error);
    return false;
  }
}

// ============= BANK TRANSACTIONS =============

// Save multiple bank transactions
export async function saveTransactions(
  transactions: BankTransaction[],
  statementId?: string
): Promise<string[]> {
  const client = getChromaClient();
  
  const collection = await getTransactionsCollection(client);

  const ids: string[] = [];
  const embeddings: number[][] = [];
  const metadatas: Record<string, string>[] = [];
  const documents: string[] = [];
  
  for (const transaction of transactions) {
    const id = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    ids.push(id);
    
    // Create transaction text for embedding
    const transactionText = `${transaction.description} on ${transaction.date}. Category: ${transaction.category}. Amount: ${transaction.amount} ${transaction.currency}`;
    const embedding = await generateEmbedding(transactionText);
    embeddings.push(embedding);
    documents.push(transactionText);
    
    metadatas.push({
      date: transaction.date,
      description: transaction.description,
      amount: transaction.amount.toString(),
      category: transaction.category,
      currency: transaction.currency,
      statementId: statementId || '',
      createdAt: new Date().toISOString(),
    } as Record<string, string>);
  }
  
  await collection.add({
    ids,
    embeddings,
    documents,
    metadatas,
  });
  
  return ids;
}

// Get all bank transactions
export async function getTransactions(limit = 500): Promise<StoredTransaction[]> {
  const client = getChromaClient();
  
  try {
    const collection = await getTransactionsCollection(client);
    
    const results = await collection.get({
      limit,
    });
    
    if (!results.ids || results.ids.length === 0) {
      return [];
    }
    
    return results.ids.map((id, index) => {
      const metadata = results.metadatas?.[index] as Record<string, string> | undefined;
      
      return {
        id,
        date: metadata?.date || '',
        description: metadata?.description || '',
        amount: parseFloat(metadata?.amount || '0'),
        category: (metadata?.category || 'other') as BankTransaction['category'],
        currency: metadata?.currency || 'GBP',
        statementId: metadata?.statementId || undefined,
        createdAt: new Date(metadata?.createdAt || Date.now()),
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Error getting transactions:', error);
    return [];
  }
}

// Get transaction spending summary by category
export async function getTransactionSummary() {
  const transactions = await getTransactions(1000);
  
  const categoryMap = new Map<string, { totalSpent: number; count: number }>();
  
  transactions.forEach(transaction => {
    // Only count spending (positive amounts), skip income/transfers
    if (transaction.amount > 0 && transaction.category !== 'income' && transaction.category !== 'transfer') {
      const existing = categoryMap.get(transaction.category) || { totalSpent: 0, count: 0 };
      categoryMap.set(transaction.category, {
        totalSpent: existing.totalSpent + transaction.amount,
        count: existing.count + 1,
      });
    }
  });
  
  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      totalSpent: data.totalSpent,
      count: data.count,
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent);
}

// Delete a transaction
export async function deleteTransaction(id: string): Promise<boolean> {
  const client = getChromaClient();
  
  try {
    const collection = await getTransactionsCollection(client);
    
    await collection.delete({
      ids: [id],
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return false;
  }
}
