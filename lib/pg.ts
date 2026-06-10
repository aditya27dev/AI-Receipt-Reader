/**
 * PostgreSQL connection — lazy singleton.
 * The client is only created on first use, so the build succeeds without
 * DATABASE_URL and the error is deferred to the first runtime DB call.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './pg-schema';

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
    if (!_db) {
        const url = process.env.DATABASE_URL;
        if (!url) throw new Error('DATABASE_URL environment variable is not set');

        const client = postgres(url, {
            max: 1, // keep pool small for serverless (Vercel)
            idle_timeout: 20,
            connect_timeout: 10,
            // ssl: 'require' is handled automatically when the URL contains sslmode=require
        });

        _db = drizzle(client, { schema });
    }
    return _db;
}

export type AppDb = ReturnType<typeof getDb>;
