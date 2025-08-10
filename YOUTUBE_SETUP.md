# 🎥 YouTube Integration Setup Guide

## Overview
This guide helps you complete the YouTube Data API v3 integration for the Finance Transformers website.

## 📋 Current Status
✅ Edge Functions deployed  
✅ Database schema created  
✅ React components updated  
✅ Automated sync function created  
⚠️ **Missing: Real YouTube API Key**

## 🔑 Step 1: Get YouTube Data API Key

### 1.1 Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing: **"Finance Transformers"**
3. Navigate to **"APIs & Services"** → **"Library"**
4. Search for **"YouTube Data API v3"** and click **"Enable"**

### 1.2 Create API Credentials  
1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"API Key"**
3. Copy the generated API key immediately
4. Click on the key name to configure restrictions

### 1.3 Secure Your API Key
```
Application restrictions: HTTP referrers (web sites)
Allowed referrers:
- *.vercel.app/*
- yourdomain.com/*
- localhost:*/*

API restrictions: Restrict key
Selected APIs:
- YouTube Data API v3
```

## 🔧 Step 2: Configure Supabase

### 2.1 Update API Key Secret
```bash
cd /path/to/your/project
supabase secrets set YOUTUBE_API_KEY=YOUR_ACTUAL_API_KEY_HERE
```

### 2.2 Apply Database Migration
```bash
# If not already applied
supabase db push
```

### 2.3 Verify Function Deployment
```bash
supabase functions list
# Should show: youtube-videos, youtube-video-sync
```

## 🚀 Step 3: Test the Integration

### 3.1 Manual Test
1. Visit your deployed site
2. Go to `/discover` page
3. Scroll to YouTube videos section
4. Should now show real videos from WTF channel

### 3.2 Admin Testing
1. Add `YouTubeSyncButton` component to admin interface
2. Test manual sync functionality
3. Verify videos appear in database

## ⏰ Step 4: Automated Sync Setup

### 4.1 GitHub Secrets
Add these to your GitHub repository secrets:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4.2 Verify GitHub Action
- Check `.github/workflows/youtube-sync.yml` exists
- Workflow runs every 6 hours automatically
- Can trigger manually from Actions tab

## 🔍 Step 5: Monitoring & Troubleshooting

### 5.1 Check Function Logs
```bash
supabase functions logs youtube-videos
supabase functions logs youtube-video-sync
```

### 5.2 Database Queries
```sql
-- Check stored videos
SELECT COUNT(*) FROM youtube_videos;

-- View latest videos  
SELECT title, duration, view_count, published_at 
FROM youtube_videos 
ORDER BY published_at DESC 
LIMIT 10;

-- Check shorts only
SELECT COUNT(*) FROM youtube_videos WHERE is_short = true;
```

### 5.3 Common Issues

**No videos showing:**
- Check API key is valid and not rate-limited
- Verify WTF channel ID: `UC2sXuBElJDyzxKv3J8kmyng`
- Check function logs for errors

**API Rate Limits:**
- YouTube API allows 10,000 units/day
- Each video fetch ~100 units  
- Monitor usage in Google Cloud Console

**Build Errors:**
- Ensure all imports are correct
- Run `npm run build` to verify

## 📊 Expected Results

After setup completion:
- ✅ Real YouTube Shorts from WTF channel
- ✅ Automatic updates every 6 hours  
- ✅ Fallback to mock data if API fails
- ✅ Admin interface for manual sync
- ✅ Responsive video cards with play functionality

## 🎯 API Key Validation

To test if your API key works:
```bash
curl "https://www.googleapis.com/youtube/v3/search?key=YOUR_API_KEY&channelId=UC2sXuBElJDyzxKv3J8kmyng&part=snippet&maxResults=5&order=date&type=video"
```

Should return JSON with recent videos from the channel.

## 🛠️ Files Created/Modified

```
New Files:
├── src/hooks/useYouTubeVideos.ts
├── src/components/admin/YouTubeSyncButton.tsx  
├── supabase/functions/youtube-videos/index.ts
├── supabase/functions/youtube-video-sync/index.ts
├── supabase/migrations/20250810000000_create_youtube_videos_table.sql
└── .github/workflows/youtube-sync.yml

Modified Files:
├── src/pages/Discover.tsx (updated to use real API)
└── package.json (if new dependencies added)
```

## 🎉 Final Verification Checklist

- [ ] YouTube API key obtained and configured
- [ ] Supabase secret `YOUTUBE_API_KEY` set
- [ ] Functions deployed successfully  
- [ ] Database migration applied
- [ ] GitHub Action configured
- [ ] Site builds without errors
- [ ] Discover page shows real YouTube videos
- [ ] Manual sync button works (optional)
- [ ] Automatic sync runs every 6 hours

---

**Need Help?** Check the function logs or create a GitHub issue for troubleshooting assistance.