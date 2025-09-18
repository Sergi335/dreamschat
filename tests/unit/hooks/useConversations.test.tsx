import { ConversationsProvider } from '@/context/conversations-context'
import { useConversations } from '@/hooks/useConversations'
import { renderHook } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'

// Mock global fetch
global.fetch = vi.fn()

// Wrapper component que proporciona el contexto
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ConversationsProvider>{children}</ConversationsProvider>
)

describe('useConversations', () => {
  it('should be defined and have expected properties', () => {
    const { result } = renderHook(() => useConversations(), {
      wrapper: TestWrapper
    })

    expect(result.current).toBeDefined()
    expect(result.current.conversations).toBeDefined()
    expect(result.current.isLoading).toBeDefined()
    expect(result.current.error).toBeDefined()
    expect(typeof result.current.createConversation).toBe('function')
    expect(typeof result.current.deleteConversation).toBe('function')
    expect(typeof result.current.addMessage).toBe('function')
  })

  it('should start with loading state', () => {
    const { result } = renderHook(() => useConversations(), {
      wrapper: TestWrapper
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.conversations).toEqual([])
    expect(result.current.error).toBeNull()
  })
})
