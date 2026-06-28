/**
 * Better Auth server configuration.
 * Docs: https://www.better-auth.com/docs/installation
 *
 * Uses a lazy singleton to avoid calling getDb() at module evaluation time,
 * which would fail at build time when DATABASE_URL is not set.
 */

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import * as schema from './pg-schema';

function createAuth() {
    // Lazy require — defers getDb() call until first request.
    // This prevents the "DATABASE_URL not set" error at build time.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getDb } = require('./pg') as typeof import('./pg');
    return betterAuth({
        secret: process.env.BETTER_AUTH_SECRET!,
        baseURL:
            process.env.DEV_ORIGIN ??
            'http://localhost:3000',

        trustedOrigins: [
            'http://localhost:3000',
            ...(process.env.DEV_ORIGIN ? [process.env.DEV_ORIGIN] : []),
        ],

        database: drizzleAdapter(getDb(), {
            provider: 'pg',
            schema: {
                user: schema.user,
                session: schema.session,
                account: schema.account,
                verification: schema.verification,
            },
        }),

        emailAndPassword: {
            enabled: true,
            minPasswordLength: 8,
        },
    });
}

type AuthInstance = ReturnType<typeof createAuth>;
let _auth: AuthInstance | undefined;

export function getAuth(): AuthInstance {
    if (!_auth) _auth = createAuth();
    return _auth;
}
