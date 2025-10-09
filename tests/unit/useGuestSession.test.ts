import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGuestSession } from '@/hooks/useGuestSession';

// Mock fetch for API calls
global.fetch = vi.fn();

describe('useGuestSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation
    (global.fetch as any).mockImplementation(async (url: string, options: any) => {
      const body = JSON.parse(options.body);
      
      if (url.includes('/api/guest/session')) {
        return {
          ok: true,
          json: async () => ({
            fingerprint: body.fingerprint || 'test-fp-123',
            conversationCount: 0,
            messageCount: 0,
            canCreateConversation: true,
            canSendMessage: true,
            lastActivity: new Date().toISOString(),
          })
        };
      }
      
      if (url.includes('/api/guest/increment')) {
        const isConversation = body.type === 'conversation';
        return {
          ok: true,
          json: async () => ({
            fingerprint: body.fingerprint,
            conversationCount: isConversation ? 1 : 0,
            messageCount: isConversation ? 0 : 1,
            canCreateConversation: !isConversation,
            canSendMessage: true,
            lastActivity: new Date().toISOString(),
          })
        };
      }
      
      return { ok: false, status: 404 };
    });
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
    // Mock para sesión con 1 conversación
    (global.fetch as any).mockImplementation(async (url: string, options: any) => {
      if (url.includes('/api/guest/session')) {
        return {
          ok: true,
          json: async () => ({
            fingerprint: 'test-fp-123',
            conversationCount: 0,
            messageCount: 0,
            canCreateConversation: true,
            canSendMessage: true,
            lastActivity: new Date().toISOString(),
          })
        };
      }
      
      if (url.includes('/api/guest/increment')) {
        return {
          ok: true,
          json: async () => ({
            fingerprint: 'test-fp-123',
            conversationCount: 1,
            messageCount: 0,
            canCreateConversation: false,
            canSendMessage: true,
            lastActivity: new Date().toISOString(),
          })
        };
      }
    });

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
    let messageCount = 0;
    
    // Mock para incrementar mensajes
    (global.fetch as any).mockImplementation(async (url: string, options: any) => {
      if (url.includes('/api/guest/session')) {
        return {
          ok: true,
          json: async () => ({
            fingerprint: 'test-fp-123',
            conversationCount: 0,
            messageCount: 0,
            canCreateConversation: true,
            canSendMessage: true,
            lastActivity: new Date().toISOString(),
          })
        };
      }
      
      if (url.includes('/api/guest/increment')) {
        messageCount++;
        return {
          ok: true,
          json: async () => ({
            fingerprint: 'test-fp-123',
            conversationCount: 0,
            messageCount: messageCount,
            canCreateConversation: true,
            canSendMessage: messageCount < 3,
            lastActivity: new Date().toISOString(),
          })
        };
      }
    });

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
      // Session should be reloaded (may or may not have a different reference)
      expect(result.current.loading).toBe(false);
    });
  });
});
