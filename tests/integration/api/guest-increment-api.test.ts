import { POST as incrementPOST } from '@/app/api/guest/increment/route'
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Simula la función auth de Clerk para evitar el error 'server-only'
vi.mock('@clerk/nextjs/server', () => ({
  auth: () =>
    Promise.resolve({
      userId: 'user_test_id',
      getToken: () => Promise.resolve('mock_supabase_token')
    })
}))

// Simula el cliente de Supabase para aislar la prueba de la base de datos
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  rpc: vi.fn()
}

vi.mock('@/lib/supabase-server', () => ({
  createSupabaseClient: () => mockSupabase
}))

describe('API /api/guest/increment', () => {
  const mockFingerprint = 'test-fp-increment'

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase.single.mockReset()
  })

  it('debería incrementar conversation_count', async () => {
    const existingSession = {
      fingerprint: mockFingerprint,
      conversation_count: 0,
      message_count: 0,
      last_activity: '2024-01-01T00:00:00.000Z'
    }
    const updatedSession = {
      ...existingSession,
      conversation_count: existingSession.conversation_count + 1,
      last_activity: '2024-01-02T00:00:00.000Z'
    }

    mockSupabase.single.mockResolvedValueOnce({
      data: existingSession,
      error: null
    })
    mockSupabase.single.mockResolvedValueOnce({
      data: updatedSession,
      error: null
    })

    const request = new NextRequest('http://localhost/api/guest/increment', {
      method: 'POST',
      body: JSON.stringify({
        fingerprint: mockFingerprint,
        type: 'conversation'
      })
    })

    const response = await incrementPOST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.conversationCount).toBe(updatedSession.conversation_count)
    expect(data.messageCount).toBe(updatedSession.message_count)
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        conversation_count: updatedSession.conversation_count,
        last_activity: expect.any(String)
      })
    )
  })

  it('debería incrementar message_count', async () => {
    const existingSession = {
      fingerprint: mockFingerprint,
      conversation_count: 0,
      message_count: 1,
      last_activity: '2024-01-01T00:00:00.000Z'
    }
    const updatedSession = {
      ...existingSession,
      message_count: existingSession.message_count + 1,
      last_activity: '2024-01-02T00:00:00.000Z'
    }

    mockSupabase.single.mockResolvedValueOnce({
      data: existingSession,
      error: null
    })
    mockSupabase.single.mockResolvedValueOnce({
      data: updatedSession,
      error: null
    })

    const request = new NextRequest('http://localhost/api/guest/increment', {
      method: 'POST',
      body: JSON.stringify({
        fingerprint: mockFingerprint,
        type: 'message'
      })
    })

    const response = await incrementPOST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.messageCount).toBe(updatedSession.message_count)
    expect(data.conversationCount).toBe(updatedSession.conversation_count)
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        message_count: updatedSession.message_count,
        last_activity: expect.any(String)
      })
    )
  })

  it('debería devolver un error 400 si el tipo es inválido', async () => {
    const request = new NextRequest('http://localhost/api/guest/increment', {
      method: 'POST',
      body: JSON.stringify({
        fingerprint: mockFingerprint,
        type: 'invalid_type'
      })
    })

    const response = await incrementPOST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Type must be "conversation" or "message"')
    expect(mockSupabase.from).not.toHaveBeenCalled()
    expect(mockSupabase.update).not.toHaveBeenCalled()
  })

  it('debería manejar errores al actualizar el conteo', async () => {
    const existingSession = {
      fingerprint: mockFingerprint,
      conversation_count: 0,
      message_count: 0,
      last_activity: '2024-01-01T00:00:00.000Z'
    }

    mockSupabase.single.mockResolvedValueOnce({
      data: existingSession,
      error: null
    })
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'update failed' }
    })

    const request = new NextRequest('http://localhost/api/guest/increment', {
      method: 'POST',
      body: JSON.stringify({
        fingerprint: mockFingerprint,
        type: 'conversation'
      })
    })

    const response = await incrementPOST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })
})
