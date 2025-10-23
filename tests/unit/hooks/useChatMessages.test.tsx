import { ConversationsProvider } from '@/context/conversations-context'
import useChatMessages from '@/hooks/useChatMessages'
import { renderHook } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock de los hooks que useChatMessages depende
vi.mock('@/hooks/useChatState', () => ({
  useChatState: () => ({
    state: {
      input: '',
      isTyping: false,
      isInitialChat: true,
      error: '',
      optimisticMessages: [],
      typingMessage: ''
    },
    updateState: vi.fn(),
    resetForConversationChange: vi.fn(),
    shouldStopRef: { current: false }
  })
}))

vi.mock('@/lib/llm-providers', () => ({
  callLLM: vi.fn()
}))

vi.mock('@/hooks/useTypingEffect', () => ({
  useTypingEffect: () => ({
    simulateTyping: vi.fn()
  })
}))

vi.mock('@/hooks/useScrollManager', () => ({
  useScrollManager: () => ({
    scrollToBottom: vi.fn()
  })
}))

vi.mock('@/hooks/useMessageUtils', () => ({
  useMessageUtils: () => ({
    createMessage: vi.fn()
  })
}))

vi.mock('@/hooks/useMessageMerging', () => ({
  useMessageMerging: () => [] // Devuelve un array vacío por defecto
}))

// Mock de Clerk para evitar efectos secundarios
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: null, isLoaded: true })
}))

// Mock de useGuestSession para controlar su comportamiento
vi.mock('@/hooks/useGuestSession', () => ({
  useGuestSession: () => ({
    session: null,
    loading: false,
    error: null,
    canCreateConversation: true,
    canSendMessage: true,
    incrementConversation: vi.fn(),
    incrementMessage: vi.fn(),
    reloadSession: vi.fn()
  })
}))

// Wrapper que proporciona el contexto necesario
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ConversationsProvider>{children}</ConversationsProvider>
)

describe('useChatMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock global fetch para todas las llamadas de API
    globalThis.fetch = vi.fn(async (input) => {
      const url = typeof input === 'string' ? input : input.toString()

      if (url.includes('/api/conversations')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ conversations: [] })
        }
      }

      if (url.includes('/api/guest/session')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            fingerprint: 'test-fp',
            conversationCount: 0,
            messageCount: 0,
            canCreateConversation: true,
            canSendMessage: true,
            lastActivity: new Date().toISOString()
          })
        }
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' })
      }
    }) as unknown as typeof globalThis.fetch
  })

  it('should be defined and callable', () => {
    const { result } = renderHook(() => useChatMessages(), { wrapper })

    expect(result.current).toBeDefined()
    expect(typeof result.current.handleSendMessage).toBe('function')
    expect(typeof result.current.handleStopTyping).toBe('function')
  })

  it('should have activeConversation computed value', () => {
    const { result } = renderHook(() => useChatMessages(), { wrapper })

    // Para invitados, se crea automáticamente una conversación temporal
    expect(result.current.activeConversation).toBeDefined()
    expect(result.current.activeConversation?.id).toBe('guest-session')
    expect(result.current.activeConversation?.title).toBe('Chat de invitado')
    expect(result.current.activeConversation?.messages).toEqual([])
  })
})
