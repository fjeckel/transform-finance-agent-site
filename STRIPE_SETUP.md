# Stripe Integration Setup Guide

## Overview
This guide covers the remaining setup steps to complete the Stripe PDF monetization integration after the code implementation.

## 🚀 Implementation Status
✅ **Completed:**
- Stripe SDK packages installed
- Database schema created (migration pending)
- Supabase Edge Functions deployed
- Frontend components updated
- Admin interface enhanced
- Premium content UI implemented

## 🔧 Required Setup Steps

### 1. Configure Environment Variables

Add these variables to your environment (`.env.local` for development):

```bash
# Stripe Keys (get from Stripe Dashboard)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Your Stripe publishable key
STRIPE_SECRET_KEY=sk_test_...            # Your Stripe secret key  
STRIPE_WEBHOOK_SECRET=whsec_...          # Webhook signing secret

# Supabase (should already exist)
VITE_SUPABASE_URL=https://aumijfxmeclxweojrefa.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Apply Database Migration

Run the database migration to add pricing and purchase tables:

```bash
# Connect to your Supabase project
supabase db push

# Or manually apply the migration in Supabase Dashboard:
# Copy contents of: supabase/migrations/20250123000000-stripe-monetization-setup.sql
```

### 3. Configure Stripe Webhooks

1. **In Stripe Dashboard:**
   - Go to Developers → Webhooks
   - Add endpoint: `https://aumijfxmeclxweojrefa.supabase.co/functions/v1/stripe-webhook`
   - Select events:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.dispute.created`
   - Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 4. Set Supabase Environment Variables

In Supabase Dashboard → Project Settings → Environment Variables:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 5. Create Private Storage Bucket (Optional)

For enhanced security, create a private bucket for premium PDFs:

```sql
-- In Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public) 
VALUES ('premium-pdfs', 'premium-pdfs', false);

-- Add RLS policy for private access
CREATE POLICY "Authenticated users can read premium PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'premium-pdfs' AND auth.role() = 'authenticated');
```

## 🧪 Testing the Implementation

### 1. Test Premium Content Creation

1. **Access Admin Panel:**
   - Go to `/admin` and login
   - Navigate to PDFs section
   - Create a new PDF with premium pricing enabled

2. **Set Premium Pricing:**
   - Enable "Premium Content" toggle
   - Set price (e.g., 9.99 EUR)
   - Upload PDF and save

### 2. Test Purchase Flow

1. **View Premium Content:**
   - Go to `/episodes` tab "Memos"  
   - Premium PDFs show price and "Buy Now" button
   - Free PDFs show "Download" button

2. **Test Payment:**
   - Click "Buy Now" on premium content
   - Should redirect to Stripe Checkout
   - Use test card: `4242 4242 4242 4242`

### 3. Test Webhook Processing

1. **Complete Test Purchase:**
   - Use Stripe test environment
   - Monitor webhook delivery in Stripe Dashboard
   - Check Supabase logs for function execution

2. **Verify Purchase Record:**
   - Check `purchases` table in Supabase
   - Verify `download_tokens` table entry
   - Test secure download link

## 🔍 Monitoring and Debugging

### Stripe Dashboard
- Monitor payments in Test Data → Payments
- Check webhook delivery logs
- View customer records

### Supabase Dashboard  
- Function logs: Database → Functions → View Logs
- Check tables: `purchases`, `download_tokens`, `stripe_customers`
- Monitor RLS policy effectiveness

### Browser DevTools
- Check network requests to Supabase functions
- Monitor console for client-side errors
- Test responsive design on mobile

## 🚨 Security Checklist

- [ ] Stripe keys are environment variables (never in code)
- [ ] Webhook signature verification enabled
- [ ] RLS policies protect sensitive data
- [ ] Download tokens have expiry times
- [ ] Rate limiting on download endpoints
- [ ] HTTPS enforced for all payment flows

## 📊 Success Metrics

### Technical Metrics
- [ ] Payment success rate > 95%
- [ ] Download token generation < 2 seconds
- [ ] Zero unauthorized PDF access attempts
- [ ] Webhook processing success rate > 98%

### Business Metrics  
- [ ] Conversion rate on premium content > 2%
- [ ] Average order value tracking
- [ ] Customer retention for premium content
- [ ] Revenue attribution by content

## 🔗 Next Steps

After successful testing:

1. **Switch to Live Mode:**
   - Replace test keys with live Stripe keys
   - Update webhook URL for production
   - Test with real payment methods

2. **Implement Sales Landing Pages (Issue #115):**
   - Create dedicated report landing pages
   - Add persuasive sales copy
   - Optimize conversion funnel

3. **Add Email Marketing (Issue #118):**
   - Purchase confirmation emails
   - Lead capture forms
   - Abandoned cart recovery

## 🆘 Troubleshooting

### Common Issues

**Payment Intent Creation Fails:**
- Check Stripe API keys are correct
- Verify Supabase function has proper environment variables
- Check user authentication status

**Webhook Not Receiving Events:**
- Verify webhook URL is accessible
- Check Stripe webhook configuration
- Monitor Supabase function logs

**Download Links Not Working:**
- Check token expiry settings
- Verify purchase status in database
- Test token validation logic

**Premium Content Not Showing Price:**
- Verify `is_premium` flag is set
- Check price field is populated
- Ensure currency is specified

For additional support:
- Check Issue #114 on GitHub
- Review Supabase function logs
- Monitor Stripe Dashboard events