'use client'
import DashboardHeader from '@/components/dashboard-header'
import { Sidebar } from '@/components/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { useConversations } from '@/context/conversations-context'
import useChatMessages from '@/hooks/useChatMessages'
import useLLMConfig from '@/hooks/useLLMConfig'
import { getProviderById } from '@/lib/llm-providers'
import React from 'react'

export default function DashboardContent ({
  children,
  locale
}: {
  children: React.ReactNode
  locale?: string
}) {
  // ✅ Ahora SÍ está dentro del ConversationsProvider
  const { activeConversation, inputRef, setError } = useChatMessages()
  const { isLoading } = useConversations()
  const llmConfig = useLLMConfig()
  const currentProvider = getProviderById(llmConfig.providerId)

  return (
    <div className="flex h-screen text-white">
      <Sidebar ref={inputRef} setError={setError} locale={locale} />
      <main className="flex-1 flex flex-col">
        <DashboardHeader
          activeConversation={activeConversation}
          isLoading={isLoading}
          currentProvider={currentProvider}
          llmConfig={llmConfig}
        />
        {children}
      </main>
      <Toaster position="top-right" richColors />
    </div>
  )
}
