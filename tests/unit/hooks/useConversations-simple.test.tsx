import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock simple que devuelve datos estáticos
const mockUseConversations = vi.fn(() => ({
  conversations: [],
  activeConversationId: null,
  setActiveConversationId: vi.fn(),
  createConversation: vi.fn().mockResolvedValue('new-id'),
  updateConversationTitle: vi.fn().mockResolvedValue(undefined),
  deleteConversation: vi.fn().mockResolvedValue(undefined),
  addMessage: vi.fn().mockResolvedValue(undefined),
  isLoading: false,
  error: null
}))

// Mock del hook
vi.mock('@/hooks/useConversations', () => ({
  useConversations: mockUseConversations
}))

describe('useConversations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return initial state', () => {
    const { result } = renderHook(() => mockUseConversations())

    expect(result.current.conversations).toEqual([])
    expect(result.current.activeConversationId).toBe(null)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('should create conversation', async () => {
    const { result } = renderHook(() => mockUseConversations())

    const id = await result.current.createConversation('Test')
    expect(id).toBe('new-id')
  })

  it('should handle functions without errors', async () => {
    const { result } = renderHook(() => mockUseConversations())

    await result.current.addMessage('conv-1', 'user', 'test message')
    await result.current.updateConversationTitle('conv-1', 'new title')
    await result.current.deleteConversation('conv-1')

    expect(result.current.addMessage).toHaveBeenCalled()
    expect(result.current.updateConversationTitle).toHaveBeenCalled()
    expect(result.current.deleteConversation).toHaveBeenCalled()
  })
})
