import { ConversationsProvider } from '@/context/conversations-context'
import useChatMessages from '@/hooks/useChatMessages'
import { renderHook } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'

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

// Wrapper que proporciona el contexto necesario
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ConversationsProvider>{children}</ConversationsProvider>
)

describe('useChatMessages', () => {
  it('should be defined and callable', () => {
    const { result } = renderHook(() => useChatMessages(), { wrapper })

    expect(result.current).toBeDefined()
    expect(typeof result.current.handleSendMessage).toBe('function')
    expect(typeof result.current.handleStopTyping).toBe('function')
  })

  it('should have activeConversation computed value', () => {
    const { result } = renderHook(() => useChatMessages(), { wrapper })

    // activeConversation puede ser undefined al inicio
    expect(result.current.activeConversation).toBeNull()
  })
})
