import { POST as incrementPOST } from '@/app/api/guest/increment/route'
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/lib/db'

// Simulación de Drizzle 'db'
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn()
  }
}))

// Mock de @/sql/schema para los tests
vi.mock('@/sql/schema', () => ({
  guestSessions: { fingerprint: 'fingerprint', conversation_count: 'conversation_count', message_count: 'message_count', last_activity: 'last_activity' }
}))

describe('API /api/guest/increment', () => {
  const mockFingerprint = 'test-fp-increment'

  beforeEach(() => {
    vi.clearAllMocks()
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

    // @ts-ignore
    db.limit.mockResolvedValueOnce([existingSession])
    // @ts-ignore
    db.returning.mockResolvedValueOnce([updatedSession])

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
    expect(db.update).toHaveBeenCalled()
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

    // @ts-ignore
    db.limit.mockResolvedValueOnce([existingSession])
    // @ts-ignore
    db.returning.mockResolvedValueOnce([updatedSession])

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
    expect(db.update).toHaveBeenCalled()
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
    expect(db.update).not.toHaveBeenCalled()
  })

  it('debería manejar errores al actualizar el conteo', async () => {
    const existingSession = {
      fingerprint: mockFingerprint,
      conversation_count: 0,
      message_count: 0,
      last_activity: '2024-01-01T00:00:00.000Z'
    }

    // @ts-ignore
    db.limit.mockResolvedValueOnce([existingSession])
    // @ts-ignore
    db.returning.mockRejectedValueOnce(new Error('update failed'))

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
