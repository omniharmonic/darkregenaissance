# Vercel Environment Variables Setup

## Required Environment Variables

Go to your Vercel project → Settings → Environment Variables and add these:

### 1. Admin Dashboard
```
ADMIN_PASSWORD=N3h08Qqq9cCFvtX
```

### 2. Supabase (Get these from your Supabase project settings)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Twitter API (Get these from Twitter Developer Portal)
```
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret  
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_SECRET=your_access_secret
TWITTER_BEARER_TOKEN=your_bearer_token
```

### 4. AI APIs
```
GEMINI_API_KEY=your_gemini_api_key
```

### 5. Telegram (Optional - for Telegram bot)
```
TELEGRAM_BOT_TOKEN=your_telegram_token
```

## How to Add in Vercel

1. Go to https://vercel.com/your-project/settings/environment-variables
2. Add each variable one by one
3. Select "Production", "Preview", and "Development" for each
4. Click "Save"
5. **Redeploy** your project for changes to take effect

## Quick Check

After adding variables and redeploying:
- Visit `/admin` - should redirect to login
- Login with password
- Dashboard should load without 500 errors

## Troubleshooting

If you still see 500 errors:
1. Check Vercel logs (Deployments → View Function Logs)
2. Verify all environment variables are set correctly
3. Make sure you redeployed after adding variables
4. Check Supabase connection string is correct

