// hooks/useChatMessages.ts - Hook principal refactorizado
import { useConversations } from '@/context/conversations-context'
import { useUser } from '@clerk/nextjs'
import { useCallback, useEffect, useRef } from 'react'
import { useChatState } from './useChatState'
import { useLLMApi } from './useLLMApi'
import { useMessageMerging } from './useMessageMerging'
import { useMessageUtils } from './useMessageUtils'
import { useScrollManager } from './useScrollManager'
import { useTypingEffect } from './useTypingEffect'

export default function useChatMessages () {
  const { user } = useUser()
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    updateConversationTitle,
    addMessage
  } = useConversations()

  const {
    state,
    updateState,
    resetToInitialChat,
    resetForConversationChange,
    shouldStopRef
  } = useChatState()

  const { simulateTyping } = useTypingEffect()
  const { callLLM } = useLLMApi()
  const { generateTitle, formatTime, createOptimisticMessage } = useMessageUtils()

  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { scrollToBottom, autoScroll } = useScrollManager(messagesEndRef)

  // Obtener conversación activa
  const activeConversation = conversations.find(c => c.id === activeConversationId)

  const relevantOptimisticMessages = state.optimisticMessages.filter(
    m => m.conversationId === activeConversationId
  )
  // Fusionar mensajes
  const uniqueMessages = useMessageMerging(
    activeConversation?.messages || [],
    relevantOptimisticMessages,
    state.typingMessage,
    state.isTyping
  )

  const hasMessages = uniqueMessages.some(msg => !msg.id.startsWith('typing'))

  useEffect(() => {
    if (autoScroll) {
      scrollToBottom('smooth')
    }
  }, [uniqueMessages, autoScroll, scrollToBottom])

  // Detectar cuando se selecciona una conversación existente
  useEffect(() => {
    if (activeConversationId && activeConversation && activeConversation.messages.length > 0) {
      // Si hay una conversación activa con mensajes, no es un chat inicial
      updateState({ isInitialChat: false })
    } else if (!activeConversationId) {
      // Si no hay conversación activa, es un chat inicial
      updateState({ isInitialChat: true })
    }
  }, [activeConversationId, activeConversation, updateState])

  // Función para iniciar nuevo chat
  const startNewChat = useCallback(() => {
    resetToInitialChat()
    setActiveConversationId(null)
  }, [resetToInitialChat, setActiveConversationId])

  // Función principal para enviar mensaje
  const handleSendMessage = useCallback(async () => {
    if (!state.input.trim() || state.isTyping) return

    try {
      // Si es chat inicial, crear conversación primero
      let conversationId = activeConversationId
      if (state.isInitialChat) {
        conversationId = await createConversation('Nueva conversación')
        setActiveConversationId(conversationId)
        updateState({ isInitialChat: false })
      }

      if (!conversationId || !activeConversation) {
        throw new Error('No se pudo crear o encontrar la conversación')
      }

      // Crear mensaje optimista del usuario
      const userMessage = createOptimisticMessage(state.input.trim(), 'user', 'optimistic', conversationId)
      const isFirstMessage = activeConversation.messages.filter(m => m.role === 'user').length === 0

      // Actualizar estado
      updateState({
        optimisticMessages: [...state.optimisticMessages, userMessage],
        input: '',
        isTyping: true,
        typingMessage: '',
        error: ''
      })
      shouldStopRef.current = false

      // Obtener respuesta de la IA
      const aiResponseContent = await callLLM([
        ...activeConversation.messages,
        userMessage
      ])

      // Simular efecto de escritura
      const finalContent = await simulateTyping(
        aiResponseContent,
        shouldStopRef,
        (displayed) => updateState({ typingMessage: displayed })
      )

      // Crear mensaje optimista del asistente
      const assistantMessage = createOptimisticMessage(finalContent, 'assistant', 'optimistic-ai', conversationId)

      updateState({
        optimisticMessages: [...state.optimisticMessages, assistantMessage],
        typingMessage: '',
        isTyping: false
      })

      // CAMBIO: Guardar mensajes en base de datos y esperar a que se completen antes de limpiar
      try {
        await addMessage(conversationId, userMessage.role, userMessage.content)
        await addMessage(conversationId, 'assistant', finalContent)

        // IMPORTANTE: Esperar un breve momento para que los datos se actualicen en el contexto
        await new Promise(resolve => setTimeout(resolve, 500))

        // Verificar que los mensajes existen en conversaciones antes de eliminarlos del estado optimista
        const updatedConversation = conversations.find(c => c.id === conversationId)
        const messagesExistInDB = updatedConversation?.messages.some(m =>
          (m.content === userMessage.content && m.role === userMessage.role) &&
          updatedConversation.messages.some(m2 =>
            m2.content === finalContent && m2.role === 'assistant'
          )
        )

        // Solo eliminar mensajes optimistas si existen en la base de datos
        if (messagesExistInDB) {
          updateState({
            optimisticMessages: state.optimisticMessages.filter(m =>
              m.optimisticId !== userMessage.optimisticId &&
              m.optimisticId !== assistantMessage.optimisticId
            )
          })
        }
      } catch (error) {
        console.error('Error al guardar mensajes en la base de datos:', error)
        // No eliminar mensajes optimistas si hay error
      }

      // Actualizar título si es el primer mensaje
      if (isFirstMessage) {
        await updateConversationTitle(conversationId, generateTitle(userMessage.content))
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al enviar mensaje'
      updateState({
        error: errorMessage,
        isTyping: false,
        typingMessage: ''
      })
    } finally {
      inputRef.current?.focus()
    }
  }, [
    state,
    activeConversationId,
    activeConversation,
    createConversation,
    setActiveConversationId,
    updateState,
    shouldStopRef,
    createOptimisticMessage,
    callLLM,
    simulateTyping,
    addMessage,
    updateConversationTitle,
    generateTitle,
    conversations
  ])

  const handleStopTyping = useCallback(() => {
    shouldStopRef.current = true
    updateState({
      isTyping: false,
      typingMessage: ''
    })
  }, [updateState, shouldStopRef])

  const setInput = useCallback((value: string) => {
    updateState({ input: value })
  }, [updateState])

  const setError = useCallback((error: string) => {
    updateState({ error })
  }, [updateState])

  // Determinar estado de envío
  let submitStatus: 'submitted' | 'streaming' | 'error' | undefined
  if (state.isTyping) {
    submitStatus = 'streaming'
  } else if (state.error) {
    submitStatus = 'error'
  }

  return {
    // Mensajes y estado
    uniqueMessages,
    hasMessages,
    isTyping: state.isTyping,
    error: state.error,

    // Input
    input: state.input,
    setInput,

    // Acciones
    handleSendMessage,
    handleStopTyping,
    startNewChat,
    setError,
    resetForConversationChange,
    resetToInitialChat,

    // Estado y referencias
    submitStatus,
    messagesEndRef,
    inputRef,

    // Datos del usuario y conversación
    user,
    activeConversation,
    isInitialChat: state.isInitialChat,

    // Utilidades
    formatTime
  }
}
