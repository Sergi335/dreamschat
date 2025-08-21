// hooks/useScrollManager.ts - Sistema de scroll mejorado
import React, { useCallback, useEffect, useRef, useState } from 'react'

export function useScrollManager (messagesEndRef: React.RefObject<HTMLDivElement>) {
  const [autoScroll, setAutoScroll] = useState(true)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Scroll solo si el usuario está abajo
  const scrollToBottom = useCallback((behavior: 'auto' | 'smooth' = 'smooth') => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' })
    }
  }, [autoScroll, messagesEndRef])

  // Observer para saber si el usuario está abajo
  useEffect(() => {
    const sentinel = messagesEndRef.current
    if (!sentinel) return

    const container = sentinel.parentElement
    if (!container) return

    observerRef.current?.disconnect()
    observerRef.current = new IntersectionObserver(
      ([entry]) => setAutoScroll(entry.isIntersecting),
      { root: container, threshold: 1.0 }
    )
    observerRef.current.observe(sentinel)

    return () => observerRef.current?.disconnect()
  }, [messagesEndRef])

  // Resetear scroll al cambiar de conversación
  const resetScrollState = useCallback(() => {
    setAutoScroll(true)
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' })
      }
    }, 100)
  }, [messagesEndRef])

  return {
    scrollToBottom,
    resetScrollState,
    autoScroll
  }
}
