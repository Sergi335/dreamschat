import { createSupabaseClient, createSupabaseGuestClient } from '@/lib/supabase-server'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST (request: NextRequest) {
  try {
    const authSession = await auth()
    const { getToken } = authSession
    const token = await getToken()

    // if (!userId || !token) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const supabase = token
      ? createSupabaseClient(token)
      : createSupabaseGuestClient()

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
    const { data: session, error: fetchError } = await supabase
      .from('guest_sessions')
      .select('*')
      .eq('fingerprint', fingerprint)
      .single()
    console.log('🚀 ~ POST ~ fetchError:', fetchError)

    if (fetchError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Incrementar el contador apropiado
    const field = type === 'conversation' ? 'conversation_count' : 'message_count'

    const { data: updated, error: updateError } = await supabase
      .from('guest_sessions')
      .update({
        [field]: session[field] + 1,
        last_activity: new Date().toISOString()
      })
      .eq('fingerprint', fingerprint)
      .select()
      .single()

    if (updateError) throw updateError

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
