# Supabase Database Migration Guide

## Overview

This migration implements a comprehensive Supabase database solution to solve the Twitter repeated reply issue and create a holistic conversation tracking system across all platforms (Twitter, Telegram, Website).

## What Was Fixed

### Twitter Automation Issues
- **Repeated Replies**: The Twitter automation was responding to the same tweets repeatedly because it had no persistent memory
- **Inconsistent Deduplication**: Different entry points (`lib/twitter/monitor.ts` vs `src/app/api/cron/monitor/route.ts`) had different or missing deduplication logic
- **File-based Storage Problems**: Unreliable file-based storage for tracking processed interactions

### System-wide Improvements
- **Unified Database**: All platforms now use the same Supabase database for consistency
- **Conversation Tracking**: Proper conversation history management across platforms
- **Usage Monitoring**: Comprehensive API usage tracking for rate limiting
- **Analytics**: Built-in analytics and reporting capabilities

## Architecture Changes

### Database Schema
Created comprehensive schema in `database-schema.sql`:
- **conversations**: Platform-agnostic conversation sessions
- **messages**: Individual messages within conversations
- **interactions**: Platform interactions to prevent duplicates
- **usage_tracking**: API usage monitoring
- **analytics**: System metrics and insights

### Service Layer
New database service in `lib/services/database.ts`:
- Centralized database operations
- Interaction deduplication
- Conversation management
- Usage tracking
- Analytics queries

### Platform Integration

#### Twitter (`lib/twitter/monitor.ts`, `src/app/api/cron/monitor/route.ts`)
- Database-based interaction tracking prevents repeated replies
- Usage-based rate limiting
- Conversation history storage
- Tweet metadata preservation

#### Telegram (`lib/telegram/handlers.ts`)
- Database conversation persistence
- Context-aware responses using message history
- User metadata tracking
- Group vs direct message handling

#### Website (`src/app/api/chat/route.ts`)
- Database conversation storage
- Session persistence
- Message history for context

## Setup Instructions

### 1. Environment Variables
Add to your `.env.local`:
```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Cron Authentication
CRON_SECRET=your_cron_secret_key_here
```

### 2. Database Setup
1. Create a new Supabase project at https://supabase.com
2. Run the SQL schema from `database-schema.sql` in your Supabase SQL editor
3. Verify all tables and functions are created successfully

### 3. Migration (Optional)
If you have existing file-based data to migrate:
```bash
# Run migration helper (if needed)
npm run migrate-conversations
```

### 4. Testing
```bash
# Test database connection
npm run test-db

# Run Twitter automation (should now prevent duplicates)
npm run monitor

# Test Telegram bot
npm run telegram:start

# Test website chat
npm run dev
```

## Key Features

### Duplicate Prevention
- **Twitter**: Checks `interactions` table before responding
- **Telegram**: Conversation-based context prevents duplicate responses
- **Website**: Session-based conversation continuity

### Rate Limiting
- **Database-tracked Usage**: Daily limits per platform/operation
- **Automatic Throttling**: Stops operations when limits reached
- **Usage Analytics**: Track API consumption patterns

### Conversation Continuity
- **Platform-specific IDs**: Each platform maintains its conversation context
- **Message History**: Recent messages provide context for responses
- **Metadata Storage**: Platform-specific data preserved

### Analytics & Monitoring
- **Interaction Stats**: Track mentions, replies, conversations
- **Usage Patterns**: Monitor API consumption
- **Performance Metrics**: Response times and success rates

## Database Functions

### Core Operations
```sql
-- Check if interaction processed
SELECT is_interaction_processed('twitter', 'tweet_id_123');

-- Record new interaction
SELECT record_interaction('twitter', 'tweet_id_123', 'mention', 'user_123');

-- Mark as processed
SELECT mark_interaction_processed('twitter', 'tweet_id_123', 'conversation_uuid');

-- Track usage
SELECT track_usage('twitter', 'write', 1);
```

### Views & Analytics
```sql
-- Daily interaction stats
SELECT * FROM daily_interaction_stats WHERE date >= CURRENT_DATE - INTERVAL '7 days';

-- Usage summary
SELECT * FROM daily_usage_summary WHERE date >= CURRENT_DATE - INTERVAL '30 days';

-- Active conversations
SELECT * FROM active_conversations_with_latest LIMIT 20;
```

## Monitoring & Maintenance

### Health Checks
```bash
# Database connection check
curl /api/health/database

# Usage limits check
curl /api/admin/usage-stats

# Interaction stats
curl /api/admin/interaction-stats
```

### Cleanup Tasks
```sql
-- Archive old conversations (>90 days)
UPDATE conversations SET status = 'archived'
WHERE created_at < NOW() - INTERVAL '90 days';

-- Clean old usage data (>1 year)
DELETE FROM usage_tracking
WHERE created_at < NOW() - INTERVAL '1 year';
```

## Troubleshooting

### Common Issues

1. **Repeated Replies Still Happening**
   - Check Supabase connection in logs
   - Verify `interactions` table has proper indexes
   - Ensure both cron and monitor services use database

2. **Rate Limits Not Working**
   - Check `usage_tracking` table updates
   - Verify daily limits in `checkUsageLimit` calls
   - Review timezone settings for date calculations

3. **Conversation Context Lost**
   - Check `conversations` and `messages` tables
   - Verify conversation ID consistency
   - Review message ordering and timestamps

### Debug Queries
```sql
-- Check recent interactions
SELECT * FROM interactions
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Check conversation activity
SELECT c.platform, COUNT(*) as conversations,
       MAX(c.updated_at) as last_activity
FROM conversations c
GROUP BY c.platform;

-- Check usage today
SELECT platform, operation_type, operation_count
FROM usage_tracking
WHERE date = CURRENT_DATE;
```

## Performance Optimization

### Indexes
The schema includes optimized indexes for:
- Fast interaction lookups by platform + ID
- Conversation queries by platform
- Usage tracking by date ranges
- Message retrieval by conversation

### Caching
- Web API responses cached for 1 hour
- Database queries use prepared statements
- Connection pooling via Supabase

### Rate Limiting
- Database-enforced daily limits
- Graceful degradation when limits hit
- Usage tracking prevents API overages

## Security Considerations

- Service role key used for server-side operations
- Row Level Security (RLS) can be enabled for multi-tenant setups
- Sensitive data like API keys not stored in database
- User data anonymized where possible

## Next Steps

1. **Enable RLS**: Add row-level security for multi-user environments
2. **Add Webhooks**: Real-time notifications for critical events
3. **Dashboard**: Build admin interface for monitoring
4. **Backup**: Set up automated database backups
5. **Scaling**: Consider read replicas for high-volume usage

## Support

For issues or questions:
1. Check Supabase dashboard for database errors
2. Review application logs for service issues
3. Use debug queries to inspect data
4. Verify environment variables are set correctly