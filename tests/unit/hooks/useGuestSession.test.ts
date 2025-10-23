import { useGuestSession } from '@/hooks/useGuestSession'
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGetFingerprint } = vi.hoisted(() => ({
  mockGetFingerprint: vi.fn()
}))

vi.mock('@/lib/fingerprint', () => ({
  getFingerprint: mockGetFingerprint
}))

vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: null, isLoaded: true })
}))

type SessionState = {
  fingerprint: string;
  conversationCount: number;
  messageCount: number;
  canCreateConversation: boolean;
  canSendMessage: boolean;
  lastActivity: string;
}

const createSession = (overrides: Partial<SessionState> = {}): SessionState => ({
  fingerprint: 'test-fp',
  conversationCount: 0,
  messageCount: 0,
  canCreateConversation: true,
  canSendMessage: true,
  lastActivity: new Date('2024-01-01T00:00:00.000Z').toISOString(),
  ...overrides
})

describe('useGuestSession', () => {
  let currentSession: SessionState
  type FetchInput = Parameters<typeof globalThis.fetch>[0]
  type FetchInit = Parameters<typeof globalThis.fetch>[1]
  const getResponse = (data: SessionState, ok = true, status = 200) => ({
    ok,
    status,
    json: async () => ({ ...data })
  })

  beforeEach(() => {
    currentSession = createSession()
    mockGetFingerprint.mockResolvedValue(currentSession.fingerprint)

    globalThis.fetch = vi.fn(async (input: FetchInput, init?: FetchInit) => {
      const url = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input?.toString?.() ?? ''

      if (url.includes('/api/guest/session')) {
        // Simula que cada carga actualiza la actividad para obtener una nueva referencia
        currentSession = {
          ...currentSession,
          lastActivity: new Date(Date.now()).toISOString()
        }
        return getResponse(currentSession)
      }

      if (url.includes('/api/guest/increment')) {
        const body = init?.body ? JSON.parse(init.body as string) : {}
        const { type } = body as { type?: 'conversation' | 'message' }

        if (type === 'conversation') {
          currentSession = {
            ...currentSession,
            conversationCount: currentSession.conversationCount + 1
          }
        } else if (type === 'message') {
          currentSession = {
            ...currentSession,
            messageCount: currentSession.messageCount + 1
          }
        }

        currentSession = {
          ...currentSession,
          canCreateConversation: currentSession.conversationCount < 1,
          canSendMessage: currentSession.messageCount < 3,
          lastActivity: new Date(Date.now()).toISOString()
        }

        return getResponse(currentSession)
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' })
      }
    }) as unknown as typeof globalThis.fetch
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('debería inicializar con loading=true', () => {
    const { result } = renderHook(() => useGuestSession())
    expect(result.current.loading).toBe(true)
  })

  it('debería cargar sesión y actualizar estado', async () => {
    const { result } = renderHook(() => useGuestSession())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.session).toBeDefined()
    expect(result.current.session?.conversationCount).toBeDefined()
    expect(result.current.session?.messageCount).toBeDefined()
  })

  it('debería indicar canCreateConversation=true para sesión nueva', async () => {
    const { result } = renderHook(() => useGuestSession())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.canCreateConversation).toBe(true)
  })

  it('debería indicar canSendMessage=true para sesión nueva', async () => {
    const { result } = renderHook(() => useGuestSession())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.canSendMessage).toBe(true)
  })

  it('debería incrementar contador de conversaciones', async () => {
    const { result } = renderHook(() => useGuestSession())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const before = result.current.session?.conversationCount || 0
    await result.current.incrementConversation()

    await waitFor(() => {
      expect(result.current.session?.conversationCount).toBe(before + 1)
    })
  })

  it('debería incrementar contador de mensajes', async () => {
    const { result } = renderHook(() => useGuestSession())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const before = result.current.session?.messageCount || 0
    await result.current.incrementMessage()

    await waitFor(() => {
      expect(result.current.session?.messageCount).toBe(before + 1)
    })
  })

  it('debería bloquear creación de conversación después de 1', async () => {
    const { result } = renderHook(() => useGuestSession())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await result.current.incrementConversation()

    await waitFor(() => {
      expect(result.current.canCreateConversation).toBe(false)
    })
  })

  it('debería bloquear envío de mensajes después de 3', async () => {
    const { result } = renderHook(() => useGuestSession())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Enviar 3 mensajes
    await result.current.incrementMessage()
    await result.current.incrementMessage()
    await result.current.incrementMessage()

    await waitFor(() => {
      expect(result.current.canSendMessage).toBe(false)
    })
  })

  it('debería recargar sesión manualmente', async () => {
    const { result } = renderHook(() => useGuestSession())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const before = result.current.session
    await result.current.reloadSession()

    await waitFor(() => {
      expect(result.current.session).toBeDefined()
      expect(result.current.session).not.toBe(before) // Nueva referencia
    })
  })
})
