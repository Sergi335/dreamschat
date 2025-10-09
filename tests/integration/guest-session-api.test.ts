import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { POST as sessionPOST } from '@/app/api/guest/session/route';
import { POST as incrementPOST } from '@/app/api/guest/increment/route';

// Mock supabase for integration tests
vi.mock('@/lib/supabase', () => {
  const mockData: Record<string, any> = {};
  
  return {
    supabase: {
      from: (table: string) => ({
        select: (columns: string = '*') => ({
          eq: (column: string, value: any) => ({
            single: async () => {
              const key = `${table}_${value}`;
              if (!mockData[key]) {
                return { data: null, error: { code: 'PGRST116' } };
              }
              return { data: mockData[key], error: null };
            }
          })
        }),
        insert: (data: any) => ({
          select: () => ({
            single: async () => {
              const key = `${table}_${data.fingerprint}`;
              mockData[key] = {
                ...data,
                id: `test-id-${Date.now()}`,
                created_at: new Date().toISOString(),
                last_activity: new Date().toISOString(),
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                is_blocked: false
              };
              return { data: mockData[key], error: null };
            }
          })
        }),
        update: (updateData: any) => ({
          eq: (column: string, value: any) => ({
            select: () => ({
              single: async () => {
                const key = `${table}_${value}`;
                if (!mockData[key]) {
                  return { data: null, error: { code: 'NOT_FOUND' } };
                }
                mockData[key] = { ...mockData[key], ...updateData };
                return { data: mockData[key], error: null };
              }
            })
          })
        })
      })
    }
  };
});

describe('API /api/guest/session', () => {
  const mockFingerprint = `test-fp-${Date.now()}`;

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
    const uniqueFingerprint = `test-fp-existing-${Date.now()}`;
    
    // Crear sesión primero
    await sessionPOST(new Request('http://localhost/api/guest/session', {
      method: 'POST',
      body: JSON.stringify({ fingerprint: uniqueFingerprint })
    }));

    // Obtener sesión existente
    const request = new Request('http://localhost/api/guest/session', {
      method: 'POST',
      body: JSON.stringify({ fingerprint: uniqueFingerprint })
    });

    const response = await sessionPOST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.fingerprint).toBe(uniqueFingerprint);
  });

  it('debería bloquear cuando conversation_count >= 1', async () => {
    const uniqueFingerprint = `test-fp-conv-${Date.now()}`;
    
    // Crear sesión
    await sessionPOST(new Request('http://localhost/api/guest/session', {
      method: 'POST',
      body: JSON.stringify({ fingerprint: uniqueFingerprint })
    }));

    // Incrementar conversación
    await incrementPOST(new Request('http://localhost/api/guest/increment', {
      method: 'POST',
      body: JSON.stringify({ 
        fingerprint: uniqueFingerprint,
        type: 'conversation'
      })
    }));

    // Verificar que no puede crear más conversaciones
    const response = await sessionPOST(new Request('http://localhost/api/guest/session', {
      method: 'POST',
      body: JSON.stringify({ fingerprint: uniqueFingerprint })
    }));
    const data = await response.json();

    expect(data.canCreateConversation).toBe(false);
  });

  it('debería bloquear cuando message_count >= 3', async () => {
    const uniqueFingerprint = `test-fp-msg-${Date.now()}`;
    
    // Crear sesión
    await sessionPOST(new Request('http://localhost/api/guest/session', {
      method: 'POST',
      body: JSON.stringify({ fingerprint: uniqueFingerprint })
    }));

    // Enviar 3 mensajes
    for (let i = 0; i < 3; i++) {
      await incrementPOST(new Request('http://localhost/api/guest/increment', {
        method: 'POST',
        body: JSON.stringify({ 
          fingerprint: uniqueFingerprint,
          type: 'message'
        })
      }));
    }

    // Verificar que no puede enviar más mensajes
    const response = await sessionPOST(new Request('http://localhost/api/guest/session', {
      method: 'POST',
      body: JSON.stringify({ fingerprint: uniqueFingerprint })
    }));
    const data = await response.json();

    expect(data.canSendMessage).toBe(false);
  });
});

describe('API /api/guest/increment', () => {
  const mockFingerprint = `test-fp-inc-${Date.now()}`;

  beforeAll(async () => {
    // Crear sesión para los tests de increment
    await sessionPOST(new Request('http://localhost/api/guest/session', {
      method: 'POST',
      body: JSON.stringify({ fingerprint: mockFingerprint })
    }));
  });

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
    const uniqueFingerprint = `test-fp-msg-inc-${Date.now()}`;
    
    // Crear sesión
    await sessionPOST(new Request('http://localhost/api/guest/session', {
      method: 'POST',
      body: JSON.stringify({ fingerprint: uniqueFingerprint })
    }));

    const request = new Request('http://localhost/api/guest/increment', {
      method: 'POST',
      body: JSON.stringify({ 
        fingerprint: uniqueFingerprint,
        type: 'message'
      })
    });

    const response = await incrementPOST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.messageCount).toBeGreaterThan(0);
  });

  it('debería actualizar last_activity', async () => {
    const uniqueFingerprint = `test-fp-activity-${Date.now()}`;
    
    // Crear sesión
    await sessionPOST(new Request('http://localhost/api/guest/session', {
      method: 'POST',
      body: JSON.stringify({ fingerprint: uniqueFingerprint })
    }));

    const before = new Date();
    
    await incrementPOST(new Request('http://localhost/api/guest/increment', {
      method: 'POST',
      body: JSON.stringify({ 
        fingerprint: uniqueFingerprint,
        type: 'message'
      })
    }));

    const session = await sessionPOST(new Request('http://localhost/api/guest/session', {
      method: 'POST',
      body: JSON.stringify({ fingerprint: uniqueFingerprint })
    }));
    const data = await session.json();

    const lastActivity = new Date(data.lastActivity);
    expect(lastActivity.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('debería retornar error si fingerprint no existe', async () => {
    const request = new Request('http://localhost/api/guest/increment', {
      method: 'POST',
      body: JSON.stringify({ 
        fingerprint: 'non-existent-fingerprint',
        type: 'message'
      })
    });

    const response = await incrementPOST(request);
    expect(response.status).toBe(404);
  });
});
