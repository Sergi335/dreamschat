'use client'

import { useGuestSession } from '@/hooks/useGuestSession'
import { Badge } from '@/components/ui/badge'
import { MessageSquare } from 'lucide-react'

export function GuestMessageCounter () {
  const { session, loading } = useGuestSession()

  if (loading || !session) {
    return null
  }

  const { messageCount } = session
  const isAtLimit = messageCount >= 3
  const isNearLimit = messageCount === 2

  return (
    <div className="flex items-center gap-2 text-sm">
      <Badge
        variant={isAtLimit ? 'destructive' : isNearLimit ? 'secondary' : 'outline'}
        className="flex items-center gap-1"
      >
        <MessageSquare className="h-3 w-3" />
        <span className={isAtLimit ? 'text-red-600 font-semibold' : ''}>
          {messageCount}/3
        </span>
      </Badge>
      {isAtLimit && (
        <span className="text-xs text-muted-foreground">
          Regístrate para continuar
        </span>
      )}
    </div>
  )
}
