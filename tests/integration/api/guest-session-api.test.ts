import { POST as sessionPOST } from '@/app/api/guest/session/route'
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

describe('API /api/guest/session', () => {
  const mockFingerprint = 'test-fp-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debería crear nueva sesión para fingerprint nuevo', async () => {
    // 1. Simula que la sesión NO existe
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116', message: 'Not found' }
    })

    // 2. Simula la creación exitosa de la sesión
    const newSessionData = {
      fingerprint: mockFingerprint,
      conversation_count: 0,
      message_count: 0,
      last_activity: new Date().toISOString()
    }
    mockSupabase.single.mockResolvedValueOnce({
      data: newSessionData,
      error: null
    })

    const request = new NextRequest('http://localhost/api/guest/session', {
      method: 'POST',
      body: JSON.stringify({ fingerprint: mockFingerprint })
    })

    const response = await sessionPOST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.fingerprint).toBe(mockFingerprint)
    expect(data.canCreateConversation).toBe(true)
    expect(mockSupabase.from).toHaveBeenCalledWith('guest_sessions')
    expect(mockSupabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({ fingerprint: mockFingerprint })
    )
  })

  it('debería retornar sesión existente', async () => {
    const existingSessionData = {
      fingerprint: mockFingerprint,
      conversation_count: 0,
      message_count: 2,
      last_activity: new Date().toISOString()
    }
    mockSupabase.single.mockResolvedValue({
      data: existingSessionData,
      error: null
    })

    const request = new NextRequest('http://localhost/api/guest/session', {
      method: 'POST',
      body: JSON.stringify({ fingerprint: mockFingerprint })
    })

    const response = await sessionPOST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.fingerprint).toBe(mockFingerprint)
    expect(data.canSendMessage).toBe(true) // 2 < 3
    expect(mockSupabase.insert).not.toHaveBeenCalled()
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
    const dbError = { message: 'Database connection failed' }
    mockSupabase.single.mockResolvedValue({ data: null, error: dbError })

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
