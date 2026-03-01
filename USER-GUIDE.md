# 📖 User Guide - AI Receipt Scanner

Welcome! This guide will help you understand and use the AI Receipt Scanner application.

## 🎯 What Does This App Do?

The AI Receipt Scanner helps you:

- 📸 **Scan receipts** using AI vision technology (GPT-4o or Claude)
- 🏦 **Analyze bank statements** by uploading PDF files
- 📊 **Track spending** with automatic categorization
- 🔍 **Search transactions** using natural language
- 💱 **Handle multiple currencies** (USD, GBP, EUR, JPY, and more)

---

## 🚀 Quick Start

### 1. First Time Setup

Before using the app, make sure:

- ✅ ChromaDB is running (see [Setup Instructions](#setup-instructions))
- ✅ You have an OpenAI API key configured
- ✅ The development server is running

```bash
# Start ChromaDB
pnpm run docker:up

# Start the app
pnpm dev
```

Visit **http://localhost:3000** to access the app.

---

## 📱 App Navigation

The app has **4 main tabs**:

### 📸 1. Receipt Scanner Tab

Upload and scan individual receipt images.

### 📊 2. Analytics Tab

View spending summaries, charts, and insights.

### 📜 3. History Tab

Browse all previously scanned receipts with images.

### 🏦 4. Transactions Tab

View bank statement transactions and manage spending data.

---

## 🔄 Complete User Flow

### Flow 1: Scanning a Receipt

```
1. Open App → Receipt Scanner Tab
2. Select AI Model (GPT-4o or Claude)
3. Upload Receipt Image (drag & drop or click)
4. AI Extracts Data (merchant, items, total, etc.)
5. Data Saved to Database with Embeddings
6. View Result on Screen
```

**Step-by-Step:**

1. **Navigate to Receipt Scanner**
   - The first tab in the app

2. **Choose Your AI Model**
   - **GPT-4o** - Best overall accuracy (recommended)
   - **Claude 3.5 Sonnet** - Excellent for complex receipts

3. **Upload a Receipt**
   - Click the upload area OR
   - Drag & drop an image file
   - Supported formats: JPG, PNG, HEIC

4. **Wait for Processing**
   - The AI analyzes your receipt (5-15 seconds)
   - Extracts: merchant name, date, items, prices, tax, total

5. **Review Extracted Data**
   - Check the structured data displayed
   - Verify amounts and categories
   - Currency is auto-detected (£, $, €, ¥)

6. **Duplicate Detection**
   - If you upload the same receipt twice:
   - You'll see a warning message
   - Option to use existing data or force reprocess

7. **Data is Automatically Saved**
   - Receipt stored in ChromaDB vector database
   - Searchable via semantic search
   - Visible in History and Analytics tabs

---

### Flow 2: Uploading Bank Statements

```
1. Navigate to Transactions Tab
2. Click "Upload Bank Statement"
3. Select PDF File (credit card statement)
4. AI Extracts ALL Transactions
5. Transactions Categorized Automatically
6. View in Transaction History
```

**Step-by-Step:**

1. **Go to Transactions Tab**
   - Fourth tab in the navigation

2. **Upload PDF Statement**
   - Click "Upload Bank Statement" button
   - Select your PDF statement file

3. **Processing**
   - PDF text is extracted
   - AI identifies transaction patterns
   - Each transaction is categorized

4. **Review Transactions**
   - All transactions appear in the list
   - Filter by category
   - View spending summaries

5. **Categories**
   - Groceries
   - Dining
   - Transportation
   - Entertainment
   - Shopping
   - Healthcare
   - Utilities
   - Other

---

### Flow 3: Viewing Analytics

```
1. Go to Analytics Tab
2. See Total Spending
3. View Category Breakdown (Pie Chart)
4. Check Spending Over Time (Line Chart)
5. Change Currency (if multi-currency data)
```

**Step-by-Step:**

1. **Navigate to Analytics**
   - Second tab in the app

2. **Overview Metrics**
   - Total spending amount
   - Number of receipts/transactions
   - Average transaction value

3. **Category Breakdown**
   - Pie chart showing spending by category
   - Bar chart with exact amounts
   - Percentage of total for each category

4. **Spending Over Time**
   - Line chart showing daily/weekly trends
   - Last 30 days by default

5. **Currency Selector**
   - Top-right dropdown
   - Switch between USD, GBP, EUR, etc.
   - Only shows if you have multi-currency data

---

### Flow 4: Browsing History

```
1. Open History Tab
2. Scroll Through Receipt Images
3. Click to View Details
4. Delete Unwanted Receipts
```

**Step-by-Step:**

1. **Go to History Tab**
   - Third tab in navigation

2. **Browse Receipts**
   - See thumbnail images of all receipts
   - Sorted by date (newest first)

3. **View Receipt Details**
   - Click on any receipt card
   - See full extracted data
   - View original image

4. **Delete Receipts**
   - Click the trash icon
   - Confirm deletion
   - Receipt removed from all analytics

---

### Flow 5: Managing Transactions

```
1. Go to Transactions Tab
2. View All Transactions
3. Filter by Category
4. See Category Totals
5. Delete Individual Transactions
```

**Step-by-Step:**

1. **Navigate to Transactions**
   - Fourth tab

2. **View Transaction List**
   - All bank transactions displayed
   - Sorted by date

3. **Filter Transactions**
   - Click category filters at top
   - View only specific categories
   - See filtered totals

4. **Category Summary**
   - Total spent per category
   - Number of transactions
   - Progress bars showing distribution

5. **Delete Transactions**
   - Click trash icon on any transaction
   - Removes from database and analytics

---

## 🔍 Semantic Search Feature

The app includes powerful semantic search:

```
1. Use the Search Bar
2. Type Natural Language Query
   - "Starbucks last month"
   - "groceries over $50"
   - "dinner receipts"
3. AI Finds Relevant Receipts
4. Results Based on Meaning (not just keywords)
```

**Example Queries:**

- "Coffee purchases"
- "Expensive meals"
- "Shopping at Walmart"
- "Receipts from December"
- "Gas station transactions"

---

## 💡 Key Features Explained

### 🔒 Duplicate Detection

- Uses SHA-256 image hashing
- Prevents uploading same receipt twice
- Saves API costs and keeps data clean

### 💱 Multi-Currency Support

- Automatically detects currency symbols
- Supports: USD ($), GBP (£), EUR (€), JPY (¥), INR (₹)
- Currency selector in analytics

### 🤖 AI Models

- **GPT-4o**: Best accuracy, slightly more expensive
- **Claude 3.5 Sonnet**: Great for tricky receipts, good value

### 📦 Vector Database

- ChromaDB stores all data
- Enables semantic search
- Fast retrieval of similar receipts

### 🎨 Dark Mode

- Automatically follows system preference
- Toggle in browser settings

---

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- OpenAI API key

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/ai-receipt-scanner
cd ai-receipt-scanner
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Configure environment variables**

```bash
cp .env.example .env
```

Edit `.env` and add:

```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...  # Optional
CHROMA_URL=http://localhost:8000
```

4. **Start ChromaDB**

```bash
pnpm run docker:up
```

5. **Run the app**

```bash
pnpm dev
```

6. **Open in browser**

```
http://localhost:3000
```

---

## 📊 Data Flow Architecture

```
┌─────────────┐
│   User      │
│  Uploads    │
│  Receipt    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  AI Processing  │
│  (GPT-4o or     │
│   Claude)       │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   Structured    │
│   Extraction    │
│   (Zod Schema)  │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   OpenAI        │
│   Embeddings    │
│   Generated     │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   ChromaDB      │
│   Stores Data   │
│   + Embeddings  │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   Analytics &   │
│   Search        │
│   Available     │
└─────────────────┘
```

---

## 🔧 Troubleshooting

### ChromaDB Not Running

**Error:** "Failed to connect to ChromaDB"

**Solution:**

```bash
pnpm run docker:up
# Check status
docker ps
```

### Embedding Warnings

**Error:** "Cannot instantiate collection with DefaultEmbeddingFunction"

**Solution:**

```bash
# Reset ChromaDB database
pnpm run docker:reset
```

### API Key Issues

**Error:** "OPENAI_API_KEY is not configured"

**Solution:**

- Check your `.env` file exists
- Verify API key is correct
- Restart the dev server

### Image Upload Fails

**Error:** "Failed to process receipt"

**Possible causes:**

- Image format not supported (use JPG/PNG)
- Image too large (max ~10MB)
- API rate limit reached
- Network connection issue

---

## 📞 Support

For issues or questions:

- Check [SETUP.md](SETUP.md) for detailed configuration
- Review [CHROMADB.md](CHROMADB.md) for database issues
- See [LICENSE](LICENSE) for usage terms

---

## 🎓 Learning Resources

Want to understand how it works?

**Key Technologies:**

- **Next.js 15** - React framework
- **Vercel AI SDK** - AI integration toolkit
- **ChromaDB** - Vector database for embeddings
- **OpenAI GPT-4o** - Vision AI model
- **Anthropic Claude** - Alternative AI model
- **Zod** - Schema validation

**Concepts Demonstrated:**

- Multimodal AI (vision + text)
- Structured data extraction
- Vector embeddings
- Semantic search
- PDF text extraction
- Real-time analytics

---

## 🚀 What's Next?

After getting comfortable with the basics:

1. **Try Different Receipts**
   - Various stores and formats
   - Different languages
   - Handwritten receipts

2. **Upload Bank Statements**
   - Monthly credit card statements
   - Analyze spending patterns

3. **Use Semantic Search**
   - Find specific purchases
   - Track spending categories

4. **Export Data** (Coming soon)
   - CSV export
   - PDF reports
   - Budget tracking

---

**Happy Scanning! 📸💰📊**
