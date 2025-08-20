import { useConversations } from '@/context/conversations-context'
import { Message } from '@/types/message.types'
import { useUser } from '@clerk/nextjs'
import { useEffect, useRef, useState } from 'react'
import useLLMConfig from './useLLMConfig'

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
  const llmConfig = useLLMConfig()
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [typingMessage, setTypingMessage] = useState('')
  const [error, setError] = useState<string>('')
  const [localMessages, setLocalMessages] = useState<Message[]>([])
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([])
  const [isInitialChat, setIsInitialChat] = useState(true)
  const shouldStopRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [hasMounted, setHasMounted] = useState(false)
  const [userScrolled, setUserScrolled] = useState(false)
  const lastConversationId = useRef<string | null>(null)

  // Cuando el usuario pulsa "nueva conversación" o entra por primera vez
  function startNewChat () {
    setIsInitialChat(true)
    setInput('')
    setLocalMessages([])
    setOptimisticMessages([])
    setTypingMessage('')
    setIsTyping(false)
    setError('')
    shouldStopRef.current = true
    setActiveConversationId(null)
  }

  // Limpia todos los estados al cambiar de conversación real
  useEffect(() => {
    if (activeConversationId) {
      setLocalMessages([])
      setOptimisticMessages([])
      setTypingMessage('')
      setIsTyping(false)
      shouldStopRef.current = true
      setIsInitialChat(false)
    }
  }, [activeConversationId])

  const activeConversation = conversations.find(c => c.id === activeConversationId)

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

  // Al enviar mensaje
  async function handleSendMessage () {
    if (!input.trim() || isTyping) return

    // Si estamos en el chat inicial, crea la conversación real y actívala
    if (isInitialChat) {
      const newId = await createConversation('Nueva conversación')
      setActiveConversationId(newId)
      setIsInitialChat(false)
      // Espera a que el estado se actualice antes de continuar
      setTimeout(() => {
        handleSendMessage()
      }, 0)
      return
    }

    if (!activeConversation) return

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
      const isLong = aiResponseContent.length > 500
      const isTable = aiResponseContent.includes('|---') && aiResponseContent.includes('\n')
      const charsPerStep = isTable ? 40 : isLong ? 20 : 8
      const delay = isTable ? 1 : isLong ? 2 : 8

      let stopped = false
      for (let i = 0; i < aiResponseContent.length; i += charsPerStep) {
        if (shouldStopRef.current) {
          stopped = true
          break
        }
        displayed = aiResponseContent.slice(0, i + charsPerStep)
        setTypingMessage(displayed)
        await new Promise(resolve => setTimeout(resolve, delay))
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

  // Detecta si el usuario ha hecho scroll manualmente
  useEffect(() => {
    const el = messagesEndRef.current?.parentElement
    if (!el) return
    const onScroll = () => {
      setUserScrolled(!isUserAtBottom())
    }
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [messagesEndRef])

  function isUserAtBottom () {
    const el = messagesEndRef.current?.parentElement
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100
  }

  // Marca como montado tras el primer render
  useEffect(() => {
    setHasMounted(true)
  }, [])

  // Efecto de scroll mejorado:
  useEffect(() => {
    if (!hasMounted) return

    // Detecta cambio de conversación
    const isConversationChange = lastConversationId.current !== activeConversationId
    lastConversationId.current = activeConversationId

    // Solo hace scroll si:
    // - No es cambio de conversación (o es la primera vez)
    // - El usuario está abajo y no ha hecho scroll manual
    if (
      !isConversationChange &&
      ((isTyping || (lastMessageKey && !isTyping)) && isUserAtBottom() && !userScrolled)
    ) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [lastMessageKey, isTyping, hasMounted, activeConversationId, userScrolled])

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
    activeConversation,
    isInitialChat,
    startNewChat
  }
}
