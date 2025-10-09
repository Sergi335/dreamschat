import { useState, useEffect, useCallback } from 'react'
import { getFingerprint } from '@/lib/fingerprint'

interface GuestSession {
  fingerprint: string
  conversationCount: number
  messageCount: number
  canCreateConversation: boolean
  canSendMessage: boolean
  lastActivity: string
}

export function useGuestSession () {
  const [session, setSession] = useState<GuestSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSession = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const fingerprint = await getFingerprint()

      const response = await fetch('/api/guest/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint })
      })

      if (!response.ok) {
        throw new Error('Failed to load session')
      }

      const data = await response.json()
      setSession(data)
    } catch (err) {
      console.error('Error loading guest session:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  const incrementConversation = useCallback(async () => {
    try {
      // Si no hay sesión, cargarla primero
      if (!session) {
        await loadSession()
        // Después de cargar, necesitamos esperar a que el estado se actualice
        // pero como esto es asíncrono, vamos a obtener el fingerprint directamente
      }

      const fingerprint = session?.fingerprint || await getFingerprint()

      const response = await fetch('/api/guest/increment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fingerprint,
          type: 'conversation'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to increment conversation')
      }

      const data = await response.json()
      setSession(data)
    } catch (err) {
      console.error('Error incrementing conversation:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [session, loadSession])

  const incrementMessage = useCallback(async () => {
    try {
      // Si no hay sesión, cargarla primero
      if (!session) {
        await loadSession()
      }

      const fingerprint = session?.fingerprint || await getFingerprint()

      const response = await fetch('/api/guest/increment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fingerprint,
          type: 'message'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to increment message')
      }

      const data = await response.json()
      setSession(data)
    } catch (err) {
      console.error('Error incrementing message:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [session, loadSession])

  const reloadSession = useCallback(() => {
    return loadSession()
  }, [loadSession])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  return {
    session,
    loading,
    error,
    canCreateConversation: session?.canCreateConversation ?? false,
    canSendMessage: session?.canSendMessage ?? false,
    incrementConversation,
    incrementMessage,
    reloadSession
  }
}
