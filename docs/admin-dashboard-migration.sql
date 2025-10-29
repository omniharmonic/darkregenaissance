-- Admin Dashboard Migration
-- Run this in your Supabase SQL editor

-- Create twitter_accounts table for managing monitored accounts
CREATE TABLE IF NOT EXISTS twitter_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    category TEXT,
    strategy JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_twitter_accounts_username ON twitter_accounts(username);
CREATE INDEX IF NOT EXISTS idx_twitter_accounts_priority ON twitter_accounts(priority);
CREATE INDEX IF NOT EXISTS idx_twitter_accounts_is_active ON twitter_accounts(is_active);

-- Insert some example accounts (optional - remove if you don't want these)
INSERT INTO twitter_accounts (username, priority, category) VALUES
    ('vitalik', 'high', 'crypto'),
    ('naval', 'high', 'philosophy'),
    ('balajis', 'high', 'tech')
ON CONFLICT (username) DO NOTHING;

-- Add helpful comment
COMMENT ON TABLE twitter_accounts IS 'Stores Twitter accounts to monitor for mentions and engagement';

