import { POST as sessionPOST } from '@/app/api/guest/session/route'
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
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn()
  }
}))

// Mock de @/sql/schema para los tests
vi.mock('@/sql/schema', () => ({
  guestSessions: { fingerprint: 'fingerprint', conversation_count: 'conversation_count', message_count: 'message_count', last_activity: 'last_activity' }
}))

describe('API /api/guest/session', () => {
  const mockFingerprint = 'test-fp-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debería crear nueva sesión para fingerprint nuevo', async () => {
    // 1. Simula que la sesión NO existe
    // @ts-ignore
    db.limit.mockResolvedValueOnce([])

    // 2. Simula la creación exitosa
    const newSessionData = {
      fingerprint: mockFingerprint,
      conversation_count: 0,
      message_count: 0,
      last_activity: new Date().toISOString()
    }
    // @ts-ignore
    db.returning.mockResolvedValueOnce([newSessionData])

    const request = new NextRequest('http://localhost/api/guest/session', {
      method: 'POST',
      body: JSON.stringify({ fingerprint: mockFingerprint })
    })

    const response = await sessionPOST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.fingerprint).toBe(mockFingerprint)
    expect(data.canCreateConversation).toBe(true)
    expect(db.insert).toHaveBeenCalled()
  })

  it('debería retornar sesión existente', async () => {
    const existingSessionData = {
      fingerprint: mockFingerprint,
      conversation_count: 0,
      message_count: 2,
      last_activity: new Date().toISOString()
    }
    // @ts-ignore
    db.limit.mockResolvedValueOnce([existingSessionData])

    const request = new NextRequest('http://localhost/api/guest/session', {
      method: 'POST',
      body: JSON.stringify({ fingerprint: mockFingerprint })
    })

    const response = await sessionPOST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.fingerprint).toBe(mockFingerprint)
    expect(data.canSendMessage).toBe(true) // 2 < 3
    expect(db.insert).not.toHaveBeenCalled()
  })

  it('debería devolver un error 400 si no se proporciona fingerprint', async () => {
    const request = new NextRequest('http://localhost/api/guest/session', {
      method: 'POST',
      body: JSON.stringify({})
    })

    const response = await sessionPOST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Fingerprint is required')
  })

  it('debería manejar errores de base de datos al buscar sesión', async () => {
    // @ts-ignore
    db.limit.mockRejectedValueOnce(new Error('Database connection failed'))

    const request = new NextRequest('http://localhost/api/guest/session', {
      method: 'POST',
      body: JSON.stringify({ fingerprint: mockFingerprint })
    })

    const response = await sessionPOST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })
})
