import { MarkdownRenderer } from '@/components/markdown-renderer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Bot } from 'lucide-react';
import { memo } from 'react';
// Componente memoizado para mensajes
export const MessageComponent = memo(({ 
  message, 
  isUser, 
  userImage, 
  providerName, 
  formatTime 
}: {
  message: any;
  isUser: boolean;
  userImage?: string;
  providerName?: string;
  formatTime: (date: Date) => string;
}) => (
  <div className={cn(
    "flex gap-3 rounded-lg p-4",
    isUser ? "bg-blue-900/20 ml-8" : "bg-gray-800/50 mr-8"
  )}>
    <Avatar className="h-8 w-8 shrink-0">
      {isUser ? (
        <AvatarImage src={userImage} />
      ) : (
        <AvatarFallback className="bg-green-900">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      )}
    </Avatar>
    <div className="flex-1 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {isUser ? 'Tú' : providerName || 'Asistente'}
        </span>
        <span className="text-xs text-gray-400">
          {formatTime(new Date(message.timestamp))}
        </span>
      </div>
      <div className="prose prose-invert max-w-none">
        {isUser ? (
          <p style={{ margin: 0 }}>{message.content}</p>
        ) : (
          <MarkdownRenderer content={message.content} />
        )}
      </div>
    </div>
  </div>
));

MessageComponent.displayName = 'MessageComponent';