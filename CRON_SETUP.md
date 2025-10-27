# Dark Regenaissance Vercel Cron Jobs Setup

## 🕐 Automated Schedule

### Daily Tweets (3x per day)
- **Schedule**: `0 9,15,21 * * *`
- **Times**: 9:00 AM, 3:00 PM, 9:00 PM UTC
- **Endpoint**: `/api/cron/tweet`
- **Function**: Posts AI-generated Dark Regenaissance insights

### Mention Monitoring (Every 15 minutes)
- **Schedule**: `*/15 * * * *`
- **Frequency**: Every 15 minutes
- **Endpoint**: `/api/cron/monitor`
- **Function**: Checks for mentions and responds automatically

## 🔧 Setup Instructions

### 1. Environment Variables (Required in Vercel)
```bash
# All your existing variables from .env.local
GEMINI_API_KEY=your_key
TWITTER_API_KEY=your_key
TWITTER_API_SECRET=your_secret
TWITTER_ACCESS_TOKEN=your_token
TWITTER_ACCESS_SECRET=your_secret
TWITTER_BEARER_TOKEN=your_bearer_token

# Optional: Cron job security
CRON_SECRET=your_random_secret_string
```

### 2. Deploy to Vercel
```bash
git add .
git commit -m "Add Vercel cron jobs for automated tweets and monitoring"
git push origin main
```

### 3. Verify Cron Jobs in Vercel Dashboard
1. Go to your Vercel project dashboard
2. Navigate to "Functions" tab
3. Look for cron jobs section
4. Verify both jobs are scheduled

## 🧪 Testing Endpoints

### Test Tweet Generation
```bash
curl -X GET https://darkregenaissance.xyz/api/cron/tweet
```

### Test Mention Monitor
```bash
curl -X GET https://darkregenaissance.xyz/api/cron/monitor
```

### Manual Tweet Posting (with auth)
```bash
curl -X POST https://darkregenaissance.xyz/api/cron/tweet \
  -H "Authorization: Bearer $CRON_SECRET"
```

## 📊 Monitoring

### Vercel Function Logs
- Check function logs in Vercel dashboard
- Monitor for errors or rate limit issues

### Expected Behavior
- **Daily Tweets**: 3 AI insights posted daily
- **Mention Responses**: Automatic replies to @darkregenaI mentions (limited by Twitter API)
- **Rate Limiting**: Respects Twitter's 15-minute search window

## 🚨 Known Limitations

1. **Twitter Free API**: Only 1 search per 15 minutes
2. **Rate Limits**: May miss some mentions during high activity
3. **Search Delay**: Twitter search isn't real-time

## 🔄 Manual Operations

```bash
# Generate tweet manually
npm run tweet -- --generate

# Check configuration
npm run configure -- list-accounts

# Add watched accounts
npm run configure -- add-account username
```

## 🍄 The Mycelial Network is Now Automated! 🌲