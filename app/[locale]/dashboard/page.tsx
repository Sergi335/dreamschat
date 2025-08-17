'use client'

import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar
} from '@/components/ai-elements/prompt-input'
import DashboardHeader from '@/components/dashboard-header'
import { MessageComponent } from '@/components/message-component'
import { Sidebar } from '@/components/sidebar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useConversations } from '@/context/conversations-context'
import { getProviderById } from '@/lib/llm-providers'
import { useUser } from '@clerk/nextjs'
import { MessageSquare, Mic } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

// Cambia la interfaz Message:
interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  optimisticId?: string; // <-- Nuevo campo opcional
}
const llmConfig = {
  providerId: process.env.NEXT_PUBLIC_LLM_PROVIDER || 'openai',
  model: process.env.NEXT_PUBLIC_LLM_MODEL || 'gpt-3.5-turbo',
  temperature: parseFloat(process.env.NEXT_PUBLIC_LLM_TEMPERATURE || '0.7'),
  maxTokens: parseInt(process.env.NEXT_PUBLIC_LLM_MAX_TOKENS || '1000'),
  customBaseURL: process.env.NEXT_PUBLIC_LLM_BASE_URL || undefined
}

export default function Dashboard () {
  const { user, isLoaded, isSignedIn } = useUser()
  const {
    conversations,
    activeConversationId,
    createConversation,
    updateConversationTitle,
    addMessage,
    isLoading
  } = useConversations()

  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [typingMessage, setTypingMessage] = useState('')
  const [error, setError] = useState<string>('')
  const [localMessages, setLocalMessages] = useState<Message[]>([])
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([])
  const shouldStopRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isLoaded && isSignedIn && conversations.length === 0 && !isLoading) {
      createConversation('Nueva conversación')
    }
  }, [isLoaded, isSignedIn, conversations.length, isLoading, createConversation])

  const activeConversation = conversations.find(c => c.id === activeConversationId)
  const currentProvider = getProviderById(llmConfig.providerId)

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

  // Scroll automático solo cuando cambia el número de mensajes o typingMessage
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [localMessages.length, typingMessage])

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
      for (let i = 0; i < aiResponseContent.length; i += charsPerStep) {
        if (shouldStopRef.current) break
        displayed = aiResponseContent.slice(0, i + charsPerStep)
        setTypingMessage(displayed)
        await new Promise(resolve => setTimeout(resolve, 8))
      }

      // Mensaje final del asistente (optimista)
      const assistantOptimisticId = `optimistic-ai-${Date.now()}-${Math.random()}`
      const assistantMessage: Message = {
        id: assistantOptimisticId,
        optimisticId: assistantOptimisticId,
        content: aiResponseContent,
        role: 'assistant',
        timestamp: new Date()
      }
      setOptimisticMessages(prev => [...prev, assistantMessage])
      setTypingMessage('')

      // Guarda ambos mensajes en la base de datos
      await addMessage(activeConversationId!, userMessage.role, userMessage.content)
      await addMessage(activeConversationId!, 'assistant', aiResponseContent)

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

  return (
    <div className="flex h-screen bg-black text-white">
      <Sidebar ref={inputRef} setError={setError} />
      <main className="flex-1 flex flex-col">
        <DashboardHeader
          activeConversation={activeConversation}
          currentProvider={currentProvider}
          llmConfig={llmConfig}
        />

        <ScrollArea className="flex-1 p-4">
          {activeConversation
            ? (
              <div className="space-y-4 max-w-4xl mx-auto">
                {uniqueMessages.map((message) => (
                  <MessageComponent
                    key={`${message.id}-${message.role}-${String(message.timestamp)}`}
                    message={message}
                    isUser={message.role === 'user'}
                    userImage={user?.imageUrl}
                    providerName={currentProvider?.name}
                    formatTime={formatTime}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )
            : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                  <p>Selecciona una conversación para comenzar</p>
                </div>
              </div>
            )}
        </ScrollArea>

        {activeConversation && (
          <div className="p-4 border-t border-gray-700">
            {error && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-200">
                {error}
              </div>
            )}
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-2">
                <PromptInput onSubmit={e => {
                  e.preventDefault()
                  handleSendMessage()
                }} className="mt-4 relative">
                  <PromptInputTextarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    aria-label="Prompt"
                    spellCheck={true}
                  />
                  <PromptInputToolbar>
                    <Mic />
                    <PromptInputSubmit
                      disabled={!input.trim() || isTyping}
                    />
                  </PromptInputToolbar>
                </PromptInput>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
