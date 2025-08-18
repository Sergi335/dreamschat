'use client'

import ChatInput from '@/components/chatInput'
import { ChatMessages } from '@/components/chatMessages'
import DashboardHeader from '@/components/dashboard-header'
import { Sidebar } from '@/components/sidebar'
import { ScrollArea } from '@/components/ui/scroll-area'
import useChatMessages from '@/hooks/useChatMessages'
import useLLMConfig from '@/hooks/useLLMConfig'
import { getProviderById } from '@/lib/llm-providers'
import { useTranslations } from 'next-intl'

export default function Dashboard () {
  const {
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
  } = useChatMessages()
  const llmConfig = useLLMConfig()
  const t = useTranslations()

  const currentProvider = getProviderById(llmConfig.providerId)

  return (
    <div className="flex h-screen text-white">
      <Sidebar ref={inputRef} setError={setError} />
      <main className="flex-1 flex flex-col">
        <DashboardHeader
          activeConversation={activeConversation}
          currentProvider={currentProvider}
          llmConfig={llmConfig}
        />
        <ScrollArea className={(isTyping || hasMessages) ? 'flex-1 p-4' : 'flex-1 p-4 max-h-[255px]'}>
          <ChatMessages
            uniqueMessages={uniqueMessages}
            user={user || null}
            formatTime={formatTime}
            ref={messagesEndRef}
          />
        </ScrollArea>
        {activeConversation && (
          <div className="pt-4 pb-12 px-4">
            {error && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-200">
                {error}
              </div>
            )}
            {
              (!isTyping && !hasMessages) && <h2 className="text-4xl font-semibold text-center text-zinc-400 pb-8">{t('whatAreYouThinking')}</h2>
            }
            <ChatInput
              input={input}
              setInput={setInput}
              handleSendMessage={handleSendMessage}
              isTyping={isTyping}
              handleStopTyping={handleStopTyping}
              submitStatus={submitStatus}
            />
          </div>
        )}
      </main>
    </div>
  )
}
