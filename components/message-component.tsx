import { MarkdownRenderer } from '@/components/markdown-renderer'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { Bot } from 'lucide-react'
import { memo } from 'react'
// Componente memoizado para mensajes
export const MessageComponent = memo(({
  message,
  isUser,
  userImage,
  formatTime
}: {
  message: {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
  };
  isUser: boolean;
  userImage?: string;
  providerName?: string;
  formatTime: (date: Date) => string;
}) => (

  isUser
    ? (
      <div className={cn(
        'flex gap-3 rounded-lg p-4 justify-end items-center'
      )}>
        <div>
          <div className="flex items-center justify-end gap-2">
            <span className="text-sm font-medium">
              Tú
            </span>
            <span className="text-xs text-gray-400">
              {formatTime(new Date(message.timestamp))}
            </span>
          </div>
          <div className="prose prose-invert max-w-4xl">
            <p className="text-neutral-400" style={{ margin: 0 }}>{message.content}</p>
          </div>
        </div>
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={userImage} />
        </Avatar>
      </div>
    )
    : (
      <div className={cn(
        'flex gap-3 rounded-lg p-4 justify-end'
      )}>
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-green-900">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              Asistente
            </span>
            <span className="text-xs text-gray-400">
              {formatTime(new Date(message.timestamp))}
            </span>
          </div>
          <div className="prose prose-invert max-w-4xl">
            <MarkdownRenderer content={message.content} />
          </div>
        </div>
      </div>
    )

))

MessageComponent.displayName = 'MessageComponent'
