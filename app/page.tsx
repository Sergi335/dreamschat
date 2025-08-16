'use client'

import { MessageComponent } from '@/components/message-component'
import { Sidebar } from '@/components/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useConversations } from '@/context/conversations-context'
import { getProviderById } from '@/lib/llm-providers'
import { useUser } from '@clerk/nextjs'
import { Bot, MessageSquare, Send, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export default function ChatGPT () {
  // Clerk hooks para autenticación
  const { user, isLoaded, isSignedIn } = useUser()

  // Hook para gestión de conversaciones con persistencia
  const {
    conversations,
    activeConversationId,
    createConversation,
    updateConversationTitle,
    addMessage,
    isLoading
  } = useConversations()
  console.log('🚀 ~ ChatGPT ~ activeConversationId:', activeConversationId)

  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [typingMessage, setTypingMessage] = useState('') // Estado para el mensaje en escritura
  const shouldStopRef = useRef(false)
  // const [sidebarOpen, setSidebarOpen] = useState(false) <-- contexto?
  const [error, setError] = useState<string>('') // <-- contexto?

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load configuration from environment variables
  const llmConfig = useMemo(() => ({
    providerId: process.env.NEXT_PUBLIC_LLM_PROVIDER || 'openai',
    model: process.env.NEXT_PUBLIC_LLM_MODEL || 'gpt-3.5-turbo',
    temperature: parseFloat(process.env.NEXT_PUBLIC_LLM_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.NEXT_PUBLIC_LLM_MAX_TOKENS || '1000'),
    customBaseURL: process.env.NEXT_PUBLIC_LLM_BASE_URL || undefined
  }), [])

  // Create initial conversation if none exist and user is loaded
  useEffect(() => {
    if (isLoaded && isSignedIn && conversations.length === 0 && !isLoading) {
      createConversation('Nueva conversación')
    }
  }, [isLoaded, isSignedIn, conversations.length, isLoading, createConversation])

  const activeConversation = conversations.find(c => c.id === activeConversationId)
  const currentProvider = getProviderById(llmConfig.providerId)

  // Optimizar scroll con throttle
  const scrollToBottomThrottled = useMemo(() => {
    let timeoutId: ReturnType<typeof setTimeout>
    return () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [])

  useEffect(() => {
    scrollToBottomThrottled()
  }, [activeConversation?.messages?.length, isTyping, scrollToBottomThrottled])

  const generateTitle = useCallback((firstMessage: string): string => {
    return firstMessage.length > 30
      ? firstMessage.substring(0, 30) + '...'
      : firstMessage
  }, [])

  const callLLM = useCallback(async (messages: Message[]): Promise<string> => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        config: llmConfig
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get response')
    }

    return data.message.content
  }, [llmConfig])

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || !activeConversation || isTyping) return

    const userMessage = {
      content: input.trim(),
      role: 'user' as const
    }

    const isFirstMessage = activeConversation.messages.filter(m => m.role === 'user').length === 0

    try {
      // Agregar mensaje del usuario a la base de datos
      await addMessage(activeConversationId!, userMessage.role, userMessage.content)

      // Actualizar título si es el primer mensaje
      if (isFirstMessage) {
        await updateConversationTitle(activeConversationId!, generateTitle(userMessage.content))
      }

      setInput('')
      setIsTyping(true)
      setTypingMessage('') // Limpiar mensaje de escritura anterior
      shouldStopRef.current = false
      setError('')

      const allMessages = [...activeConversation.messages, {
        id: 'temp',
        content: userMessage.content,
        role: userMessage.role,
        timestamp: new Date()
      }]

      const aiResponseContent = await callLLM(allMessages)

      // Efecto de escritura optimizado
      let displayed = ''
      const charsPerStep = 12 // Más caracteres para tablas
      let updateCounter = 0

      for (let i = 0; i < aiResponseContent.length; i += charsPerStep) {
        if (shouldStopRef.current) {
          displayed = aiResponseContent // Mostrar todo si se detiene
          break
        }

        displayed += aiResponseContent.slice(i, i + charsPerStep)
        updateCounter++

        // Actualizar UI solo cada 3 iteraciones para reducir re-renders
        if (updateCounter % 3 === 0 || i + charsPerStep >= aiResponseContent.length) {
          setTypingMessage(displayed)
          await new Promise(resolve => setTimeout(resolve, 10)) // Ligeramente más lento pero más suave
        }
      }

      // Asegurar que se muestra el contenido final
      if (displayed !== aiResponseContent) {
        setTypingMessage(aiResponseContent)
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      // Guardar el mensaje final en la base de datos
      await addMessage(activeConversationId!, 'assistant', displayed)
    } catch (error: unknown) {
      console.error('Error calling LLM:', error)
      setError(error instanceof Error ? error.message : 'Failed to get response from AI')
    } finally {
      setIsTyping(false)
      inputRef.current?.focus()
    }
  }, [input, activeConversation, isTyping, activeConversationId, addMessage, updateConversationTitle, callLLM, generateTitle])

  // Función para detener el efecto de escritura
  const handleStopTyping = useCallback(() => {
    shouldStopRef.current = true
  }, [])

  // const handleNewConversation = useCallback(async () => {
  //   try {
  //     const newConversationId = await createConversation('Nueva conversación')
  //     if (newConversationId) {
  //       setActiveConversationId(newConversationId)
  //     }
  //     setSidebarOpen(false)
  //     setError('')

  //     // Enfocar el input después de crear la conversación
  //     setTimeout(() => {
  //       inputRef.current?.focus()
  //     }, 100)
  //   } catch (error) {
  //     console.error('Error creating conversation:', error)
  //     setError('Error al crear nueva conversación')
  //   }
  // }, [createConversation, setActiveConversationId])

  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }, [])

  // Mostrar loading mientras Clerk se inicializa
  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  // Mostrar página de inicio de sesión si no está autenticado
  if (!isSignedIn) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <div className="text-center max-w-md mx-auto p-8">
          <Bot className="h-16 w-16 mx-auto mb-6 text-blue-400" />
          <h1 className="text-3xl font-bold mb-4">Dream Reader</h1>
          <p className="text-gray-300 mb-8">
            Tu asistente de IA personalizado con múltiples modelos de lenguaje
          </p>
          <div className="space-y-4">
            <Button
              onClick={() => { window.location.href = '/sign-in' }}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Iniciar Sesión
            </Button>
            <Button
              onClick={() => { window.location.href = '/sign-up' }}
              variant="outline"
              className="w-full"
            >
              Registrarse
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-black text-white">
      <Sidebar ref={inputRef} setError={setError} />
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            {/* <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden"
            >
              <Menu className="h-4 w-4" />
            </Button> */}
            <div>
              <h2 className="font-semibold">
                {activeConversation?.title || 'Selecciona una conversación'}
              </h2>
              {currentProvider && (
                <p className="text-sm text-gray-400">
                  {currentProvider.name} - {llmConfig.model}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {activeConversation
            ? (
              <div className="space-y-4 max-w-4xl mx-auto">
                {[
                  ...activeConversation.messages,
                  ...(isTyping
                    ? [{
                      id: 'typing',
                      content: typingMessage
                        ? typingMessage + '|'
                        : 'Pensando...',
                      role: 'assistant',
                      timestamp: new Date()
                    }]
                    : [])
                ].map((message) => (
                  <MessageComponent
                    key={message.id}
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

        {/* Input */}
        {activeConversation && (
          <div className="p-4 border-t border-gray-700">
            {error && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-200">
                {error}
              </div>
            )}

            <div className="max-w-4xl mx-auto">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="Escribe tu mensaje..."
                  disabled={isTyping}
                  className="flex-1 bg-gray-800 border-gray-600 focus:border-blue-500"
                />

                {isTyping
                  ? (
                    <Button
                      onClick={handleStopTyping}
                      variant="outline"
                      className="px-3"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )
                  : (
                    <Button
                      onClick={handleSendMessage}
                      disabled={!input.trim()}
                      className="px-3"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
