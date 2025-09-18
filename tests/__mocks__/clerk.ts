import React from 'react'
import { vi } from 'vitest'

export const mockClerk = {
  useUser: vi.fn(),
  useAuth: vi.fn(),
  ClerkProvider: vi.fn(),
  SignIn: vi.fn(),
  SignUp: vi.fn()
}

// Mock de Clerk
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

export default mockClerk
