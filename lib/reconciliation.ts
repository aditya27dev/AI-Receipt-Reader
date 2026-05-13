/**
 * Receipt ↔ Transaction Reconciliation
 * Fuzzy-matches scanned receipts to bank statement transactions
 * by amount, date proximity, and merchant name similarity.
 */

import type { StoredReceipt } from './db';
import type { StoredTransaction } from './db';

export interface ReconciliationMatch {
    receipt: StoredReceipt;
    transaction: StoredTransaction;
    /** 0–1 confidence score */
    confidence: number;
    /** Breakdown of match scores */
    scores: {
        amount: number;
        date: number;
        merchant: number;
    };
}

/** Longest common subsequence ratio for merchant name similarity */
function nameSimilarity(a: string, b: string): number {
    const s1 = a.toLowerCase().replace(/[^a-z0-9]/g, '');
    const s2 = b.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!s1 || !s2) return 0;
    if (s1 === s2) return 1;
    if (s1.includes(s2) || s2.includes(s1)) return 0.85;

    // Bigram similarity
    const bigrams = (s: string) => {
        const set = new Set<string>();
        for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
        return set;
    };

    const bg1 = bigrams(s1);
    const bg2 = bigrams(s2);
    const intersection = [...bg1].filter(b => bg2.has(b)).length;
    return (2 * intersection) / (bg1.size + bg2.size);
}

/** Score amount match: 1.0 if exact, decays to 0 at >5% difference */
function amountScore(receiptTotal: number, txnAmount: number): number {
    if (receiptTotal === 0) return 0;
    const diff = Math.abs(receiptTotal - txnAmount) / receiptTotal;
    if (diff === 0) return 1;
    if (diff <= 0.005) return 0.95;
    if (diff <= 0.01) return 0.85;
    if (diff <= 0.05) return 0.5;
    return 0;
}

/** Score date match: 1.0 if same day, 0.7 at 1-day diff, 0.3 at 2-day diff, 0 beyond */
function dateScore(receiptDate: string, txnDate: string): number {
    const d1 = new Date(receiptDate).getTime();
    const d2 = new Date(txnDate).getTime();
    const daysDiff = Math.abs((d1 - d2) / (1000 * 60 * 60 * 24));
    if (daysDiff === 0) return 1;
    if (daysDiff <= 1) return 0.7;
    if (daysDiff <= 2) return 0.3;
    return 0;
}

/**
 * Find best receipt↔transaction matches.
 * Only returns pairs with confidence ≥ threshold (default 0.6).
 */
export function reconcile(
    receipts: StoredReceipt[],
    transactions: StoredTransaction[],
    threshold = 0.6
): ReconciliationMatch[] {
    const matches: ReconciliationMatch[] = [];
    const usedTxnIds = new Set<string>();

    // Sort receipts by date descending for deterministic output
    const sortedReceipts = [...receipts].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    for (const receipt of sortedReceipts) {
        let best: ReconciliationMatch | null = null;

        for (const txn of transactions) {
            if (usedTxnIds.has(txn.id)) continue;

            const amount = amountScore(receipt.total, txn.amount);
            if (amount === 0) continue; // Skip if amounts are too far apart

            const date = dateScore(receipt.date, txn.date);
            if (date === 0) continue; // Skip if dates are too far apart

            const merchant = nameSimilarity(receipt.merchantName, txn.description);

            // Weighted score: amount 50%, date 30%, merchant 20%
            const confidence = amount * 0.5 + date * 0.3 + merchant * 0.2;

            if (confidence >= threshold && (!best || confidence > best.confidence)) {
                best = { receipt, transaction: txn, confidence, scores: { amount, date, merchant } };
            }
        }

        if (best) {
            matches.push(best);
            usedTxnIds.add(best.transaction.id);
        }
    }

    return matches.sort((a, b) => b.confidence - a.confidence);
}
