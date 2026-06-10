import { NextRequest } from 'next/server';
import { streamObject } from 'ai';
import { bankStatementSchema } from '@/lib/transaction-schemas';
import { saveTransactions } from '@/lib/db';
import { getVisionModel } from '@/lib/ai';
import { rateLimit } from '@/lib/ratelimit';
import { getSessionUserId } from '@/lib/session';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_PDF_BYTES = 20 * 1024 * 1024; // 20 MB base64-encoded

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const rl = await rateLimit(ip, { limit: 20, windowMs: 60_000 });
  if (!rl.success) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { file?: string; model?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { file: fileBase64, model: modelProvider = 'openai' } = body;

  if (!fileBase64) {
    return new Response(JSON.stringify({ error: 'Missing file (base64)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (fileBase64.length > MAX_PDF_BYTES) {
    return new Response(JSON.stringify({ error: 'PDF exceeds 20 MB limit' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const allowedProviders = ['openai', 'anthropic'] as const;
  if (!allowedProviders.includes(modelProvider as 'openai' | 'anthropic')) {
    return new Response(JSON.stringify({ error: 'Invalid model provider' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // BYOK: accept user-supplied OpenAI key from header (VERCEL_MODE)
  const rawUserKey = request.headers.get('x-openai-key') ?? undefined;
  const userApiKey = rawUserKey && /^sk-[A-Za-z0-9_\-]{20,}$/.test(rawUserKey) ? rawUserKey : undefined;

  if (process.env.NEXT_PUBLIC_VERCEL_MODE === 'true' && modelProvider === 'openai' && !userApiKey) {
    return new Response(JSON.stringify({ error: 'OpenAI API key required. Please enter your key in the banner.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const buffer = Buffer.from(fileBase64, 'base64');

    const { extractText } = await import('unpdf');
    const { text: extractedText } = await extractText(new Uint8Array(buffer), { mergePages: true });

    if (!extractedText || extractedText.length < 50) {
      return new Response(JSON.stringify({ error: 'Could not extract text from PDF' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const model = getVisionModel(modelProvider as 'openai' | 'anthropic', userApiKey);
    const statementId = `stmt_${Date.now()}`;

    const result = streamObject({
      model,
      schema: bankStatementSchema,
      prompt: `You are analyzing a bank statement. Extract ALL transactions.

Bank Statement Text:
${extractedText}

Instructions:
- Extract every transaction with: date (YYYY-MM-DD), description, amount, and category
- Positive amounts = spending/debits, negative = refunds/credits
- Currency: GBP unless stated otherwise
- Skip balance summary lines — only include actual transactions`,
      onFinish: ({ object }) => {
        if (object?.transactions?.length) {
          getSessionUserId(request).then(userId =>
            saveTransactions(object.transactions, statementId, userId)
          ).catch(console.error);
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Error processing bank statement:', error);
    return new Response(JSON.stringify({ error: 'Failed to process bank statement' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
