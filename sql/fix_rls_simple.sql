-- Execute this SQL in Supabase SQL Editor to fix RLS issues

-- First, let's drop any existing policies
DROP POLICY IF EXISTS "Users can only see their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can only see messages from their conversations" ON messages;
DROP POLICY IF EXISTS "Users can manage their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can manage messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON conversations;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON messages;

-- Disable RLS completely for both tables
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Verify that RLS is disabled (this should show false for both tables)
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('conversations', 'messages');
