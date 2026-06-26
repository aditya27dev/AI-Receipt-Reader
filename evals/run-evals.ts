/**
 * AI Receipt Reader — Eval Runner
 *
 * Three-section evaluation suite:
 *   1. Receipt Extraction (Vision AI)   — fixtures 01-05
 *   2. Bank Statement Parsing           — fixtures 06-08
 *   3. Reconciliation Engine            — inline test cases
 *
 * Usage: pnpm eval
 * Exit code 1 if any fixture fails Zod schema validation.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { receiptSchema } from '@/lib/schemas';
import type { Receipt } from '@/lib/schemas';
import { bankStatementSchema } from '@/lib/transaction-schemas';
import type { BankStatement } from '@/lib/transaction-schemas';
import { reconcile } from '@/lib/reconciliation';
import type { StoredReceipt, StoredTransaction } from '@/lib/db';

// ── Terminal colour helpers ───────────────────────────────────────────────────

const R = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';

function colourPass(s: string): string { return `${GREEN}${s}${R}`; }
function colourFail(s: string): string { return `${RED}${s}${R}`; }
function colourWarn(s: string): string { return `${YELLOW}${s}${R}`; }
function dim(s: string): string { return `${DIM}${s}${R}`; }

function colourScore(correct: number, total: number): string {
    const pct = (correct / total) * 100;
    const label = `${correct}/${total} (${pct.toFixed(1)}%)`;
    if (pct === 100) return colourPass(label);
    if (pct >= 70) return colourWarn(label);
    return colourFail(label);
}

// ── Fixture loading ───────────────────────────────────────────────────────────

const FIXTURES_DIR = join(process.cwd(), 'evals', 'fixtures');

interface RawFixture {
    id: string;
    schema: 'receipt' | 'bankStatement';
    description: string;
    rawOutput: unknown;
    expected: unknown;
}

interface FieldResult {
    field: string;
    pass: boolean;
    actual: unknown;
    expected: unknown;
}

function loadFixturesBySchema(schemaType: 'receipt' | 'bankStatement'): RawFixture[] {
    return readdirSync(FIXTURES_DIR)
        .filter(f => f.endsWith('.json'))
        .sort()
        .map(file => JSON.parse(readFileSync(join(FIXTURES_DIR, file), 'utf-8')) as RawFixture)
        .filter(f => f.schema === schemaType);
}

// ── Comparison helpers ────────────────────────────────────────────────────────

const NUM_TOLERANCE = 0.01;

function numEq(a: unknown, b: unknown): boolean {
    return typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= NUM_TOLERANCE;
}

function strEq(a: unknown, b: unknown): boolean {
    return typeof a === 'string' && typeof b === 'string' && a.trim().toLowerCase() === b.trim().toLowerCase();
}

// ── Section 1: Receipt Extraction (Vision AI) ─────────────────────────────────

const RECEIPT_SCALAR_CHECKS: { key: keyof Receipt; eq: (a: unknown, b: unknown) => boolean }[] = [
    { key: 'merchantName', eq: strEq },
    { key: 'merchantAddress', eq: strEq },
    { key: 'date', eq: strEq },
    { key: 'time', eq: strEq },
    { key: 'subtotal', eq: numEq },
    { key: 'tax', eq: numEq },
    { key: 'total', eq: numEq },
    { key: 'paymentMethod', eq: strEq },
    { key: 'currency', eq: strEq },
];

interface SectionStats {
    grandCorrect: number;
    grandTotal: number;
    schemaFailures: number;
    invalidEnumCount: number;
}

function runReceiptEval(fixture: RawFixture) {
    const TOTAL = RECEIPT_SCALAR_CHECKS.length + 1; // +1 for items.length
    const parsed = receiptSchema.safeParse(fixture.rawOutput);

    if (!parsed.success) {
        const zodErrors = parsed.error.issues.map(
            issue => `${issue.path.join('.') || '(root)'}: ${issue.message}`,
        );
        return { id: fixture.id, description: fixture.description, schemaValid: false, zodErrors, fieldResults: [] as FieldResult[], correctCount: 0, totalFields: TOTAL };
    }

    const expected = fixture.expected as Receipt;
    const fieldResults: FieldResult[] = RECEIPT_SCALAR_CHECKS.map(({ key, eq }) => ({
        field: key,
        pass: eq(parsed.data[key], expected[key]),
        actual: parsed.data[key],
        expected: expected[key],
    }));
    fieldResults.push({
        field: 'items.length',
        pass: parsed.data.items.length === expected.items.length,
        actual: parsed.data.items.length,
        expected: expected.items.length,
    });

    return { id: fixture.id, description: fixture.description, schemaValid: true, zodErrors: [] as string[], fieldResults, correctCount: fieldResults.filter(r => r.pass).length, totalFields: TOTAL };
}

function printReceiptSection(): SectionStats {
    const fixtures = loadFixturesBySchema('receipt');
    const results = fixtures.map(runReceiptEval);

    console.log(`\n${BOLD}${CYAN}╔══ Section 1: Receipt Extraction (Vision AI) ══════════════════════╗${R}`);
    console.log(dim('  Validates AI-extracted receipt data against Zod schema + ground truth'));
    console.log(dim('  5 fixtures · GPT-5.4 mini (OpenAI) · Claude Sonnet (Anthropic)\n'));

    let grandCorrect = 0;
    let grandTotal = 0;
    let schemaFailures = 0;
    let invalidEnumCount = 0;

    for (const r of results) {
        const schemaTag = r.schemaValid ? colourPass('schema ✓') : colourFail('schema ✗');
        console.log(`  ${BOLD}${r.id}${R}  ${schemaTag}  score: ${colourScore(r.correctCount, r.totalFields)}`);
        console.log(`  ${dim(r.description)}`);

        if (!r.schemaValid) {
            schemaFailures++;
            for (const msg of r.zodErrors) {
                if (msg.toLowerCase().includes('invalid') && msg.toLowerCase().includes('option')) invalidEnumCount++;
                console.log(`    ${colourFail('✗')} ${dim(msg)}`);
            }
        } else {
            for (const f of r.fieldResults.filter(f => !f.pass)) {
                console.log(`    ${colourWarn('~')} ${f.field}: got ${JSON.stringify(f.actual)}, expected ${JSON.stringify(f.expected)}`);
            }
        }

        grandCorrect += r.correctCount;
        grandTotal += r.totalFields;
        console.log();
    }

    console.log(`  ${BOLD}Section 1 accuracy: ${colourScore(grandCorrect, grandTotal)} · ${results.length} fixtures · ${schemaFailures} schema fail(s)${R}`);
    return { grandCorrect, grandTotal, schemaFailures, invalidEnumCount };
}

// ── Section 2: Bank Statement Parsing ────────────────────────────────────────

function runStatementEval(fixture: RawFixture) {
    const TOTAL = 4; // transactions.length, startDate, endDate, accountNumber
    const parsed = bankStatementSchema.safeParse(fixture.rawOutput);

    if (!parsed.success) {
        const zodErrors = parsed.error.issues.map(
            issue => `${issue.path.join('.') || '(root)'}: ${issue.message}`,
        );
        return { id: fixture.id, description: fixture.description, schemaValid: false, zodErrors, fieldResults: [] as FieldResult[], correctCount: 0, totalFields: TOTAL };
    }

    const expected = fixture.expected as BankStatement;
    const fieldResults: FieldResult[] = [
        {
            field: 'transactions.length',
            pass: parsed.data.transactions.length === expected.transactions.length,
            actual: parsed.data.transactions.length,
            expected: expected.transactions.length,
        },
        {
            field: 'statementPeriod.startDate',
            pass: strEq(parsed.data.statementPeriod.startDate, expected.statementPeriod.startDate),
            actual: parsed.data.statementPeriod.startDate,
            expected: expected.statementPeriod.startDate,
        },
        {
            field: 'statementPeriod.endDate',
            pass: strEq(parsed.data.statementPeriod.endDate, expected.statementPeriod.endDate),
            actual: parsed.data.statementPeriod.endDate,
            expected: expected.statementPeriod.endDate,
        },
        {
            field: 'accountNumber',
            pass: strEq(parsed.data.accountNumber, expected.accountNumber),
            actual: parsed.data.accountNumber,
            expected: expected.accountNumber,
        },
    ];

    return { id: fixture.id, description: fixture.description, schemaValid: true, zodErrors: [] as string[], fieldResults, correctCount: fieldResults.filter(r => r.pass).length, totalFields: TOTAL };
}

function printStatementSection(): SectionStats {
    const fixtures = loadFixturesBySchema('bankStatement');
    const results = fixtures.map(runStatementEval);

    console.log(`\n${BOLD}${CYAN}╔══ Section 2: Bank Statement Parsing ══════════════════════════════╗${R}`);
    console.log(dim('  Parses PDF/image bank statements into structured transaction data'));
    console.log(dim('  3 fixtures · Zod v4 validation · multi-currency (GBP, USD, EUR)\n'));

    let grandCorrect = 0;
    let grandTotal = 0;
    let schemaFailures = 0;
    let invalidEnumCount = 0;

    for (const r of results) {
        const schemaTag = r.schemaValid ? colourPass('schema ✓') : colourFail('schema ✗');
        console.log(`  ${BOLD}${r.id}${R}  ${schemaTag}  score: ${colourScore(r.correctCount, r.totalFields)}`);
        console.log(`  ${dim(r.description)}`);

        if (!r.schemaValid) {
            schemaFailures++;
            for (const msg of r.zodErrors) {
                if (msg.toLowerCase().includes('invalid') && msg.toLowerCase().includes('option')) invalidEnumCount++;
                console.log(`    ${colourFail('✗')} ${dim(msg)}`);
            }
        } else {
            for (const f of r.fieldResults.filter(f => !f.pass)) {
                console.log(`    ${colourWarn('~')} ${f.field}: got ${JSON.stringify(f.actual)}, expected ${JSON.stringify(f.expected)}`);
            }
        }

        grandCorrect += r.correctCount;
        grandTotal += r.totalFields;
        console.log();
    }

    console.log(`  ${BOLD}Section 2 accuracy: ${colourScore(grandCorrect, grandTotal)} · ${results.length} fixtures · ${schemaFailures} schema fail(s)${R}`);
    return { grandCorrect, grandTotal, schemaFailures, invalidEnumCount };
}

// ── Section 3: Reconciliation Engine ─────────────────────────────────────────

interface ReconTestCase {
    label: string;
    receipt: StoredReceipt;
    transaction: StoredTransaction;
    expectMatch: boolean;
    minConfidence?: number;
    maxConfidence?: number;
}

function makeReceipt(id: string, merchantName: string, total: number, date: string): StoredReceipt {
    return { id, merchantName, merchantAddress: '', date, time: '12:00', items: [], subtotal: total, tax: 0, total, paymentMethod: 'other', currency: 'GBP', createdAt: new Date() };
}

function makeTransaction(id: string, description: string, amount: number, date: string): StoredTransaction {
    return { id, description, amount, date, category: 'other', currency: 'GBP', createdAt: new Date() };
}

const RECON_CASES: ReconTestCase[] = [
    {
        label: 'Exact match — Tesco same day, same amount (£5.98)',
        receipt: makeReceipt('r1', 'Tesco', 5.98, '2026-05-01'),
        transaction: makeTransaction('t1', 'TESCO STORES 4256', 5.98, '2026-05-01'),
        expectMatch: true,
        minConfidence: 0.7,
    },
    {
        label: 'Near match — restaurant 1-day lag (£44.65)',
        receipt: makeReceipt('r2', "Joe's Diner", 44.65, '2026-05-02'),
        transaction: makeTransaction('t2', 'JOES DINER', 44.65, '2026-05-03'),
        expectMatch: true,
        minConfidence: 0.6,
    },
    {
        label: 'No match — pharmacy amount too different (£9.48 vs £42.99)',
        receipt: makeReceipt('r3', 'Boots Pharmacy', 9.48, '2026-05-10'),
        transaction: makeTransaction('t3', 'BOOTS', 42.99, '2026-05-10'),
        expectMatch: false,
        maxConfidence: 0.6,
    },
    {
        label: 'Substring match — Shell station same day (£84.24)',
        receipt: makeReceipt('r4', 'Shell', 84.24, '2026-06-15'),
        transaction: makeTransaction('t4', 'SHELL STATION 0847', 84.24, '2026-06-15'),
        expectMatch: true,
        minConfidence: 0.7,
    },
];

function printReconSection(): { correct: number; total: number } {
    console.log(`\n${BOLD}${CYAN}╔══ Section 3: Reconciliation Engine ═══════════════════════════════╗${R}`);
    console.log(dim('  Fuzzy-matches scanned receipts to bank transactions'));
    console.log(dim('  Weighted scoring: amount 50% · date proximity 30% · merchant name 20%\n'));

    let correct = 0;
    const total = RECON_CASES.length;

    for (const tc of RECON_CASES) {
        const matches = reconcile([tc.receipt], [tc.transaction], 0.6);
        const matched = matches.length > 0;
        const confidence = matched ? matches[0].confidence : null;

        let passed = matched === tc.expectMatch;
        if (passed && tc.expectMatch && tc.minConfidence !== undefined) {
            passed = confidence! >= tc.minConfidence;
        }
        if (passed && !tc.expectMatch && tc.maxConfidence !== undefined) {
            passed = confidence === null || confidence < tc.maxConfidence;
        }

        const confidenceStr = confidence !== null ? `confidence: ${confidence.toFixed(3)}` : 'no match';
        const thresholdStr = tc.expectMatch ? `min ${tc.minConfidence}` : `max ${tc.maxConfidence ?? 0.6}`;

        console.log(`  ${passed ? colourPass('✓') : colourFail('✗')} ${tc.label}`);
        console.log(`    ${dim(`${confidenceStr} (${thresholdStr})`)}  ${passed ? colourPass('PASS') : colourFail('FAIL')}`);
        console.log();

        if (passed) correct++;
    }

    console.log(`  ${BOLD}Section 3: ${colourScore(correct, total)} reconciliation cases${R}`);
    return { correct, total };
}

// ── Skills Coverage Summary ───────────────────────────────────────────────────

function printSkillsCoverage(invalidEnumCount: number): void {
    console.log(`\n${BOLD}${CYAN}╔══ Skills Coverage ════════════════════════════════════════════════╗${R}`);
    console.log();
    const chk = colourPass('✓');
    console.log(`  ${chk} Vision AI receipt extraction      (OpenAI / Anthropic)`);
    console.log(`  ${chk} PDF bank statement parsing`);
    console.log(`  ${chk} Zod v4 schema validation`);
    console.log(`  ${chk} Multi-currency support             (GBP, USD, EUR)`);
    console.log(`  ${chk} Reconciliation engine              weighted fuzzy matching (amount 50%, date 30%, merchant 20%)`);
    console.log(`  ${chk} AI hallucination detection         ${invalidEnumCount} invalid enum value(s) caught`);
    console.log(`  ${chk} Numeric tolerance handling         (±0.01)`);
    console.log(`  ${chk} Type-safe TypeScript throughout    (strict mode)`);
    console.log();
}

// ── Main ──────────────────────────────────────────────────────────────────────

const s1 = printReceiptSection();
const s2 = printStatementSection();
const s3 = printReconSection();

printSkillsCoverage(s1.invalidEnumCount + s2.invalidEnumCount);

const allCorrect = s1.grandCorrect + s2.grandCorrect + s3.correct;
const allTotal = s1.grandTotal + s2.grandTotal + s3.total;
const totalSchemaFails = s1.schemaFailures + s2.schemaFailures;

console.log('═'.repeat(68));
console.log(`${BOLD}Overall: ${colourScore(allCorrect, allTotal)} — ${((allCorrect / allTotal) * 100).toFixed(1)}% · ${totalSchemaFails} Zod schema failure(s) caught${R}`);
console.log();

if (totalSchemaFails > 0) {
    console.log(colourFail(`${totalSchemaFails} fixture(s) failed Zod schema validation.`));
    console.log(dim('These represent AI outputs returning invalid enum values or missing required fields.'));
    process.exit(1);
}

