import '@testing-library/jest-dom'
import React from 'react'
import { afterEach, vi } from 'vitest'

// Mock de Next.js
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn()
  }),
  useSearchParams: () => ({
    get: vi.fn(),
    has: vi.fn(),
    getAll: vi.fn(),
    keys: vi.fn(),
    values: vi.fn(),
    entries: vi.fn(),
    forEach: vi.fn(),
    toString: vi.fn()
  }),
  useParams: () => ({
    locale: 'es'
  }),
  usePathname: () => '/dashboard',
  redirect: vi.fn(),
  notFound: vi.fn()
}))

// Mock de Clerk (sin autenticación)
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: {
      id: 'test-user-id',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      firstName: 'Test',
      lastName: 'User'
    },
    isLoaded: true,
    isSignedIn: true
  }),
  useAuth: () => ({
    userId: 'test-user-id',
    isLoaded: true,
    isSignedIn: true,
    signOut: vi.fn()
  }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignIn: () => null,
  SignUp: () => null
}))

// Mock de Drizzle/Turso
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => [])
          })),
          limit: vi.fn(() => [])
        })),
        orderBy: vi.fn(() => [])
      }))
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => [{}])
      }))
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => [{}])
        }))
      }))
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(() => [{}])
      }))
    })),
    transaction: vi.fn((cb) => cb({
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => [{}])
        }))
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({}))
        }))
      })),
      delete: vi.fn(() => ({
        where: vi.fn(() => ({}))
      }))
    }))
  }
}))

vi.mock('@/sql/schema', () => ({
  conversations: { id: 'id', user_id: 'user_id', title: 'title', updated_at: 'updated_at' },
  messages: { id: 'id', conversation_id: 'conversation_id', content: 'content', role: 'role', timestamp: 'timestamp' },
  guestSessions: { fingerprint: 'fingerprint', conversation_count: 'conversation_count', message_count: 'message_count', last_activity: 'last_activity' }
}))

// Mock global de fetch
global.fetch = vi.fn()

// Setup para limpiar mocks después de cada test
afterEach(() => {
  vi.clearAllMocks()
})
