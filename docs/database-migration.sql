-- Database Migration for Enhanced Twitter Monitoring
-- Execute these commands in your Supabase SQL editor

-- Update the interactions table to support new interaction types
ALTER TABLE interactions
DROP CONSTRAINT IF EXISTS interactions_interaction_type_check;

ALTER TABLE interactions
ADD CONSTRAINT interactions_interaction_type_check
CHECK (interaction_type IN (
  'mention',
  'reply',
  'direct_message',
  'post',
  'comment',
  'watch',
  'target_account_response',
  'filtered'
));

-- Add indexes for performance with new interaction types
CREATE INDEX IF NOT EXISTS idx_interactions_type_platform
ON interactions (interaction_type, platform);

CREATE INDEX IF NOT EXISTS idx_interactions_processed_date
ON interactions (processed, created_at);

-- Add index for conversation metadata searches
CREATE INDEX IF NOT EXISTS idx_conversations_metadata
ON conversations USING gin (metadata);

-- Add index for message metadata searches
CREATE INDEX IF NOT EXISTS idx_messages_metadata
ON messages USING gin (metadata);

-- Update any existing rows if needed (optional)
-- This is safe to run multiple times
UPDATE interactions
SET metadata = metadata || '{"migrated": true}'::jsonb
WHERE metadata IS NULL;

-- Verify the changes
SELECT DISTINCT interaction_type
FROM interactions
ORDER BY interaction_type;

-- Show index status
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('interactions', 'conversations', 'messages')
AND schemaname = 'public'
ORDER BY tablename, indexname;