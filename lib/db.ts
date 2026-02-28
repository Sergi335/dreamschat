import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '@/sql/schema'

const isDevelopment = process.env.NODE_ENV === 'development'
const url = process.env.TURSO_DATABASE_URL || (isDevelopment ? 'file:local.db' : '')
const authToken = process.env.TURSO_AUTH_TOKEN

// Use dynamic requires to prevent Next.js from tracing and bundling native modules
// that are not needed as dependencies in all environments.
function createLibsqlClient () {
  if (!url) {
    throw new Error('Missing TURSO_DATABASE_URL in production environment')
  }

  if (url.startsWith('file:')) {
    if (!isDevelopment) {
      throw new Error('file: database URLs are only supported in local development')
    }

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
