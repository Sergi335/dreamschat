'use client'

import type { UseConversationsReturn } from '@/hooks/useConversations'
import { useConversations as useConversationsHook } from '@/hooks/useConversations'
import React, { createContext, useContext } from 'react'

// Define el contexto
const ConversationsContext = createContext<UseConversationsReturn | undefined>(undefined)

export function ConversationsProvider ({ children }: { children: React.ReactNode }) {
  // Usa el hook aquí, así el estado es compartido
  const conversations = useConversationsHook()

  return (
    <ConversationsContext.Provider value={conversations}>
      {children}
    </ConversationsContext.Provider>
  )
}

// Hook para usar el contexto
export function useConversations () {
  const ctx = useContext(ConversationsContext)
  if (!ctx) throw new Error('useConversations must be used within a ConversationsProvider')
  return ctx
}
