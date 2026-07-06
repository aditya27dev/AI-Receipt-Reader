/**
 * Environment Variable Validation
 * Validates all required env vars at import time — fails fast with clear errors.
 */

import { z } from 'zod';

// In VERCEL_MODE the user supplies their own OpenAI key at runtime — env keys are not required.
const isVercelMode = process.env.NEXT_PUBLIC_VERCEL_MODE === 'true';
// When DATABASE_URL is set, auth is enabled and a strong secret is required.
const isPgEnabled = !!process.env.DATABASE_URL;

const optionalKey = z.string().optional();
const requiredKey = (name: string) => z.string().min(1, `${name} is required`);

const envSchema = z.object({
    OPENAI_API_KEY: isVercelMode ? optionalKey : requiredKey('OPENAI_API_KEY'),
    ANTHROPIC_API_KEY: isVercelMode ? optionalKey : requiredKey('ANTHROPIC_API_KEY'),
    CHROMA_URL: z.string().url().optional().default('http://localhost:8000'),
    DATABASE_URL: z.string().optional(),
    BETTER_AUTH_SECRET: isPgEnabled
        ? z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters when DATABASE_URL is set')
        : z.string().optional(),
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
