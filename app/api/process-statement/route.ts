import { NextRequest, NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { bankStatementSchema, bankStatementJsonSchema } from '@/lib/transaction-schemas';
import { saveTransactions } from '@/lib/db';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const model = formData.get('model') as string || 'openai';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF
    console.log('Extracting text from PDF...');
    const { extractText } = await import('unpdf');
    const { text: extractedText } = await extractText(new Uint8Array(buffer), { mergePages: true });

    if (!extractedText || extractedText.length < 50) {
      return NextResponse.json(
        { error: 'Could not extract text from PDF. Please ensure it is a valid bank statement.' },
        { status: 400 }
      );
    }

    console.log('Extracted text length:', extractedText.length);
    console.log('First 500 chars:', extractedText.substring(0, 500));

    const aiModel = model === 'anthropic'
      ? anthropic('claude-3-5-sonnet-20241022')
      : openai('gpt-4o');

    console.log(`Using ${model === 'anthropic' ? 'Anthropic Claude' : 'OpenAI GPT-4o'} for transaction extraction...`);

    // Use AI to parse and categorize transactions
    const result = await generateText({
      model: aiModel,
      output: Output.object({ schema: bankStatementSchema }),
      prompt: `You are analyzing a bank statement. Extract ALL transactions and respond with a JSON object that strictly conforms to the following JSON Schema:

${JSON.stringify(bankStatementJsonSchema, null, 2)}

Bank Statement Text:
${extractedText}

Instructions:
- Extract every transaction with: date (YYYY-MM-DD), description (merchant name), amount, and category
- For amounts: use positive numbers for spending/debits, negative for refunds/credits
- Currency: usually GBP unless stated otherwise in the statement
- Include statementPeriod start/end dates if shown, otherwise use empty strings
- Include last 4 digits of accountNumber if shown, otherwise use empty string
- Skip balance summary lines — only include actual transactions
- Be thorough and extract EVERY transaction you can find`,
    });

    const statement = result.output;

    console.log(`Extracted ${statement.transactions.length} transactions`);

    if (statement.transactions.length === 0) {
      return NextResponse.json(
        { error: 'No transactions found in the statement. Please check if the PDF is readable.' },
        { status: 400 }
      );
    }

    // Save transactions to ChromaDB
    const statementId = `stmt_${Date.now()}`;
    await saveTransactions(statement.transactions, statementId);

    return NextResponse.json({
      success: true,
      transactions: statement.transactions,
      count: statement.transactions.length,
      statementPeriod: statement.statementPeriod,
    });
  } catch (error) {
    console.error('Error processing bank statement:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process bank statement' },
      { status: 500 }
    );
  }
}
