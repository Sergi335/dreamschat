import { Conversation, Message } from '@/lib/database'
import { useUser } from '@clerk/nextjs'
import React, { useCallback, useEffect, useState } from 'react'

export type UseConversationsReturn = {
  conversations: Conversation[]
  activeConversationId: string | null
  setActiveConversationId: React.Dispatch<React.SetStateAction<string | null>>
  createConversation: (title?: string) => Promise<string | null>
  updateConversationTitle: (conversationId: string, title: string) => Promise<void>
  deleteConversation: (conversationId: string) => Promise<void>
  addMessage: (conversationId: string, role: 'user' | 'assistant', content: string) => Promise<void>
  isLoading: boolean
  error: string | null
}

type LocalMessage = Omit<Message, 'timestamp'> & { timestamp: string }
type LocalConversation = Omit<Conversation, 'lastUpdated' | 'messages'> & {
  lastUpdated: string
  messages: LocalMessage[]
}

export const useConversations = (): UseConversationsReturn => {
  const { user, isLoaded } = useUser()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar conversaciones del servidor
  const loadConversations = useCallback(async () => {
    if (!user) {
      setConversations([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/conversations')

      if (!response.ok) {
        throw new Error('Failed to fetch conversations')
      }

      const data: { conversations: Conversation[] } = await response.json()
      // Ordenar conversaciones por lastUpdated (más recientes primero)
      const sortedConversations = (data.conversations || []).sort(
        (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      )
      setConversations(sortedConversations)
      setError(null)
    } catch (err) {
      const errorObj = err as Error
      console.error('Error loading conversations:', errorObj)
      setError(errorObj.message)

      // Fallback a localStorage si falla la DB
      const localConversations = localStorage.getItem('dream-reader-conversations')
      if (localConversations) {
        try {
          const parsed: LocalConversation[] = JSON.parse(localConversations)
          setConversations(parsed.map((conv) => ({
            ...conv,
            lastUpdated: new Date(conv.lastUpdated),
            messages: conv.messages.map((msg) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          })))
        } catch {
          setConversations([])
        }
      }
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Crear nueva conversación
  const createConversation = async (title?: string): Promise<string | null> => {
    setIsLoading(true)
    setError(null)

    // 1. Crear conversación optimista
    const tempId = `temp-${Date.now()}`
    const optimisticConversation: Conversation = {
      id: tempId,
      title: title || 'Nueva conversación',
      lastUpdated: new Date(),
      messages: []
    }
    setConversations(prev => [optimisticConversation, ...prev])
    setActiveConversationId(tempId)

    try {
      // 2. Llamada real al backend
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title || 'Nueva conversación' })
      })

      if (!response.ok) throw new Error('Failed to create conversation')

      const newConversation: Conversation = await response.json()

      // Actualizar estado con la conversación real y reordenar
      setConversations(prev => {
        const updated = [newConversation, ...prev.filter(c => c.id !== newConversation.id)]
        return updated.sort(
          (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        )
      })
      setActiveConversationId(newConversation.id)
      return newConversation.id
    } catch (err) {
      // Si falla, elimina la conversación optimista
      setConversations(prev => prev.filter(conv => conv.id !== tempId))
      setError((err as Error).message)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Agregar mensaje a una conversación
  const addMessage = async (
    conversationId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<void> => {
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      role,
      content,
      timestamp: new Date()
    }

    // Actualizar UI inmediatamente
    setConversations(prev => prev.map(conv =>
      conv.id === conversationId
        ? {
          ...conv,
          messages: [...conv.messages, tempMessage],
          lastUpdated: new Date()
        }
        : conv
    ))

    // Guardar en servidor
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role, content })
      })

      if (response.ok) {
        const savedMessage: Message = await response.json()

        // Actualizar con el ID real del servidor
        setConversations(prev => prev.map(conv =>
          conv.id === conversationId
            ? {
              ...conv,
              messages: conv.messages.map(msg =>
                msg.id === tempMessage.id
                  ? { ...savedMessage, timestamp: new Date(savedMessage.timestamp) }
                  : msg
              ),
              lastUpdated: new Date() // Esto es importante
            }
            : conv
        ).sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()))
      }
    } catch (err) {
      const errorObj = err as Error
      console.error('Error saving message:', errorObj)
      setError(errorObj.message)
    }
  }

  // Actualizar título de conversación
  const updateConversationTitle = async (conversationId: string, title: string): Promise<void> => {
    // Actualizar UI inmediatamente
    setConversations(prev => prev.map(conv =>
      conv.id === conversationId ? { ...conv, title } : conv
    ))

    // Guardar en servidor
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title })
      })

      if (!response.ok) {
        throw new Error('Failed to update title')
      }
    } catch (err) {
      const errorObj = err as Error
      console.error('Error updating title:', errorObj)
      setError(errorObj.message)
    }
  }

  // Eliminar conversación
  const deleteConversation = async (conversationId: string): Promise<void> => {
    if (!user) return

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete conversation')
      }

      // Actualizar estado local
      setConversations(prev => prev.filter(conv => conv.id !== conversationId))

      // Si era la conversación activa, limpiar la selección
      if (activeConversationId === conversationId) {
        setActiveConversationId(null)
      }
    } catch (err) {
      const errorObj = err as Error
      console.error('Error deleting conversation:', errorObj)
      setError(errorObj.message)
    }
  }

  // Efectos
  useEffect(() => {
    if (isLoaded && user) {
      loadConversations()
    }
  }, [isLoaded, user, loadConversations])

  // Auto-seleccionar la primera conversación si no hay ninguna activa
  useEffect(() => {
    if (conversations.length > 0 && !activeConversationId) {
      setActiveConversationId(conversations.find(c => c.title === 'Nueva conversación')?.id || null)
    }
  }, [conversations, activeConversationId])

  return {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    updateConversationTitle,
    deleteConversation,
    addMessage,
    isLoading,
    error
  }
}
