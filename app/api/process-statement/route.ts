import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { bankStatementSchema } from '@/lib/transaction-schemas';
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
    // Dynamic import for pdf-parse which exports PDFParse as a named export
    const { PDFParse } = await import('pdf-parse');
    const pdfParser = new PDFParse({ data: buffer });
    const result = await pdfParser.getText();
    const extractedText = result.text;

    if (!extractedText || extractedText.length < 50) {
      return NextResponse.json(
        { error: 'Could not extract text from PDF. Please ensure it is a valid bank statement.' },
        { status: 400 }
      );
    }

    console.log('Extracted text length:', extractedText.length);
    console.log('First 500 chars:', extractedText.substring(0, 500));

    // Use AI to parse and categorize transactions
    let statement;
    
    if (model === 'anthropic') {
      console.log('Using Anthropic Claude for transaction extraction...');
      
      const result = await generateObject({
        model: anthropic('claude-3-5-sonnet-20241022'),
        schema: bankStatementSchema,
        prompt: `You are analyzing a bank statement from Virgin Money credit card. 
        
Extract ALL transactions from this statement and categorize each one appropriately.

Bank Statement Text:
${extractedText}

Instructions:
1. Extract every transaction with: date, description (merchant name), amount, and category
2. For amounts: use positive numbers for spending/debits, negative for refunds/credits
3. Categories: groceries, dining, transportation, entertainment, utilities, healthcare, shopping, travel, bills, transfer, income, other
4. Date format: YYYY-MM-DD
5. Currency: Usually GBP for Virgin Money unless stated otherwise
6. Include statement period (start/end dates) if available
7. Skip account balance lines, only include actual transactions

Be thorough and extract EVERY transaction you can find.`,
      });

      statement = result.object;
    } else {
      // OpenAI (default)
      console.log('Using OpenAI GPT-4o for transaction extraction...');
      
      const result = await generateObject({
        model: openai('gpt-4o'),
        schema: bankStatementSchema,
        prompt: `You are analyzing a bank statement from Virgin Money credit card. 
        
Extract ALL transactions from this statement and categorize each one appropriately.

Bank Statement Text:
${extractedText}

Instructions:
1. Extract every transaction with: date, description (merchant name), amount, and category
2. For amounts: use positive numbers for spending/debits, negative for refunds/credits
3. Categories: groceries, dining, transportation, entertainment, utilities, healthcare, shopping, travel, bills, transfer, income, other
4. Date format: YYYY-MM-DD
5. Currency: Usually GBP for Virgin Money unless stated otherwise
6. Include statement period (start/end dates) if available
7. Skip account balance lines, only include actual transactions

Be thorough and extract EVERY transaction you can find.`,
      });

      statement = result.object;
    }

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
