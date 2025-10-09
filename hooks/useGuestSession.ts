import { useState, useEffect, useCallback, useRef } from 'react'
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
  const loadingRef = useRef(false)
  const loadPromiseRef = useRef<Promise<GuestSession> | null>(null)

  const loadSession = useCallback(async () => {
    // Si ya estamos cargando, devolver la promesa existente
    if (loadingRef.current && loadPromiseRef.current) {
      return loadPromiseRef.current
    }

    // Marcar que estamos cargando
    loadingRef.current = true

    const promise = (async () => {
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
        return data // Return the session data for immediate use
      } catch (err) {
        console.error('Error loading guest session:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        throw err // Re-throw to let callers know it failed
      } finally {
        setLoading(false)
        loadingRef.current = false
        loadPromiseRef.current = null
      }
    })()

    loadPromiseRef.current = promise
    return promise
  }, [])

  const incrementConversation = useCallback(async () => {
    try {
      // Obtener el fingerprint de la sesión actual o cargar una nueva
      let fingerprint = session?.fingerprint
      
      if (!fingerprint) {
        const loadedSession = await loadSession()
        fingerprint = loadedSession.fingerprint
      }

      const response = await fetch('/api/guest/increment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fingerprint,
          type: 'conversation'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to increment conversation')
      }

      const data = await response.json()
      setSession(data)
    } catch (err) {
      console.error('Error incrementing conversation:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err // Re-throw to let caller handle it
    }
  }, [session, loadSession])

  const incrementMessage = useCallback(async () => {
    try {
      // Obtener el fingerprint de la sesión actual o cargar una nueva
      let fingerprint = session?.fingerprint
      
      if (!fingerprint) {
        const loadedSession = await loadSession()
        fingerprint = loadedSession.fingerprint
      }

      const response = await fetch('/api/guest/increment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fingerprint,
          type: 'message'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to increment message')
      }

      const data = await response.json()
      setSession(data)
    } catch (err) {
      console.error('Error incrementing message:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err // Re-throw to let caller handle it
    }
  }, [session, loadSession])

  const reloadSession = useCallback(() => {
    return loadSession()
  }, [loadSession])

  useEffect(() => {
    // Solo cargar una vez al montar
    let mounted = true
    
    const init = async () => {
      if (mounted) {
        try {
          await loadSession()
        } catch (err) {
          // Error ya manejado en loadSession
        }
      }
    }
    
    init()
    
    return () => {
      mounted = false
    }
  }, []) // Dependencias vacías para ejecutar solo una vez

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
