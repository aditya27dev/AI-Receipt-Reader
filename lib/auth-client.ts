"use client";

/**
 * Better Auth browser client.
 * Import `authClient` to call auth methods and hooks from client components.
 */

import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
    baseURL:
        typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
});

export type { Session } from 'better-auth';
