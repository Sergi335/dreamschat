import { db } from '@/lib/db'
import { guestSessions } from '@/sql/schema'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export async function POST (request: NextRequest) {
  try {
    const { fingerprint, type } = await request.json()

    if (!fingerprint || !type) {
      return NextResponse.json(
        { error: 'Fingerprint and type are required' },
        { status: 400 }
      )
    }

    if (!['conversation', 'message'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be "conversation" or "message"' },
        { status: 400 }
      )
    }

    // Verificar que la sesión existe
    const [session] = await db
      .select()
      .from(guestSessions)
      .where(eq(guestSessions.fingerprint, fingerprint))
      .limit(1)

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Incrementar el contador apropiado
    const field = type === 'conversation' ? 'conversation_count' : 'message_count'

    const [updated] = await db
      .update(guestSessions)
      .set({
        [field]: session[field] + 1,
        last_activity: new Date().toISOString()
      })
      .where(eq(guestSessions.fingerprint, fingerprint))
      .returning()

    return NextResponse.json({
      fingerprint: updated.fingerprint,
      conversationCount: updated.conversation_count,
      messageCount: updated.message_count,
      canCreateConversation: updated.conversation_count < 1,
      canSendMessage: updated.message_count < 3,
      lastActivity: updated.last_activity
    })
  } catch (error) {
    console.error('Error in /api/guest/increment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
