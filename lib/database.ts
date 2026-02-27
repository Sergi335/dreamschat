import { db } from './db'
import { conversations, messages } from '@/sql/schema'
import { eq, desc, asc, inArray } from 'drizzle-orm'

export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  lastUpdated: Date
}

// Convertir de formato DB a formato de la aplicación
const convertDbToAppConversation = (
  dbConversation: typeof conversations.$inferSelect,
  dbMessages: (typeof messages.$inferSelect)[]
): Conversation => {
  return {
    id: dbConversation.id,
    title: dbConversation.title,
    lastUpdated: new Date(dbConversation.updated_at),
    messages: dbMessages.map(msg => ({
      id: msg.id,
      content: msg.content,
      // Se asegura el tipado de enum
      role: msg.role as 'user' | 'assistant',
      timestamp: new Date(msg.timestamp)
    }))
  }
}

// Obtener todas las conversaciones del usuario
export const getUserConversations = async (userId: string): Promise<Conversation[]> => {
  try {
    // Obtener conversaciones
    const userConversations = await db
      .select()
      .from(conversations)
      .where(eq(conversations.user_id, userId))
      .orderBy(desc(conversations.updated_at))

    if (!userConversations || userConversations.length === 0) {
      return []
    }

    // Obtener todos los mensajes para estas conversaciones
    const conversationIds = userConversations.map(c => c.id)
    const allMessages = await db
      .select()
      .from(messages)
      .where(inArray(messages.conversation_id, conversationIds))
      .orderBy(asc(messages.timestamp))

    // Agrupar mensajes por conversación
    const messagesByConversation = allMessages.reduce((acc, msg) => {
      if (!acc[msg.conversation_id]) {
        acc[msg.conversation_id] = []
      }
      acc[msg.conversation_id].push(msg)
      return acc
    }, {} as Record<string, typeof messages.$inferSelect[]>)

    // Combinar conversaciones con sus mensajes
    return userConversations.map(conv =>
      convertDbToAppConversation(conv, messagesByConversation[conv.id] || [])
    )
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return []
  }
}

// Crear una nueva conversación
export const createConversation = async (
  userId: string,
  title: string
): Promise<string | null> => {
  try {
    const [newConversation] = await db
      .insert(conversations)
      .values({
        user_id: userId,
        title,
        updated_at: new Date().toISOString()
      })
      .returning({ id: conversations.id })

    return newConversation.id
  } catch (error) {
    console.error('Error creating conversation:', error)
    return null
  }
}

// Actualizar el título de una conversación
export const updateConversationTitle = async (
  conversationId: string,
  title: string
): Promise<boolean> => {
  try {
    await db
      .update(conversations)
      .set({
        title,
        updated_at: new Date().toISOString()
      })
      .where(eq(conversations.id, conversationId))

    return true
  } catch (error) {
    console.error('Error updating conversation title:', error)
    return false
  }
}

// Agregar un mensaje a una conversación
export const addMessage = async (
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<string | null> => {
  try {
    const now = new Date().toISOString()
    let messageId: string | null = null

    await db.transaction(async (tx) => {
      const [newMessage] = await tx
        .insert(messages)
        .values({
          conversation_id: conversationId,
          role,
          content,
          timestamp: now
        })
        .returning({ id: messages.id })

      messageId = newMessage.id

      // Actualizar el timestamp de la conversación
      await tx
        .update(conversations)
        .set({ updated_at: now })
        .where(eq(conversations.id, conversationId))
    })

    return messageId
  } catch (error) {
    console.error('Error adding message:', error)
    return null
  }
}

// Eliminar una conversación y todos sus mensajes
export const deleteConversation = async (conversationId: string): Promise<boolean> => {
  try {
    // Al haber definido onDelete: cascade en schema.ts para messages,
    // eliminar la conversación eliminará automáticamente los mensajes.
    // También podemos forzar Borrado de mensajes por si SQLite local no tiene activado el PRAGMA foreign_keys
    await db.transaction(async (tx) => {
      await tx.delete(messages).where(eq(messages.conversation_id, conversationId))
      await tx.delete(conversations).where(eq(conversations.id, conversationId))
    })

    return true
  } catch (error) {
    console.error('Error deleting conversation:', error)
    return false
  }
}

// Migrar conversaciones locales a la base de datos
export const migrateLocalConversations = async (
  userId: string,
  localConversations: Conversation[]
): Promise<boolean> => {
  try {
    for (const conv of localConversations) {
      // Crear conversación
      const conversationId = await createConversation(userId, conv.title)
      if (!conversationId) continue

      // Agregar mensajes
      for (const msg of conv.messages) {
        await addMessage(conversationId, msg.role, msg.content)
      }
    }
    return true
  } catch (error) {
    console.error('Error migrating conversations:', error)
    return false
  }
}
