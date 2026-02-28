import { db } from '@/lib/db'
import { conversations } from '@/sql/schema'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { count, eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET () {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Test simple query using Drizzle
    const [result] = await db
      .select({ value: count() })
      .from(conversations)
      .where(eq(conversations.user_id, userId))

    return NextResponse.json({
      status: 'ok',
      userId,
      count: result.value,
      env: {
        url: process.env.TURSO_DATABASE_URL?.substring(0, 30) + '...',
        hasToken: !!process.env.TURSO_AUTH_TOKEN
      }
    })
  } catch (error: unknown) {
    console.error('Test error:', error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'Server error', details: message },
      { status: 500 }
    )
  }
}
