import { vi } from 'vitest'

export const mockDatabase = {
  insertConversation: vi.fn(),
  getUserConversations: vi.fn(),
  updateConversationTitle: vi.fn(),
  deleteConversation: vi.fn(),
  insertMessage: vi.fn(),
  getConversationMessages: vi.fn(),
  getConversationById: vi.fn()
}

// Mock de las funciones de base de datos
vi.mock('@/lib/database', () => ({
  insertConversation: mockDatabase.insertConversation,
  getUserConversations: mockDatabase.getUserConversations,
  updateConversationTitle: mockDatabase.updateConversationTitle,
  deleteConversation: mockDatabase.deleteConversation,
  insertMessage: mockDatabase.insertMessage,
  getConversationMessages: mockDatabase.getConversationMessages,
  getConversationById: mockDatabase.getConversationById
}))

export default mockDatabase
