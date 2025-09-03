'use client'
// import type { Metadata } from 'next'
// import { Inter } from 'next/font/google'
import DashboardHeader from '@/components/dashboard-header'
import { Sidebar } from '@/components/sidebar'
import useChatMessages from '@/hooks/useChatMessages'
import useLLMConfig from '@/hooks/useLLMConfig'
import { getProviderById } from '@/lib/llm-providers'
import { useParams } from 'next/navigation'
import React from 'react'
// import './globals.css'

// const inter = Inter({ subsets: ['latin'] })

// export const metadata: Metadata = {
//   title: 'Dream Reader - AI Chat Interface',
//   description: 'A modern multi-LLM chat interface with authentication'
// }

export default function RootLayout ({ children }: {children: React.ReactNode}) {
  const { activeConversation, inputRef, setError } = useChatMessages()
  const llmConfig = useLLMConfig()
  const currentProvider = getProviderById(llmConfig.providerId)
  const params = useParams()
  const { locale } = params

  return (

    <div className="flex h-screen text-white">
      <Sidebar ref={inputRef} setError={setError} locale={locale?.toString()} />
      <main className="flex-1 flex flex-col">
        <DashboardHeader
          activeConversation={activeConversation}
          currentProvider={currentProvider}
          llmConfig={llmConfig}
        />
        {children}
      </main>
    </div>

  )
}
