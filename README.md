# 🧾 AI Receipt Scanner

**A Full-Stack AI Receipt Scanning Application**

Built by Aditya Batra - © 2026 All Rights Reserved

> **📖 New to this app? Check out the [User Guide](USER-GUIDE.md) for a complete walkthrough!**

A portfolio project showcasing **Multimodal AI**, **Structured Data Extraction**, **Vector Databases**, and **Generative UI**.

Built with Next.js 15+, Vercel AI SDK, ChromaDB, and modern AI models (GPT-4o & Claude 3.5 Sonnet).

> Demonstrates advanced AI integration, vector databases, semantic search, and modern full-stack development

## ⚠️ License Notice

**This project is licensed for PERSONAL USE ONLY.**

- ✅ You may study the code for learning purposes
- ✅ You may run it locally for testing
- ❌ You may NOT use it for your own portfolio demonstration
- ❌ You may NOT use it for commercial purposes
- ❌ You may NOT deploy it to production

See [LICENSE](LICENSE) for full terms. Violations will be pursued.

## ✨ Features

### 📸 Receipt Scanning
- **Multimodal Vision AI** - Upload receipt images with multiple options:
  - **GPT-4o** - Best overall accuracy
  - **Claude 3.5 Sonnet** - Excellent for complex receipts
- 🔍 **Duplicate Detection** - SHA-256 image hashing prevents duplicate uploads and saves AI API costs
- 💰 **Multi-Currency Support** - Automatically detects currencies (£, $, €, ¥, ₹) from receipts
- 🖼️ **Receipt History** - Browse all uploaded receipts with image thumbnails and full details
- 🗑️ **Delete Receipts** - Remove receipts you don't need

### 📊 Analytics & Insights
- 🎯 **Structured Extraction** - Uses Zod schemas with `generateObject()` for type-safe data extraction
- 📈 **Generative UI** - Beautiful spending analytics with interactive charts and breakdowns
- 🗄️ **Vector Database (ChromaDB)** - Store receipts with embeddings for semantic search
- 🔎 **Semantic Search** - Find receipts by natural language queries
- 💱 **Currency Selector** - View analytics in different currencies when you have mixed-currency data

### 🎨 Developer Experience
- 🐳 **Docker Integration** - ChromaDB runs in Docker for easy setup
- 🎨 **Modern UI** - Built with Next.js 15, React 19, and Tailwind CSS 4
- 🌓 **Dark Mode** - Full dark mode support throughout the app
- ✅ **Type Safety** - Full TypeScript with Zod validation and strict type checking
- 🎨 **Drag & Drop** - Intuitive file upload for receipts

## 🏗️ Architecture: "The Agentic Pipeline"

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐     ┌──────────────┐
│   File Upload   │ ──> │   AI Processing  │ ──> │  Structured │ ──> │   ChromaDB   │
│   Receipt       │     │  • GPT-4o Vision │     │ Extraction  │     │   (Docker)   │
│                 │     │  • Claude Vision │     │    (Zod)    │     │  OpenAI      │
│                 │     │                  │     │             │     │  Embeddings  │
└─────────────────┘     └──────────────────┘     └─────────────┘     └──────────────┘
                                                         │                     │
                                                         v                     v
                                                 ┌──────────────┐     ┌──────────────┐
                                                 │ Generative UI│     │   Semantic   │
                                                 │ Charts/Tables│     │    Search    │
                                                 └──────────────┘     └──────────────┘
```

### Key Components

1. **Receipt Scanner** - Upload images → AI vision extracts structured data → Store with embeddings
2. **Vector Database** - ChromaDB with OpenAI embeddings for semantic search
3. **Analytics Dashboard** - Real-time charts, spending breakdowns, and multi-currency support
4. **Receipt History** - Browse and manage all uploaded receipts

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm (or npm/yarn)
- Docker & Docker Compose
- OpenAI API key (required, for GPT-4o vision and embeddings)
- Anthropic API key (optional, for Claude 3.5 Sonnet vision)

### Installation

1. **Clone and install dependencies:**

```bash
pnpm install
```

2. **Set up environment variables:**

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Then add your API keys:

```env
# Required: OpenAI for GPT-4o vision and embeddings
OPENAI_API_KEY=sk-...

# Optional: Anthropic for Claude 3.5 Sonnet
ANTHROPIC_API_KEY=sk-ant-...

# ChromaDB URL (defaults when using Docker Compose)
CHROMA_URL=http://localhost:8000
```

**Getting API Keys:**
- **OpenAI**: https://platform.openai.com/api-keys (required)
- **Anthropic**: https://console.anthropic.com/ (optional, for Claude)

3. **Start ChromaDB with Docker:**

```bash
docker-compose up -d
```

Verify ChromaDB is running:
```bash
curl http://localhost:8000/api/v1/heartbeat
```

4. **Run the development server:**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app!

The ChromaDB collection will be automatically created when you upload your first receipt.

<details>
<summary>Optional: Manually initialize the database</summary>

If you prefer to initialize the ChromaDB collection manually before uploading receipts:

```bash
curl -X POST http://localhost:3000/api/init-db
```

</details>

## 🎯 How It Works

### 1. Upload & Extract

The user uploads a receipt image. The app:
- Converts the image to base64
- Sends it to GPT-4o or Claude 3.5 Sonnet
- Uses `generateObject()` from Vercel AI SDK with a Zod schema
- Extracts structured data (merchant, date, items, totals, categories)

### 2. Generate Embeddings & Store

The extracted receipt is processed:
- Receipt text is created from structured data
- OpenAI's `text-embedding-3-small` generates vector embeddings
- Stored in ChromaDB with:
  - Vector embeddings for semantic search
  - Metadata (merchant, date, totals, payment info)
  - Full receipt document text

### 3. Analyze (Generative UI)

The analytics tab queries the database and generates:
- **Total spending** across all receipts
- **Category breakdown** (pie chart & bar chart)
- **Spending over time** (line chart)
- **Detailed table** with averages and counts

## 🛠️ Technologies

- **Framework**: Next.js 15+ (App Router, React 19, Server Components)
- **AI SDK**: Vercel AI SDK (`ai` package) with `generateObject()`
- **AI Models**: OpenAI GPT-4o, Anthropic Claude 3.5 Sonnet
- **Embeddings**: OpenAI text-embedding-3-small
- **Vector Database**: ChromaDB (Docker) with semantic search
- **Validation**: Zod (type-safe schemas)
- **Charts**: Recharts (interactive visualizations)
- **Styling**: Tailwind CSS 4 (latest)
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Security**: crypto-js (SHA-256 image hashing for duplicate detection)
- **Type Safety**: TypeScript with strict mode

## 🎨 Key Concepts Demonstrated

### Multimodal AI
Uses vision-capable models to "see" receipt images without OCR:

```typescript
await generateObject({
  model: openai('gpt-4o'),
  schema: receiptSchema,
  messages: [{
    role: 'user',
    content: [
      { type: 'text', text: '...' },
      { type: 'image', image: `data:image/jpeg;base64,${base64}` }
    ]
  }]
});
```

### Structured Extraction
Type-safe extraction with Zod schemas:

```typescript
const receiptSchema = z.object({
  merchantName: z.string(),
  items: z.array(receiptItemSchema),
  total: z.number(),
  // ...
});
```

### Generative UI
Components that generate visualizations based on AI-extracted data:
- Real-time chart rendering
- Category-based analytics
- Spending trends over time

## 🚢 Deployment

### Deploy to Vercel

```bash
vercel deploy
```

Make sure to:
1. Add environment variables in Vercel dashboard
2. Create a Postgres database in Vercel (or use ChromaDB)
3. The database will auto-initialize on first receipt upload

## 📝 API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/extract-receipt` | POST | Upload receipt image, extract with AI (supports duplicate detection) |
| `/api/receipts` | GET | Get all receipts and spending analytics |
| `/api/receipts/[id]` | DELETE | Delete a specific receipt by ID |
| `/api/search?q=query` | GET | Semantic search across receipts |
| `/api/init-db` | POST | Initialize ChromaDB collection (optional, auto-creates) |

## 📚 Documentation

- **[USER-GUIDE.md](USER-GUIDE.md)** - Complete user guide with app flow and tutorials
- **[SETUP.md](SETUP.md)** - Detailed installation and configuration guide

## 🧪 Testing Locally

1. Start ChromaDB: `docker-compose up -d`
2. Start the dev server: `pnpm dev`
3. Open http://localhost:3000
4. Upload a receipt image (the database will auto-initialize on first upload)
5. Watch as the AI extracts structured data and generates embeddings
6. Navigate to the Analytics tab to see spending visualizations
7. Try semantic search: `curl "http://localhost:3000/api/search?q=coffee"`

## 💡 Features Completed

- [x] Semantic search with vector embeddings
- [x] Receipt duplication detection using SHA-256 hashing
- [x] Multi-currency support with auto-detection
- [x] Receipt history with image thumbnails
- [x] Delete receipts
- [x] Drag & drop file upload
- [x] Dark mode support
- [x] Multiple AI model options (2 providers: GPT-4o & Claude)

## 🚀 Future Enhancements

- [ ] Advanced filtering UI for search results
- [ ] Export to CSV/PDF
- [ ] Monthly spending reports with email notifications
- [ ] Budget tracking and alerts
- [ ] Receipt image storage in cloud (S3/R2)
- [ ] Multi-user authentication (Clerk/Auth.js)
- [ ] Mobile app with React Native
- [ ] Receipt OCR editing interface

## 📄 License

**Personal Use License** - see [LICENSE](LICENSE) file for details

This project is licensed for personal, educational, and local development use only.  
Production deployment and commercial use are **not permitted** without explicit permission.

For commercial licensing inquiries, please contact the author.

## 👨‍💻 Author

**Aditya Batra**  

📧 Contact: adityabatra277@gmail.com  
🔗 LinkedIn: https://www.linkedin.com/in/aditya-batra/  
🐙 GitHub: [@aditya27dev](https://github.com/aditya27dev)

### Skills Demonstrated

This project demonstrates:
- Advanced AI/ML integration (multimodal vision with GPT-4o and Claude)
- Vector database implementation with semantic search
- Multi-currency financial data handling
- Modern full-stack TypeScript development
- Docker containerization
- Type-safe data extraction with Zod schemas

---

## 🚨 Copyright & Usage Notice

This project is the **intellectual property of Aditya Batra**.  

**Unauthorized use includes:**
- Using this project for your own portfolio
- Deploying to production (personal or commercial)
- Claiming this work as your own
- Commercial use of any kind

**Monitoring:** This project contains unique identifiers for tracking unauthorized use.  
**Enforcement:** Violations will be reported to GitHub and hosting platforms.

For licensing inquiries, please contact the author.

---

Built with ❤️ using Next.js 15, Vercel AI SDK, and ChromaDB
