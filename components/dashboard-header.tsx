import { Conversation } from '@/lib/database'
import { LLMProvider } from '@/lib/llm-providers'
import { llmConfig } from '@/types/llmconfig.types'

export default function DashboardHeader ({ activeConversation, currentProvider, llmConfig }: { activeConversation: Conversation | undefined, currentProvider: LLMProvider | undefined, llmConfig: llmConfig; }) {
  return (
    <div className="flex items-center justify-between p-4 min-h-20">
      <div className="flex items-center space-x-3">
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
  )
}
