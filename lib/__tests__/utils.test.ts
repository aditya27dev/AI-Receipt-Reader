import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn', () => {
    it('joins class names', () => {
        expect(cn('a', 'b')).toBe('a b');
    });

    it('handles conditional classes', () => {
        expect(cn('base', false && 'omit', 'keep')).toBe('base keep');
    });

    it('merges conflicting Tailwind classes (last wins)', () => {
        const result = cn('p-2', 'p-4');
        expect(result).toBe('p-4');
    });

    it('merges conflicting text colors', () => {
        const result = cn('text-red-500', 'text-blue-500');
        expect(result).toBe('text-blue-500');
    });

    it('handles undefined and null gracefully', () => {
        expect(cn('a', undefined, null, 'b')).toBe('a b');
    });

    it('handles empty input', () => {
        expect(cn()).toBe('');
    });

    it('handles object syntax', () => {
        expect(cn({ 'text-white': true, 'text-black': false })).toBe('text-white');
    });
});
