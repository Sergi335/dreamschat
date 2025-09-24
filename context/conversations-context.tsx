'use client'

import type { UseConversationsReturn } from '@/hooks/useConversations'
import { useConversations as useConversationsHook } from '@/hooks/useConversations'
import { useUser } from '@clerk/nextjs'
import React, { createContext, useContext, useEffect } from 'react'

// Define el contexto
const ConversationsContext = createContext<UseConversationsReturn | undefined>(undefined)

export function ConversationsProvider ({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser()
  const conversations = useConversationsHook()

  // Limpiar al desmontar (cuando el usuario sale del dashboard)
  useEffect(() => {
    return () => {
      console.log('🧹 ConversationsProvider unmounting, cleaning state')
      // Limpiar localStorage si existe
      if (typeof window !== 'undefined') {
        localStorage.removeItem('dream-reader-conversations')
        localStorage.removeItem('dream-reader-active-conversation')
      }
    }
  }, [])

  // También limpiar si el usuario hace logout mientras está en el dashboard
  useEffect(() => {
    if (isLoaded && !user && conversations.conversations.length > 0) {
      console.log('🔐 User logged out, cleaning conversations')
      conversations.setActiveConversationId(null)
      // La limpieza del localStorage se hará al desmontar
    }
  }, [isLoaded, user, conversations])

  return (
    <ConversationsContext.Provider value={conversations}>
      {children}
    </ConversationsContext.Provider>
  )
}

// Hook para usar el contexto
export function useConversations () {
  const ctx = useContext(ConversationsContext)
  if (!ctx) {
    // Retornar valores por defecto cuando no esté dentro del provider
    return {
      conversations: [],
      activeConversationId: null,
      setActiveConversationId: () => {},
      isLoading: false,
      error: null,
      createConversation: async () => null,
      updateConversationTitle: async () => {},
      deleteConversation: async () => {},
      addMessage: async () => {}
    }
  }
  return ctx
}
