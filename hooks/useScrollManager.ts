// hooks/useScrollManager.ts - Sistema de scroll mejorado
import { Message } from '@/types/message.types'
import React, { useCallback, useRef, useState } from 'react'

export function useScrollManager (messagesEndRef: React.RefObject<HTMLDivElement>) {
  // Estado para rastrear si el usuario está activamente controlando el scroll
  const [userHasScrolled, setUserHasScrolled] = useState(false)

  // Referencia para rastrear si el componente está montado
  const isMountedRef = useRef(false)

  // Referencia para manejar debounce (usar tipo ReturnType<typeof setTimeout>)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Contador para evitar scroll en la carga inicial
  const initialLoadCountRef = useRef(0)

  /**
   * Comprueba si el usuario está cerca del final del scroll
   */
  const isNearBottom = useCallback(() => {
    const container = messagesEndRef.current?.parentElement
    if (!container) return true

    // Tolerancia de 80px o el 10% de la altura del contenedor (el que sea menor)
    const tolerance = Math.min(80, container.clientHeight * 0.1)
    return container.scrollHeight - container.scrollTop - container.clientHeight <= tolerance
  }, [messagesEndRef])

  /**
   * Realiza el scroll hasta el final del chat
   */
  const scrollToBottom = useCallback((behavior: 'auto' | 'smooth' = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' })
    }
  }, [messagesEndRef])

  /**
   * Maneja la detección de la interacción del usuario con el scroll
   */
  const setupUserScrollDetection = useCallback(() => {
    const container = messagesEndRef.current?.parentElement
    if (!container) return () => {}

    // Funciones para detectar interacción real del usuario
    const handleUserInteraction = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      setUserHasScrolled(true)

      // Si el usuario vuelve al final, reactivamos el scroll automático después de un tiempo
      scrollTimeoutRef.current = setTimeout(() => {
        if (isNearBottom()) {
          setUserHasScrolled(false)
        }
      }, 1000) // Esperar 1 segundo antes de reactivar autoscroll
    }

    // Capturar eventos que indican interacción real del usuario (no programática)
    container.addEventListener('wheel', handleUserInteraction, { passive: true })
    container.addEventListener('touchmove', handleUserInteraction, { passive: true })
    container.addEventListener('mousedown', handleUserInteraction)

    // Evento para detectar si el usuario ha hecho scroll manualmente
    const handleScroll = () => {
      // Solo si no está cerca del final y no ha sido marcado previamente como scroll de usuario
      if (!isNearBottom() && !userHasScrolled) {
        setUserHasScrolled(true)
      } else if (isNearBottom() && userHasScrolled) {
        // Si el usuario llega al final, podemos reactivar el scroll automático
        // Usamos un timeout para evitar falsas detecciones
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current)
        }
        scrollTimeoutRef.current = setTimeout(() => {
          setUserHasScrolled(false)
        }, 500)
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      container.removeEventListener('wheel', handleUserInteraction)
      container.removeEventListener('touchmove', handleUserInteraction)
      container.removeEventListener('mousedown', handleUserInteraction)
      container.removeEventListener('scroll', handleScroll)

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [isNearBottom, userHasScrolled, messagesEndRef])

  /**
   * Hook principal para gestionar el scroll automático según el estado de la conversación
   */
  const manageScrollBehavior = useCallback((
    isTyping: boolean,
    messages: Message[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _activeConversationId: string | null
  ) => {
    // En el primer render, marcamos que el componente está montado
    if (!isMountedRef.current) {
      isMountedRef.current = true
      initialLoadCountRef.current = 1
      return setupUserScrollDetection()
    }

    // Si estamos en una conversación con mensajes y el usuario no ha hecho scroll
    // O si el asistente está escribiendo, hacemos scroll automático
    const shouldAutoScroll =
      messages.length > 0 &&
      !userHasScrolled &&
      (isTyping || initialLoadCountRef.current <= 1)

    if (shouldAutoScroll) {
      // Usar comportamiento instantáneo en carga inicial, suave durante escritura
      const behavior = initialLoadCountRef.current === 0 ? 'auto' : 'smooth'
      scrollToBottom(behavior)
    }

    // Incrementar contador de cargas iniciales
    if (initialLoadCountRef.current <= 1) {
      initialLoadCountRef.current++
    }

    return setupUserScrollDetection()
  }, [scrollToBottom, setupUserScrollDetection, userHasScrolled])

  /**
   * Resetea el estado de scroll cuando cambia la conversación activa
   */
  const resetScrollState = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_newConversationId: string | null) => {
      setUserHasScrolled(false)
      initialLoadCountRef.current = 0

      // Pequeño retraso para asegurar que los mensajes se han renderizado
      setTimeout(() => {
        scrollToBottom('auto')
      }, 100)
    },
    [scrollToBottom]
  )

  return {
    manageScrollBehavior,
    scrollToBottom,
    resetScrollState,
    isNearBottom,
    userHasScrolled
  }
}
