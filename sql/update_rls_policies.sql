-- Update RLS policies to work with Clerk authentication
-- Execute these commands in the Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Users can only see their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can only see messages from their conversations" ON messages;

-- Option 1: More secure - Create policies that work with our user_id field
CREATE POLICY "Users can manage their own conversations" ON conversations
  FOR ALL USING (
    user_id = current_setting('app.current_user_id', true)
  );

CREATE POLICY "Users can manage messages in their conversations" ON messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = current_setting('app.current_user_id', true)
    )
  );

-- Option 2: Temporarily disable RLS for easier development
-- (uncomment these lines if you prefer to disable RLS completely)
-- ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Function to set current user context
CREATE OR REPLACE FUNCTION set_current_user_id(user_id text)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
