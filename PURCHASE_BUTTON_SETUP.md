# Purchase Button Setup Checklist

## Current Configuration Status ✅
Your Stripe configuration architecture is **correct**:
- **Vercel**: `VITE_STRIPE_PUBLISHABLE_KEY` (frontend)
- **Supabase**: `STRIPE_SECRET_KEY` (backend Edge functions)  
- **Supabase**: `STRIPE_WEBHOOK_SECRET` (webhook verification)

## Setup Steps to Complete

### 1. Deploy Edge Functions 🚀
The Stripe payment functions need to be deployed to Supabase:

```bash
./deploy-functions.sh
```

This will deploy:
- `stripe-create-checkout-session` - Creates payment sessions
- `stripe-webhook` - Handles payment confirmations
- `download-pdf` - Manages secure PDF downloads
- `stripe-create-payment-intent` - Alternative payment flow

### 2. Configure Stripe Webhook 🔗
In your Stripe Dashboard:

1. Go to **Developers > Webhooks**
2. Add endpoint: `https://[your-supabase-url]/functions/v1/stripe-webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed` 
   - `charge.dispute.created`
4. Copy the **Webhook Secret** to Supabase environment variables

### 3. Environment Variables Check 📋

#### Vercel Environment Variables:
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_... (or pk_test_...)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

#### Supabase Environment Variables:
```
STRIPE_SECRET_KEY=sk_live_... (or sk_test_...)
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 4. Test the Purchase Flow 🧪

1. **Development Testing**:
   - Use debug component (shows in dev mode)
   - Check browser console for errors
   - Verify environment variables are loaded

2. **Payment Testing**:
   - Use Stripe test cards: `4242 4242 4242 4242`
   - Test purchase flow end-to-end
   - Verify purchase records in database

### 5. Common Issues & Solutions 🔧

| Issue | Cause | Solution |
|-------|-------|----------|
| "Stripe configuration error" | Missing publishable key | Add `VITE_STRIPE_PUBLISHABLE_KEY` to Vercel |
| "PDF not found" | Edge function not deployed | Run `./deploy-functions.sh` |
| "Internal server error" | Missing secret key | Add `STRIPE_SECRET_KEY` to Supabase |
| Button not clickable | Purchase status check failing | Check network/auth status |

### 6. Debugging Tools 🔍

The purchase button now includes:
- **Debug panel** (development mode only)
- **Enhanced error messages** with specific failure reasons
- **Console logging** for troubleshooting
- **Purchase verification** before payment processing

### 7. Production Deployment 🌟

1. **Switch to Live Keys**:
   - Update `VITE_STRIPE_PUBLISHABLE_KEY` to `pk_live_...`
   - Update `STRIPE_SECRET_KEY` to `sk_live_...`
   - Create production webhook endpoint

2. **Test Production Flow**:
   - Verify webhook receives events
   - Test with small amount
   - Check purchase completion

## Quick Status Check 📊

Run this to verify your setup:

```bash
# Check if functions are deployed
supabase functions list

# Test checkout session creation
curl -X POST https://your-project.supabase.co/functions/v1/stripe-create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

## Need Help? 🆘

If the purchase button still doesn't work:

1. Check the **debug panel** in development mode
2. Look for errors in **browser console**
3. Verify **network requests** in dev tools
4. Check **Supabase logs** for Edge function errors
5. Review **Stripe dashboard** for webhook delivery issues

The fixes I've implemented should resolve the most common purchase button issues!