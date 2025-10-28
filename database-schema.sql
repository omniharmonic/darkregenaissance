-- Dark Regenaissance Database Schema
-- Comprehensive schema for tracking all conversations and interactions

-- Conversations table - stores all conversation sessions across platforms
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL CHECK (platform IN ('web', 'telegram', 'twitter')),
    platform_id TEXT, -- tweet_id, telegram_chat_id, etc.
    user_id TEXT, -- platform-specific user identifier
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
    metadata JSONB, -- platform-specific metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table - stores individual messages within conversations
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    metadata JSONB, -- message-specific metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interactions table - tracks all platform interactions to prevent duplicates
CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL CHECK (platform IN ('web', 'telegram', 'twitter')),
    platform_interaction_id TEXT NOT NULL, -- tweet_id, message_id, etc.
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('mention', 'reply', 'direct_message', 'post', 'comment')),
    user_id TEXT, -- who initiated the interaction
    processed BOOLEAN DEFAULT FALSE,
    response_sent BOOLEAN DEFAULT FALSE,
    conversation_id UUID REFERENCES conversations(id),
    metadata JSONB, -- interaction-specific data
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure we don't process the same interaction twice
    UNIQUE(platform, platform_interaction_id)
);

-- Usage tracking table - monitor API usage across platforms
CREATE TABLE usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL CHECK (platform IN ('twitter', 'telegram', 'gemini')),
    operation_type TEXT NOT NULL CHECK (operation_type IN ('read', 'write', 'search', 'generate')),
    operation_count INTEGER DEFAULT 1,
    date DATE DEFAULT CURRENT_DATE,
    metadata JSONB, -- operation-specific metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- One record per platform/operation/date
    UNIQUE(platform, operation_type, date)
);

-- Analytics table - store insights and metrics
CREATE TABLE analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    metric_value NUMERIC,
    dimensions JSONB, -- flexible dimensions (platform, user_type, etc.)
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_conversations_platform ON conversations(platform);
CREATE INDEX idx_conversations_platform_id ON conversations(platform_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

CREATE INDEX idx_interactions_platform ON interactions(platform);
CREATE INDEX idx_interactions_platform_interaction_id ON interactions(platform_interaction_id);
CREATE INDEX idx_interactions_processed ON interactions(processed);
CREATE INDEX idx_interactions_response_sent ON interactions(response_sent);
CREATE INDEX idx_interactions_created_at ON interactions(created_at);

CREATE INDEX idx_usage_tracking_platform_date ON usage_tracking(platform, date);
CREATE INDEX idx_analytics_metric_name_date ON analytics(metric_name, date);

-- Functions for common operations

-- Function to check if an interaction has been processed
CREATE OR REPLACE FUNCTION is_interaction_processed(
    p_platform TEXT,
    p_platform_interaction_id TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM interactions
        WHERE platform = p_platform
        AND platform_interaction_id = p_platform_interaction_id
        AND processed = TRUE
    );
END;
$$ LANGUAGE plpgsql;

-- Function to record an interaction
CREATE OR REPLACE FUNCTION record_interaction(
    p_platform TEXT,
    p_platform_interaction_id TEXT,
    p_interaction_type TEXT,
    p_user_id TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    interaction_uuid UUID;
BEGIN
    INSERT INTO interactions (
        platform,
        platform_interaction_id,
        interaction_type,
        user_id,
        metadata
    ) VALUES (
        p_platform,
        p_platform_interaction_id,
        p_interaction_type,
        p_user_id,
        p_metadata
    )
    ON CONFLICT (platform, platform_interaction_id)
    DO UPDATE SET
        updated_at = NOW(),
        metadata = COALESCE(p_metadata, interactions.metadata)
    RETURNING id INTO interaction_uuid;

    RETURN interaction_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to mark interaction as processed with response
CREATE OR REPLACE FUNCTION mark_interaction_processed(
    p_platform TEXT,
    p_platform_interaction_id TEXT,
    p_conversation_id UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE interactions SET
        processed = TRUE,
        response_sent = TRUE,
        processed_at = NOW(),
        conversation_id = COALESCE(p_conversation_id, conversation_id)
    WHERE platform = p_platform
    AND platform_interaction_id = p_platform_interaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment usage tracking
CREATE OR REPLACE FUNCTION track_usage(
    p_platform TEXT,
    p_operation_type TEXT,
    p_count INTEGER DEFAULT 1,
    p_metadata JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO usage_tracking (platform, operation_type, operation_count, metadata)
    VALUES (p_platform, p_operation_type, p_count, p_metadata)
    ON CONFLICT (platform, operation_type, date)
    DO UPDATE SET
        operation_count = usage_tracking.operation_count + p_count,
        metadata = COALESCE(p_metadata, usage_tracking.metadata);
END;
$$ LANGUAGE plpgsql;

-- Views for common queries

-- Active conversations with latest message
CREATE VIEW active_conversations_with_latest AS
SELECT
    c.*,
    m.content as latest_message,
    m.role as latest_message_role,
    m.created_at as latest_message_at
FROM conversations c
LEFT JOIN LATERAL (
    SELECT * FROM messages
    WHERE conversation_id = c.id
    ORDER BY created_at DESC
    LIMIT 1
) m ON true
WHERE c.status = 'active'
ORDER BY COALESCE(m.created_at, c.created_at) DESC;

-- Daily interaction stats
CREATE VIEW daily_interaction_stats AS
SELECT
    platform,
    interaction_type,
    DATE(created_at) as date,
    COUNT(*) as total_interactions,
    COUNT(*) FILTER (WHERE processed = TRUE) as processed_interactions,
    COUNT(*) FILTER (WHERE response_sent = TRUE) as responses_sent
FROM interactions
GROUP BY platform, interaction_type, DATE(created_at)
ORDER BY date DESC, platform, interaction_type;

-- Daily usage summary
CREATE VIEW daily_usage_summary AS
SELECT
    platform,
    date,
    SUM(operation_count) FILTER (WHERE operation_type = 'read') as reads,
    SUM(operation_count) FILTER (WHERE operation_type = 'write') as writes,
    SUM(operation_count) FILTER (WHERE operation_type = 'search') as searches,
    SUM(operation_count) FILTER (WHERE operation_type = 'generate') as generations
FROM usage_tracking
GROUP BY platform, date
ORDER BY date DESC, platform;