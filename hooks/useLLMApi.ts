// hooks/useLLMApi.ts
import { Message } from '@/types/message.types'
import { useCallback } from 'react'
import useLLMConfig from './useLLMConfig'

export function useLLMApi () {
  const llmConfig = useLLMConfig()

  const callLLM = useCallback(async (messages: Message[]): Promise<string> => {
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

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get response')
    }

    return data.message.content
  }, [llmConfig])

  return { callLLM }
}
