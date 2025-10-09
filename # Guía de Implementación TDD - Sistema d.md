# 🎯 Guía de Implementación TDD - Sistema de Sesión de Invitados (Supabase)

## 📋 Contexto

**Objetivo**: Limitar usuarios invitados a 1 conversación y 3 mensajes usando Supabase como backend.

**Stack Técnico**:
- Next.js 15 con App Router
- Supabase (PostgreSQL)
- FingerprintJS para identificación de dispositivo
- Vitest para tests
- TypeScript

**Tabla Supabase ya existente**: `guest_sessions`
```sql
CREATE TABLE guest_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  conversation_count INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  is_blocked BOOLEAN DEFAULT FALSE,
  user_agent TEXT,
  country TEXT
);
```

---

## 📁 Estructura de Archivos

```
dream-reader/
├── tests/
│   ├── unit/
│   │   ├── fingerprint.test.ts              # ← FASE 1
│   │   ├── useGuestSession.test.ts          # ← FASE 3
│   │   └── guest-message-counter.test.ts    # ← FASE 5
│   └── integration/
│       └── guest-session-api.test.ts        # ← FASE 2
├── lib/
│   └── fingerprint.ts                       # ← FASE 1
├── app/api/guest/
│   ├── session/route.ts                     # ← FASE 2
│   └── increment/route.ts                   # ← FASE 2
├── hooks/
│   └── useGuestSession.ts                   # ← FASE 3
├── components/
│   └── guest-message-counter.tsx            # ← FASE 5
└── hooks/useChatMessages.ts                 # ← FASE 4 (modificar)
```

---

## 🚀 Plan de Implementación

### FASE 1: Fingerprint (Est. 30 min) 🔐

**Objetivo**: Generar ID único por dispositivo usando FingerprintJS

#### 1.1 Instalar dependencia
```bash
npm install @fingerprintjs/fingerprintjs
```

#### 1.2 Crear test (RED)
**Archivo**: `tests/unit/fingerprint.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getFingerprint, loadFingerprint } from '@/lib/fingerprint';

describe('Fingerprint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería generar un fingerprint único', async () => {
    const fp1 = await getFingerprint();
    expect(fp1).toBeDefined();
    expect(typeof fp1).toBe('string');
    expect(fp1.length).toBeGreaterThan(10);
  });

  it('debería devolver el mismo fingerprint en múltiples llamadas', async () => {
    const fp1 = await getFingerprint();
    const fp2 = await getFingerprint();
    expect(fp1).toBe(fp2);
  });

  it('debería cargar la librería FingerprintJS', async () => {
    const fpAgent = await loadFingerprint();
    expect(fpAgent).toBeDefined();
    expect(fpAgent.get).toBeDefined();
  });

  it('debería manejar errores al generar fingerprint', async () => {
    // Simular error en FingerprintJS
    vi.mock('@fingerprintjs/fingerprintjs', () => ({
      load: vi.fn().mockRejectedValue(new Error('FP Error'))
    }));
    
    await expect(getFingerprint()).rejects.toThrow();
  });
});
```

**Verificar**: `npm test fingerprint` → ❌ FALLAN

#### 1.3 Implementar (GREEN)
**Archivo**: `lib/fingerprint.ts`

```typescript
import FingerprintJS from '@fingerprintjs/fingerprintjs';

let fpPromise: Promise<FingerprintJS.Agent> | null = null;

export async function loadFingerprint() {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load();
  }
  return fpPromise;
}

export async function getFingerprint(): Promise<string> {
  try {
    const fp = await loadFingerprint();
    const result = await fp.get();
    return result.visitorId;
  } catch (error) {
    console.error('Error generating fingerprint:', error);
    throw new Error('Failed to generate device fingerprint');
  }
}
```

**Verificar**: `npm test fingerprint` → ✅ PASAN

---

### FASE 2: API Endpoints (Est. 45 min) 🌐

**Objetivo**: Crear endpoints para validar y actualizar sesión de invitado

#### 2.1 Crear tests (RED)
**Archivo**: `tests/integration/guest-session-api.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST as sessionPOST } from '@/app/api/guest/session/route';
import { POST as incrementPOST } from '@/app/api/guest/increment/route';

describe('API /api/guest/session', () => {
  const mockFingerprint = 'test-fp-123';

  it('debería crear nueva sesión para fingerprint nuevo', async () => {
    const request = new Request('http://localhost/api/guest/session', {
      method: 'POST',
      body: JSON.stringify({ fingerprint: mockFingerprint })
    });

    const response = await sessionPOST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.conversationCount).toBe(0);
    expect(data.messageCount).toBe(0);
    expect(data.canCreateConversation).toBe(true);
    expect(data.canSendMessage).toBe(true);
  });

  it('debería retornar sesión existente', async () => {
    // Crear sesión primero
    await sessionPOST(new Request('http://localhost/api/guest/session', {
      method: 'POST',
      body: JSON.stringify({ fingerprint: mockFingerprint })
    }));

    // Obtener sesión existente
    const request = new Request('http://localhost/api/guest/session', {
      method: 'POST',
      body: JSON.stringify({ fingerprint: mockFingerprint })
    });

    const response = await sessionPOST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.fingerprint).toBe(mockFingerprint);
  });

  it('debería bloquear cuando conversation_count >= 1', async () => {
    // Simular sesión con 1 conversación
    const request = new Request('http://localhost/api/guest/session', {
      method: 'POST',
      body: JSON.stringify({ 
        fingerprint: mockFingerprint,
        conversationCount: 1 
      })
    });

    const response = await sessionPOST(request);
    const data = await response.json();

    expect(data.canCreateConversation).toBe(false);
  });

  it('debería bloquear cuando message_count >= 3', async () => {
    // Simular sesión con 3 mensajes
    const request = new Request('http://localhost/api/guest/session', {
      method: 'POST',
      body: JSON.stringify({ 
        fingerprint: mockFingerprint,
        messageCount: 3 
      })
    });

    const response = await sessionPOST(request);
    const data = await response.json();

    expect(data.canSendMessage).toBe(false);
  });
});

describe('API /api/guest/increment', () => {
  const mockFingerprint = 'test-fp-456';

  it('debería incrementar conversation_count', async () => {
    const request = new Request('http://localhost/api/guest/increment', {
      method: 'POST',
      body: JSON.stringify({ 
        fingerprint: mockFingerprint,
        type: 'conversation'
      })
    });

    const response = await incrementPOST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.conversationCount).toBe(1);
  });

  it('debería incrementar message_count', async () => {
    const request = new Request('http://localhost/api/guest/increment', {
      method: 'POST',
      body: JSON.stringify({ 
        fingerprint: mockFingerprint,
        type: 'message'
      })
    });

    const response = await incrementPOST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.messageCount).toBeGreaterThan(0);
  });

  it('debería actualizar last_activity', async () => {
    const before = new Date();
    
    await incrementPOST(new Request('http://localhost/api/guest/increment', {
      method: 'POST',
      body: JSON.stringify({ 
        fingerprint: mockFingerprint,
        type: 'message'
      })
    }));

    const session = await sessionPOST(new Request('http://localhost/api/guest/session', {
      method: 'POST',
      body: JSON.stringify({ fingerprint: mockFingerprint })
    }));
    const data = await session.json();

    const lastActivity = new Date(data.lastActivity);
    expect(lastActivity.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('debería retornar error si fingerprint no existe', async () => {
    const request = new Request('http://localhost/api/guest/increment', {
      method: 'POST',
      body: JSON.stringify({ 
        fingerprint: 'non-existent',
        type: 'message'
      })
    });

    const response = await incrementPOST(request);
    expect(response.status).toBe(404);
  });
});
```

**Verificar**: `npm test guest-session-api` → ❌ FALLAN

#### 2.2 Implementar endpoints (GREEN)

**Archivo**: `app/api/guest/session/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { fingerprint } = await request.json();

    if (!fingerprint) {
      return NextResponse.json(
        { error: 'Fingerprint is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Buscar sesión existente
    const { data: existingSession, error: fetchError } = await supabase
      .from('guest_sessions')
      .select('*')
      .eq('fingerprint', fingerprint)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    // Si existe, retornar sesión
    if (existingSession) {
      return NextResponse.json({
        fingerprint: existingSession.fingerprint,
        conversationCount: existingSession.conversation_count,
        messageCount: existingSession.message_count,
        canCreateConversation: existingSession.conversation_count < 1,
        canSendMessage: existingSession.message_count < 3,
        lastActivity: existingSession.last_activity,
      });
    }

    // Si no existe, crear nueva sesión
    const { data: newSession, error: insertError } = await supabase
      .from('guest_sessions')
      .insert({
        fingerprint,
        conversation_count: 0,
        message_count: 0,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({
      fingerprint: newSession.fingerprint,
      conversationCount: 0,
      messageCount: 0,
      canCreateConversation: true,
      canSendMessage: true,
      lastActivity: newSession.last_activity,
    });
  } catch (error) {
    console.error('Error in /api/guest/session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Archivo**: `app/api/guest/increment/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { fingerprint, type } = await request.json();

    if (!fingerprint || !type) {
      return NextResponse.json(
        { error: 'Fingerprint and type are required' },
        { status: 400 }
      );
    }

    if (!['conversation', 'message'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be "conversation" or "message"' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Verificar que la sesión existe
    const { data: session, error: fetchError } = await supabase
      .from('guest_sessions')
      .select('*')
      .eq('fingerprint', fingerprint)
      .single();

    if (fetchError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Incrementar el contador apropiado
    const field = type === 'conversation' ? 'conversation_count' : 'message_count';
    
    const { data: updated, error: updateError } = await supabase
      .from('guest_sessions')
      .update({
        [field]: session[field] + 1,
        last_activity: new Date().toISOString(),
      })
      .eq('fingerprint', fingerprint)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      fingerprint: updated.fingerprint,
      conversationCount: updated.conversation_count,
      messageCount: updated.message_count,
      canCreateConversation: updated.conversation_count < 1,
      canSendMessage: updated.message_count < 3,
      lastActivity: updated.last_activity,
    });
  } catch (error) {
    console.error('Error in /api/guest/increment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Verificar**: `npm test guest-session-api` → ✅ PASAN

---

### FASE 3: Hook useGuestSession (Est. 45 min) 🪝

**Objetivo**: Hook React para gestionar sesión de invitado

#### 3.1 Crear tests (RED)
**Archivo**: `tests/unit/useGuestSession.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGuestSession } from '@/hooks/useGuestSession';

describe('useGuestSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería inicializar con loading=true', () => {
    const { result } = renderHook(() => useGuestSession());
    expect(result.current.loading).toBe(true);
  });

  it('debería cargar sesión y actualizar estado', async () => {
    const { result } = renderHook(() => useGuestSession());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.session).toBeDefined();
    expect(result.current.session?.conversationCount).toBeDefined();
    expect(result.current.session?.messageCount).toBeDefined();
  });

  it('debería indicar canCreateConversation=true para sesión nueva', async () => {
    const { result } = renderHook(() => useGuestSession());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.canCreateConversation).toBe(true);
  });

  it('debería indicar canSendMessage=true para sesión nueva', async () => {
    const { result } = renderHook(() => useGuestSession());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.canSendMessage).toBe(true);
  });

  it('debería incrementar contador de conversaciones', async () => {
    const { result } = renderHook(() => useGuestSession());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const before = result.current.session?.conversationCount || 0;
    await result.current.incrementConversation();

    await waitFor(() => {
      expect(result.current.session?.conversationCount).toBe(before + 1);
    });
  });

  it('debería incrementar contador de mensajes', async () => {
    const { result } = renderHook(() => useGuestSession());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const before = result.current.session?.messageCount || 0;
    await result.current.incrementMessage();

    await waitFor(() => {
      expect(result.current.session?.messageCount).toBe(before + 1);
    });
  });

  it('debería bloquear creación de conversación después de 1', async () => {
    const { result } = renderHook(() => useGuestSession());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.incrementConversation();

    await waitFor(() => {
      expect(result.current.canCreateConversation).toBe(false);
    });
  });

  it('debería bloquear envío de mensajes después de 3', async () => {
    const { result } = renderHook(() => useGuestSession());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Enviar 3 mensajes
    await result.current.incrementMessage();
    await result.current.incrementMessage();
    await result.current.incrementMessage();

    await waitFor(() => {
      expect(result.current.canSendMessage).toBe(false);
    });
  });

  it('debería recargar sesión manualmente', async () => {
    const { result } = renderHook(() => useGuestSession());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const before = result.current.session;
    await result.current.reloadSession();

    await waitFor(() => {
      expect(result.current.session).toBeDefined();
      expect(result.current.session).not.toBe(before); // Nueva referencia
    });
  });
});
```

**Verificar**: `npm test useGuestSession` → ❌ FALLAN

#### 3.2 Implementar hook (GREEN)
**Archivo**: `hooks/useGuestSession.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { getFingerprint } from '@/lib/fingerprint';

interface GuestSession {
  fingerprint: string;
  conversationCount: number;
  messageCount: number;
  canCreateConversation: boolean;
  canSendMessage: boolean;
  lastActivity: string;
}

export function useGuestSession() {
  const [session, setSession] = useState<GuestSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const fingerprint = await getFingerprint();

      const response = await fetch('/api/guest/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint }),
      });

      if (!response.ok) {
        throw new Error('Failed to load session');
      }

      const data = await response.json();
      setSession(data);
    } catch (err) {
      console.error('Error loading guest session:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const incrementConversation = useCallback(async () => {
    if (!session) return;

    try {
      const response = await fetch('/api/guest/increment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fingerprint: session.fingerprint,
          type: 'conversation',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to increment conversation');
      }

      const data = await response.json();
      setSession(data);
    } catch (err) {
      console.error('Error incrementing conversation:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [session]);

  const incrementMessage = useCallback(async () => {
    if (!session) return;

    try {
      const response = await fetch('/api/guest/increment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fingerprint: session.fingerprint,
          type: 'message',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to increment message');
      }

      const data = await response.json();
      setSession(data);
    } catch (err) {
      console.error('Error incrementing message:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [session]);

  const reloadSession = useCallback(() => {
    return loadSession();
  }, [loadSession]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  return {
    session,
    loading,
    error,
    canCreateConversation: session?.canCreateConversation ?? false,
    canSendMessage: session?.canSendMessage ?? false,
    incrementConversation,
    incrementMessage,
    reloadSession,
  };
}
```

**Verificar**: `npm test useGuestSession` → ✅ PASAN

---

### FASE 4: Integración con useChatMessages (Est. 45 min) 🔗

**Objetivo**: Integrar límites de invitado en el flujo de mensajes

#### 4.1 Modificar useChatMessages.ts

**Cambios necesarios**:

1. Importar hook:
```typescript
import { useGuestSession } from './useGuestSession';
import { useUser } from '@clerk/nextjs';
```

2. Usar hook dentro del componente:
```typescript
export function useChatMessages() {
  const { user } = useUser();
  const isGuest = !user;
  const guestSession = useGuestSession();
  
  // ... resto del código
```

3. Validar antes de enviar mensaje:
```typescript
const handleSendMessage = async (content: string) => {
  // Validar límites de invitado
  if (isGuest) {
    if (!guestSession.canSendMessage) {
      toast({
        title: 'Límite alcanzado',
        description: 'Has alcanzado el límite de 3 mensajes. Regístrate para continuar.',
        variant: 'destructive',
      });
      return;
    }
  }

  // ... resto de la lógica de envío

  // Después de enviar exitosamente
  if (isGuest) {
    await guestSession.incrementMessage();
  }
};
```

4. Validar creación de conversación:
```typescript
const createNewConversation = async () => {
  if (isGuest && !guestSession.canCreateConversation) {
    toast({
      title: 'Límite alcanzado',
      description: 'Ya tienes una conversación activa. Regístrate para crear más.',
      variant: 'destructive',
    });
    return;
  }

  // ... resto de la lógica

  if (isGuest) {
    await guestSession.incrementConversation();
  }
};
```

**Verificar manualmente**: 
- Usuario invitado puede enviar 3 mensajes
- 4to mensaje muestra error
- 2da conversación muestra error

---

### FASE 5: UI Component (Est. 30 min) 🎨

**Objetivo**: Mostrar contador visual para invitados

#### 5.1 Crear tests (RED)
**Archivo**: `tests/unit/guest-message-counter.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GuestMessageCounter } from '@/components/guest-message-counter';

vi.mock('@/hooks/useGuestSession', () => ({
  useGuestSession: vi.fn(),
}));

describe('GuestMessageCounter', () => {
  it('debería mostrar "0/3" para sesión nueva', () => {
    const { useGuestSession } = require('@/hooks/useGuestSession');
    useGuestSession.mockReturnValue({
      session: { messageCount: 0 },
      loading: false,
    });

    render(<GuestMessageCounter />);
    expect(screen.getByText(/0\/3/)).toBeInTheDocument();
  });

  it('debería mostrar "2/3" después de 2 mensajes', () => {
    const { useGuestSession } = require('@/hooks/useGuestSession');
    useGuestSession.mockReturnValue({
      session: { messageCount: 2 },
      loading: false,
    });

    render(<GuestMessageCounter />);
    expect(screen.getByText(/2\/3/)).toBeInTheDocument();
  });

  it('debería usar color de advertencia en 3/3', () => {
    const { useGuestSession } = require('@/hooks/useGuestSession');
    useGuestSession.mockReturnValue({
      session: { messageCount: 3 },
      loading: false,
    });

    render(<GuestMessageCounter />);
    const counter = screen.getByText(/3\/3/);
    expect(counter.className).toContain('text-red');
  });

  it('no debería renderizar si está loading', () => {
    const { useGuestSession } = require('@/hooks/useGuestSession');
    useGuestSession.mockReturnValue({
      session: null,
      loading: true,
    });

    const { container } = render(<GuestMessageCounter />);
    expect(container.firstChild).toBeNull();
  });

  it('debería mostrar mensaje de registro en 3/3', () => {
    const { useGuestSession } = require('@/hooks/useGuestSession');
    useGuestSession.mockReturnValue({
      session: { messageCount: 3 },
      loading: false,
    });

    render(<GuestMessageCounter />);
    expect(screen.getByText(/Regístrate/)).toBeInTheDocument();
  });
});
```

**Verificar**: `npm test guest-message-counter` → ❌ FALLAN

#### 5.2 Implementar componente (GREEN)
**Archivo**: `components/guest-message-counter.tsx`

```typescript
'use client';

import { useGuestSession } from '@/hooks/useGuestSession';
import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';

export function GuestMessageCounter() {
  const { session, loading } = useGuestSession();

  if (loading || !session) {
    return null;
  }

  const { messageCount } = session;
  const isAtLimit = messageCount >= 3;
  const isNearLimit = messageCount === 2;

  return (
    <div className="flex items-center gap-2 text-sm">
      <Badge 
        variant={isAtLimit ? 'destructive' : isNearLimit ? 'secondary' : 'outline'}
        className="flex items-center gap-1"
      >
        <MessageSquare className="h-3 w-3" />
        <span className={isAtLimit ? 'text-red-600 font-semibold' : ''}>
          {messageCount}/3
        </span>
      </Badge>
      {isAtLimit && (
        <span className="text-xs text-muted-foreground">
          Regístrate para continuar
        </span>
      )}
    </div>
  );
}
```

**Verificar**: `npm test guest-message-counter` → ✅ PASAN

#### 5.3 Integrar en ChatInput

**Archivo**: `components/chatInput.tsx`

```typescript
import { GuestMessageCounter } from './guest-message-counter';
import { useUser } from '@clerk/nextjs';

export function ChatInput() {
  const { user } = useUser();
  const isGuest = !user;

  return (
    <div>
      {isGuest && <GuestMessageCounter />}
      {/* ... resto del componente */}
    </div>
  );
}
```

---

## ✅ Checklist Final

### Tests
- [ ] `npm test fingerprint` → ✅
- [ ] `npm test guest-session-api` → ✅
- [ ] `npm test useGuestSession` → ✅
- [ ] `npm test guest-message-counter` → ✅
- [ ] `npm test` (todos) → ✅

### Funcionalidad
- [ ] Usuario invitado puede enviar 3 mensajes
- [ ] 4to mensaje muestra error y toast
- [ ] Usuario invitado puede crear 1 conversación
- [ ] 2da conversación muestra error y toast
- [ ] Contador visual se actualiza en tiempo real
- [ ] Contador cambia de color (normal → warning → destructive)
- [ ] Datos persisten en Supabase

### Manual Testing
1. **Escenario 1: Límite de mensajes**
   - Abrir app sin autenticar
   - Enviar 3 mensajes → ✅
   - Intentar 4to → ❌ Error

2. **Escenario 2: Límite de conversaciones**
   - Crear nueva conversación → ✅
   - Intentar crear 2da → ❌ Error

3. **Escenario 3: Persistencia**
   - Enviar 2 mensajes
   - Cerrar navegador
   - Reabrir → Debería mostrar 2/3

4. **Escenario 4: Registro**
   - Alcanzar límite
   - Registrarse
   - Verificar que límites desaparecen

5. **Escenario 5: Verificar Supabase**
   - Abrir Supabase dashboard
   - Ver tabla `guest_sessions`
   - Verificar que los contadores se actualizan

---

## 📊 Tiempo Estimado Total

- FASE 1: Fingerprint → 30 min
- FASE 2: API Endpoints → 45 min
- FASE 3: Hook useGuestSession → 45 min
- FASE 4: Integración → 45 min
- FASE 5: UI Component → 30 min
- **Total: ~3 horas**

---

## 💡 Principios TDD

1. **RED** → Escribir test que falle
2. **GREEN** → Implementar código mínimo para que pase
3. **REFACTOR** → Mejorar sin romper tests

**Reglas de Oro**:
- ❌ No escribir código sin test
- ✅ Un test a la vez
- ✅ Commits frecuentes
- ✅ Si un test falla, arreglarlo antes de continuar

---

## 🚀 ¿Listo para empezar?

**Comando para FASE 1**:
```bash
npm test -- --watch fingerprint
```

¿Comenzamos creando el primer archivo de tests? 🎯