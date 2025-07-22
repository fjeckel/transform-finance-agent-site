# Supabase Edge Functions Deployment Guide

## RSS Feed Function Deployment

### Prerequisites
1. Install Supabase CLI:
   ```bash
   brew install supabase/tap/supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

### Deployment Steps

1. **Link your project** (if not already linked):
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   
   You can find your project reference in your Supabase dashboard URL:
   `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`

2. **Deploy the RSS feed function**:
   ```bash
   supabase functions deploy rss-feed
   ```

3. **Verify deployment**:
   ```bash
   supabase functions list
   ```

### Testing the Function

After deployment, your RSS feeds will be available at:

- All episodes: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/rss-feed`
- WTF series: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/rss-feed/wtf`
- Finance Transformers: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/rss-feed/finance_transformers`
- CFO Memo: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/rss-feed/cfo_memo`

### Environment Variables

The function uses these environment variables (automatically available):
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Troubleshooting

1. **CORS Issues**: The function includes CORS headers for cross-origin access
2. **Caching**: RSS feeds are cached for 1 hour (Cache-Control: public, max-age=3600)
3. **Logs**: View function logs with:
   ```bash
   supabase functions logs rss-feed
   ```

### Local Development

To test the function locally:

```bash
supabase functions serve rss-feed
```

The function will be available at `http://localhost:54321/functions/v1/rss-feed`