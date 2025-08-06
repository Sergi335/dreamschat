import { LLMConfig, getProviderById } from '@/lib/llm-providers';
import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { messages, config }: { messages: any[], config: LLMConfig } = await request.json();

    if (!config) {
      return NextResponse.json(
        { error: 'LLM configuration is required' },
        { status: 400 }
      );
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const provider = getProviderById(config.providerId);
    
    if (!provider) {
      return NextResponse.json(
        { error: 'Invalid provider ID' },
        { status: 400 }
      );
    }

    // Validar API key si es requerida
    if (provider.requiresApiKey && !config.apiKey) {
      return NextResponse.json(
        { error: `API key is required for ${provider.name}` },
        { status: 400 }
      );
    }

    // Configurar el cliente OpenAI con el endpoint personalizado
    const baseURL = config.customBaseURL || provider.baseURL;
    const apiKey = config.apiKey || 'no-key-required';

    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: baseURL,
    });

    // Preparar parámetros de la request
    const requestParams: any = {
      model: config.model || provider.defaultModel,
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: config.temperature || 0.7,
      max_tokens: config.maxTokens || provider.maxTokens || 1000,
    };

    // Manejar casos especiales para diferentes proveedores
    if (config.providerId === 'anthropic') {
      // Anthropic usa un formato diferente, pero muchos proxies lo convierten automáticamente
      // Si estás usando un proxy OpenAI-compatible para Anthropic, esto debería funcionar
    }

    const completion = await client.chat.completions.create(requestParams);

    const responseMessage = completion.choices[0]?.message;

    if (!responseMessage) {
      return NextResponse.json(
        { error: `No response from ${provider.name}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: {
        role: responseMessage.role,
        content: responseMessage.content,
      },
    });
  } catch (error: any) {
    console.error('LLM API error:', error);
    
    // Manejar errores comunes
    if (error.code === 'invalid_api_key' || error.status === 401) {
      return NextResponse.json(
        { error: 'Invalid API key. Please check your API key.' },
        { status: 401 }
      );
    }
    
    if (error.code === 'insufficient_quota' || error.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded or insufficient quota.' },
        { status: 429 }
      );
    }

    if (error.code === 'model_not_found' || error.status === 404) {
      return NextResponse.json(
        { error: 'Model not found or not available.' },
        { status: 404 }
      );
    }

    // Error de conexión (típico para Ollama u otros servicios locales)
    if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { error: 'Cannot connect to the LLM service. Make sure it is running.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to get response from AI' },
      { status: 500 }
    );
  }
}