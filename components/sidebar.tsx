import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useConversations } from '@/context/conversations-context'
import useChatMessages from '@/hooks/useChatMessages'
import { cn } from '@/lib/utils'
import { UserButton, useUser } from '@clerk/nextjs'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { forwardRef, useCallback } from 'react'

interface SidebarProps {
  setError: (error: string) => void;
  locale?: string;
}

export const Sidebar = forwardRef<HTMLInputElement, SidebarProps>(
  ({ setError, locale }, inputRef) => {
    const { user } = useUser()

    const router = useRouter()
    const t = useTranslations()
    const {
      conversations,
      activeConversationId,
      setActiveConversationId,
      createConversation,
      deleteConversation,
      isLoading
    } = useConversations()

    const { resetToInitialChat } = useChatMessages()

    const handleNewConversation = useCallback(async () => {
      // Busca una conversación vacía
      const emptyConversation = conversations.find(c => c.messages.length === 0)

      if (emptyConversation) {
        setActiveConversationId(emptyConversation.id)
        resetToInitialChat()
        router.push(`/${locale}/dashboard`)
        setError('')
        setTimeout(() => {
          if (inputRef && 'current' in inputRef && inputRef.current) {
            inputRef.current.focus()
          }
        }, 100)
        return
      }

      // Si no existe, crea una nueva
      try {
        const newConversationId = await createConversation('Nueva conversación')
        if (newConversationId) {
          setActiveConversationId(newConversationId)
        }
        router.push(`/${locale}/dashboard`)
        setError('')
        setTimeout(() => {
          if (inputRef && 'current' in inputRef && inputRef.current) {
            inputRef.current.focus()
          }
        }, 100)
      } catch (error) {
        console.error('Error creating conversation:', error)
        setError('Error al crear nueva conversación')
      }
    }, [conversations, createConversation, setActiveConversationId, setError, inputRef, resetToInitialChat, locale, router])

    const handleDeleteConversation = useCallback(async (conversationId: string, e: React.MouseEvent) => {
      e.stopPropagation() // Evitar que se seleccione la conversación al hacer click en eliminar

      try {
        await deleteConversation(conversationId)

        // Si la conversación eliminada era la activa, cambiar a la primera disponible
        if (conversationId === activeConversationId) {
          const remainingConversations = conversations.filter(c => c.id !== conversationId)
          if (remainingConversations.length > 0) {
            setActiveConversationId(remainingConversations[0].id)
          } else {
            setActiveConversationId(null)
          }
        }

        setError('')
      } catch (error) {
        console.error('Error deleting conversation:', error)
        setError('Error al eliminar la conversación')
      }
    }, [deleteConversation, activeConversationId, conversations, setActiveConversationId, setError])

    const handleSetActiveConversation = (conversationId: string) => {
      setActiveConversationId(conversationId)
      router.push(`/${locale}/dashboard`)
    }

    return (
      <div className={cn(
        'flex flex-col w-64 border-r border-gray-700 transition-all duration-300'
      )}>
        {/* Header */}
        <header className="flex flex-col items-start p-4 min-h-20">
          <Link href="/" className="text-xl font-bold">Dream<span className="text-accent font-normal">Reader</span></Link>
          {/* New conversation button */}
          <div className="py-4 my-4 border-y border-gray-700">
            <Button
              onClick={handleNewConversation}
              className="w-full bg-transparent text-gray-400 justify-start"
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('newConversation')}
            </Button>
            <Button
              className="w-full bg-transparent text-gray-400 justify-start"
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Buscar
            </Button>
            <Link
              className="inline-flex items-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-primary/90 hover:text-white h-10 px-4 py-2 w-full bg-transparent text-gray-400 justify-start"
              href={`/${locale}/calendar`}
            >
              <Plus className="h-4 w-4 mr-2" />
              {user ? 'calendario' : 'calendario - pro'}
            </Link>
          </div>
        </header>

        {/* Conversations list */}
        <ScrollArea className="flex-1 px-4">
          <div className="">
            <p className="text-gray-400 text-sm px-3">Chats</p>
            {conversations.map((conversation) => (
              conversation.messages.length > 0 && (
                <div key={conversation.id} className="relative">
                  <Button
                    variant={conversation.id === activeConversationId ? 'secondary' : 'ghost'}
                    className="w-full justify-start text-left h-auto p-3 group hover:bg-secondary"
                    onClick={() => handleSetActiveConversation(conversation.id)}
                  >
                    <div className="flex-1 truncate">
                      <div className="font-medium truncate">
                        {conversation.title || t('untitled') || 'Sin título'}
                      </div>
                    </div>
                    <Trash2 onClick={(e) => handleDeleteConversation(conversation.id, e)} className="h-4 w-4 group-hover:block hidden hover:text-red-400" />
                  </Button>
                </div>
              )))}
          </div>
        </ScrollArea>

        {/* User info and settings */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3 border-t border-gray-700 py-4">
            <div className="flex items-center space-x-3">
              <UserButton />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.firstName || user?.emailAddresses[0]?.emailAddress}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

Sidebar.displayName = 'Sidebar'
