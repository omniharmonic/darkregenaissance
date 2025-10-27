# Dark Regenaissance GitHub Actions Automation

## 🕐 Automated Schedule

### Daily Tweets (3x per day)
- **Schedule**: `0 9,15,21 * * *`
- **Times**: 9:00 AM, 3:00 PM, 9:00 PM UTC
- **Workflow**: `.github/workflows/daily-tweets.yml`
- **Function**: Posts AI-generated Dark Regenaissance insights

### Mention Monitoring (Every 15 minutes)
- **Schedule**: `*/15 * * * *`
- **Frequency**: Every 15 minutes
- **Workflow**: `.github/workflows/monitor-mentions.yml`
- **Function**: Checks for mentions and responds automatically

## 🔧 Setup Instructions

### 1. Configure GitHub Repository Secrets
Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:
```bash
GEMINI_API_KEY=your_key
TWITTER_API_KEY=your_key
TWITTER_API_SECRET=your_secret
TWITTER_ACCESS_TOKEN=your_token
TWITTER_ACCESS_SECRET=your_secret
TWITTER_BEARER_TOKEN=your_bearer_token
```

### 2. Deploy GitHub Actions
```bash
git add .
git commit -m "Add GitHub Actions workflows for automated tweets and monitoring"
git push origin main
```

### 3. Verify GitHub Actions
1. Go to your GitHub repository
2. Navigate to "Actions" tab
3. Verify both workflows are scheduled and running
4. Check workflow logs for any errors

## 🧪 Testing Workflows

### Test Manual Trigger
1. Go to GitHub Actions tab
2. Select a workflow
3. Click "Run workflow" to trigger manually

### Test Local Scripts
```bash
# Test tweet generation
npm run tweet -- --generate

# Test mention monitoring
npm run monitor -- --check
```

## 📊 Monitoring

### GitHub Actions Logs
- Check workflow logs in GitHub Actions tab
- Monitor for errors or rate limit issues
- View detailed step-by-step execution

### Expected Behavior
- **Daily Tweets**: 3 AI insights posted daily at scheduled times
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