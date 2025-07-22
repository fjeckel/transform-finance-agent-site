# GitHub Actions Deployment Setup

This guide will help you set up automated deployment of Supabase Edge Functions using GitHub Actions.

## Prerequisites

You'll need:
1. Your Supabase project reference
2. A Supabase access token

## Step 1: Get your Supabase Project Reference

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Look at the URL - it will be: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`
4. Copy the `YOUR_PROJECT_REF` part (it looks like: `abcdefghijklmnop`)

## Step 2: Generate a Supabase Access Token

1. Go to [Supabase Account Tokens](https://supabase.com/dashboard/account/tokens)
2. Click "Generate New Token"
3. Give it a name like "GitHub Actions Deployment"
4. Copy the token (you won't be able to see it again!)

## Step 3: Add Secrets to GitHub

1. Go to your GitHub repository
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these two secrets:

### Secret 1: SUPABASE_PROJECT_REF
- **Name**: `SUPABASE_PROJECT_REF`
- **Value**: Your project reference from Step 1

### Secret 2: SUPABASE_ACCESS_TOKEN
- **Name**: `SUPABASE_ACCESS_TOKEN`
- **Value**: Your access token from Step 2

## Step 4: Test the Deployment

1. The workflow will automatically run when you:
   - Push changes to `main` branch
   - Push changes to Supabase functions
   - Manually trigger it from the Actions tab

2. To manually trigger:
   - Go to the **Actions** tab in your repository
   - Select "Deploy Supabase Edge Functions"
   - Click "Run workflow"

## Workflow Features

### Automatic Deployment
- Deploys when functions are changed on main branch
- Shows deployment status and URLs

### Pull Request Testing
- Runs Deno checks on functions in PRs
- Ensures code quality before merge

## Troubleshooting

### Deployment Failed
1. Check that your secrets are set correctly
2. Verify your Supabase project is active
3. Check the workflow logs for specific errors

### Function Not Working
1. Check function logs in Supabase Dashboard
2. Verify the function code has no errors
3. Test locally with `supabase functions serve`

## Security Notes

- Never commit your access token to the repository
- Rotate your access token periodically
- Use repository environments for production deployments