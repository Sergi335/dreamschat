import { createConversation, getUserConversations } from '@/lib/database'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET () {
  try {
    const session = await auth()
    const { userId } = session
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const conversations = await getUserConversations(userId)

    return NextResponse.json({ conversations })
  } catch (error: unknown) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}

export async function POST (_request: NextRequest) {
  try {
    const session = await auth()
    const { userId } = session
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title } = await _request.json()
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const conversationId = await createConversation(userId, title)

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
