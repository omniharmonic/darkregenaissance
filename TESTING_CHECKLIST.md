# 🧪 Admin Dashboard Testing Checklist

## ✅ Pre-Testing Setup

- [x] Development server running (`npm run dev`)
- [x] `ADMIN_PASSWORD` environment variable set in `.env.local`
- [x] Build successful (all TypeScript errors fixed)
- [ ] Browser ready

## 🔐 1. Authentication Testing

### Login Page
- [ ] Navigate to: `http://localhost:3000/admin/login`
- [ ] Verify beautiful dark-themed login page loads
- [ ] Check for Dark Renaissance branding (🍄 mushroom icon)

### Test Invalid Login
- [ ] Enter wrong password
- [ ] Click "Access Dashboard"
- [ ] Should see error message: "Invalid password" or "Authentication failed"
- [ ] Should remain on login page

### Test Valid Login
- [ ] Enter correct password from `.env.local` (`ADMIN_PASSWORD`)
- [ ] Click "Access Dashboard"
- [ ] Should see loading spinner briefly
- [ ] Should redirect to `/admin` dashboard
- [ ] Should see navigation tabs at top

### Test Protected Routes
- [ ] Log out (click "Logout" button in header)
- [ ] Try to access `/admin` directly
- [ ] Should automatically redirect to `/admin/login`

---

## 📊 2. Overview Tab Testing

### Dashboard Stats
- [ ] Should see 4 stat cards:
  - Twitter Mentions
  - Web Conversations  
  - Telegram Chats
  - Target Accounts
- [ ] Stats should display numbers (may be 0 if no data yet)
- [ ] System health indicator should show (green dot = healthy)

### Recent Activity
- [ ] Should see "Recent Activity" section
- [ ] May show "No recent activity" if database is empty
- [ ] Check if any recent interactions appear

### Quick Actions
- [ ] Should see 4 quick action buttons:
  - 🔍 Check Mentions
  - 📝 Post Tweet
  - 💚 System Health
  - 🗑️ Clear Cache
- [ ] Buttons should be clickable (don't click yet)

---

## 💬 3. Conversations Tab Testing

### Navigation
- [ ] Click "Conversations" tab in navigation
- [ ] Tab should highlight in emerald/green color
- [ ] Page should load conversations interface

### Platform Filter
- [ ] Should see 4 filter buttons: All, Twitter, Web, Telegram
- [ ] Click each filter button
- [ ] Selected filter should highlight
- [ ] "All" should be selected by default

### Conversation List
- [ ] Left side shows conversation list
- [ ] Right side shows "Select a conversation to view details" message
- [ ] If database has conversations, they should appear
- [ ] Each conversation should show:
  - Platform icon (🐦/🌐/✈️)
  - Preview of first message
  - Message count
  - Date

### Conversation Details
- [ ] Click on a conversation (if any exist)
- [ ] Right panel should show full conversation
- [ ] Messages should be color-coded:
  - Bot messages: green/emerald background on left
  - User messages: gray background on right
- [ ] Should show timestamps
- [ ] Should show metadata section at bottom

---

## 🎯 4. Target Accounts Tab Testing

### Account List
- [ ] Click "Target Accounts" tab
- [ ] Should see accounts organized by priority:
  - Critical (red)
  - High (orange)
  - Medium (yellow)
  - Low (green)
- [ ] Each account card should show:
  - Username (@username)
  - Category
  - Interaction count
  - Active/Inactive toggle
  - Delete button (🗑️)

### Add New Account
- [ ] Click "➕ Add Account" button (top right)
- [ ] Modal should appear with form
- [ ] Form should have:
  - Username field (required)
  - Priority dropdown (Critical/High/Medium/Low)
  - Category field (optional)
- [ ] Try adding a test account:
  - Username: `testuser` or `@testuser`
  - Priority: `Medium`
  - Category: `test`
- [ ] Click "Add Account"
- [ ] Should see success or error message
- [ ] If successful, new account should appear in Medium priority section

### Toggle Account Active/Inactive
- [ ] Find an account in the list
- [ ] Click the circular toggle button (✓ or ○)
- [ ] Should toggle between active (green) and inactive (gray)
- [ ] Account should update in database

### Delete Account
- [ ] Click delete button (🗑️) on test account
- [ ] Should see confirmation dialog
- [ ] Click "OK" to confirm
- [ ] Account should disappear from list

### Refresh Button
- [ ] Click "🔄 Refresh" button (top right)
- [ ] List should reload from database

---

## 🔧 5. System Monitoring Tab Testing

### System Status Cards
- [ ] Click "System" tab (formerly "Monitoring")
- [ ] Should see 3 status cards:
  - **Database**: Status, latency in ms
  - **System**: Uptime, memory usage
  - **Environment**: Node.js version, platform

### API Usage Section
- [ ] Should see "API Usage" section with 2 subsections:
  - **Twitter API**: Hourly and daily usage bars
  - **OpenAI API**: Monthly usage bar
- [ ] Progress bars should show current usage vs limits
- [ ] Numbers should be displayed (e.g., "50 / 100")

### Recent Errors
- [ ] If no errors, section shouldn't appear
- [ ] If errors exist, should see up to 5 recent errors
- [ ] Each error should show message and timestamp

### System Information
- [ ] Should show when system started
- [ ] Should show total uptime

### Auto-Refresh
- [ ] Wait 10 seconds
- [ ] Stats should auto-refresh (numbers may update)

---

## ⚡ 6. Actions Tab Testing

### Quick Actions Grid
- [ ] Click "Actions" tab
- [ ] Should see 6 quick action buttons:
  - 🔍 Check Mentions
  - 💚 Health Check
  - 🗑️ Clear Cache
  - ▶️ Start Monitor
  - ⏸️ Stop Monitor
  - ✈️ Test Telegram

### Test Health Check Action
- [ ] Click "💚 Health Check" button
- [ ] Button should show loading spinner
- [ ] After completion, should show success/failure message
- [ ] Result should appear below button

### Post New Tweet Form
- [ ] Scroll to "Post New Tweet" section
- [ ] Should see textarea and character counter
- [ ] Type a test message (< 280 chars)
- [ ] Character counter should update
- [ ] Try typing > 280 characters
- [ ] Counter should turn red, button should disable
- [ ] **⚠️ Don't actually post unless you want to tweet!**

### Reply to Tweet Form
- [ ] Scroll to "Reply to Tweet" section
- [ ] Should see two fields:
  - Tweet ID or URL
  - Reply content (textarea)
- [ ] Enter a test tweet ID
- [ ] Enter reply content
- [ ] Character counter should work (max 280)
- [ ] **⚠️ Don't actually reply unless you want to!**

---

## 📈 7. Analytics Tab Testing

### Key Metrics
- [ ] Click "Analytics" tab
- [ ] Should see 3 key metric cards:
  - Total Interactions (with % change)
  - Response Rate (with % change)
  - Avg Response Time (with % change)

### Time Range Filter
- [ ] Should see 4 time range buttons: 24h, 7d, 30d, 90d
- [ ] Click each button
- [ ] Selected range should highlight
- [ ] Data should update (currently mock data)

### Platform Activity
- [ ] Should see 3 platform cards:
  - 🐦 Twitter (blue)
  - 🌐 Web (purple)
  - ✈️ Telegram (cyan)
- [ ] Each should show interactions and messages
- [ ] Progress bars should visualize relative activity

### Activity Timeline
- [ ] Should see 7-day bar chart
- [ ] Two colors: Interactions (blue) and Responses (green)
- [ ] Dates should be labeled
- [ ] Legend at bottom

### Top Monitored Accounts
- [ ] Should see ranked list (1-5)
- [ ] Each account shows:
  - Rank number
  - Username
  - Category
  - Interaction count

### Performance Metrics
- [ ] Should see 3 performance cards:
  - Uptime (% with progress bar)
  - Error Rate (% with progress bar)
  - Avg API Latency (ms)

---

## 🔄 8. Navigation & General UX Testing

### Tab Switching
- [ ] Click each tab multiple times
- [ ] Switching should be instant
- [ ] Previous tab content should disappear
- [ ] New tab content should load
- [ ] Selected tab should highlight in green/emerald

### Header Elements
- [ ] Logo/icon should be visible (🍄)
- [ ] Title "Dark Renaissance" should be visible
- [ ] System health indicator should show (green dot)
- [ ] Logout button should be visible

### Logout Flow
- [ ] Click "Logout" button
- [ ] Should redirect to `/admin/login`
- [ ] Trying to go back to `/admin` should redirect to login
- [ ] Cookie should be cleared

### Responsive Design
- [ ] Resize browser window
- [ ] Layout should adapt to different sizes
- [ ] On mobile size:
  - Navigation should stack or scroll
  - Cards should stack vertically
  - Tables should remain usable

### Auto-Refresh Testing
- [ ] Stay on Overview tab for 30 seconds
- [ ] Stats should auto-refresh
- [ ] Stay on System tab for 10 seconds
- [ ] Metrics should auto-refresh

---

## 🐛 9. Error Handling Testing

### Invalid Routes
- [ ] Try accessing: `http://localhost:3000/admin/invalid`
- [ ] Should handle gracefully (404 or redirect)

### Network Disconnection
- [ ] Disconnect from internet briefly
- [ ] Try refreshing a tab
- [ ] Should show loading state or error message
- [ ] Reconnect and verify recovery

### Empty States
- [ ] If database is empty:
  - Conversations tab should show "No conversations found"
  - Stats should show 0s
  - Activity feed should show "No recent activity"

---

## 📱 10. Cross-Browser Testing

### Chrome
- [ ] Test all features in Chrome
- [ ] Check console for errors

### Safari
- [ ] Test all features in Safari
- [ ] Check for rendering issues

### Firefox
- [ ] Test all features in Firefox
- [ ] Verify all functionality works

---

## ✅ Final Checks

### Performance
- [ ] Dashboard loads quickly (< 3 seconds)
- [ ] Tab switching is instant
- [ ] No console errors in browser DevTools
- [ ] No memory leaks (check DevTools Performance)

### Security
- [ ] Cannot access `/admin` without login
- [ ] Cannot access `/api/admin/*` without auth cookie
- [ ] Logout properly clears session
- [ ] Password is not visible in network requests

### Data Accuracy
- [ ] Stats match database data
- [ ] Conversations display correctly
- [ ] Account list is accurate
- [ ] System metrics are realistic

---

## 🚀 Ready for Production?

If all checks pass:
- ✅ Authentication works correctly
- ✅ All 6 tabs load and function
- ✅ Forms validate properly
- ✅ Data displays accurately
- ✅ No console errors
- ✅ Responsive design works
- ✅ Security is tight

**You're ready to deploy! 🎉**

---

## 📝 Testing Notes

### Issues Found:
- [ ] Issue 1: _____________________
- [ ] Issue 2: _____________________
- [ ] Issue 3: _____________________

### Observations:
- Feature performing well: _____________________
- Suggested improvements: _____________________

---

## 🆘 Need Help?

If you encounter issues:
1. Check browser console for errors (F12)
2. Check terminal for server errors
3. Verify environment variables are set
4. Try clearing browser cookies/cache
5. Restart dev server

---

**Testing Started**: _______________
**Testing Completed**: _______________
**Tester**: _______________

