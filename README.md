# 🧾 AI Receipt Scanner & Bank Statement Analyzer

**Copyright © 2026 Aditya Batra - All Rights Reserved**

A full-stack AI-powered application that intelligently scans receipts and bank statements, extracts structured financial data, and provides real-time spending analytics using vector embeddings and semantic search.

## ⚡ What This Does

Upload a receipt photo or PDF bank statement → **AI extracts all data** → **Intelligent categorization** → **Beautiful analytics dashboard** with spending breakdowns, trends, and semantic search capabilities.

## 🎯 Key Features

| Feature                              | Description                                                                              |
| ------------------------------------ | ---------------------------------------------------------------------------------------- |
| 📸 **Vision AI Receipt Scanning**    | Multimodal AI (GPT-4o & Claude 3.5) extracts merchant, items, totals from receipt images |
| 📄 **PDF Bank Statement Processing** | Automatically extracts all transactions from bank statements with AI categorization      |
| 🔍 **Duplicate Detection**           | SHA-256 image hashing prevents duplicate uploads and saves API costs                     |
| 💰 **Multi-Currency Support**        | Auto-detects currencies (£, $, €, ¥) from receipts and statements                        |
| 🧠 **Semantic Search**               | Find receipts/transactions using natural language queries via vector embeddings          |
| 📊 **Analytics Dashboard**           | Interactive charts, spending breakdowns by category, trends over time                    |
| 🌓 **Dark Mode**                     | Full dark mode support with responsive design                                            |
| ✅ **Type-Safe**                     | Full TypeScript with Zod schema validation end-to-end                                    |

## 🛠️ Tech Stack

**Frontend:** Next.js 16 • React 19 • Tailwind CSS 3 • Recharts
**AI/ML:** Vercel AI SDK (v6) • OpenAI GPT-4o • Claude 3.5 Sonnet
**Backend:** Node.js • RESTful APIs • PDF parsing
**Database:** ChromaDB (vector embeddings) • Docker
**Tools:** TypeScript • Zod • ESLint 9 • pnpm

## 🚀 Quick Start

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

## 💡 What This Demonstrates

### AI & Machine Learning

- **Multimodal Vision AI** - Process images and extract structured data
- **JSON Schema Validation** - Use AI output with guaranteed type safety
- **Prompt Engineering** - Precise instructions for accurate extraction
- **Multi-Model Support** - Seamless provider switching (OpenAI ↔ Anthropic)

### Backend Development

- **Next.js App Router** - Modern server/client component architecture
- **RESTful API Design** - Clean, error-handled endpoints
- **File Processing** - Base64 encoding, PDF extraction, image hashing
- **Real-time Pipelines** - Process and analyze data on upload

### Data & Vector Databases

- **Vector Embeddings** - OpenAI embeddings for semantic search
- **ChromaDB Integration** - Vector database for similarity queries
- **Duplicate Detection** - SHA-256 hashing for intelligent deduplication
- **Multi-format Handling** - Images, PDFs, JSON data

### Frontend & UX

- **Generative UI** - Dynamic component rendering based on AI data
- **Interactive Charts** - Real-time spending visualizations
- **Responsive Design** - Mobile-friendly with drag & drop
- **Dark Mode** - Full theme support

### DevOps & Best Practices

- **Docker Containerization** - Simple deployment with Docker Compose
- **Type Safety** - TypeScript strict mode throughout
- **Modern Tooling** - ESLint 9 flat config, pnpm for performance
- **Production Ready** - Full build and lint passing

## 🎓 Project Highlights

✅ **Full working application** - Not just a tutorial or template
✅ **Production-grade code** - Type-safe, error handling, validation
✅ **Modern tech stack** - Latest versions of Next.js, React, TypeScript
✅ **Real AI integration** - Works with actual AI models (GPT-4o, Claude)
✅ **Practical features** - Duplicate detection, multi-currency, dark mode
✅ **Vector database** - Advanced search with semantic understanding

## 📝 API Endpoints

```
POST   /api/extract-receipt      → Extract receipt data from image
POST   /api/process-statement    → Extract transactions from PDF
GET    /api/receipts             → Get all receipts & analytics
DELETE /api/receipts/[id]        → Delete specific receipt
GET    /api/transactions         → Get all transactions
GET    /api/search?q=query       → Semantic search
```

## 📚 How It Works

```
Receipt/PDF Upload
    ↓
AI Vision Processing (GPT-4o or Claude)
    ↓
Structured Extraction (generateText + JSON validation)
    ↓
Zod Schema Validation
    ↓
Vector Embedding Generation (OpenAI)
    ↓
Storage in ChromaDB + Metadata
    ↓
Analytics & Search Ready
```

## ⚠️ License

**Personal Use Only** - This is a portfolio project to demonstrate advanced full-stack AI development skills.

- ✅ Study the code, run it locally, learn from it
- ❌ Cannot be used for your own portfolio or deployed to production

See [LICENSE](LICENSE) for details.

---

**Built by Aditya Batra** • [LinkedIn](https://www.linkedin.com/in/aditya-batra/) • [GitHub](https://github.com/aditya27dev)
_Demonstrating advanced AI integration, vector databases, and modern full-stack development_
