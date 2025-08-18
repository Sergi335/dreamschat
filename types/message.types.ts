export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  optimisticId?: string; // <-- Nuevo campo opcional
}
