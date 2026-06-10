"use client";

/**
 * Better Auth browser client.
 * Import `authClient` to call auth methods and hooks from client components.
 */

import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
    baseURL:
        process.env.NEXT_PUBLIC_APP_URL ??
        (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
});

export type { Session } from 'better-auth';
