// hooks/useChatMessages.ts - Hook principal refactorizado
import { useConversations } from '@/context/conversations-context'
import { useUser } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useChatState } from './useChatState'
import { useLLMApi } from './useLLMApi'
import { useMessageMerging } from './useMessageMerging'
import { useMessageUtils } from './useMessageUtils'
import { useScrollManager } from './useScrollManager'
import { useTypingEffect } from './useTypingEffect'

export default function useChatMessages () {
  const { user, isLoaded } = useUser()
  const searchParams = useSearchParams()
  const guestPromptProcessedRef = useRef(false)

  // DEBUG: Log siempre para verificar que el hook se ejecuta
  console.log('🔧 useChatMessages - user:', user, 'isLoaded:', isLoaded, 'searchParams:', searchParams?.toString())
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

  // Obtener conversación activa o crear virtual para guests
  const activeConversation = useMemo(() => {
    const found = conversations.find(c => c.id === activeConversationId)
    if (found) return found

    // Conversación virtual para usuarios guest - LOGIC MAS ROBUSTA
    if (activeConversationId === 'guest-session') {
      console.log('🏗️ Creating virtual guest conversation')
      return {
        id: 'guest-session',
        title: 'Chat de invitado',
        lastUpdated: new Date(0), // Fecha fija para evitar cambios
        messages: []
      }
    }

    return null
  }, [conversations, activeConversationId])

  const relevantOptimisticMessages = useMemo(() =>
    state.optimisticMessages.filter(
      m => m.conversationId === activeConversationId || m.conversationId === 'guest-session'
    ), [state.optimisticMessages, activeConversationId]
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

  // Detectar cuando se selecciona una conversación existente - VERSIÓN SIMPLIFICADA
  useEffect(() => {
    // Solo verificar si hay una conversación activa (sin depender del objeto activeConversation)
    if (activeConversationId) {
      updateState({ isInitialChat: false })
    } else {
      updateState({ isInitialChat: true })
    }
  }, [activeConversationId, updateState])

  // MASTER useEffect para gestión de guest users
  useEffect(() => {
    const promptFromUrl = searchParams?.get('prompt')

    console.log('🎮 MASTER useEffect - isLoaded:', isLoaded, 'user:', !!user, 'prompt:', promptFromUrl, 'activeConvId:', activeConversationId)

    // Solo proceder cuando Clerk ha cargado
    if (!isLoaded) return

    // Si no hay usuario (guest mode)
    if (!user) {
      // Asegurar que hay conversación guest
      if (!activeConversationId || activeConversationId !== 'guest-session') {
        console.log('🚀 Setting guest-session for guest user')
        setActiveConversationId('guest-session')
      }

      // Si hay prompt y no se ha procesado
      if (promptFromUrl && !guestPromptProcessedRef.current) {
        console.log('🔍 Processing guest prompt:', promptFromUrl)
        guestPromptProcessedRef.current = true

        // Formatear como pregunta sobre sueños
        const formattedPrompt = `¿Qué significa soñar con ${promptFromUrl}?`

        // Configurar input
        updateState({
          input: formattedPrompt,
          isInitialChat: true
        })

        // Limpiar URL
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href)
          url.searchParams.delete('prompt')
          window.history.replaceState({}, '', url.toString())
        }

        // Auto-enviar (sin usar handleSendMessage en dependencias)
        setTimeout(() => {
          console.log('🚀 Auto-sending guest message')
          // Encontrar el form y dispatchear evento submit
          const form = document.querySelector('form[data-chat-form]') || document.querySelector('form')
          if (form) {
            const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
            form.dispatchEvent(submitEvent)
          }
        }, 1000)
      }
    } else {
      // Reset para usuarios autenticados
      // TODO debería crear la conversación del usuario como si lo hiciera desde el dashboard
      guestPromptProcessedRef.current = false
    }
  }, [isLoaded, user, searchParams, activeConversationId, setActiveConversationId, updateState])

  // Función para iniciar nuevo chat
  const startNewChat = useCallback(() => {
    resetToInitialChat()
    setActiveConversationId(null)
  }, [resetToInitialChat, setActiveConversationId])

  // Función principal para enviar mensaje
  const handleSendMessage = useCallback(async () => {
    if (!state.input.trim() || state.isTyping) return

    try {
      let conversationId = activeConversationId

      // Para usuarios guest (no autenticados)
      if (!user) {
        console.log('💭 Guest mode: sending message without saving to DB')
        conversationId = 'guest-session'

        // Crear mensaje optimista del usuario
        const userMessage = createOptimisticMessage(state.input.trim(), 'user', 'guest-user', conversationId)
        console.log('👤 Created guest user message:', userMessage)

        // Actualizar estado con mensaje de usuario incluido
        const messagesWithUser = [...state.optimisticMessages, userMessage]
        updateState({
          optimisticMessages: messagesWithUser,
          input: '',
          isTyping: true,
          typingMessage: '',
          error: '',
          isInitialChat: false
        })
        console.log('📝 Added user message, total messages:', messagesWithUser.length)
        shouldStopRef.current = false

        // Obtener respuesta de la IA
        const aiResponseContent = await callLLM([userMessage])

        // Simular efecto de escritura
        const finalContent = await simulateTyping(
          aiResponseContent,
          shouldStopRef,
          (displayed) => updateState({ typingMessage: displayed })
        )

        // Crear mensaje optimista del asistente
        const assistantMessage = createOptimisticMessage(finalContent, 'assistant', 'guest-ai', conversationId)
        console.log('🤖 Created guest assistant message:', assistantMessage)

        // Agregar mensaje del asistente a los mensajes existentes (que ya incluyen el del usuario)
        const finalMessages = [...messagesWithUser, assistantMessage]

        updateState({
          optimisticMessages: finalMessages,
          typingMessage: '',
          isTyping: false
        })
        console.log('📝 Added assistant message, total messages:', finalMessages.length)

        return // Salir temprano para guest users
      }

      // Para usuarios autenticados: lógica original
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
    user,
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
