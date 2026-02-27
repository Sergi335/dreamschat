import { db } from '@/lib/db'
import { guestSessions } from '@/sql/schema'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export async function POST (request: NextRequest) {
  try {
    const { fingerprint } = await request.json()
    console.log('🚀 ~ POST ~ fingerprint:', fingerprint)

    if (!fingerprint) {
      return NextResponse.json(
        { error: 'Fingerprint is required' },
        { status: 400 }
      )
    }

    // Buscar sesión existente
    const [existingSession] = await db
      .select()
      .from(guestSessions)
      .where(eq(guestSessions.fingerprint, fingerprint))
      .limit(1)

    // Si existe, retornar sesión
    if (existingSession) {
      return NextResponse.json({
        fingerprint: existingSession.fingerprint,
        conversationCount: existingSession.conversation_count,
        messageCount: existingSession.message_count,
        canCreateConversation: existingSession.conversation_count < 1,
        canSendMessage: existingSession.message_count < 3,
        lastActivity: existingSession.last_activity
      })
    }

    // Si no existe, crear nueva sesión
    const [newSession] = await db
      .insert(guestSessions)
      .values({
        fingerprint,
        conversation_count: 0,
        message_count: 0
      })
      .returning()

    console.log('🚀 ~ POST ~ newSession:', newSession)

    return NextResponse.json({
      fingerprint: newSession.fingerprint,
      conversationCount: 0,
      messageCount: 0,
      canCreateConversation: true,
      canSendMessage: true,
      lastActivity: newSession.last_activity
    })
  } catch (error) {
    console.error('Error in /api/guest/session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
