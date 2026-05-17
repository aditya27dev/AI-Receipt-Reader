/**
 * Centralised AI model routing.
 * Single place to update model IDs when providers deprecate old versions.
 */

import { openai, createOpenAI } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

const OPENAI_VISION_MODEL = 'gpt-4o' as const;
const ANTHROPIC_VISION_MODEL = 'claude-3-5-sonnet-20241022' as const;

export type ModelProvider = 'openai' | 'anthropic';

export function getVisionModel(provider: ModelProvider, apiKey?: string) {
    if (provider === 'anthropic') {
        return anthropic(ANTHROPIC_VISION_MODEL);
    }
    if (apiKey) {
        return createOpenAI({ apiKey })(OPENAI_VISION_MODEL);
    }
    return openai(OPENAI_VISION_MODEL);
}
