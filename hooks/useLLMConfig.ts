export default function useLLMConfig () {
  const llmConfig = {
    providerId: process.env.NEXT_PUBLIC_LLM_PROVIDER || 'openai',
    model: process.env.NEXT_PUBLIC_LLM_MODEL || 'gpt-3.5-turbo',
    temperature: parseFloat(process.env.NEXT_PUBLIC_LLM_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.NEXT_PUBLIC_LLM_MAX_TOKENS || '1000'),
    customBaseURL: process.env.NEXT_PUBLIC_LLM_BASE_URL || undefined
  }

  return llmConfig
}
