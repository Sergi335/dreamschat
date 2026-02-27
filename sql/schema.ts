import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  user_id: text('user_id').notNull(),
  title: text('title').notNull(),
  updated_at: text('updated_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`)
})

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  conversation_id: text('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  role: text('role', { enum: ['user', 'assistant'] }).notNull(),
  timestamp: text('timestamp')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`)
})

export const guestSessions = sqliteTable('guest_sessions', {
  fingerprint: text('fingerprint').primaryKey().notNull(),
  conversation_count: integer('conversation_count').notNull().default(0),
  message_count: integer('message_count').notNull().default(0),
  last_activity: text('last_activity')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`)
})
