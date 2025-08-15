import { Conversation, Message } from '@/lib/database';
import { useUser } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';

export const useConversations = () => {
  const { user, isLoaded } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar conversaciones del servidor
  const loadConversations = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/conversations');
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      
      const data = await response.json();
      setConversations(data.conversations || []);
      setError(null);
    } catch (err: any) {
      console.error('Error loading conversations:', err);
      setError(err.message);
      
      // Fallback a localStorage si falla la DB
      const localConversations = localStorage.getItem('dream-reader-conversations');
      if (localConversations) {
        try {
          const parsed = JSON.parse(localConversations);
          setConversations(parsed.map((conv: any) => ({
            ...conv,
            lastUpdated: new Date(conv.lastUpdated),
            messages: conv.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          })));
        } catch {
          setConversations([]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Crear nueva conversación
  const createConversation = async (title: string = 'New Chat'): Promise<string | null> => {
    if (!user) return null;

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      const newConversation = await response.json();
      
      setConversations(prev => [newConversation, ...prev]);
      return newConversation.id;
    } catch (err: any) {
      console.error('Error creating conversation:', err);
      setError(err.message);
      
      // Fallback a localStorage
      const tempId = Date.now().toString();
      const newConversation: Conversation = {
        id: tempId,
        title,
        messages: [],
        lastUpdated: new Date()
      };
      
      setConversations(prev => [newConversation, ...prev]);
      return tempId;
    }
  };

  // Agregar mensaje a una conversación
  const addMessage = async (
    conversationId: string, 
    role: 'user' | 'assistant', 
    content: string
  ): Promise<void> => {
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      role,
      content,
      timestamp: new Date()
    };

    // Actualizar UI inmediatamente
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? {
            ...conv,
            messages: [...conv.messages, tempMessage],
            lastUpdated: new Date()
          }
        : conv
    ));

    // Guardar en servidor
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role, content }),
      });

      if (response.ok) {
        const savedMessage = await response.json();
        
        // Actualizar con el ID real del servidor
        setConversations(prev => prev.map(conv => 
          conv.id === conversationId 
            ? {
                ...conv,
                messages: conv.messages.map(msg => 
                  msg.id === tempMessage.id ? { ...savedMessage, timestamp: new Date(savedMessage.timestamp) } : msg
                )
              }
            : conv
        ));
      }
    } catch (err: any) {
      console.error('Error saving message:', err);
      setError(err.message);
    }
  };

  // Actualizar título de conversación
  const updateConversationTitle = async (conversationId: string, title: string): Promise<void> => {
    // Actualizar UI inmediatamente
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId ? { ...conv, title } : conv
    ));

    // Guardar en servidor
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        throw new Error('Failed to update title');
      }
    } catch (err: any) {
      console.error('Error updating title:', err);
      setError(err.message);
    }
  };

  // Eliminar conversación
  const deleteConversation = async (conversationId: string): Promise<void> => {
    if (!user) return;

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }

      // Actualizar estado local
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      // Si era la conversación activa, limpiar la selección
      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
      }
    } catch (err: any) {
      console.error('Error deleting conversation:', err);
      setError(err.message);
    }
  };

  // Migrar conversaciones locales a la base de datos
  const migrateLocalConversations = async (): Promise<void> => {
    if (!user) return;

    const localConversations = localStorage.getItem('dream-reader-conversations');
    if (!localConversations) return;

    try {
      const parsed = JSON.parse(localConversations);
      const { migrateLocalConversations: migrateFunc } = await import('@/lib/database');
      
      const conversationsToMigrate = parsed.map((conv: any) => ({
        ...conv,
        lastUpdated: new Date(conv.lastUpdated),
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));

      const success = await migrateFunc(user.id, conversationsToMigrate);
      
      if (success) {
        localStorage.removeItem('dream-reader-conversations');
        await loadConversations(); // Recargar desde la DB
      }
    } catch (err: any) {
      console.error('Error migrating conversations:', err);
      setError(err.message);
    }
  };

  // Efectos
  useEffect(() => {
    if (isLoaded && user) {
      loadConversations();
    }
  }, [isLoaded, user, loadConversations]);

  // Auto-seleccionar la primera conversación si no hay ninguna activa
  useEffect(() => {
    if (conversations.length > 0 && !activeConversationId) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId]);

  return {
    conversations,
    activeConversationId,
    setActiveConversationId,
    isLoading,
    error,
    createConversation,
    addMessage,
    updateConversationTitle,
    deleteConversation,
    migrateLocalConversations,
    refreshConversations: loadConversations
  };
};
