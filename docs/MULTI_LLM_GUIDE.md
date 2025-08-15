# Dream Reader - Multi-LLM Chat Interface

Una interfaz de chat moderna que soporta múltiples proveedores de LLM con APIs compatibles con el estándar OpenAI.

## Proveedores Soportados

### 🤖 OpenAI
- **Modelos**: GPT-3.5 Turbo, GPT-4, GPT-4 Turbo, GPT-4o, GPT-4o Mini
- **API Key**: Obtén tu clave desde [OpenAI Platform](https://platform.openai.com/api-keys)
- **Formato**: `sk-...`

### 🧠 Anthropic (Claude)
- **Modelos**: Claude 3 Sonnet, Claude 3 Opus, Claude 3 Haiku, Claude 3.5 Sonnet
- **API Key**: Obtén tu clave desde [Anthropic Console](https://console.anthropic.com/)
- **Formato**: `sk-ant-...`

### ⚡ Groq
- **Modelos**: Mixtral 8x7B, Llama2 70B, Gemma 7B, Llama3 8B/70B
- **API Key**: Obtén tu clave desde [Groq Console](https://console.groq.com/keys)
- **Formato**: `gsk_...`
- **Ventaja**: Inferencia ultra-rápida

### 🌐 Together AI
- **Modelos**: Meta Llama 2, Mixtral, Nous Hermes
- **API Key**: Obtén tu clave desde [Together AI](https://api.together.xyz/settings/api-keys)
- **Ventaja**: Modelos open source

### 🏠 Ollama (Local)
- **Modelos**: Llama2, CodeLlama, Mistral, Mixtral
- **Setup**: Instala [Ollama](https://ollama.ai/) y ejecuta `ollama serve`
- **Ventaja**: Ejecuta modelos localmente, sin API key requerida

### 🔍 Perplexity AI
- **Modelos**: Llama 3.1 Sonar (Small/Large/Huge)
- **API Key**: Obtén tu clave desde [Perplexity Settings](https://www.perplexity.ai/settings/api)
- **Formato**: `pplx-...`
- **Ventaja**: Modelos con capacidades de búsqueda

### 🎯 Google Gemini
- **Modelos**: Gemini 1.5 Flash, Gemini 1.5 Pro, Gemini 1.0 Pro
- **API Key**: Obtén tu clave desde [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Formato**: `AIza...`
- **Ventaja**: Modelos multimodales de Google

## Características

- ✅ **Interfaz unificada** para todos los proveedores
- ✅ **Configuración per-proveedor** con temperatura y max tokens ajustables
- ✅ **URLs base personalizables** para proxies o deployments privados
- ✅ **Almacenamiento local** de configuraciones (no se envían a nuestros servidores)
- ✅ **Migración automática** desde configuraciones anteriores
- ✅ **Manejo de errores** específico por proveedor
- ✅ **Detección automática** de problemas de conectividad
- ✅ **Compatibilidad con Ollama** para uso local

## Cómo usar

1. **Configurar Proveedor**: Haz clic en el ícono ⚡ para abrir la configuración
2. **Seleccionar Proveedor**: Elige tu proveedor preferido de LLM
3. **Agregar API Key**: Ingresa tu clave API (si es requerida)
4. **Seleccionar Modelo**: Elige el modelo específico que deseas usar
5. **Ajustar Configuración**: Opcional - ajusta temperatura y max tokens
6. **¡Chatear!**: Comienza a conversar con tu modelo seleccionado

## URLs Base Personalizadas

Puedes usar URLs base personalizadas para:
- Proxies OpenAI-compatibles
- Deployments privados
- Servicios auto-hospedados
- Gateways de API personalizados

## Ejemplos de Configuración

### Para usar Ollama localmente:
```
Proveedor: Ollama (Local)
Modelo: llama2
URL Base: http://localhost:11434/v1
API Key: No requerida
```

### Para usar un proxy OpenAI:
```
Proveedor: OpenAI
Modelo: gpt-3.5-turbo
URL Base: https://tu-proxy.com/v1
API Key: tu-api-key
```

## Notas de Seguridad

- 🔒 Las API keys se almacenan solo en tu navegador
- 🔒 Nunca enviamos tus claves a nuestros servidores
- 🔒 Las requests van directamente a tu proveedor seleccionado
- 🔒 Puedes usar el modo local con Ollama para máxima privacidad

## Solución de Problemas

### Error de conexión con Ollama
Asegúrate de que Ollama esté ejecutándose:
```bash
ollama serve
```

### Error 401 - API Key inválida
Verifica que tu API key sea correcta y tenga los permisos necesarios.

### Error 429 - Rate limit
Algunos proveedores tienen límites de rate. Espera un momento antes de reintentar.

### Error 503 - Servicio no disponible
El proveedor puede estar experimentando problemas. Intenta con otro proveedor.
