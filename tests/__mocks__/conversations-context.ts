import React from 'react'
import { vi } from 'vitest'

// Mock del contexto de conversaciones
export const mockConversationsContext = {
  conversations: [],
  activeConversationId: null,
  setActiveConversationId: vi.fn(),
  createConversation: vi.fn(),
  updateConversationTitle: vi.fn(),
  deleteConversation: vi.fn(),
  addMessage: vi.fn(),
  isLoading: false,
  error: null
}

// Provider mockeado
export const ConversationsProvider = ({ children }: { children: React.ReactNode }) => {
  return React.createElement('div', null, children)
}

// Hook mockeado
export const useConversations = () => mockConversationsContext
