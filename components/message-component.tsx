import { MarkdownRenderer } from '@/components/markdown-renderer'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { Bot } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { memo } from 'react'

export const MessageComponent = memo(function MessageComponent ({
  message,
  isUser,
  userImage,
  formatTime
}: {
  message: {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date | string;
  };
  isUser: boolean;
  userImage?: string;
  formatTime: (date: Date) => string;
}) {
  // Aquí puedes añadir funciones auxiliares si lo necesitas

  const t = useTranslations()

  if (isUser) {
    return (
      <div className={cn('flex flex-col-reverse gap-3 rounded-lg p-4 justify-end items-end min-w-[924px]')}>
        <div>
          <div className="flex items-center justify-end gap-2">
            <span className="text-sm font-medium">{t('you')}</span>
            <span className="text-xs text-gray-400">
              {formatTime(
                message.timestamp instanceof Date
                  ? message.timestamp
                  : new Date(message.timestamp)
              )}
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
  }

  // Mensaje del asistente
  return (
    <div className={cn('flex flex-col gap-3 rounded-lg p-4 justify-end min-w-[924px]')}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-green-900">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{t('assistant')}</span>
          <span className="text-xs text-gray-400">
            {formatTime(
              message.timestamp instanceof Date
                ? message.timestamp
                : new Date(message.timestamp)
            )}
          </span>
        </div>
        <div className="prose prose-invert max-w-4xl">
          <MarkdownRenderer content={message.content} />
        </div>
      </div>
    </div>
  )
})

MessageComponent.displayName = 'MessageComponent'
