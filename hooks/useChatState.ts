// hooks/useChatState.ts
import { Message } from '@/types/message.types'
import { useCallback, useRef, useState } from 'react'

export interface ChatState {
  input: string
  isTyping: boolean
  typingMessage: string
  error: string
  optimisticMessages: Message[]
  isInitialChat: boolean
}

const initialState: ChatState = {
  input: '',
  isTyping: false,
  typingMessage: '',
  error: '',
  optimisticMessages: [],
  isInitialChat: true
}

export function useChatState () {
  const [state, setState] = useState<ChatState>(initialState)
  const shouldStopRef = useRef(false)

  const updateState = useCallback((updates: Partial<ChatState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const resetToInitialChat = useCallback(() => {
    setState(initialState)
    shouldStopRef.current = true
  }, [])

  const resetForConversationChange = useCallback(() => {
    setState(prev => ({
      ...prev,
      optimisticMessages: [],
      typingMessage: '',
      isTyping: false,
      error: '',
      isInitialChat: false
    }))
    shouldStopRef.current = true
  }, [])

  return {
    state,
    updateState,
    resetToInitialChat,
    resetForConversationChange,
    shouldStopRef
  }
}
