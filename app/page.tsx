"use client";

import { ApiKeyDialog } from '@/components/api-key-dialog';
import { LLMConfigDialog } from '@/components/llm-config-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LLMConfig, getProviderById } from '@/lib/llm-providers';
import { cn } from '@/lib/utils';
import { Bot, Menu, MessageSquare, Plus, Send, Settings, User, X, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
}

export default function ChatGPT() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
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
    // Load old API key for backward compatibility
    const savedApiKey = localStorage.getItem('openai-api-key');
    
    // Load LLM configuration
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
      // Migrate old API key to new format
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

  // Create initial conversation if none exist
  useEffect(() => {
    if (conversations.length === 0) {
      createNewConversation();
    }
  }, [conversations.length]);

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const currentProvider = getProviderById(llmConfig.providerId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages, isTyping]);

  const handleApiKeySubmit = (newApiKey: string) => {
    setApiKey(newApiKey);
    const updatedConfig = { ...llmConfig, apiKey: newApiKey };
    setLlmConfig(updatedConfig);
    localStorage.setItem('openai-api-key', newApiKey);
    localStorage.setItem('llm-config', JSON.stringify(updatedConfig));
    setError('');
  };

  const handleLlmConfigSubmit = (newConfig: LLMConfig) => {
    setLlmConfig(newConfig);
    setApiKey(newConfig.apiKey || '');
    localStorage.setItem('llm-config', JSON.stringify(newConfig));
    setError('');
  };

  const generateTitle = (firstMessage: string): string => {
    return firstMessage.length > 30 
      ? firstMessage.substring(0, 30) + '...'
      : firstMessage;
  };

  const callLLM = async (messages: Message[]): Promise<string> => {
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
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !activeConversation || isTyping) return;

    if (currentProvider?.requiresApiKey && !llmConfig.apiKey) {
      setLlmConfigDialogOpen(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    // Update conversation title if it's the first user message
    const isFirstMessage = activeConversation.messages.filter(m => m.role === 'user').length === 0;
    
    // Add user message
    setConversations(prev => prev.map(conv => 
      conv.id === activeConversationId 
        ? { 
            ...conv, 
            title: isFirstMessage ? generateTitle(userMessage.content) : conv.title,
            messages: [...conv.messages, userMessage],
            lastUpdated: new Date()
          }
        : conv
    ));

    setInput('');
    setIsTyping(true);
    setError('');

    try {
      // Get all messages for context
      const allMessages = [...activeConversation.messages, userMessage];
      const aiResponseContent = await callLLM(allMessages);

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponseContent,
        role: 'assistant',
        timestamp: new Date(),
      };

      setConversations(prev => prev.map(conv => 
        conv.id === activeConversationId 
          ? { 
              ...conv, 
              messages: [...conv.messages, aiResponse],
              lastUpdated: new Date()
            }
          : conv
      ));
    } catch (error: any) {
      console.error('Error calling LLM:', error);
      setError(error.message || 'Failed to get response from AI');
      
      // If it's an API key error, open the config dialog
      if (error.message.includes('API key') || error.message.includes('Invalid')) {
        setLlmConfigDialogOpen(true);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      lastUpdated: new Date(),
    };

    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
    setSidebarOpen(false);
    setError('');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Initialize first conversation if none exist
  useEffect(() => {
    if (conversations.length === 0) {
      createNewConversation();
    }
  }, [conversations.length]);

  const hasValidConfig = currentProvider && (!currentProvider.requiresApiKey || llmConfig.apiKey);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* API Key Dialog (for backward compatibility) */}
      <ApiKeyDialog
        open={apiKeyDialogOpen}
        onOpenChange={setApiKeyDialogOpen}
        onApiKeySubmit={handleApiKeySubmit}
        currentApiKey={apiKey}
      />

      {/* LLM Configuration Dialog */}
      <LLMConfigDialog
        open={llmConfigDialogOpen}
        onOpenChange={setLlmConfigDialogOpen}
        onConfigSubmit={handleLlmConfigSubmit}
        currentConfig={llmConfig}
      />

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-80 bg-gray-950 border-r border-gray-800 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold">Dream Reader</h1>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLlmConfigDialogOpen(true)}
                  className="text-gray-400 hover:text-white"
                >
                  <Zap className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* New Chat Button */}
          <div className="p-4">
            <Button
              onClick={createNewConversation}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-600"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>

          {/* Provider Status */}
          <div className="px-4 pb-4">
            <div className={cn(
              "text-xs p-2 rounded-lg border",
              hasValidConfig 
                ? "bg-green-900/20 border-green-800 text-green-400" 
                : "bg-red-900/20 border-red-800 text-red-400"
            )}>
              {hasValidConfig ? (
                <div>
                  <div className="flex items-center gap-1">
                    ✓ {currentProvider?.name} Connected
                  </div>
                  <div className="text-xs mt-1 opacity-75">
                    Model: {llmConfig.model}
                  </div>
                </div>
              ) : (
                "⚠ Configuration Required"
              )}
            </div>
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1 px-2">
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => {
                    setActiveConversationId(conversation.id);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-colors group hover:bg-gray-800",
                    activeConversationId === conversation.id 
                      ? "bg-gray-800 text-white" 
                      : "text-gray-300"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 truncate">
                      <div className="font-medium text-sm truncate">
                        {conversation.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {conversation.messages.length} messages
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-800 p-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">
                {activeConversation?.title || 'Chat'}
              </h2>
              <p className="text-sm text-gray-400">
                {activeConversation?.messages.length || 0} messages
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLlmConfigDialogOpen(true)}
              className="text-gray-400 hover:text-white"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Welcome Message */}
            {activeConversation?.messages.length === 0 && (
              <div className="text-center py-12">
                <Bot className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">
                  Welcome to Dream Reader
                </h3>
                <p className="text-gray-500 mb-4">
                  Start a conversation with AI. Choose your preferred model provider and start chatting.
                </p>
                {!hasValidConfig && (
                  <Button
                    onClick={() => setLlmConfigDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Configure AI Provider
                  </Button>
                )}
              </div>
            )}

            {activeConversation?.messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start space-x-4",
                  message.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                
                <div className={cn(
                  "max-w-xs sm:max-w-md lg:max-w-2xl px-4 py-3 rounded-2xl",
                  message.role === 'user' 
                    ? "bg-blue-600 text-white ml-auto" 
                    : "bg-gray-800 text-gray-100"
                )}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-60 mt-2">
                    {formatTime(message.timestamp)}
                  </p>
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-gray-800 text-gray-100 px-4 py-3 rounded-2xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-lg">
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-gray-800 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={hasValidConfig ? "Type your message here..." : "Configure your AI provider to start chatting..."}
                  className="w-full bg-gray-800 border-gray-700 text-white placeholder-gray-400 pr-12 focus:border-blue-500 focus:ring-blue-500"
                  disabled={isTyping || !hasValidConfig}
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isTyping || !hasValidConfig}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {hasValidConfig 
                ? "Press Enter to send, Shift + Enter for new line" 
                : `Configure your ${currentProvider?.name || 'AI'} provider to start chatting`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}