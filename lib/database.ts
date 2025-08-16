import { supabase } from './supabase'

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
}
interface DBConversation {
  id: string
  user_id: string
  title: string
  updated_at: string
}

interface DBMessage {
  id: string
  conversation_id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: string
}

// Convertir de formato DB a formato de la aplicación
const convertDbToAppConversation = (dbConversation: DBConversation, dbMessages: DBMessage[]): Conversation => {
  return {
    id: dbConversation.id,
    title: dbConversation.title,
    lastUpdated: new Date(dbConversation.updated_at),
    messages: dbMessages.map(msg => ({
      id: msg.id,
      content: msg.content,
      role: msg.role,
      timestamp: new Date(msg.timestamp)
    }))
  }
}

// Obtener todas las conversaciones del usuario
export const getUserConversations = async (userId: string): Promise<Conversation[]> => {
  try {
    // Obtener conversaciones
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (convError) throw convError

    if (!conversations || conversations.length === 0) {
      return []
    }

    // Obtener todos los mensajes para estas conversaciones
    const conversationIds = conversations.map(c => c.id)
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .in('conversation_id', conversationIds)
      .order('timestamp', { ascending: true })

    if (msgError) throw msgError

    // Agrupar mensajes por conversación
    const messagesByConversation = (messages || []).reduce((acc, msg) => {
      if (!acc[msg.conversation_id]) {
        acc[msg.conversation_id] = []
      }
      acc[msg.conversation_id].push(msg)
      return acc
    }, {} as Record<string, DBMessage[]>)

    // Combinar conversaciones con sus mensajes
    return conversations.map(conv =>
      convertDbToAppConversation(conv, messagesByConversation[conv.id] || [])
    )
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return []
  }
}

// Crear una nueva conversación
export const createConversation = async (userId: string, title: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        title,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data.id
  } catch (error) {
    console.error('Error creating conversation:', error)
    return null
  }
}

// Actualizar el título de una conversación
export const updateConversationTitle = async (conversationId: string, title: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('conversations')
      .update({
        title,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)

    if (error) throw error
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
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        timestamp: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // Actualizar el timestamp de la conversación
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)

    return data.id
  } catch (error) {
    console.error('Error adding message:', error)
    return null
  }
}

// Eliminar una conversación y todos sus mensajes
export const deleteConversation = async (conversationId: string): Promise<boolean> => {
  try {
    // Primero eliminar los mensajes
    const { error: msgError } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId)

    if (msgError) throw msgError

    // Luego eliminar la conversación
    const { error: convError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)

    if (convError) throw convError
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
