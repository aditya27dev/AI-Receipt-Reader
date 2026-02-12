# 🚀 Quick Setup Guide

## Step-by-Step Setup (5 minutes)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Get Your API Keys

#### Required: OpenAI (for GPT-4o vision)
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy it (starts with `sk-`)

⚠️ **Note**: OpenAI is only needed for vision (receipt extraction). Embeddings are now handled by **Ollama (free)**!

#### Optional: Anthropic (Claude 3.5 Sonnet)
1. Go to https://console.anthropic.com/
2. Create an API key
3. Copy it (starts with `sk-ant-`)

### 3. Set Up ChromaDB and Ollama with Docker

ChromaDB is a vector database that stores receipt embeddings for semantic search.
Ollama provides free local embeddings using the `nomic-embed-text` model.

#### Install Docker
If you don't have Docker installed:
- **Mac**: Download [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)
- **Linux**: Install via package manager: `sudo apt-get install docker-compose`
- **Windows**: Download [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)

#### Quick Setup (Recommended)

```bash
# Automated setup - starts services and downloads model
pnpm run setup
```

This will:
- Start ChromaDB and Ollama containers
- Pull the `nomic-embed-text` embedding model (~275MB)
- Verify everything is working

#### Manual Setup

If you prefer manual setup:

```bash
# Start ChromaDB and Ollama
pnpm run docker:up

# Pull the embedding model (first time only)
pnpm run ollama:pull

# Verify models are installed
pnpm run ollama:models
```

Verify services are running:
```bash
# ChromaDB health check
curl http://localhost:8000/api/v1/heartbeat

# Ollama health check
curl http://localhost:11434/api/tags
```

### 4. Create Environment File

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` and add your keys:

```env
# Required: OpenAI for GPT-4o vision
OPENAI_API_KEY=sk-proj-xxx...

# Optional: Claude for alternative extraction
ANTHROPIC_API_KEY=sk-ant-xxx...

# Service URLs (defaults for Docker Compose)
CHROMA_URL=http://localhost:8000
OLLAMA_BASE_URL=http://localhost:11434
```

### 5. Start Development Server

```bash
pnpm dev
```

### 6. Initialize ChromaDB Collection

Open your browser to http://localhost:3000 and then visit:

```
http://localhost:3000/api/init-db
```

Or use curl:

```bash
curl -X POST http://localhost:3000/api/init-db
```

You should see:
```json
{"success": true, "message": "Database initialized"}
```

### 7. Upload a Receipt!

1. Go back to http://localhost:3000
2. Take a photo of any receipt with your phone (or use an existing image)
3. Click the upload area
4. Select your receipt image
5. Watch the AI extract the data!
6. Click the "Analytics" tab to see your spending summary

## Troubleshooting

### "No API key found"
- Make sure your `.env` file is in the root directory
- Restart the dev server after adding environment variables
- OpenAI API key is **required** for embeddings

### "Cannot connect to ChromaDB"
- Ensure Docker is running: `docker ps`
- Verify ChromaDB container is running: `docker-compose ps`
- Check ChromaDB logs: `docker-compose logs chromadb`
- Restart ChromaDB: `docker-compose restart`

### "Failed to process receipt"
- Ensure your image is clear and readable
- Make sure you have credits on your AI provider account
- Check the browser console for detailed error messages

### Receipt not extracted correctly
- Try a different AI model (switch between GPT-4o and Claude)
- Use a higher quality image
- Make sure the receipt text is legible

## What to Try

1. **Upload different types of receipts**: Grocery stores, restaurants, gas stations
2. **Try semantic search**: Search for receipts using natural language:
   ```bash
   curl "http://localhost:3000/api/search?q=coffee shops"
   curl "http://localhost:3000/api/search?q=groceries"
   ```
5. **Inspect the code**: See how `generateObject()` works with Zod schemas
6. **Customize categories**: Edit the schema in `lib/schemas.ts`

## Managing ChromaDB

```bash
# Stop ChromaDB
docker-compose down

# Start ChromaDB
docker-compose up -d

# View ChromaDB logs
docker-compose logs -f chromadb

# Reset ChromaDB (delete all data)
docker-compose down -v
docker-compose up -d
``pending breakdown
4. **Inspect the code**: See how `generateObject()` works with Zod schemas
5. **Customize categories**: Edit the schema in `lib/schemas.ts`

## Next Steps

- Deploy to Vercel (see README.md)
- Add authentication
- Build mobile app
- Export reports
- Set spending budgets

Enjoy building! 🎉
