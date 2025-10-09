import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST (request: NextRequest) {
  try {
    const { fingerprint } = await request.json()

    if (!fingerprint) {
      return NextResponse.json(
        { error: 'Fingerprint is required' },
        { status: 400 }
      )
    }

    // Buscar sesión existente primero
    const { data: existingSession, error: fetchError } = await supabase
      .from('guest_sessions')
      .select('*')
      .eq('fingerprint', fingerprint)
      .single()

    // Si encontramos una sesión, retornarla
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

    // Si no existe (error PGRST116 significa "no encontrado"), intentar crear
    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }

    // Intentar crear nueva sesión
    const { data: newSession, error: insertError } = await supabase
      .from('guest_sessions')
      .insert({
        fingerprint,
        conversation_count: 0,
        message_count: 0
      })
      .select()
      .single()

    // Si la inserción falló por duplicado, intentar obtener la sesión de nuevo
    // (esto puede pasar si dos requests simultáneas pasaron el check de existencia)
    if (insertError && insertError.code === '23505') {
      const { data: existingAfterRace, error: reFetchError } = await supabase
        .from('guest_sessions')
        .select('*')
        .eq('fingerprint', fingerprint)
        .single()

      if (reFetchError) throw reFetchError

      return NextResponse.json({
        fingerprint: existingAfterRace.fingerprint,
        conversationCount: existingAfterRace.conversation_count,
        messageCount: existingAfterRace.message_count,
        canCreateConversation: existingAfterRace.conversation_count < 1,
        canSendMessage: existingAfterRace.message_count < 3,
        lastActivity: existingAfterRace.last_activity
      })
    }

    if (insertError) throw insertError

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
