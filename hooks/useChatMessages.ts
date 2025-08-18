import { useConversations } from '@/context/conversations-context'
import { Message } from '@/types/message.types'
import { useUser } from '@clerk/nextjs'
import { useEffect, useRef, useState } from 'react'
import useLLMConfig from './useLLMConfig'

export default function useChatMessages () {
  const { user, isLoaded, isSignedIn } = useUser()
  const {
    conversations,
    activeConversationId,
    createConversation,
    updateConversationTitle,
    addMessage,
    isLoading
  } = useConversations()
  const llmConfig = useLLMConfig()
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [typingMessage, setTypingMessage] = useState('')
  const [error, setError] = useState<string>('')
  const [localMessages, setLocalMessages] = useState<Message[]>([])
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([])
  const shouldStopRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Crea una conversación nueva cuando el usuario no tiene ninguna en la base de datos
  // Hay que hacer algo parecido para generar una cada vez que entras
  useEffect(() => {
    if (isLoaded && isSignedIn && conversations.length === 0 && !isLoading) {
      createConversation('Nueva conversación')
    }
  }, [isLoaded, isSignedIn, conversations.length, isLoading, createConversation])

  const activeConversation = conversations.find(c => c.id === activeConversationId)

  // Limpia todos los estados al cambiar de conversación
  useEffect(() => {
    setLocalMessages([])
    setOptimisticMessages([])
    setTypingMessage('')
    setIsTyping(false)
    shouldStopRef.current = true // cancela efecto de escritura si estaba activo
  }, [activeConversationId])

  // Sincroniza mensajes locales fusionando reales y optimistas, eliminando duplicados
  useEffect(() => {
    if (activeConversation) {
      const merged = [
        ...activeConversation.messages,
        ...optimisticMessages.filter(om =>
          !activeConversation.messages.some(
            m =>
              (om.optimisticId && m.id === om.optimisticId) ||
                  (!om.optimisticId && m.content === om.content && m.role === om.role)
          )
        )
      ]
      setLocalMessages(merged)
    }
  }, [activeConversationId, activeConversation, optimisticMessages])

  function generateTitle (firstMessage: string): string {
    return firstMessage.length > 30
      ? firstMessage.substring(0, 30) + '...'
      : firstMessage
  }

  function formatTime (date: Date) {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  async function callLLM (messages: Message[]): Promise<string> {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        config: llmConfig
      })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to get response')
    return data.message.content
  }

  // Al enviar mensaje, añade solo a optimisticMessages
  async function handleSendMessage () {
    if (!input.trim() || !activeConversation || isTyping) return

    const optimisticId = `optimistic-${Date.now()}-${Math.random()}`
    const userMessage: Message = {
      id: optimisticId,
      optimisticId,
      content: input.trim(),
      role: 'user',
      timestamp: new Date()
    }

    const isFirstMessage = activeConversation.messages.filter(m => m.role === 'user').length === 0

    setOptimisticMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)
    setTypingMessage('')
    shouldStopRef.current = false
    setError('')

    try {
      // Solo mensajes reales + el mensaje actual
      const aiResponseContent = await callLLM([
        ...activeConversation.messages,
        userMessage
      ])

      // Efecto de escritura más rápido:
      let displayed = ''
      const charsPerStep = 4
      let stopped = false
      for (let i = 0; i < aiResponseContent.length; i += charsPerStep) {
        if (shouldStopRef.current) {
          stopped = true
          break
        }
        displayed = aiResponseContent.slice(0, i + charsPerStep)
        setTypingMessage(displayed)
        await new Promise(resolve => setTimeout(resolve, 8))
      }

      // Si se paró, guarda solo lo escrito hasta el momento
      const finalContent = stopped ? displayed : aiResponseContent

      const assistantOptimisticId = `optimistic-ai-${Date.now()}-${Math.random()}`
      const assistantMessage: Message = {
        id: assistantOptimisticId,
        optimisticId: assistantOptimisticId,
        content: finalContent,
        role: 'assistant',
        timestamp: new Date()
      }
      setOptimisticMessages(prev => [...prev, assistantMessage])
      setTypingMessage('')

      // Guarda ambos mensajes en la base de datos
      await addMessage(activeConversationId!, userMessage.role, userMessage.content)
      await addMessage(activeConversationId!, 'assistant', finalContent)

      // Elimina los mensajes optimistas que ya están en la base de datos
      setOptimisticMessages(prev =>
        prev.filter(m =>
          m.optimisticId !== userMessage.optimisticId &&
              m.optimisticId !== assistantMessage.optimisticId
        )
      )

      if (isFirstMessage) {
        await updateConversationTitle(activeConversationId!, generateTitle(userMessage.content))
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || 'Error al enviar mensaje')
      } else {
        setError('Error al enviar mensaje')
      }
    } finally {
      setTypingMessage('')
      setIsTyping(false)
      inputRef.current?.focus()
    }
  }

  // Renderiza mensajes locales + mensaje de typing
  const lastMessage = localMessages[localMessages.length - 1]
  const showTyping =
        isTyping &&
        (
          typingMessage ||
          !lastMessage || lastMessage.role !== 'assistant'
        )

  const renderedMessages = [
    ...localMessages,
    ...(showTyping
      ? [{
        id: `typing-${isTyping ? 1 : 0}-${Date.now()}`, // id único por render
        content: typingMessage
          ? typingMessage + '|'
          : 'Pensando...',
        role: 'assistant' as const,
        timestamp: new Date()
      }]
      : [])
  ]

  // Justo antes del renderizado:
  const uniqueMessages: Message[] = []
  const seen = new Set<string>()
  for (const msg of renderedMessages) {
    const key = `${msg.role}-${msg.content}`
    if (!seen.has(key)) {
      uniqueMessages.push(msg)
      seen.add(key)
    }
  }
  const lastMessageKey = uniqueMessages.length
    ? `${uniqueMessages[uniqueMessages.length - 1].id}-${uniqueMessages[uniqueMessages.length - 1].role}-${String(uniqueMessages[uniqueMessages.length - 1].timestamp)}`
    : ''
  const hasMessages = uniqueMessages.some(
    msg => !msg.id.startsWith('typing')
  )

  // Scroll automático solo cuando cambia el número de mensajes o typingMessage
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lastMessageKey])

  function handleStopTyping () {
    shouldStopRef.current = true
    setIsTyping(false)
    setTypingMessage('')
  }
  let submitStatus: 'submitted' | 'streaming' | 'error' | undefined
  if (isTyping) {
    submitStatus = 'streaming'
  } else if (error) {
    submitStatus = 'error'
  } else {
    submitStatus = undefined // o simplemente no lo pongas
  }

  return {
    uniqueMessages,
    isTyping,
    hasMessages,
    error,
    handleSendMessage,
    handleStopTyping,
    input,
    setInput,
    submitStatus,
    messagesEndRef,
    user,
    formatTime,
    inputRef,
    setError,
    activeConversation
  }
}
