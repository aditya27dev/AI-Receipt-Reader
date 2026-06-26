import { streamObject } from 'ai';
import { receiptSchema } from '@/lib/schemas';
import { saveReceipt } from '@/lib/db';
import { getVisionModel } from '@/lib/ai';
import { rateLimit } from '@/lib/ratelimit';
import { getSessionUserId } from '@/lib/session';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif'];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const rl = await rateLimit(ip, { limit: 20, windowMs: 60_000 });
  if (!rl.success) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: {
    image?: string;
    mimeType?: string;
    model?: string;
    imageDataUrl?: string;
    imageHash?: string;
  };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { image, mimeType, model: modelProvider = 'openai', imageDataUrl, imageHash } = body;

  if (!image || !mimeType) {
    return new Response(JSON.stringify({ error: 'Missing image or mimeType' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return new Response(JSON.stringify({ error: 'Unsupported image type' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if ((image.length * 3) / 4 > MAX_IMAGE_BYTES) {
    return new Response(JSON.stringify({ error: 'Image exceeds 10 MB limit' }), {
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
  const rawUserKey = req.headers.get('x-openai-key') ?? undefined;
  const userApiKey = rawUserKey && /^sk-[A-Za-z0-9_\-]{20,}$/.test(rawUserKey) ? rawUserKey : undefined;

  if (process.env.NEXT_PUBLIC_VERCEL_MODE === 'true' && modelProvider === 'openai' && !userApiKey) {
    return new Response(JSON.stringify({ error: 'OpenAI API key required. Please enter your key in the banner.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const model = getVisionModel(modelProvider as 'openai' | 'anthropic', userApiKey);
    const userId = await getSessionUserId(req);

    const result = streamObject({
      model,
      schema: receiptSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this receipt image and extract all information into the provided schema.

Instructions:
- Use ISO date format (YYYY-MM-DD) for the date field
- DETECT CURRENCY from symbols: £=GBP, $=USD, €=EUR, ¥=JPY
- Use empty string "" for any text field not visible
- Use 0 for any numeric field not visible
- Use 1 for quantity and 0 for unitPrice when not shown
- Use "other" for paymentMethod when not shown`,
            },
            {
              type: 'image',
              image: `data:${mimeType};base64,${image}`,
            },
          ],
        },
      ],
      onFinish: ({ object }) => {
        if (object) {
          saveReceipt(object, imageDataUrl, imageHash, userId).catch(console.error);
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Receipt extraction error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process receipt' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
