import { createConversation, getUserConversations } from '@/lib/database'
import { createSupabaseClient } from '@/lib/supabase-server'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET () {
  try {
    const session = await auth()
    const { getToken, userId } = session
    const token = await getToken()
    if (!userId || !token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createSupabaseClient(token)
    const conversations = await getUserConversations(supabase, userId)

    return NextResponse.json({ conversations })
  } catch (error: unknown) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}

export async function POST (_request: NextRequest) {
  try {
    const session = await auth()
    const { getToken, userId } = session
    const token = await getToken()
    if (!userId || !token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title } = await _request.json()
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const supabase = createSupabaseClient(token)
    const conversationId = await createConversation(supabase, userId, title)

    if (!conversationId) {
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
    }

    return NextResponse.json({
      id: conversationId,
      title,
      messages: [],
      lastUpdated: new Date()
    })
  } catch (error: unknown) {
    console.error('Error creating conversation:', error)
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
  }
}
