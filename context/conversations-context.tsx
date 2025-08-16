'use client'

import { useConversations as useConversationsHook } from '@/hooks/use-conversations'
import React, { createContext, useContext } from 'react'

// Define el contexto
const ConversationsContext = createContext<any>(null)

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
  return useContext(ConversationsContext)
}
