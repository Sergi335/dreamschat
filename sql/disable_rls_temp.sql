-- Temporary fix: Disable RLS for development
-- Execute this in Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Users can only see their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can only see messages from their conversations" ON messages;

-- Disable RLS temporarily for easier development
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
