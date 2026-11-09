# AI Receipt Scanner & Bank Statement Analyzer

Built to explore multimodal AI, vector search, and full-stack SaaS patterns (auth, budgets, reconciliation).

A full-stack AI-powered application that scans receipts and bank statements, extracts structured financial data, and delivers real-time spending analytics, all powered by vector embeddings and semantic search.

## What This Does

Upload a receipt photo or PDF bank statement → **AI extracts all data** → **Intelligent categorization** → **Beautiful analytics dashboard** with spending breakdowns, budgets, trends, and semantic search.

## Key Features

| Feature                              | Description                                                                                          |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Vision AI Receipt Scanning**        | Multimodal AI (OpenAI & Anthropic) extracts merchant, items, and totals from receipt images           |
| **PDF Bank Statement Processing**     | Automatically extracts transactions from bank statements with AI-powered categorization               |
| **Receipt ↔ Transaction Reconciliation** | Matches scanned receipts against bank transactions to flag what's accounted for and what's missing |
| **Budgets**                           | Set monthly category spending limits and track progress against them                                  |
| **Transaction History & Sorting**     | Sort transactions by date, description, category, or amount with visual indicators                    |
| **Category Filtering**                | Filter transactions by spending category with real-time statistics                                    |
| **Duplicate Detection**               | SHA-256 image hashing prevents duplicate uploads and saves API costs                                  |
| **Multi-Currency Support**            | Auto-detects currencies (£, $, €, ¥) from receipts and statements                                     |
| **Semantic Search**                   | Find receipts and transactions using natural language queries via vector embeddings                   |
| **Analytics Dashboard**               | Interactive bar, pie, and line charts with spending breakdowns by category and trends over time       |
| **Data Export**                       | Export receipts or transactions as CSV or JSON                                                        |
| **Authentication & Demo Mode**        | Email/password auth (Better Auth) with per-user data, plus a one-click seeded demo account            |
| **Rate Limiting**                     | Upstash-backed rate limiting on sensitive endpoints (e.g. demo login)                                 |
| **BYOK Mode**                        | Optional "bring your own OpenAI key" client-side mode for public deployments without shared API costs |
| **Cookie Consent & Analytics**        | GDPR-style cookie banner gating Google Analytics via Google Tag Manager consent mode                  |
| **Security Headers**                  | Strict Content Security Policy, frame blocking, and hardened response headers on every route          |
| **Dark Mode**                         | Full dark mode support with responsive, mobile-friendly design                                        |
| **Type-Safe**                         | Full TypeScript with Zod schema validation end-to-end                                                 |

## Tech Stack

**Frontend:** Next.js 16 · React 19 · Tailwind CSS 3 · Recharts · Framer Motion · Lucide Icons
**AI/ML:** Vercel AI SDK (v6) · OpenAI · Anthropic
**Backend:** Node.js · Next.js API Routes · PDF parsing (unpdf)
**Database:** PostgreSQL (Drizzle ORM) · ChromaDB (vector search) · Docker
**Auth:** Better Auth (email/password, session-based) with a seeded demo account
**Infra:** Upstash Redis (rate limiting) · Google Tag Manager (consent-gated analytics)
**Tools:** TypeScript 5 · Zod · ESLint 9 · Vitest · pnpm

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Set environment variables
cp .env.sample .env
# Fill in the variables listed under "Environment Variables" below

# 3. Start ChromaDB + PostgreSQL
docker-compose up -d

# 4. Push the database schema (only needed if DATABASE_URL is set)
pnpm db:push

# 5. Run development server
pnpm dev

# 6. Open http://localhost:3000
```

## Environment Variables

| Variable                   | Required                          | Purpose                                                                                       |
| -------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------- |
| `OPENAI_API_KEY`           | Yes, unless BYOK mode is on       | OpenAI vision extraction and embeddings                                                       |
| `ANTHROPIC_API_KEY`        | Yes, unless BYOK mode is on       | Anthropic vision extraction                                                                   |
| `CHROMA_URL`               | No (default `http://localhost:8000`) | ChromaDB endpoint for vector search                                                        |
| `DATABASE_URL`             | No                                | PostgreSQL connection string. Enables auth, budgets, export, and reconciliation               |
| `BETTER_AUTH_SECRET`       | When `DATABASE_URL` is set        | Session signing secret, at least 32 characters                                                |
| `NEXT_PUBLIC_APP_URL`      | No                                | Public app URL used as the auth base URL and a trusted origin                                 |
| `DEV_ORIGIN`               | No                                | Extra dev origin (e.g. a tunnel URL) allowed for auth and Next.js dev requests                |
| `UPSTASH_REDIS_REST_URL`   | No                                | Upstash Redis URL for rate limiting                                                           |
| `UPSTASH_REDIS_REST_TOKEN` | No                                | Upstash Redis token for rate limiting                                                         |
| `NEXT_PUBLIC_VERCEL_MODE`  | No                                | Set to `true` to enable BYOK mode, where users supply their own OpenAI key in the browser     |
| `NEXT_PUBLIC_GTM_ID`       | No                                | Google Tag Manager container ID, loaded only after cookie consent                             |

Environment variables are validated at startup with Zod (`lib/env.ts`), so missing or invalid values fail fast with a clear error. Rate limiting is skipped when the Upstash variables are not set.

## API Endpoints

```
POST   /api/extract-receipt        → Extract receipt data from an image
POST   /api/extract-receipt/check  → Check if an image hash was already processed
POST   /api/process-statement      → Extract transactions from a PDF statement
GET    /api/receipts                → Get all receipts & spending analytics
DELETE /api/receipts/[id]           → Delete a specific receipt
GET    /api/transactions            → Get all bank transactions
GET    /api/reconcile                → Match receipts against bank transactions
GET    /api/budgets                 → Get budgets
POST   /api/budgets                 → Create/update a budget
GET    /api/export?type=&format=    → Export receipts/transactions as CSV or JSON
GET    /api/search?q=query          → Semantic search across receipts
POST   /api/demo-login              → Sign in (or create) the seeded demo account
*      /api/auth/[...all]           → Better Auth session/sign-in/sign-up routes
```

## How It Works

```
Receipt Image / PDF Upload
    ↓
AI Vision Processing (OpenAI or Anthropic)
    ↓
Structured Data Extraction + JSON Validation
    ↓
Zod Schema Validation
    ↓
Vector Embedding Generation (OpenAI)
    ↓
Storage in ChromaDB + PostgreSQL (scoped per user)
    ↓
Analytics, Budgets, Reconciliation, Sorting & Search Ready
```

## Testing

```bash
pnpm test           # Vitest unit tests (schemas, reconciliation, demo restrictions, db)
pnpm test:coverage  # With coverage report
pnpm eval           # Offline eval suite for the AI extraction pipeline (see evals/README.md)
```

## What This Demonstrates

**AI & Machine Learning:** Multimodal vision AI, structured JSON output with schema validation, prompt engineering, and seamless multi-model provider switching (OpenAI ↔ Anthropic).

**Full-Stack Development:** Next.js App Router with server/client components, RESTful API design, file processing (Base64, PDF extraction, image hashing), and real-time data pipelines.

**Auth & Multi-Tenancy:** Session-based authentication with Better Auth, per-user data scoping with authorization checks on data API routes, a seeded read-only demo account, and rate-limited sensitive endpoints.

**Data & Vector Databases:** OpenAI embeddings for semantic search, ChromaDB integration for similarity queries, PostgreSQL via Drizzle ORM for relational data, SHA-256 deduplication, and multi-format data handling.

**Frontend & UX:** Dynamic component rendering, interactive Recharts visualizations, sortable and filterable data tables, responsive design with drag-and-drop, and full dark mode theming.

**DevOps & Best Practices:** Docker containerization, GitHub Actions CI (lint, type-check, test, build), Content Security Policy and security headers, TypeScript strict mode, ESLint 9 flat config, Vitest testing, and pnpm for fast, reliable builds.

## License

This is a personal portfolio project by Aditya Batra, shared for learning and inspiration.

- You're welcome to study the code, run it locally, and learn from it
- Please don't use it as your own portfolio piece or deploy it to production

See [LICENSE](LICENSE) for full details.

---

**Aditya Batra** · [LinkedIn](https://www.linkedin.com/in/aditya-batra/) · [GitHub](https://github.com/aditya27dev)
