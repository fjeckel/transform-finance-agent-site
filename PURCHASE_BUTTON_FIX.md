# Purchase Button Fix - Troubleshooting Guide

## 🚨 **Issue Resolved: Purchase Button Disabled**

The purchase button was disabled due to several issues that have now been fixed:

## ✅ **Fixes Applied:**

### 1. **Authentication Flow Fixed**
- **Problem**: Purchase required authentication but didn't redirect to login
- **Fix**: Added automatic redirect to `/auth` when user not logged in
- **Code**: Both PDFCard and PremiumReport now check `user` state and redirect

### 2. **Stripe API Implementation Fixed**
- **Problem**: Mixing Payment Intents with Checkout Sessions incorrectly
- **Fix**: Switched to pure Stripe Checkout Sessions for simpler implementation
- **New Function**: `stripe-create-checkout-session` Edge Function deployed

### 3. **Environment Variables Setup**
- **Problem**: Missing `VITE_STRIPE_PUBLISHABLE_KEY` causing Stripe to fail loading
- **Fix**: Added environment variable configuration guide

### 4. **Better Error Messaging**
- **Problem**: Users didn't know why button was disabled
- **Fix**: Added contextual messages ("Melden Sie sich an, um zu kaufen")

## 🔧 **Required Setup Steps:**

### **1. Environment Variables** (Critical!)
Create `.env.local` file in project root:

```bash
# Stripe Configuration (REQUIRED)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Supabase (should already exist)
VITE_SUPABASE_URL=https://aumijfxmeclxweojrefa.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### **2. Supabase Environment Variables**
In Supabase Dashboard → Project Settings → Environment Variables:

```bash
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### **3. Get Stripe Test Keys**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy "Publishable key" → `VITE_STRIPE_PUBLISHABLE_KEY`
3. Copy "Secret key" → `STRIPE_SECRET_KEY`

## 🧪 **Testing the Fix:**

### **Test Scenario 1: Not Logged In**
1. ✅ Go to `/episodes` and find a premium PDF
2. ✅ Click "Jetzt kaufen" → Should redirect to login page
3. ✅ Message shows: "Melden Sie sich an, um zu kaufen"

### **Test Scenario 2: Logged In**
1. ✅ Login first at `/auth`
2. ✅ Go to premium PDF and click "Jetzt kaufen"
3. ✅ Should redirect to Stripe Checkout page
4. ✅ Use test card: `4242 4242 4242 4242`
5. ✅ Complete purchase → Redirect to `/dashboard`

### **Test Scenario 3: Landing Page**
1. ✅ Visit `/report/{pdf-id}` for premium content
2. ✅ Purchase flow should work same as above
3. ✅ Purchase button should be enabled when logged in

## 🚀 **New Stripe Checkout Flow:**

**Old (Broken):** Payment Intents with manual redirect  
**New (Working):** Checkout Sessions with automatic redirect

```typescript
// New simplified flow:
1. User clicks "Jetzt kaufen"
2. createCheckoutSession() called
3. Stripe Checkout Session created
4. User redirected to Stripe hosted checkout
5. After payment: redirected to /dashboard
6. Webhook processes payment completion
```

## 🐛 **Debugging Tips:**

### **Check Console Errors:**
- `Missing Stripe publishable key` → Add environment variable
- `User not authenticated` → Login first
- `Function not found` → Edge function deployment needed

### **Check Network Tab:**
- `stripe-create-checkout-session` should return sessionId
- 401 errors → Authentication issue
- 500 errors → Environment variables missing

### **Check Database:**
- Premium PDFs have `is_premium = true` and `price > 0`
- User is in `auth.users` table
- Purchases table exists with proper structure

## 📝 **Changes Made:**

**Files Modified:**
- `src/hooks/useStripePayment.ts` - New checkout session flow
- `src/components/ui/pdf-card.tsx` - Auth check and redirect
- `src/pages/PremiumReport.tsx` - Auth check and redirect
- `supabase/functions/stripe-create-checkout-session/index.ts` - New function

**Edge Functions Deployed:**
- `stripe-create-checkout-session` - Handles Stripe Checkout creation

The purchase button should now work properly once environment variables are configured! 🎉