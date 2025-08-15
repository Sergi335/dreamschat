"use client";

import { ApiKeyDialog } from '@/components/api-key-dialog';
import { LLMConfigDialog } from '@/components/llm-config-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useConversations } from '@/hooks/use-conversations';
import { LLMConfig, getProviderById } from '@/lib/llm-providers';
import { cn } from '@/lib/utils';
import { useClerk, useUser } from '@clerk/nextjs';
import { Bot, LogOut, Menu, MessageSquare, Plus, Send, Settings, User, X, Zap } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Componente memoizado para el Markdown
const MarkdownRenderer = memo(({ content }: { content: string }) => (
  <Markdown
    remarkPlugins={[remarkGfm]}
    components={{
      p: ({ children }) => <p style={{ margin: '0.5rem 0' }}>{children}</p>,
      ul: ({ children }) => <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>{children}</ul>,
      ol: ({ children }) => <ol style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>{children}</ol>,
      li: ({ children }) => <li style={{ margin: '0.25rem 0' }}>{children}</li>,
      table: ({ children }) => (
        <table style={{ 
          borderCollapse: 'collapse', 
          width: '100%', 
          margin: '1rem 0',
          border: '1px solid #374151'
        }}>
          {children}
        </table>
      ),
      th: ({ children }) => (
        <th style={{ 
          border: '1px solid #374151', 
          padding: '0.5rem',
          backgroundColor: '#374151',
          textAlign: 'left'
        }}>
          {children}
        </th>
      ),
      td: ({ children }) => (
        <td style={{ 
          border: '1px solid #374151', 
          padding: '0.5rem'
        }}>
          {children}
        </td>
      ),
      code: ({ children, className }) => {
        const isInline = !className;
        return isInline ? (
          <code style={{ 
            backgroundColor: '#374151', 
            padding: '0.125rem 0.25rem', 
            borderRadius: '0.25rem',
            fontSize: '0.875rem'
          }}>
            {children}
          </code>
        ) : (
          <pre style={{ 
            backgroundColor: '#1f2937', 
            padding: '1rem', 
            borderRadius: '0.5rem',
            overflow: 'auto',
            margin: '0.5rem 0'
          }}>
            <code>{children}</code>
          </pre>
        );
      },
      blockquote: ({ children }) => (
        <blockquote style={{ 
          borderLeft: '4px solid #6b7280', 
          paddingLeft: '1rem', 
          margin: '0.5rem 0',
          fontStyle: 'italic'
        }}>
          {children}
        </blockquote>
      ),
    }}
  >
    {content}
  </Markdown>
));

MarkdownRenderer.displayName = 'MarkdownRenderer';

// Componente memoizado para mensajes
const MessageComponent = memo(({ 
  message, 
  isUser, 
  userImage, 
  providerName, 
  formatTime 
}: {
  message: any;
  isUser: boolean;
  userImage?: string;
  providerName?: string;
  formatTime: (date: Date) => string;
}) => (
  <div className={cn(
    "flex gap-3 rounded-lg p-4",
    isUser ? "bg-blue-900/20 ml-8" : "bg-gray-800/50 mr-8"
  )}>
    <Avatar className="h-8 w-8 shrink-0">
      {isUser ? (
        <AvatarImage src={userImage} />
      ) : (
        <AvatarFallback className="bg-green-900">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      )}
    </Avatar>
    <div className="flex-1 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {isUser ? 'Tú' : providerName || 'Asistente'}
        </span>
        <span className="text-xs text-gray-400">
          {formatTime(new Date(message.timestamp))}
        </span>
      </div>
      <div className="prose prose-invert max-w-none">
        {isUser ? (
          <p style={{ margin: 0 }}>{message.content}</p>
        ) : (
          <MarkdownRenderer content={message.content} />
        )}
      </div>
    </div>
  </div>
));

MessageComponent.displayName = 'MessageComponent';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export default function ChatGPT() {
  // Clerk hooks para autenticación
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  
  // Hook para gestión de conversaciones con persistencia
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    updateConversationTitle,
    deleteConversation,
    addMessage,
    isLoading,
    error: dbError
  } = useConversations();
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingMessage, setTypingMessage] = useState(''); // Estado para el mensaje en escritura
  const [shouldStopTyping, setShouldStopTyping] = useState(false);
  const shouldStopRef = useRef(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [llmConfigDialogOpen, setLlmConfigDialogOpen] = useState(false);
  const [llmConfig, setLlmConfig] = useState<LLMConfig>({
    providerId: 'openai',
    model: 'gpt-3.5-turbo',
    apiKey: '',
    temperature: 0.7,
    maxTokens: 1000,
  });
  const [error, setError] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load configuration from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai-api-key');
    const savedConfig = localStorage.getItem('llm-config');
    
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setLlmConfig(parsedConfig);
        setApiKey(parsedConfig.apiKey || '');
      } catch (error) {
        console.error('Error parsing saved config:', error);
      }
    } else if (savedApiKey) {
      const migratedConfig: LLMConfig = {
        providerId: 'openai',
        model: 'gpt-3.5-turbo',
        apiKey: savedApiKey,
        temperature: 0.7,
        maxTokens: 1000,
      };
      setLlmConfig(migratedConfig);
      setApiKey(savedApiKey);
      localStorage.setItem('llm-config', JSON.stringify(migratedConfig));
    } else {
      setLlmConfigDialogOpen(true);
    }
  }, []);

  // Create initial conversation if none exist and user is loaded
  useEffect(() => {
    if (isLoaded && isSignedIn && conversations.length === 0 && !isLoading) {
      createConversation("Nueva conversación");
    }
  }, [isLoaded, isSignedIn, conversations.length, isLoading, createConversation]);

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const currentProvider = getProviderById(llmConfig.providerId);

  // Optimizar scroll con throttle
  const scrollToBottomThrottled = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    };
  }, []);

  useEffect(() => {
    scrollToBottomThrottled();
  }, [activeConversation?.messages?.length, isTyping, scrollToBottomThrottled]);

  const handleApiKeySubmit = useCallback((newApiKey: string) => {
    setApiKey(newApiKey);
    const updatedConfig = { ...llmConfig, apiKey: newApiKey };
    setLlmConfig(updatedConfig);
    localStorage.setItem('openai-api-key', newApiKey);
    localStorage.setItem('llm-config', JSON.stringify(updatedConfig));
    setError('');
  }, [llmConfig]);

  const handleLlmConfigSubmit = useCallback((newConfig: LLMConfig) => {
    setLlmConfig(newConfig);
    setApiKey(newConfig.apiKey || '');
    localStorage.setItem('llm-config', JSON.stringify(newConfig));
    setError('');
  }, []);

  const generateTitle = useCallback((firstMessage: string): string => {
    return firstMessage.length > 30 
      ? firstMessage.substring(0, 30) + '...'
      : firstMessage;
  }, []);

  const callLLM = useCallback(async (messages: Message[]): Promise<string> => {
    if (currentProvider?.requiresApiKey && !llmConfig.apiKey) {
      throw new Error('API key not provided');
    }

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        config: llmConfig,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get response');
    }

    return data.message.content;
  }, [currentProvider, llmConfig]);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || !activeConversation || isTyping) return;

    if (currentProvider?.requiresApiKey && !llmConfig.apiKey) {
      setLlmConfigDialogOpen(true);
      return;
    }

    const userMessage = {
      content: input.trim(),
      role: 'user' as const,
    };

    const isFirstMessage = activeConversation.messages.filter(m => m.role === 'user').length === 0;

    try {
      // Agregar mensaje del usuario a la base de datos
      await addMessage(activeConversationId!, userMessage.role, userMessage.content);
      
      // Actualizar título si es el primer mensaje
      if (isFirstMessage) {
        await updateConversationTitle(activeConversationId!, generateTitle(userMessage.content));
      }

      setInput('');
      setIsTyping(true);
      setTypingMessage(''); // Limpiar mensaje de escritura anterior
      setShouldStopTyping(false);
      shouldStopRef.current = false;
      setError('');

      const allMessages = [...activeConversation.messages, {
        id: 'temp',
        content: userMessage.content,
        role: userMessage.role,
        timestamp: new Date()
      }];
      
      const aiResponseContent = await callLLM(allMessages);

      // Efecto de escritura optimizado
      let displayed = '';
      const charsPerStep = 12; // Más caracteres para tablas
      let updateCounter = 0;
      
      for (let i = 0; i < aiResponseContent.length; i += charsPerStep) {
        if (shouldStopRef.current) {
          displayed = aiResponseContent; // Mostrar todo si se detiene
          break;
        }

        displayed += aiResponseContent.slice(i, i + charsPerStep);
        updateCounter++;
        
        // Actualizar UI solo cada 3 iteraciones para reducir re-renders
        if (updateCounter % 3 === 0 || i + charsPerStep >= aiResponseContent.length) {
          setTypingMessage(displayed);
          await new Promise(res => setTimeout(res, 10)); // Ligeramente más lento pero más suave
        }
      }

      // Asegurar que se muestra el contenido final
      if (displayed !== aiResponseContent) {
        setTypingMessage(aiResponseContent);
        await new Promise(res => setTimeout(res, 50));
      }

      // Guardar el mensaje final en la base de datos
      await addMessage(activeConversationId!, 'assistant', displayed);

    } catch (error: any) {
      console.error('Error calling LLM:', error);
      setError(error.message || 'Failed to get response from AI');
      if (error.message.includes('API key') || error.message.includes('Invalid')) {
        setLlmConfigDialogOpen(true);
      }
    } finally {
      setIsTyping(false);
      setTypingMessage(''); // Limpiar mensaje de escritura
      setShouldStopTyping(false);
      shouldStopRef.current = false;
    }
  }, [input, activeConversation, isTyping, currentProvider, llmConfig, activeConversationId, addMessage, updateConversationTitle, callLLM, generateTitle]);

  // Función para detener el efecto de escritura
  const handleStopTyping = useCallback(() => {
    setShouldStopTyping(true);
    shouldStopRef.current = true;
  }, []);

  const handleNewConversation = useCallback(async () => {
    await createConversation("Nueva conversación");
    setSidebarOpen(false);
    setError('');
  }, [createConversation]);

  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }, []);

  const hasValidConfig = currentProvider && (!currentProvider.requiresApiKey || llmConfig.apiKey);

  // Mostrar loading mientras Clerk se inicializa
  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
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
              onClick={() => window.location.href = '/sign-in'} 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Iniciar Sesión
            </Button>
            <Button 
              onClick={() => window.location.href = '/sign-up'} 
              variant="outline" 
              className="w-full"
            >
              Registrarse
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Sidebar */}
      <div className={cn(
        "flex flex-col w-64 bg-gray-900 border-r border-gray-700 transition-all duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">Dream Reader</h1>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSidebarOpen(false)}
            className="md:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* New conversation button */}
        <div className="p-4">
          <Button 
            onClick={handleNewConversation} 
            className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-600"
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva conversación
          </Button>
        </div>

        {/* Conversations list */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <Button
                key={conversation.id}
                variant={conversation.id === activeConversationId ? "secondary" : "ghost"}
                className="w-full justify-start text-left h-auto p-3"
                onClick={() => setActiveConversationId(conversation.id)}
              >
                <div className="flex-1 truncate">
                  <div className="font-medium truncate">{conversation.title}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {conversation.messages.length} mensajes
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>

        {/* User info and settings */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.firstName || user?.emailAddresses[0]?.emailAddress}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLlmConfigDialogOpen(true)}>
                  <Zap className="h-4 w-4 mr-2" />
                  Configurar LLM
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSidebarOpen(true)}
              className="md:hidden"
            >
              <Menu className="h-4 w-4" />
            </Button>
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
          
          {!hasValidConfig && (
            <Button 
              onClick={() => setLlmConfigDialogOpen(true)}
              variant="outline"
              size="sm"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurar
            </Button>
          )}
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {activeConversation ? (
            <div className="space-y-4 max-w-4xl mx-auto">
              {activeConversation.messages.map((message) => (
                <MessageComponent
                  key={message.id}
                  message={message}
                  isUser={message.role === 'user'}
                  userImage={user?.imageUrl}
                  providerName={currentProvider?.name}
                  formatTime={formatTime}
                />
              ))}
              
              {isTyping && (
                <div className="flex gap-3 rounded-lg p-4 bg-gray-800/50 mr-8">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-green-900">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {currentProvider?.name || 'Asistente'}
                      </span>
                      {typingMessage ? (
                        <span className="text-xs text-gray-400">escribiendo...</span>
                      ) : (
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      )}
                    </div>
                    {typingMessage && (
                      <div className="prose prose-invert max-w-none">
                        <MarkdownRenderer content={typingMessage + '|'} />
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : (
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
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={
                    hasValidConfig 
                      ? "Escribe tu mensaje..." 
                      : "Configura tu API key primero..."
                  }
                  disabled={!hasValidConfig || isTyping}
                  className="flex-1 bg-gray-800 border-gray-600 focus:border-blue-500"
                />
                
                {isTyping ? (
                  <Button 
                    onClick={handleStopTyping}
                    variant="outline"
                    className="px-3"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!input.trim() || !hasValidConfig}
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

      {/* Dialogs */}
      <ApiKeyDialog
        open={apiKeyDialogOpen}
        onOpenChange={setApiKeyDialogOpen}
        onApiKeySubmit={handleApiKeySubmit}
        currentApiKey={apiKey}
      />
      
      <LLMConfigDialog
        open={llmConfigDialogOpen}
        onOpenChange={setLlmConfigDialogOpen}
        onConfigSubmit={handleLlmConfigSubmit}
        currentConfig={llmConfig}
      />
    </div>
  );
}
