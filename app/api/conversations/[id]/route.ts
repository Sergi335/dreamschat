import { addMessage, updateConversationTitle } from '@/lib/database'
import { createSupabaseClient } from '@/lib/supabase-server'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { getToken, userId } = session
    const token = await getToken()
    if (!userId || !token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    const supabase = createSupabaseClient(token)

    const { role, content } = await request.json()
    const params = await context.params
    const conversationId = params.id

    if (!role || !content) {
      return NextResponse.json(
        { error: 'Role and content are required' },
        { status: 400 }
      )
    }

    if (role !== 'user' && role !== 'assistant') {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    const messageId = await addMessage(supabase, conversationId, role, content)

    if (!messageId) {
      return NextResponse.json(
        { error: 'Failed to add message' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: messageId,
      role,
      content,
      timestamp: new Date()
    })
  } catch (error: unknown) {
    console.error('Error adding message:', error)
    return NextResponse.json(
      { error: 'Failed to add message' },
      { status: 500 }
    )
  }
}

export async function PATCH (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { getToken, userId } = session
    const token = await getToken()
    if (!userId || !token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    const supabase = createSupabaseClient(token)

    const { title } = await request.json()
    const params = await context.params
    const conversationId = params.id

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const success = await updateConversationTitle(supabase, conversationId, title)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update conversation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true
    })
  } catch (error: unknown) {
    console.error('Error updating conversation:', error)
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    )
  }
}

export async function DELETE (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { getToken, userId } = session
    const token = await getToken()
    if (!userId || !token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    const supabase = createSupabaseClient(token)

    const params = await context.params
    const conversationId = params.id

    // Verificar que la conversación pertenece al usuario antes de eliminarla
    const { data: conversation, error: fetchError } = await supabase
      .from('conversations')
      .select('user_id')
      .eq('id', conversationId)
      .single()

    if (fetchError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    if (conversation.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Eliminar la conversación (los mensajes se eliminarán automáticamente por CASCADE)
    const { error: deleteError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)

    if (deleteError) {
      console.error('Error deleting conversation:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete conversation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true
    })
  } catch (error: unknown) {
    console.error('Error deleting conversation:', error)
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    )
  }
}
