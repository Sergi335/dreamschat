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

  const createOptimisticMessage = useCallback((
    content: string,
    role: 'user' | 'assistant',
    prefix = 'optimistic'
  ) => {
    const optimisticId = `${prefix}-${Date.now()}-${Math.random()}`
    return {
      id: optimisticId,
      optimisticId,
      content,
      role,
      timestamp: new Date()
    }
  }, [])

  return {
    generateTitle,
    formatTime,
    createOptimisticMessage
  }
}
