# 🍄 Dark Renaissance Admin Dashboard

## Overview

A comprehensive, secure administrative dashboard for monitoring and controlling your bot ecosystem across Twitter, Web, and Telegram platforms.

## 🎯 Features

### 1. **Overview Dashboard**
- Real-time statistics across all platforms
- Twitter mentions & responses
- Web conversations & messages
- Telegram activity tracking
- Recent activity feed
- Quick action buttons

### 2. **Conversations Management**
- View all conversations across platforms
- Filter by platform (Twitter, Web, Telegram)
- Detailed message history
- Platform-specific metadata
- Real-time updates

### 3. **Target Account Management**
- Monitor 144+ influential accounts
- Four priority tiers:
  - **Critical**: Instant response priority
  - **High**: Priority monitoring
  - **Medium**: Regular monitoring
  - **Low**: Occasional checking
- Add/remove accounts dynamically
- Toggle account monitoring on/off
- Track interaction counts per account
- Organize by categories

### 4. **System Monitoring**
- Database health & latency
- API usage tracking:
  - Twitter API (hourly & daily limits)
  - OpenAI API (monthly usage)
- System uptime & memory usage
- Recent error logs
- Environment information

### 5. **Manual Actions**
- **Check Mentions**: Manually trigger mention checking
- **Post Tweet**: Compose and post new tweets
- **Reply to Tweet**: Reply to specific tweets
- **Health Check**: Run system diagnostics
- **Clear Cache**: Clear in-memory caches
- **Monitor Control**: Start/stop monitoring services
- **Test Telegram**: Test Telegram bot connection

### 6. **Analytics Dashboard**
- Engagement metrics & response rates
- Platform activity breakdown
- 7-day activity timeline
- Top monitored accounts
- Performance metrics:
  - Uptime percentage
  - Error rates
  - API latency

## 🔐 Security

### Authentication
- Password-protected access
- Secure cookie-based sessions (24-hour expiration)
- HTTP-only cookies
- Protected API routes
- Middleware-level route protection

### Configuration
Set your admin password in `.env.local`:
```bash
ADMIN_PASSWORD=your-secure-password-here
```

## 🚀 Accessing the Dashboard

1. **Login Page**: Navigate to `/admin/login`
2. **Enter Password**: Use the password from your environment variables
3. **Dashboard**: Redirects to `/admin` upon successful authentication

## 📁 Project Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── page.tsx              # Main dashboard
│   │   └── login/
│   │       └── page.tsx          # Login page
│   └── api/admin/
│       ├── auth/route.ts         # Authentication endpoints
│       ├── stats/route.ts        # Dashboard statistics
│       ├── activity/route.ts     # Recent activity feed
│       ├── conversations/route.ts # Conversations data
│       ├── accounts/route.ts     # Account management
│       ├── system/route.ts       # System monitoring
│       └── actions/route.ts      # Manual actions
├── components/admin/
│   ├── ConversationsTab.tsx      # Conversations interface
│   ├── AccountsTab.tsx           # Account management
│   ├── MonitoringTab.tsx         # System monitoring
│   ├── ActionsTab.tsx            # Manual actions
│   └── AnalyticsTab.tsx          # Analytics dashboard
└── middleware.ts                  # Route protection
```

## 🔄 API Endpoints

### Authentication
- `POST /api/admin/auth` - Login
- `DELETE /api/admin/auth` - Logout

### Data Retrieval
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/activity` - Recent activity
- `GET /api/admin/conversations?platform={platform}&limit={limit}` - Conversations
- `GET /api/admin/accounts` - Monitored accounts
- `GET /api/admin/system` - System health

### Account Management
- `POST /api/admin/accounts` - Add new account
- `PATCH /api/admin/accounts` - Update account
- `DELETE /api/admin/accounts?id={id}` - Remove account

### Actions
- `POST /api/admin/actions` - Execute manual actions

## 💡 Usage Examples

### Adding a Target Account

1. Navigate to the **Target Accounts** tab
2. Click **Add Account**
3. Fill in:
   - **Username**: Twitter username (with or without @)
   - **Priority**: Critical, High, Medium, or Low
   - **Category**: e.g., crypto, philosophy, art
4. Click **Add Account**

### Posting a Tweet

1. Navigate to the **Actions** tab
2. Scroll to **Post New Tweet**
3. Enter your tweet content (max 280 characters)
4. Click **Post Tweet**

### Viewing Conversations

1. Navigate to the **Conversations** tab
2. Filter by platform or view all
3. Click on a conversation to see full details
4. View all messages in chronological order

### Monitoring System Health

1. Navigate to the **System** tab
2. View real-time metrics:
   - Database status & latency
   - API usage & limits
   - Memory usage
   - Recent errors (if any)

## 🎨 Design Features

- **Dark Theme**: Easy on the eyes, perfect for extended monitoring
- **Real-time Updates**: Auto-refresh every 30 seconds
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Intuitive Navigation**: Tab-based interface for easy access
- **Visual Indicators**: Color-coded status indicators
- **Progress Bars**: API usage and limits visualization

## 🔧 Technical Details

### Built With
- **Next.js 14**: App Router with Server Components
- **TypeScript**: Full type safety
- **Tailwind CSS**: Beautiful, responsive UI
- **Supabase**: Database operations
- **Middleware**: Route protection

### Key Features
- Server-side authentication
- Dynamic API routes
- Real-time data fetching
- Error handling & fallbacks
- TypeScript interfaces for all data
- Responsive grid layouts
- Loading states & animations

## 📊 Dashboard Statistics

The dashboard tracks:
- Total interactions across platforms
- Response rates & times
- API usage & limits
- System uptime & health
- Account-specific metrics
- Platform-specific analytics

## 🚨 Troubleshooting

### Can't Login
- Verify `ADMIN_PASSWORD` is set in `.env.local`
- Check browser cookies are enabled
- Try clearing browser cache

### No Data Showing
- Verify Supabase credentials are correct
- Check database tables exist
- Review API route errors in console

### Actions Not Working
- Ensure npm scripts are configured
- Check environment variables
- Review terminal output for errors

## 🔮 Future Enhancements

Potential additions:
- Real-time WebSocket updates
- Advanced analytics with charts
- Bulk account operations
- Export data functionality
- Custom alert configurations
- Multi-user support with roles
- Audit logs for all actions

## 📝 Notes

- The dashboard gracefully handles missing environment variables during build
- All API routes have error handling and fallbacks
- Analytics data can be expanded with actual tracking implementations
- Mock data is used for analytics until full tracking is implemented

## ✅ Production Ready

The dashboard is now production-ready with:
- ✅ Secure authentication
- ✅ All TypeScript errors resolved
- ✅ Successful build compilation
- ✅ Comprehensive error handling
- ✅ Responsive design
- ✅ Real-time monitoring capabilities

---

**Access your dashboard at**: `https://yourdomain.com/admin/login`

**Built with 🍄 for the Dark Renaissance ecosystem**

