# YouTube Integration Debugging Guide

This guide provides comprehensive debugging tools to identify and resolve YouTube video loading issues in production.

## 📋 Overview

The YouTube integration consists of several components:
1. **Supabase Database** (`youtube_videos` table) - Caches video data
2. **Edge Function** (`youtube-videos`) - Fetches from YouTube API and serves cached data  
3. **Frontend Hook** (`useYouTubeVideos`) - Manages data loading with fallbacks
4. **React Components** - Display the videos in the UI

## 🔧 Debugging Tools

### 1. Server-Side Debug Script

**File:** `debug-youtube-production.js`

Tests the backend infrastructure from a server perspective.

```bash
# Run the server-side debug script
node debug-youtube-production.js
```

**What it tests:**
- ✅ Supabase REST API connectivity
- ✅ YouTube videos table existence and permissions
- ✅ Direct database queries (with and without filters)
- ✅ Edge function connectivity and responses
- ✅ Environment variables (YouTube API key)
- ✅ Complete data flow simulation
- ✅ Performance metrics

### 2. Frontend Debug Tool

**File:** `debug-youtube-frontend.html`

Tests the client-side experience that users actually encounter.

```bash
# Open in browser
open debug-youtube-frontend.html
```

**What it tests:**
- 🌐 Browser-based Supabase connection
- 🌐 CORS and network policies
- 🌐 Client-side API calls
- 🌐 useYouTubeVideos hook simulation
- 🌐 Video thumbnail loading
- 🌐 Network performance from user location
- 🌐 Device-specific issues

## 🚨 Common Issues and Solutions

### Issue: "No videos loading"

**Diagnostic Steps:**
1. Run `node debug-youtube-production.js`
2. If server tests pass, open `debug-youtube-frontend.html` in browser
3. Check browser console for JavaScript errors

**Common Causes:**
- **CORS Issues:** Edge function not allowing frontend domain
- **Network Policies:** Corporate firewalls blocking Supabase
- **Browser Extensions:** Ad blockers interfering with requests
- **Cache Issues:** Old data cached in browser

### Issue: "Videos load slowly"

**Diagnostic Steps:**
1. Check Performance Metrics in debug scripts
2. Monitor network tab during loading
3. Test from different locations/networks

**Common Causes:**
- **Geographic Latency:** Users far from Supabase servers
- **Large Thumbnails:** High-res images loading slowly
- **Database Queries:** Missing indexes or large result sets

### Issue: "Some videos missing"

**Diagnostic Steps:**
1. Check if edge function is fetching fresh data
2. Verify YouTube API quota and permissions
3. Check if videos are private or deleted

**Common Causes:**
- **YouTube API Quota:** Daily limit exceeded
- **Video Privacy:** Private or unlisted videos
- **Channel Issues:** Channel ID incorrect or changed

## 🛠️ Manual Testing Commands

### Check Supabase Connection
```bash
curl -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     "https://aumijfxmeclxweojrefa.supabase.co/rest/v1/"
```

### Test Database Query
```bash
curl -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     "https://aumijfxmeclxweojrefa.supabase.co/rest/v1/youtube_videos?select=*&limit=5"
```

### Test Edge Function
```bash
curl -H "Authorization: Bearer YOUR_ANON_KEY" \
     "https://aumijfxmeclxweojrefa.supabase.co/functions/v1/youtube-videos?action=list&limit=5"
```

### Force Fresh Fetch
```bash
curl -H "Authorization: Bearer YOUR_ANON_KEY" \
     "https://aumijfxmeclxweojrefa.supabase.co/functions/v1/youtube-videos?action=fetch&limit=10"
```

## 📊 Production Environment Details

- **Supabase URL:** `https://aumijfxmeclxweojrefa.supabase.co`
- **YouTube Channel ID:** `UC2sXuBElJDyzxKv3J8kmyng`
- **Edge Function:** `youtube-videos`
- **Table:** `youtube_videos`

## 🔍 Troubleshooting Checklist

### Backend Issues
- [ ] Supabase project is active (not paused)
- [ ] Database migrations are applied
- [ ] RLS policies allow public read access
- [ ] Edge function is deployed and running
- [ ] YouTube API key is set in environment
- [ ] YouTube API quota is not exceeded

### Frontend Issues
- [ ] CORS headers allow your domain
- [ ] Browser console shows no JavaScript errors
- [ ] Network requests are not blocked
- [ ] Supabase client is properly configured
- [ ] useYouTubeVideos hook is imported correctly

### User-Specific Issues
- [ ] User's browser supports modern JavaScript
- [ ] No browser extensions blocking requests
- [ ] Corporate firewall allows Supabase domains
- [ ] Geographic location has access to services
- [ ] Device has sufficient memory/processing power

## 📈 Monitoring and Alerts

### Key Metrics to Monitor
- Edge function success rate
- Database query performance
- YouTube API quota usage
- User error reports

### Supabase Dashboard Checks
1. **Functions Logs:** Check for errors in `youtube-videos` function
2. **Database Activity:** Monitor query performance
3. **API Usage:** Track request volume and errors

## 🚀 Quick Fixes

### Clear Everything and Start Fresh
```bash
# Reset database
supabase db reset

# Redeploy edge function
supabase functions deploy youtube-videos

# Fetch fresh videos
curl -H "Authorization: Bearer YOUR_ANON_KEY" \
     "https://aumijfxmeclxweojrefa.supabase.co/functions/v1/youtube-videos?action=fetch&limit=20"
```

### Emergency Fallback
If all else fails, the `useYouTubeVideos` hook will automatically fallback to mock data to prevent a completely broken experience.

## 🆘 Getting Help

If debugging tools show all green but users still report issues:

1. **Collect User Info:**
   - Browser type and version
   - Device type (mobile/desktop)
   - Location/network type
   - Specific error messages

2. **Browser Console Logs:**
   - Have user open developer tools
   - Check Console and Network tabs
   - Look for failed requests or JavaScript errors

3. **Test Environment:**
   - Have user try incognito/private mode
   - Test from different network
   - Disable browser extensions

## 📝 Debug Script Results Interpretation

### ✅ All Tests Pass
- Backend integration is healthy
- Issue likely client-side or user-specific
- Focus on frontend debugging

### ❌ Database Tests Fail
- Check Supabase project status
- Verify table exists and has data
- Check RLS policies

### ❌ Edge Function Tests Fail  
- Check function deployment status
- Verify YouTube API key configuration
- Monitor function logs for errors

### ❌ Frontend Tests Fail
- CORS or network policy issues
- Browser compatibility problems
- JavaScript errors in console