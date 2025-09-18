import { vi } from 'vitest'

export const mockLLMProviders = {
  callOpenAI: vi.fn(),
  callClaude: vi.fn(),
  callGemini: vi.fn(),
  callLLM: vi.fn()
}

// Mock de los proveedores de LLM
vi.mock('@/lib/llm-providers', () => ({
  callOpenAI: mockLLMProviders.callOpenAI,
  callClaude: mockLLMProviders.callClaude,
  callGemini: mockLLMProviders.callGemini,
  callLLM: mockLLMProviders.callLLM
}))

export default mockLLMProviders
