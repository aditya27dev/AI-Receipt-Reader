# Multimodal Financial Ingestion & Reconciliation Platform

A high-reliability full-stack financial platform engineered to ingest, extract, and reconcile accounting data from unstructured receipt images and PDF statements. Built with Next.js 16 (App Router), React 19, and TypeScript, featuring deterministic Zod contract boundaries, tenant-isolated relational persistence, vector similarity search, and automated transaction reconciliation.

[![CI](https://github.com/aditya27dev/ai-receipt-reader/actions/workflows/ci.yml/badge.svg)](https://github.com/aditya27dev/ai-receipt-reader/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Drizzle_ORM-336791?logo=postgresql)](https://orm.drizzle.team/)
[![Coverage](https://img.shields.io/badge/Coverage-Vitest-yellow?logo=vitest)](https://vitest.dev/)

---

## Architectural Data Flow

```
[ Ingestion Layer ]
  Receipt Image / PDF Statement Upload
         │
         ▼
[ Content Hashing & Invalidation Barrier ]
  SHA-256 Payload Hash Check ────────(Duplicate Found)──────► [ Instant Cache Return / Early Exit ]
         │ (Unique Payload)
         ▼
[ Extraction & Schema Boundary ]
  Multimodal Vision Engine (OpenAI / Anthropic via Vercel AI SDK v6)
         │
         ▼
  Type-Safe Contract Enforcement (Strict Zod Schema Validation)
         │
         ├──(Validation Failure)──► [ Structured Error Response / Request Rejected ]
         │
         ▼ (Validated Payload)
[ Persistence & Indexing Layer ]
  ┌──────────────────────────────┴──────────────────────────────┐
  ▼                                                             ▼
[ Relational Engine: PostgreSQL / Drizzle ]   [ Semantic Vector Store: ChromaDB ]
  • Multi-tenant transactional isolation         • OpenAI text embeddings (1536-dim)
  • Transaction-to-receipt reconciliation engine • Cosine similarity search over merchants
  • Real-time budget threshold calculation       • Natural language expense querying
```

---

## Core System Architecture & Engineering Tradeoffs

### 1. Deterministic Extraction vs. LLM Non-Determinism

- **The Problem:** Raw multimodal LLMs frequently hallucinate line items, transpose totals, and miscalculate regional tax structures when reading distorted, faded receipts.
- **The Solution:** Model output is generated as structured objects bound to strict, nested Zod contracts covering merchant, line items, subtotal, tax, total, currency, and date. Payloads that fail schema validation are rejected with a structured error before anything reaches the database, so malformed extractions never contaminate the ledger.

### 2. Idempotent Ingestion & Cost Optimisation

- Uploaded binaries are hashed using SHA-256 before invoking external model APIs.
- Duplicate files return existing record identifiers immediately, preventing redundant API billing and eliminating ledger contamination.

### 3. Decoupled Storage Architecture

- **Relational Core:** PostgreSQL (via Drizzle ORM) manages ACID transactions, tenant isolation, foreign key constraints, and budget mutations.
- **Vector Indexing:** ChromaDB isolates semantic search vectors, ensuring resource-intensive similarity searches never contend with transactional database locks.

### 4. Zero-Trust Security & Rate Limiting

- Hardened HTTP response headers on every route, including strict Content Security Policy (CSP), frame-ancestor blocking, and secure session cookies.
- Sensitive ingestion endpoints and demo account surfaces are guarded by Upstash Redis sliding-window rate limiters, preventing denial-of-wallet vectors on external AI APIs.

---

## System Capabilities

| Capability                           | Engineering Implementation                                                                             |
| :----------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Vision Receipt Extraction**        | Multimodal extraction (OpenAI GPT-5.4 mini / Anthropic Claude Sonnet 4.6) bound to strict schemas      |
| **PDF Statement Parsing**            | High-throughput document parsing via unpdf with automated transactional categorization                 |
| **Two-Way Reconciliation**           | Algorithmic matching between scanned receipt totals and posted bank statement transactions             |
| **Deduplication Engine**             | Pre-execution SHA-256 image hashing to guarantee idempotency and prevent redundant model invocations   |
| **Semantic Natural Language Search** | Context-scoped natural language retrieval across historic records using ChromaDB vector embeddings     |
| **Budget Variance Telemetry**        | Real-time threshold monitoring with category delta calculations and Recharts visualisations            |
| **Multi-Tenant Authentication**      | Secure session management with Better Auth, strict tenant scoping, and a read-only sandboxed demo mode |
| **API Defense & Security**           | Upstash Redis sliding-window rate limiters, strict CSP headers, and fail-fast Zod startup validation   |
| **BYOK Client Deployment**           | Client-side API key configuration mode for zero-cost public demonstrations                             |
| **Consent-Gated Analytics**          | GDPR-compliant cookie consent barrier governing Google Tag Manager execution                           |

---

## Technical Specifications

- **Frontend:** Next.js 16 (App Router, Server Components, Route Handlers), React 19, Tailwind CSS 3, Recharts, Framer Motion, Lucide Icons
- **AI & Embeddings:** Vercel AI SDK (v6), Anthropic Claude Sonnet 4.6, OpenAI GPT-5.4 mini, OpenAI text-embedding-3-small
- **Backend & API:** Node.js, Next.js API Routes, unpdf parser, Zod runtime validation
- **Persistence & Storage:** PostgreSQL, Drizzle ORM, ChromaDB (Vector Store), Docker Compose
- **Security & Auth:** Better Auth (Session-based, encrypted cookies), Upstash Redis (Sliding-window rate limiting)
- **DevOps & Tooling:** TypeScript 5 (Strict), ESLint 9 (Flat Config), Vitest, GitHub Actions, pnpm

---

## Local Development & Setup

### Prerequisites

- Node.js >= 20.x
- pnpm >= 9.x
- Docker & Docker Compose

### 1. Repository Setup

```bash
git clone https://github.com/aditya27dev/ai-receipt-reader.git
cd ai-receipt-reader
pnpm install
```

### 2. Environment Configuration

Copy the template and provide the required environment secrets:

```bash
cp .env.sample .env
```

All environment variables are validated at boot time via `lib/env.ts`. Missing or invalid configurations fail fast on startup.

| Variable                   | Required          | Purpose                                                               |
| :------------------------- | :---------------- | :-------------------------------------------------------------------- |
| `OPENAI_API_KEY`           | Yes (unless BYOK) | Vision model extraction and text embeddings                           |
| `ANTHROPIC_API_KEY`        | Yes (unless BYOK) | Alternative vision model extraction engine                            |
| `DATABASE_URL`             | Optional          | PostgreSQL connection string for auth, budgets, and reconciliation    |
| `BETTER_AUTH_SECRET`       | If DB is set      | Session signing secret (minimum 32 characters)                        |
| `CHROMA_URL`               | Optional          | ChromaDB instance endpoint (defaults to `http://localhost:8000`)      |
| `NEXT_PUBLIC_APP_URL`      | Optional          | Canonical production origin used for trusted session validation       |
| `DEV_ORIGIN`               | Optional          | Additional development origin allowed for tunneling / local testing   |
| `UPSTASH_REDIS_REST_URL`   | Optional          | Upstash Redis connection endpoint for API rate limiting               |
| `UPSTASH_REDIS_REST_TOKEN` | Optional          | Upstash Redis authentication token for rate limiting                  |
| `NEXT_PUBLIC_VERCEL_MODE`  | Optional          | Toggles client-side BYOK key mode for public sandbox deployments      |
| `NEXT_PUBLIC_GTM_ID`       | Optional          | Google Tag Manager container ID, gated strictly behind cookie consent |

### 3. Service Bootstrapping

```bash
# Launch isolated PostgreSQL and ChromaDB containers
docker-compose up -d

# Execute schema migrations against PostgreSQL
pnpm db:push

# Start the development server
pnpm dev
```

Navigate to `http://localhost:3000` to inspect the application.

---

## API Surface

```
POST   /api/extract-receipt        -> Ingest, validate, and extract receipt payload
POST   /api/extract-receipt/check  -> Query idempotency barrier via binary SHA-256 hash
POST   /api/process-statement      -> Parse statement PDF and extract batch transaction records
GET    /api/receipts               -> Retrieve tenant receipts and aggregated spending analytics
DELETE /api/receipts/[id]          -> Purge target receipt record and vector embeddings
GET    /api/transactions           -> Fetch posted bank statement lines
GET    /api/reconcile              -> Run reconciliation matrix across receipts and transactions
GET    /api/budgets                -> Retrieve category spending limits and current variance
POST   /api/budgets                -> Upsert category threshold limits
GET    /api/export?type=&format=   -> Stream structured financial exports in CSV or JSON
GET    /api/search?q={query}       -> Query vector database using cosine similarity lookup
POST   /api/demo-login             -> Authenticate against the read-only seeded demo tenant
-      /api/auth/[...all]          -> Better Auth session lifecycle endpoints
```

---

## Quality Assurance & Automated Testing

The platform enforces contract validation, math accuracy, and security boundaries through Vitest:

```bash
# Run unit and integration suites
pnpm test

# Generate statement and branch coverage reports
pnpm test:coverage

# Run offline regression evals against stored extraction fixtures
pnpm eval
```

### Continuous Integration Pipeline

Every push and pull request executes a multi-stage GitHub Actions pipeline:

1. **Static Analysis:** ESLint 9 validation and strict type safety checks via `tsc --noEmit`.
2. **Contract Testing:** Vitest execution across parsers, Zod schemas, and reconciliation calculations.
3. **Build Integrity:** Full production build via `pnpm build`.

---

## License

Personal engineering portfolio project created by **Aditya Batra**. Provided for review and technical demonstration purposes.

---

**Aditya Batra**  
Senior Software & Platform Engineer  
[LinkedIn](https://www.linkedin.com/in/aditya-batra/) · [GitHub](https://github.com/aditya27dev) · [Website](https://adityabatra.dev)
