# Dream Reader - Chat Multi-LLM

Una aplicación de chat inteligente que soporta múltiples proveedores de modelos de lenguaje (LLM) con autenticación y persistencia de conversaciones.

## Características

- 🤖 **Multi-LLM Support**: Compatible con 7 proveedores diferentes
- 🔐 **Autenticación**: Integrado con Clerk para gestión de usuarios
- 💾 **Persistencia**: Base de datos Supabase para guardar conversaciones
- ⚡ **Performance**: Componentes optimizados con memoización
- 🎨 **UI Moderna**: Interfaz oscura con Tailwind CSS
- 📱 **Responsive**: Funciona en desktop y móvil

## Proveedores LLM Soportados

1. **OpenAI** - GPT-3.5, GPT-4, GPT-4o
2. **Anthropic** - Claude modelos
3. **Groq** - Llama, Mixtral modelos ultra-rápidos
4. **Together AI** - Modelos open source
5. **Ollama** - Modelos locales
6. **Perplexity** - Modelos con búsqueda web
7. **Google Gemini** - Gemini Pro

## Configuración

### 1. Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=tu_clerk_publishable_key
CLERK_SECRET_KEY=tu_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key

# LLM Configuration
# Proveedor: openai, anthropic, groq, together, ollama, perplexity, gemini
NEXT_PUBLIC_LLM_PROVIDER=openai
NEXT_PUBLIC_LLM_MODEL=gpt-3.5-turbo
LLM_API_KEY=tu_api_key_aqui
# URL base personalizada (opcional, usar solo si necesitas un proxy o endpoint diferente)
NEXT_PUBLIC_LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
NEXT_PUBLIC_LLM_TEMPERATURE=0.7
NEXT_PUBLIC_LLM_MAX_TOKENS=1000
```

### 2. Configuración por Proveedor

#### OpenAI
```bash
NEXT_PUBLIC_LLM_PROVIDER=openai
NEXT_PUBLIC_LLM_MODEL=gpt-3.5-turbo  # o gpt-4, gpt-4o
LLM_API_KEY=sk-...
```

#### Anthropic
```bash
NEXT_PUBLIC_LLM_PROVIDER=anthropic
NEXT_PUBLIC_LLM_MODEL=claude-3-haiku-20240307
LLM_API_KEY=sk-ant-...
```

#### Groq
```bash
NEXT_PUBLIC_LLM_PROVIDER=groq
NEXT_PUBLIC_LLM_MODEL=llama3-70b-8192
LLM_API_KEY=gsk_...
```

#### Together AI
```bash
NEXT_PUBLIC_LLM_PROVIDER=together
NEXT_PUBLIC_LLM_MODEL=meta-llama/Llama-2-70b-chat-hf
LLM_API_KEY=...
```

#### Ollama (Local)
```bash
NEXT_PUBLIC_LLM_PROVIDER=ollama
NEXT_PUBLIC_LLM_MODEL=llama2
NEXT_PUBLIC_LLM_BASE_URL=http://localhost:11434/v1
# No requiere API key para instalación local
```

#### Perplexity
```bash
NEXT_PUBLIC_LLM_PROVIDER=perplexity
NEXT_PUBLIC_LLM_MODEL=llama-3.1-sonar-large-128k-online
LLM_API_KEY=pplx-...
```

#### Google Gemini
```bash
NEXT_PUBLIC_LLM_PROVIDER=gemini
NEXT_PUBLIC_LLM_MODEL=gemini-pro
LLM_API_KEY=...
```

### 3. Configuración de URL Base Personalizada

La variable `NEXT_PUBLIC_LLM_BASE_URL` es útil para:

- **Proxies**: Si usas un proxy para acceder a los APIs
- **Ollama Local**: Para conectar a tu instancia local de Ollama
- **APIs Personalizados**: Si tienes tu propio wrapper de API
- **Endpoints Alternativos**: Para proveedores con múltiples endpoints

Ejemplos:
```bash
# Ollama local
NEXT_PUBLIC_LLM_BASE_URL=http://localhost:11434/v1

# Proxy personalizado
NEXT_PUBLIC_LLM_BASE_URL=https://my-proxy.com/v1

# OpenAI compatible API
NEXT_PUBLIC_LLM_BASE_URL=https://api.openai-compatible.com/v1
```

## Instalación

1. Clona el repositorio:
```bash
git clone <tu-repo>
cd dream-reader
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno (ver sección anterior)

4. Configura Supabase:
```sql
-- Crear tabla de conversaciones
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de mensajes
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor performance
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

5. Ejecuta el proyecto:
```bash
npm run dev
```

## Uso

1. Accede a `http://localhost:3000`
2. Inicia sesión con Clerk
3. ¡Comienza a chatear! La configuración se lee automáticamente de las variables de entorno

## Arquitectura

- **Frontend**: Next.js 15 con App Router
- **Autenticación**: Clerk
- **Base de Datos**: Supabase PostgreSQL
- **Estilos**: Tailwind CSS + Shadcn/ui
- **LLM Integration**: Cliente OpenAI compatible con múltiples proveedores

## Performance

- ✅ Componentes memoizados para evitar re-renders innecesarios
- ✅ Scroll throttling para mejor UX
- ✅ Efectos de escritura optimizados
- ✅ Renderizado Markdown optimizado con `remarkGfm`

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## Licencia

MIT License
