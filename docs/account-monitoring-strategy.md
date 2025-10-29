# Account Monitoring Strategy

## Overview
Efficiently monitor 144 target accounts across 40 categories while staying within API limits and minimizing costs.

## API Constraints
- **Search API**: 1 request per 15 minutes (free tier)
- **Daily Read Limit**: 100 requests (current app limit)
- **Search Results**: Max 100 tweets per request
- **Target Accounts**: 144 accounts with valid handles

## Batching Strategy

### 1. Priority-Based Batching
Group accounts by priority level and batch size:

- **Priority 5 (14 accounts)**: 2-3 accounts per batch, every 30 minutes
- **Priority 4 (16 accounts)**: 4-5 accounts per batch, every 60 minutes
- **Priority 3 (12 accounts)**: 6 accounts per batch, every 90 minutes
- **Priority 2 (78 accounts)**: 8-10 accounts per batch, every 2 hours
- **Priority 1 (23 accounts)**: 10-12 accounts per batch, every 4 hours

### 2. Query Optimization
Use efficient Twitter search operators:

```
from:sama OR from:elonmusk OR from:DarioAmodei
```

Maximum 10-12 handles per query to stay within character limits.

### 3. Time-Based Filtering
- Only search for tweets from last 24-48 hours
- Skip accounts that posted recently (< 2 hours ago)
- Prioritize accounts that haven't been checked recently

## Intelligent Filtering

### Pre-Response Filtering
Before generating AI responses, filter tweets by:

1. **Recency**: Only tweets < 24 hours old
2. **Engagement**: Minimum retweets/likes threshold
3. **Content Quality**: Skip pure retweets, filter spam
4. **Relevance**: Keywords related to AI, tech, philosophy
5. **Thread Status**: Prefer original tweets or thread starters

### Response Decision Matrix

| Account Priority | Content Relevance | Engagement Level | Response Probability |
|-----------------|-------------------|------------------|---------------------|
| 5 (AI Leaders)  | High             | Any              | 80%                 |
| 5 (AI Leaders)  | Medium           | High             | 60%                 |
| 4 (VCs/CEOs)    | High             | High             | 70%                 |
| 4 (VCs/CEOs)    | Medium           | High             | 40%                 |
| 3 (Ethics)      | High             | High             | 50%                 |
| ≤2 (Others)     | High             | Very High        | 30%                 |

## Cost Efficiency Measures

### 1. Caching Strategy
- Cache account tweet data for 30-60 minutes
- Reuse recent searches when possible
- Store last-checked timestamps per account

### 2. Smart Scheduling
- Spread monitoring across 24 hours
- Higher frequency during peak Twitter hours (9am-6pm EST)
- Reduced monitoring during low-activity periods

### 3. Adaptive Batching
- Increase batch size for inactive accounts
- Decrease batch size for highly active accounts
- Skip recently processed accounts

## Daily Monitoring Schedule

### High Priority Cycle (30 min intervals)
- **Batch A**: Sam Altman, Elon Musk, Dario Amodei (Priority 5)
- **Batch B**: Demis Hassabis, Mustafa Suleyman, Yann LeCun (Priority 5)
- **Batch C**: Andrej Karpathy, Ian Goodfellow, Jeremy Howard (Priority 5)

### Medium Priority Cycle (60 min intervals)
- **Batch D**: Tech CEOs (Satya, Sundar, Jensen, etc.)
- **Batch E**: Top VCs (Marc Andreessen, Peter Thiel, etc.)
- **Batch F**: Cultural Amplifiers (Joe Rogan, Lex Fridman, etc.)

### Lower Priority Cycle (2-4 hour intervals)
- Rotate through remaining accounts in larger batches

## Implementation Plan

### Phase 1: Core Monitoring System
1. Load target accounts config
2. Implement batched search queries
3. Add intelligent filtering
4. Database tracking for processed tweets

### Phase 2: Response Logic
1. Category-based response strategies
2. Content analysis for relevance
3. Engagement threshold checking
4. Anti-spam measures

### Phase 3: Optimization
1. Performance monitoring
2. API usage analytics
3. Response rate optimization
4. Cost analysis and adjustment

## Expected Performance

### Daily Capacity
- **API Calls**: ~60-80 per day (within 100 limit)
- **Tweets Processed**: ~600-800 tweets per day
- **Potential Responses**: ~50-100 per day (filtered)
- **Actual Responses**: ~10-20 per day (after quality filtering)

### Coverage
- Priority 5 accounts: Checked every 30-90 minutes
- Priority 4 accounts: Checked every 1-2 hours
- Priority 3 accounts: Checked every 2-3 hours
- Priority ≤2 accounts: Checked every 4-8 hours

This strategy ensures comprehensive monitoring while staying within API limits and focusing resources on the highest-value targets.