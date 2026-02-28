import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '@/sql/schema'

const isProduction = process.env.NODE_ENV === 'production'
const url = process.env.TURSO_DATABASE_URL || (isProduction ? '' : 'file:local.db')
const authToken = process.env.TURSO_AUTH_TOKEN

// Use dynamic requires to prevent Next.js from tracing and bundling native modules
// that are not needed as dependencies in all environments.
function createLibsqlClient () {
  if (!url) {
    throw new Error('Missing TURSO_DATABASE_URL in production environment')
  }

  if (url.startsWith('file:')) {
    // Native client for local development
    const { createClient } = require('@libsql/client')
    return createClient({ url })
  } else {
    // Web/HTTP client for Vercel/Production (no native dependencies)
    const { createClient } = require('@libsql/client/web')
    return createClient({ url, authToken })
  }
}

const client = createLibsqlClient()
export const db = drizzle(client, { schema })
