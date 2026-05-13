/**
 * Centralised AI model routing.
 * Single place to update model IDs when providers deprecate old versions.
 */

import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

const OPENAI_VISION_MODEL = 'gpt-4o' as const;
const ANTHROPIC_VISION_MODEL = 'claude-3-5-sonnet-20241022' as const;

export type ModelProvider = 'openai' | 'anthropic';

export function getVisionModel(provider: ModelProvider) {
    return provider === 'anthropic'
        ? anthropic(ANTHROPIC_VISION_MODEL)
        : openai(OPENAI_VISION_MODEL);
}
