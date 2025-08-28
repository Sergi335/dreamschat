'use client'
import { Conversation } from '@/lib/database'
import { LLMProvider } from '@/lib/llm-providers'
import { llmConfig } from '@/types/llmconfig.types'
import { usePathname } from 'next/navigation'

export default function DashboardHeader ({ activeConversation, currentProvider, llmConfig }: { activeConversation: Conversation | undefined, currentProvider: LLMProvider | undefined, llmConfig: llmConfig; }) {
  const pathname = usePathname()
  const path = pathname.split('/')[2]
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center space-x-3">
        <div>
          {
            path === 'dashboard'
              ? (
                <>
                  <h2 className="font-semibold">
                    {activeConversation?.title || 'Selecciona una conversación'}
                  </h2>
                  {currentProvider && (
                    <p className="text-sm text-gray-400">
                      {currentProvider.name} - {llmConfig.model}
                    </p>
                  )}
                </>
              )
              : (
                <>
                  <h2 className="font-semibold">
                    Calendario de Sueños
                  </h2>
                </>
              )
          }
        </div>
      </div>
    </div>
  )
}
