export interface LLMProvider {
  id: string;
  name: string;
  baseURL: string;
  defaultModel: string;
  availableModels: string[];
  apiKeyFormat: string; // Formato esperado de la API key
  requiresApiKey: boolean;
  maxTokens?: number;
  supportsStreaming?: boolean;
}

export const LLM_PROVIDERS: Record<string, LLMProvider> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-3.5-turbo',
    availableModels: [
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k',
      'gpt-4',
      'gpt-4-turbo',
      'gpt-4o',
      'gpt-4o-mini'
    ],
    apiKeyFormat: 'sk-...',
    requiresApiKey: true,
    maxTokens: 4096,
    supportsStreaming: true,
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    baseURL: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-sonnet-20240229',
    availableModels: [
      'claude-3-sonnet-20240229',
      'claude-3-opus-20240229',
      'claude-3-haiku-20240307',
      'claude-3-5-sonnet-20241022'
    ],
    apiKeyFormat: 'sk-ant-...',
    requiresApiKey: true,
    maxTokens: 4096,
    supportsStreaming: true,
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    baseURL: 'https://api.groq.com/openai/v1',
    defaultModel: 'mixtral-8x7b-32768',
    availableModels: [
      'mixtral-8x7b-32768',
      'llama2-70b-4096',
      'gemma-7b-it',
      'llama3-8b-8192',
      'llama3-70b-8192'
    ],
    apiKeyFormat: 'gsk_...',
    requiresApiKey: true,
    maxTokens: 8192,
    supportsStreaming: true,
  },
  together: {
    id: 'together',
    name: 'Together AI',
    baseURL: 'https://api.together.xyz/v1',
    defaultModel: 'meta-llama/Llama-2-70b-chat-hf',
    availableModels: [
      'meta-llama/Llama-2-70b-chat-hf',
      'meta-llama/Llama-2-13b-chat-hf',
      'mistralai/Mixtral-8x7B-Instruct-v0.1',
      'NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO'
    ],
    apiKeyFormat: '...',
    requiresApiKey: true,
    maxTokens: 4096,
    supportsStreaming: true,
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama (Local)',
    baseURL: 'http://localhost:11434/v1',
    defaultModel: 'llama2',
    availableModels: [
      'llama2',
      'llama2:13b',
      'llama2:70b',
      'codellama',
      'mistral',
      'mixtral'
    ],
    apiKeyFormat: 'no-key-required',
    requiresApiKey: false,
    maxTokens: 4096,
    supportsStreaming: true,
  },
  perplexity: {
    id: 'perplexity',
    name: 'Perplexity AI',
    baseURL: 'https://api.perplexity.ai',
    defaultModel: 'llama-3.1-sonar-small-128k-online',
    availableModels: [
      'llama-3.1-sonar-small-128k-online',
      'llama-3.1-sonar-large-128k-online',
      'llama-3.1-sonar-huge-128k-online'
    ],
    apiKeyFormat: 'pplx-...',
    requiresApiKey: true,
    maxTokens: 4096,
    supportsStreaming: true,
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.5-flash-lite',
    availableModels: [
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.5-pro',
    ],
    apiKeyFormat: 'AIza...',
    requiresApiKey: true,
    maxTokens: 8192,
    supportsStreaming: true,
  }
};

export interface LLMConfig {
  providerId: string;
  model: string;
  apiKey?: string;
  customBaseURL?: string;
  temperature?: number;
  maxTokens?: number;
}

export const getProviderById = (id: string): LLMProvider | undefined => {
  return LLM_PROVIDERS[id];
};

export const getAllProviders = (): LLMProvider[] => {
  return Object.values(LLM_PROVIDERS);
};
