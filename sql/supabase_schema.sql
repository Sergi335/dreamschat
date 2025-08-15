-- Dream Reader Database Schema for Supabase
-- Execute these commands in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table for conversations
CREATE TABLE conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL, -- Clerk user ID
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for messages
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);

-- RLS (Row Level Security) policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can only see their own conversations" ON conversations
  FOR ALL USING (auth.uid()::text = user_id);

-- Messages policies  
CREATE POLICY "Users can only see messages from their conversations" ON messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()::text
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_conversations_updated_at 
  BEFORE UPDATE ON conversations 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Optional: Create a function to get conversation stats
CREATE OR REPLACE FUNCTION get_conversation_stats(conv_id UUID)
RETURNS TABLE(message_count BIGINT, last_message_at TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as message_count,
    MAX(timestamp) as last_message_at
  FROM messages 
  WHERE conversation_id = conv_id;
END;
$$ LANGUAGE plpgsql;
