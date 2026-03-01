# AI Receipt Scanner & Bank Statement Analyzer

Made with care and to explore AI by Aditya Batra

A full-stack AI-powered application that scans receipts and bank statements, extracts structured financial data, and delivers real-time spending analytics — all powered by vector embeddings and semantic search.

## What This Does

Upload a receipt photo or PDF bank statement → **AI extracts all data** → **Intelligent categorization** → **Beautiful analytics dashboard** with spending breakdowns, trends, and semantic search.

## Key Features

| Feature                           | Description                                                                                         |
| --------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Vision AI Receipt Scanning**    | Multimodal AI (GPT-4o & Claude 3.5) extracts merchant, items, and totals from receipt images        |
| **PDF Bank Statement Processing** | Automatically extracts transactions from bank statements with AI-powered categorization             |
| **Transaction History & Sorting** | Sort transactions by date, description, category, or amount with visual indicators                  |
| **Category Filtering**            | Filter transactions by spending category with real-time statistics                                  |
| **Duplicate Detection**           | SHA-256 image hashing prevents duplicate uploads and saves API costs                                |
| **Multi-Currency Support**        | Auto-detects currencies (£, $, €, ¥) from receipts and statements                                   |
| **Semantic Search**               | Find receipts and transactions using natural language queries via vector embeddings                 |
| **Analytics Dashboard**           | Interactive charts — bar, pie, and line — with spending breakdowns by category and trends over time |
| **Dark Mode**                     | Full dark mode support with responsive, mobile-friendly design                                      |
| **Type-Safe**                     | Full TypeScript with Zod schema validation end-to-end                                               |

## Tech Stack

**Frontend:** Next.js 16 · React 19 · Tailwind CSS 3 · Recharts · Lucide Icons
**AI/ML:** Vercel AI SDK (v6) · OpenAI GPT-4o · Claude 3.5 Sonnet
**Backend:** Node.js · Next.js API Routes · PDF parsing (unpdf)
**Database:** ChromaDB (vector embeddings) · Docker
**Tools:** TypeScript 5 · Zod · ESLint 9 · pnpm

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Set environment variables
cp .env.example .env
# Add OPENAI_API_KEY and ANTHROPIC_API_KEY (optional)

# 3. Start ChromaDB
docker-compose up -d

# 4. Run development server
pnpm dev

# 5. Open http://localhost:3000
```

## API Endpoints

```
POST   /api/extract-receipt      → Extract receipt data from an image
POST   /api/process-statement    → Extract transactions from a PDF statement
GET    /api/receipts             → Get all receipts & spending analytics
DELETE /api/receipts/[id]        → Delete a specific receipt
GET    /api/transactions         → Get all bank transactions
GET    /api/search?q=query       → Semantic search across receipts
POST   /api/init-db              → Initialize ChromaDB collections
```

## How It Works

```
Receipt Image / PDF Upload
    ↓
AI Vision Processing (GPT-4o or Claude 3.5)
    ↓
Structured Data Extraction + JSON Validation
    ↓
Zod Schema Validation
    ↓
Vector Embedding Generation (OpenAI)
    ↓
Storage in ChromaDB + Metadata
    ↓
Analytics, Sorting & Search Ready
```

## What This Demonstrates

**AI & Machine Learning** — Multimodal vision AI, structured JSON output with schema validation, prompt engineering, and seamless multi-model provider switching (OpenAI ↔ Anthropic).

**Full-Stack Development** — Next.js App Router with server/client components, RESTful API design, file processing (Base64, PDF extraction, image hashing), and real-time data pipelines.

**Data & Vector Databases** — OpenAI embeddings for semantic search, ChromaDB integration for similarity queries, SHA-256 deduplication, and multi-format data handling.

**Frontend & UX** — Dynamic component rendering, interactive Recharts visualizations, sortable and filterable data tables, responsive design with drag-and-drop, and full dark mode theming.

**DevOps & Best Practices** — Docker containerization, TypeScript strict mode, ESLint 9 flat config, and pnpm for fast, reliable builds.

## License

This is a personal portfolio project by Aditya Batra, shared for learning and inspiration.

- You're welcome to study the code, run it locally, and learn from it
- Please don't use it as your own portfolio piece or deploy it to production

See [LICENSE](LICENSE) for full details.

---

**Aditya Batra** · [LinkedIn](https://www.linkedin.com/in/aditya-batra/) · [GitHub](https://github.com/aditya27dev)
