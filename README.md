# Multimodal Financial Ingestion & Reconciliation Platform

A full-stack financial platform that ingests, extracts, and reconciles accounting data from receipt images and PDF bank statements. Built with Next.js 16 (App Router), React 19, and TypeScript, featuring Zod-validated LLM output, user-scoped relational persistence, ChromaDB vector storage, and fuzzy receipt-to-transaction reconciliation.

[![CI](https://github.com/aditya27dev/ai-receipt-reader/actions/workflows/ci.yml/badge.svg)](https://github.com/aditya27dev/ai-receipt-reader/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Drizzle_ORM-336791?logo=postgresql)](https://orm.drizzle.team/)
[![Tests](https://img.shields.io/badge/Tests-Vitest-yellow?logo=vitest)](https://vitest.dev/)

---

## Architectural Data Flow

```
[ Ingestion Layer ]
  Receipt Image Upload                         PDF Statement Upload
         │                                              │
         ▼                                              ▼
[ Client-side SHA-256 Hash ]                  [ Text Extraction (unpdf) ]
  POST /api/extract-receipt/check                       │
         ├──(Duplicate Found)──► [ Show existing receipt; user may skip or re-run ]
         │ (New image)                                  │
         ▼                                              ▼
[ Extraction & Schema Boundary ]
  LLM structured output (OpenAI / Anthropic via Vercel AI SDK v6 streamObject)
  Receipts: vision input · Statements: extracted PDF text
         │
         ▼
  Zod Schema Validation
         │
         ├──(Validation Failure)──► [ Nothing persisted ]
         │
         ▼ (Validated Object)
[ Persistence & Indexing Layer ]
  ┌──────────────────────────────┴──────────────────────────────┐
  ▼                                                             ▼
[ Primary: PostgreSQL / Drizzle ]              [ Secondary: ChromaDB (best-effort) ]
  • Per-user row scoping (user_id FK)            • OpenAI text-embedding-3-small (1536-dim)
  • Receipts, transactions, budgets, auth        • Vector search used only when
                                                   PostgreSQL is not configured
```

When `DATABASE_URL` is not set, the app runs in ChromaDB-only mode: no auth, and all data lives in ChromaDB.

---

## Core System Architecture & Engineering Tradeoffs

### 1. Schema-Bound Extraction vs. LLM Non-Determinism

- **The Problem:** Multimodal LLMs can hallucinate line items, transpose totals, and misread tax on distorted or faded receipts.
- **The Solution:** Model output is generated with `streamObject` against nested Zod schemas covering merchant, line items, subtotal, tax, total, currency, payment method, and date. The partial object streams to the client as it is generated; only an object that passes final schema validation is persisted. Zod enforces shape and types, not arithmetic, so totals are not cross-checked against line items.

### 2. Duplicate Detection & Cost Optimisation

- The browser hashes each image with SHA-256 (Web Crypto) and calls `/api/extract-receipt/check` before invoking the model.
- If the user already has a receipt with the same hash, the existing receipt is shown and the user can skip the model call or re-run extraction anyway. The check is advisory: `/api/extract-receipt` itself does not reject duplicates.

### 3. Decoupled Storage Architecture

- **Relational Core:** PostgreSQL (via Drizzle ORM) is the source of truth for receipts, transactions, budgets, and Better Auth tables, with `user_id` foreign keys (`ON DELETE CASCADE`).
- **Vector Indexing:** ChromaDB receives a best-effort secondary write of each receipt and transaction embedding. Failures are logged and do not affect the PostgreSQL write.

### 4. Security Headers & Rate Limiting

- Security headers on every route: Content Security Policy (with `frame-ancestors 'none'`; scripts allow `'unsafe-inline'` and Google Tag Manager), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and `Permissions-Policy`.
- `/api/extract-receipt`, `/api/process-statement`, `/api/search`, and `/api/demo-login` are rate limited per IP. With Upstash configured this is an Upstash Redis sliding-window limiter; otherwise it falls back to an in-memory fixed-window limiter (single instance only).
- The demo account is read-only: write endpoints return 403 for it.

---

## System Capabilities

| Capability                      | Implementation                                                                                                   |
| :------------------------------ | :--------------------------------------------------------------------------------------------------------------- |
| **Vision Receipt Extraction**   | Multimodal extraction (OpenAI GPT-6 Luna / Anthropic Claude Sonnet 4.6) validated against Zod schemas          |
| **PDF Statement Parsing**       | Text extracted with unpdf, then transactions and categories extracted by the LLM                                 |
| **Receipt Reconciliation**      | Fuzzy matching of receipts to bank transactions, scored on amount, date proximity, and merchant name similarity  |
| **Duplicate Detection**         | Client-side SHA-256 image hashing checked before the model is called                                             |
| **Search**                      | With PostgreSQL: case-insensitive merchant name match. ChromaDB-only mode: vector similarity over embeddings     |
| **Budget Tracking**             | Monthly per-category limits with spent-vs-limit progress; Recharts spending charts                               |
| **Authentication**              | Better Auth email/password sessions, per-user data scoping, and a read-only seeded demo account                 |
| **API Defense & Security**      | Per-IP rate limiting, CSP and security headers, Zod validation of core environment variables                     |
| **BYOK Mode**                   | Users supply their own OpenAI key in the browser (`x-openai-key` header) for public demos; Anthropic and embeddings still use server keys |
| **Consent Mode Analytics**      | Google Tag Manager with Consent Mode: `analytics_storage` defaults to denied until the user accepts the cookie banner |

---

## Technical Specifications

- **Frontend:** Next.js 16 (App Router, Route Handlers), React 19, Tailwind CSS 3, Recharts, Framer Motion, Lucide Icons
- **AI & Embeddings:** Vercel AI SDK (v6), Anthropic Claude Sonnet 4.6, OpenAI GPT-6 Luna, OpenAI text-embedding-3-small
- **Backend & API:** Node.js runtime, Next.js Route Handlers, unpdf, Zod 4
- **Persistence & Storage:** PostgreSQL 16, Drizzle ORM, ChromaDB (vector store), Docker Compose
- **Security & Auth:** Better Auth (session cookies), Upstash Redis (sliding-window rate limiting)
- **DevOps & Tooling:** TypeScript 5 (strict), ESLint 9 (flat config), Vitest, GitHub Actions, pnpm

---

## Local Development & Setup

### Prerequisites

- Node.js >= 20.9 (CI uses Node 24)
- pnpm 11 (matches CI)
- Docker & Docker Compose

### 1. Repository Setup

```bash
git clone https://github.com/aditya27dev/ai-receipt-reader.git
cd ai-receipt-reader
pnpm install
```

### 2. Environment Configuration

Copy the template (it contains only the two API keys) and add any other variables you need:

```bash
cp .env.sample .env
```

`lib/env.ts` validates `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `CHROMA_URL`, `DATABASE_URL`, and `BETTER_AUTH_SECRET` with Zod when it is first imported on the server, and throws if they are missing or invalid. The other variables are read directly and are not validated.

| Variable                   | Required          | Purpose                                                                                       |
| :------------------------- | :---------------- | :-------------------------------------------------------------------------------------------- |
| `OPENAI_API_KEY`           | Yes (unless BYOK) | OpenAI vision extraction and text embeddings (embeddings need it even in BYOK mode)           |
| `ANTHROPIC_API_KEY`        | Yes (unless BYOK) | Anthropic extraction engine (needed to use Anthropic even in BYOK mode)                       |
| `DATABASE_URL`             | Optional          | PostgreSQL connection string; enables auth and PostgreSQL storage. Without it, ChromaDB-only  |
| `BETTER_AUTH_SECRET`       | If DB is set      | Session signing secret (minimum 32 characters)                                                |
| `CHROMA_URL`               | Optional          | ChromaDB endpoint (defaults to `http://localhost:8000`)                                       |
| `NEXT_PUBLIC_APP_URL`      | Optional          | Production origin; used as the Better Auth base URL and a trusted origin                      |
| `DEV_ORIGIN`               | Optional          | Extra dev origin (e.g. a tunnel) added to Next.js `allowedDevOrigins` and Better Auth trusted origins |
| `UPSTASH_REDIS_REST_URL`   | Optional          | Upstash Redis REST URL; both Upstash variables are needed to enable Redis rate limiting       |
| `UPSTASH_REDIS_REST_TOKEN` | Optional          | Upstash Redis REST token                                                                      |
| `NEXT_PUBLIC_VERCEL_MODE`  | Optional          | Set to `true` to enable BYOK mode for public deployments                                      |
| `NEXT_PUBLIC_GTM_ID`       | Optional          | Google Tag Manager container ID (runs under Consent Mode)                                     |

For the Docker Compose database, use `DATABASE_URL=postgresql://postgres:password@localhost:5432/receipts`.

### 3. Service Bootstrapping

```bash
# Start PostgreSQL and ChromaDB containers (or: pnpm docker:up)
docker compose up -d

# Push the Drizzle schema to PostgreSQL
pnpm db:push

# Start the development server
pnpm dev
```

Open `http://localhost:3000`.

---

## API Surface

When `DATABASE_URL` is set, data endpoints require a signed-in session and are scoped to that user.

```
POST   /api/extract-receipt        -> Extract a receipt image (streamed) and save it
POST   /api/extract-receipt/check  -> Look up the user's existing receipt by SHA-256 image hash
POST   /api/process-statement      -> Extract transactions from a PDF statement (streamed) and save them
GET    /api/receipts               -> List receipts with category summary and 30-day spending
PUT    /api/receipts/[id]          -> Edit merchant, date, total, or payment method
DELETE /api/receipts/[id]          -> Delete a receipt and its embedding
GET    /api/transactions           -> List bank transactions with category summary
GET    /api/reconcile              -> Match receipts to transactions (requires a session)
GET    /api/budgets                -> List category budgets
POST   /api/budgets                -> Create or replace a category budget
DELETE /api/budgets?id=            -> Delete a budget
GET    /api/export?type=&format=   -> Download receipts or transactions as CSV or JSON
GET    /api/search?q={query}       -> Search receipts (see Search above)
POST   /api/demo-login             -> Sign in to the read-only seeded demo account
-      /api/auth/[...all]          -> Better Auth session endpoints
```

---

## Quality Assurance & Automated Testing

Vitest covers Zod schemas, reconciliation scoring, PostgreSQL query helpers (with the database mocked), and demo-account write restrictions:

```bash
# Run unit tests (watch mode; use `pnpm test --run` for a single run)
pnpm test

# Run tests once with V8 coverage (text + lcov)
pnpm test:coverage

# Validate stored extraction fixtures against the Zod schemas and run reconciliation cases (no model calls)
pnpm eval
```

### Continuous Integration Pipeline

Every push to `main` or `develop`, and every pull request to `main`, runs a GitHub Actions job with these steps:

1. **Lint:** `pnpm lint` (ESLint 9).
2. **Type-check:** `tsc --noEmit`.
3. **Test:** Vitest single run.
4. **Build:** `pnpm build` in BYOK mode with placeholder secrets.

---

## License

Personal engineering portfolio project by **Aditya Batra**, released under a Personal Use License. See [LICENSE](LICENSE) for terms.

---

**Aditya Batra**  
Senior Software & Platform Engineer  
[LinkedIn](https://www.linkedin.com/in/aditya-batra/) · [GitHub](https://github.com/aditya27dev) · [Website](https://adityabatra.dev)
