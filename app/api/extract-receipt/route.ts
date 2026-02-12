import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { receiptSchema } from '@/lib/schemas';
import { saveReceipt, generateImageHash, findReceiptByImageHash } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Use Node.js runtime for ChromaDB compatibility
export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File;
    const imageDataUrl = formData.get('imageDataUrl') as string || undefined;
    const modelProvider = formData.get('model') as string || 'openai'; // 'openai' or 'anthropic'
    const forceReprocess = formData.get('forceReprocess') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');
    const mimeType = file.type;

    // Generate image hash for duplicate detection
    const imageHash = generateImageHash(buffer);
    
    // Check if this receipt has been uploaded before (unless forced to reprocess)
    if (!forceReprocess) {
      const existingReceipt = await findReceiptByImageHash(imageHash);
      if (existingReceipt) {
        return NextResponse.json({
          success: true,
          duplicate: true,
          receipt: existingReceipt,
          message: 'This receipt has already been uploaded. Use the existing data or force reprocess to extract again.',
        });
      }
    }

    // Choose model based on provider
    const model = modelProvider === 'anthropic'
      ? anthropic('claude-3-5-sonnet-20241022')
      : openai('gpt-4o');

    const result = await generateObject({
      model,
      schema: receiptSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this receipt image and extract all the information in a structured format. 
              
              Instructions:
              - Extract the merchant name, date, and all line items
              - Categorize each item appropriately
              - Calculate totals accurately
              - Use ISO date format (YYYY-MM-DD)
              - Be as accurate as possible with numbers
              - DETECT CURRENCY from the receipt (look for £, $, €, ¥ symbols):
                * £ = GBP (British Pound)
                * $ = USD (US Dollar)
                * € = EUR (Euro)
                * ¥ = JPY (Japanese Yen)
                * Use the appropriate ISO currency code based on the symbol found
              - ALL fields must be filled:
                * If merchantAddress is not visible, use empty string ""
                * If time is not visible, use empty string ""
                * If quantity is not shown, use 1
                * If unitPrice is not shown, use 0
                * If subtotal or tax are not shown, use 0
                * If paymentMethod is not shown, use "other"
              
              If any information is unclear or missing, make your best reasonable guess based on context.`,
            },
            {
              type: 'image',
              image: `data:${mimeType};base64,${base64Image}`,
            },
          ],
        },
      ],
    });

    const receipt = result.object;
    console.log('Extracted receipt:', receipt);

    // Save to database
    const savedReceipt = await saveReceipt(receipt, imageDataUrl, imageHash);

    return NextResponse.json({
      success: true,
      receipt: savedReceipt,
    });
  } catch (error) {
    console.error('Receipt extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to process receipt', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
