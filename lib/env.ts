/**
 * Environment Variable Validation
 * Validates all required env vars at import time — fails fast with clear errors.
 */

import { z } from 'zod';

const envSchema = z.object({
    OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
    ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
    CHROMA_URL: z.string().url().optional().default('http://localhost:8000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    for (const [field, errors] of Object.entries(parsed.error.flatten().fieldErrors)) {
        console.error(`  ${field}: ${(errors as string[]).join(', ')}`);
    }
    throw new Error(
        'Missing or invalid environment variables. Check server logs for details.'
    );
}

export const env = parsed.data;
