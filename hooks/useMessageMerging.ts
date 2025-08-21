// hooks/useMessageMerging.ts
import { Message } from '@/types/message.types'
import { useMemo } from 'react'

export function useMessageMerging (
  conversationMessages: Message[] = [],
  optimisticMessages: Message[],
  typingMessage: string,
  isTyping: boolean
) {
  return useMemo(() => {
    // Fusionar mensajes reales con optimistas, evitando duplicados
    const mergedMessages = [
      ...conversationMessages,
      // CAMBIO: Mejorar la lógica para evitar falsos positivos en la detección de duplicados
      ...optimisticMessages.filter(optimistic =>
        !conversationMessages.some(real =>
          // Solo considerar duplicados si el ID optimista coincide con el ID real
          // O si contenido Y rol Y timestamp son casi idénticos
          (optimistic.optimisticId && real.id === optimistic.optimisticId) ||
          (real.content === optimistic.content &&
           real.role === optimistic.role &&
           // Para evitar coincidencias accidentales en mensajes similares
           Math.abs(real.timestamp.getTime() - optimistic.timestamp.getTime()) < 10000)
        )
      )
    ]

    // Agregar mensaje de typing si es necesario
    const lastMessage = mergedMessages[mergedMessages.length - 1]
    const showTyping = isTyping && (typingMessage || !lastMessage || lastMessage.role !== 'assistant')

    if (showTyping) {
      mergedMessages.push({
        id: `typing-${Date.now()}`,
        content: typingMessage ? `${typingMessage}|` : 'Pensando...',
        role: 'assistant',
        timestamp: new Date()
      })
    }

    // Eliminar duplicados por contenido y rol
    const uniqueMessages: Message[] = []
    const seen = new Set<string>()

    for (const msg of mergedMessages) {
      const key = `${msg.role}-${msg.content}`
      if (!seen.has(key)) {
        uniqueMessages.push(msg)
        seen.add(key)
      }
    }

    return uniqueMessages
  }, [conversationMessages, optimisticMessages, typingMessage, isTyping])
}
