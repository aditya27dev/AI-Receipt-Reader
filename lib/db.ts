/**
 * Storage Orchestration Layer
 *
 * Dual-write strategy:
 *   • PostgreSQL (primary)  — structured queries, user-scoped data, analytics.
 *   • ChromaDB  (secondary) — vector embeddings for semantic search only.
 *
 * When DATABASE_URL is set, PG is the source of truth for all list/read
 * operations. ChromaDB writes are best-effort (errors are caught and logged).
 * When DATABASE_URL is not set (local dev without PG), the app falls back to
 * ChromaDB-only mode, which is the original behaviour.
 */

import { ChromaClient } from 'chromadb';
import { Receipt } from './schemas';
import { BankTransaction } from './transaction-schemas';
import { createHash } from 'crypto';
import { env } from './env';
import {
  saveReceiptPg,
  getReceiptsPg,
  findReceiptByHashPg,
  deleteReceiptPg,
  getSpendingSummaryPg,
  getSpendingOverTimePg,
  saveTransactionsPg,
  getTransactionsPg,
  getTransactionSummaryPg,
  deleteTransactionPg,
  saveBudgetPg,
  getBudgetsPg,
  deleteBudgetPg,
  searchReceiptsPg,
  type PgStoredReceipt,
} from './pg-db';

const PG_ENABLED = !!process.env.DATABASE_URL;

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

export interface Budget {
  id: string;
  category: string;
  limitAmount: number;
  period: 'monthly';
  createdAt: Date;
}

const COLLECTION_NAME = 'receipts';
const TRANSACTIONS_COLLECTION_NAME = 'bank_transactions';

const BUDGETS_COLLECTION_NAME = 'budgets';

function getChromaClient() {
  return new ChromaClient({ path: env.CHROMA_URL });
}

/** Generate a single embedding */
async function generateEmbedding(text: string): Promise<number[]> {
  const [embedding] = await generateEmbeddings([text]);
  return embedding;
}

/** Batch-generate embeddings — single API call regardless of input size */
async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set — cannot generate embeddings');
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: texts,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI embedding failed: ${response.statusText}`);
  }

  const data = await response.json();
  return (data.data as { index: number; embedding: number[] }[])
    .sort((a, b) => a.index - b.index)
    .map(d => d.embedding);
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

async function getReceiptsCollection(client: ReturnType<typeof getChromaClient>) {
  return client.getOrCreateCollection({
    name: COLLECTION_NAME,
    metadata: { description: 'Receipt storage with embeddings' },
  });
}

async function getTransactionsCollection(client: ReturnType<typeof getChromaClient>) {
  return client.getOrCreateCollection({
    name: TRANSACTIONS_COLLECTION_NAME,
    metadata: { description: 'Bank transaction storage with embeddings' },
  });
}

async function getBudgetsCollection(client: ReturnType<typeof getChromaClient>) {
  return client.getOrCreateCollection({
    name: BUDGETS_COLLECTION_NAME,
    metadata: { description: 'Budget limits per category' },
  });
}

/** Deserialise a ChromaDB metadata row into a StoredReceipt */
function metadataToReceipt(id: string, metadata: Record<string, string>): StoredReceipt {
  let items: Receipt['items'] = [];
  try { items = JSON.parse(metadata?.itemsJson || '[]'); } catch { items = []; }
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
    paymentMethod: (metadata?.paymentMethod as StoredReceipt['paymentMethod']) || 'other',
    currency: metadata?.currency || 'USD',
    imageUrl: metadata?.imageUrl || undefined,
    imageHash: metadata?.imageHash || undefined,
    createdAt: new Date(metadata?.createdAt || Date.now()),
  };
}

export async function saveReceipt(
  receipt: Receipt,
  imageUrl?: string,
  imageHash?: string,
  userId?: string | null,
): Promise<StoredReceipt> {
  if (PG_ENABLED) {
    const stored = await saveReceiptPg(receipt, userId ?? null, imageUrl, imageHash);
    // ChromaDB: best-effort secondary write for semantic search
    try {
      const client = getChromaClient();
      const collection = await getReceiptsCollection(client);
      const receiptText = createReceiptText(receipt);
      const embedding = await generateEmbedding(receiptText);
      await collection.add({
        ids: [stored.id],
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
          createdAt: stored.createdAt.toISOString(),
          itemsJson: JSON.stringify(receipt.items),
        }],
        documents: [receiptText],
      });
    } catch (e) {
      console.warn('ChromaDB write failed (non-fatal):', e);
    }
    return stored;
  }

  // ChromaDB-only fallback
  const client = getChromaClient();
  const collection = await getReceiptsCollection(client);
  const id = `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const createdAt = new Date();
  const receiptText = createReceiptText(receipt);
  const embedding = await generateEmbedding(receiptText);
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
  return { id, ...receipt, imageUrl, imageHash, createdAt };
}

// Generate hash from image buffer for duplicate detection
export function generateImageHash(buffer: Buffer): string {
  return createHash('sha256').update(new Uint8Array(buffer)).digest('hex');
}

export async function findReceiptByImageHash(imageHash: string): Promise<StoredReceipt | null> {
  if (PG_ENABLED) return findReceiptByHashPg(imageHash);

  const client = getChromaClient();
  try {
    const collection = await getReceiptsCollection(client);
    const results = await collection.get({});
    if (!results.ids || results.ids.length === 0) return null;
    const index = results.metadatas?.findIndex(
      (metadata) => (metadata as Record<string, string>)?.imageHash === imageHash,
    );
    if (index === -1 || index === undefined) return null;
    const metadata = results.metadatas?.[index] as Record<string, string>;
    return metadataToReceipt(results.ids[index], metadata);
  } catch (error) {
    console.error('Error finding receipt by hash:', error);
    return null;
  }
}

export async function getReceipts(
  limit = 50,
  offset = 0,
  userId?: string | null,
): Promise<StoredReceipt[]> {
  if (PG_ENABLED) return getReceiptsPg(userId ?? null, limit, offset);

  const client = getChromaClient();
  const collection = await getReceiptsCollection(client);
  const results = await collection.get({ limit: limit + offset });
  if (!results.ids || results.ids.length === 0) return [];
  return results.ids
    .map((id, index) => metadataToReceipt(id, results.metadatas?.[index] as Record<string, string>))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(offset, offset + limit);
}

export async function getSpendingSummary(userId?: string | null) {
  if (PG_ENABLED) return getSpendingSummaryPg(userId ?? null);
  const receipts = await getReceipts(1000);
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
    .map(([category, data]) => ({ category, totalSpent: data.totalSpent, count: data.count }))
    .sort((a, b) => b.totalSpent - a.totalSpent);
}

export async function getSpendingOverTime(days = 30, userId?: string | null) {
  if (PG_ENABLED) return getSpendingOverTimePg(userId ?? null, days);
  const receipts = await getReceipts(1000);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const dateMap = new Map<string, number>();
  receipts.forEach(receipt => {
    if (new Date(receipt.date) >= cutoff) {
      dateMap.set(receipt.date, (dateMap.get(receipt.date) || 0) + receipt.total);
    }
  });
  return Array.from(dateMap.entries())
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Semantic search for receipts
export async function searchReceipts(query: string, limit = 10, userId?: string | null): Promise<StoredReceipt[]> {
  if (PG_ENABLED) {
    return searchReceiptsPg(query, limit, userId ?? null);
  }

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
    return metadataToReceipt(id, metadata);
  });
}

export async function deleteReceipt(id: string, userId?: string | null): Promise<boolean> {
  if (PG_ENABLED) {
    const ok = await deleteReceiptPg(id, userId ?? null);
    try {
      const client = getChromaClient();
      const col = await getReceiptsCollection(client);
      await col.delete({ ids: [id] });
    } catch { /* non-fatal */ }
    return ok;
  }
  const client = getChromaClient();
  try {
    const collection = await getReceiptsCollection(client);
    await collection.delete({ ids: [id] });
    return true;
  } catch (error) {
    console.error('Error deleting receipt:', error);
    return false;
  }
}

// Update specific metadata fields on a receipt
export async function updateReceiptMetadata(
  id: string,
  metadata: Record<string, string | number>
): Promise<boolean> {
  const client = getChromaClient();
  try {
    const collection = await getReceiptsCollection(client);
    await collection.update({ ids: [id], metadatas: [metadata] });
    return true;
  } catch (error) {
    console.error('Error updating receipt:', error);
    return false;
  }
}

// ============= BANK TRANSACTIONS =============

export async function saveTransactions(
  transactions: BankTransaction[],
  statementId?: string,
  userId?: string | null,
): Promise<string[]> {
  if (transactions.length === 0) return [];
  if (PG_ENABLED) {
    const ids = await saveTransactionsPg(transactions, statementId, userId ?? null);
    try {
      const client = getChromaClient();
      const collection = await getTransactionsCollection(client);
      const texts = transactions.map(
        t => `${t.description} on ${t.date}. Category: ${t.category}. Amount: ${t.amount} ${t.currency}`,
      );
      const embeddings = await generateEmbeddings(texts);
      const now = new Date().toISOString();
      const metadatas: Record<string, string>[] = transactions.map(t => ({
        date: t.date,
        description: t.description,
        amount: t.amount.toString(),
        category: t.category,
        currency: t.currency,
        statementId: statementId || '',
        createdAt: now,
      }));
      await collection.add({ ids, embeddings, documents: texts, metadatas });
    } catch (e) {
      console.warn('ChromaDB transaction write failed (non-fatal):', e);
    }
    return ids;
  }

  // ChromaDB-only fallback
  const client = getChromaClient();
  const collection = await getTransactionsCollection(client);
  const texts = transactions.map(
    t => `${t.description} on ${t.date}. Category: ${t.category}. Amount: ${t.amount} ${t.currency}`,
  );
  const embeddings = await generateEmbeddings(texts);
  const now = new Date().toISOString();
  const ids = transactions.map(() => `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const metadatas: Record<string, string>[] = transactions.map(t => ({
    date: t.date,
    description: t.description,
    amount: t.amount.toString(),
    category: t.category,
    currency: t.currency,
    statementId: statementId || '',
    createdAt: now,
  }));
  await collection.add({ ids, embeddings, documents: texts, metadatas });
  return ids;
}

export async function getTransactions(
  limit = 100,
  offset = 0,
  userId?: string | null,
): Promise<StoredTransaction[]> {
  if (PG_ENABLED) return getTransactionsPg(userId ?? null, limit, offset);

  const client = getChromaClient();
  try {
    const collection = await getTransactionsCollection(client);
    const results = await collection.get({ limit: limit + offset });
    if (!results.ids || results.ids.length === 0) return [];
    return results.ids
      .map((id, index) => {
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
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(offset, offset + limit);
  } catch (error) {
    console.error('Error getting transactions:', error);
    return [];
  }
}

export async function getTransactionSummary(userId?: string | null) {
  if (PG_ENABLED) return getTransactionSummaryPg(userId ?? null);
  const transactions = await getTransactions(1000);
  const categoryMap = new Map<string, { totalSpent: number; count: number }>();
  transactions.forEach(transaction => {
    if (transaction.amount > 0 && transaction.category !== 'income' && transaction.category !== 'transfer') {
      const existing = categoryMap.get(transaction.category) || { totalSpent: 0, count: 0 };
      categoryMap.set(transaction.category, {
        totalSpent: existing.totalSpent + transaction.amount,
        count: existing.count + 1,
      });
    }
  });
  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({ category, totalSpent: data.totalSpent, count: data.count }))
    .sort((a, b) => b.totalSpent - a.totalSpent);
}

export async function deleteTransaction(id: string, userId?: string | null): Promise<boolean> {
  if (PG_ENABLED) {
    const ok = await deleteTransactionPg(id, userId ?? null);
    try {
      const client = getChromaClient();
      const col = await getTransactionsCollection(client);
      await col.delete({ ids: [id] });
    } catch { /* non-fatal */ }
    return ok;
  }
  const client = getChromaClient();
  try {
    const collection = await getTransactionsCollection(client);
    await collection.delete({ ids: [id] });
    return true;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return false;
  }
}

// ============= BUDGETS =============

export async function saveBudget(
  category: string,
  limitAmount: number,
  userId?: string | null,
): Promise<Budget> {
  if (PG_ENABLED) return saveBudgetPg(category, limitAmount, userId ?? null);

  const client = getChromaClient();
  const collection = await getBudgetsCollection(client);
  const existing = await collection.get({});
  if (existing.ids?.length) {
    const idx = existing.metadatas?.findIndex(
      m => (m as Record<string, string>)?.category === category
    );
    if (idx !== undefined && idx !== -1) {
      await collection.delete({ ids: [existing.ids[idx]] });
    }
  }
  const id = `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const createdAt = new Date();
  const zeroEmbedding = new Array(1536).fill(0);
  await collection.add({
    ids: [id],
    embeddings: [zeroEmbedding],
    metadatas: [{ category, limitAmount: limitAmount.toString(), period: 'monthly', createdAt: createdAt.toISOString() }],
    documents: [`Budget for ${category}: ${limitAmount}`],
  });
  return { id, category, limitAmount, period: 'monthly', createdAt };
}

export async function getBudgets(userId?: string | null): Promise<Budget[]> {
  if (PG_ENABLED) return getBudgetsPg(userId ?? null);
  const client = getChromaClient();
  try {
    const collection = await getBudgetsCollection(client);
    const results = await collection.get({});
    if (!results.ids || results.ids.length === 0) return [];
    return results.ids.map((id, index) => {
      const m = results.metadatas?.[index] as Record<string, string>;
      return {
        id,
        category: m?.category || '',
        limitAmount: parseFloat(m?.limitAmount || '0'),
        period: 'monthly' as const,
        createdAt: new Date(m?.createdAt || Date.now()),
      };
    });
  } catch {
    return [];
  }
}

export async function deleteBudget(id: string, userId?: string | null): Promise<boolean> {
  if (PG_ENABLED) return deleteBudgetPg(id, userId ?? null);
  const client = getChromaClient();
  try {
    const collection = await getBudgetsCollection(client);
    await collection.delete({ ids: [id] });
    return true;
  } catch {
    return false;
  }
}
