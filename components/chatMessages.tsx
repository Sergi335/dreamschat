import { Message } from '@/types/message.types'
import { UserResource } from '@clerk/types'
import { forwardRef } from 'react'
import { MessageComponent } from './message-component'

interface ChatMessagesProps {
    uniqueMessages: Message[]
    user: UserResource | null,
    formatTime: (date: Date) => string
}

export const ChatMessages = forwardRef<HTMLDivElement, ChatMessagesProps>(({ uniqueMessages, user, formatTime }, messagesEndRef) => {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {uniqueMessages.map((message) => (
        <MessageComponent
          key={`${message.id}-${message.role}-${String(message.timestamp)}`}
          message={message}
          isUser={message.role === 'user'}
          userImage={user?.imageUrl}
          formatTime={formatTime}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
})

ChatMessages.displayName = 'ChatMessages'
