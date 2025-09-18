import { useChatState } from '@/hooks/useChatState'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

describe('useChatState', () => {
  describe('initial state', () => {
    it('should have correct initial values', () => {
      const { result } = renderHook(() => useChatState())

      expect(result.current.state).toEqual({
        input: '',
        isTyping: false,
        typingMessage: '',
        error: '',
        optimisticMessages: [],
        isInitialChat: true
      })
    })
  })

  describe('updateState', () => {
    it('should update single property', () => {
      const { result } = renderHook(() => useChatState())

      act(() => {
        result.current.updateState({ input: 'Hello' })
      })

      expect(result.current.state.input).toBe('Hello')
      expect(result.current.state.isTyping).toBe(false) // Other properties unchanged
    })

    it('should update multiple properties', () => {
      const { result } = renderHook(() => useChatState())

      act(() => {
        result.current.updateState({
          input: 'Test message',
          isTyping: true,
          typingMessage: 'AI is typing...'
        })
      })

      expect(result.current.state.input).toBe('Test message')
      expect(result.current.state.isTyping).toBe(true)
      expect(result.current.state.typingMessage).toBe('AI is typing...')
    })

    it('should handle error state', () => {
      const { result } = renderHook(() => useChatState())

      act(() => {
        result.current.updateState({ error: 'Something went wrong' })
      })

      expect(result.current.state.error).toBe('Something went wrong')
    })
  })

  describe('resetForConversationChange', () => {
    it('should reset state when conversation changes', () => {
      const { result } = renderHook(() => useChatState())

      // Primero, cambiar algunos valores
      act(() => {
        result.current.updateState({
          input: 'Some text',
          isTyping: true,
          typingMessage: 'AI is typing...',
          error: 'Previous error'
        })
      })

      // Luego resetear
      act(() => {
        result.current.resetForConversationChange()
      })

      expect(result.current.state).toEqual({
        input: 'Some text', // El input NO se resetea en resetForConversationChange
        isTyping: false,
        typingMessage: '',
        error: '',
        optimisticMessages: [],
        isInitialChat: false
      })
    })
  })

  describe('state transitions', () => {
    it('should handle complete message sending flow', () => {
      const { result } = renderHook(() => useChatState())

      // Simular el flujo completo de envío de mensaje
      act(() => {
        result.current.updateState({ input: 'Hello AI' })
      })

      act(() => {
        result.current.updateState({ isTyping: true, typingMessage: 'AI is thinking...' })
      })

      act(() => {
        result.current.updateState({ isTyping: false, typingMessage: '', input: '' })
      })

      expect(result.current.state.input).toBe('')
      expect(result.current.state.isTyping).toBe(false)
      expect(result.current.state.typingMessage).toBe('')
    })
  })
})
