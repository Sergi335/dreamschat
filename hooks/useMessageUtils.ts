// hooks/useMessageUtils.ts
import { useCallback } from 'react'

export function useMessageUtils () {
  const generateTitle = useCallback((firstMessage: string): string => {
    return firstMessage.length > 30
      ? firstMessage.substring(0, 30) + '...'
      : firstMessage
  }, [])

  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }, [])

  // hooks/useMessageUtils.ts
  const createOptimisticMessage = useCallback((
    content: string,
    role: 'user' | 'assistant',
    prefix = 'optimistic',
    conversationId: string
  ) => ({
    id: `${prefix}-${Date.now()}-${Math.random()}`,
    content,
    role,
    timestamp: new Date(),
    optimisticId: `${prefix}-${Date.now()}-${Math.random()}`,
    conversationId
  }), [])

  return {
    generateTitle,
    formatTime,
    createOptimisticMessage
  }
}
