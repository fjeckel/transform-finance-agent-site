# Testing Stripe Checkout

## Debug Steps:

1. **Check Browser Console**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Click "Buy Now" on a premium PDF
   - Look for console messages:
     - "Handle purchase clicked for PDF:"
     - "Opening checkout dialog"

2. **Check Network Tab**
   - Open Developer Tools → Network tab
   - Click "Buy Now"
   - Look for request to `stripe-create-checkout-session`
   - Check response for errors

3. **Common Issues:**

   **If nothing happens when clicking "Buy Now":**
   - Check if you're logged in
   - Check browser console for JavaScript errors
   - Verify the PDF has `is_premium: true` and a price

   **If checkout dialog opens but payment fails:**
   - Check Stripe keys in environment variables
   - Verify `stripe-create-checkout-session` function is deployed
   - Check Supabase function logs

4. **Test with cURL:**
   ```bash
   curl -X POST https://aumijfxmeclxweojrefa.supabase.co/functions/v1/stripe-create-checkout-session \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -d '{
       "pdfId": "YOUR_PDF_ID",
       "userId": "YOUR_USER_ID",
       "successUrl": "http://localhost:8080/dashboard",
       "cancelUrl": "http://localhost:8080/episodes"
     }'
   ```

5. **Quick Fix - Direct Stripe Link:**
   If the checkout session is created but not redirecting, you can manually test by:
   - Get the session ID from network response
   - Go to: `https://checkout.stripe.com/pay/SESSION_ID`

## What Should Happen:

1. Click "Buy Now" → Checkout dialog opens
2. Click "Pay €X.XX" → Redirects to Stripe Checkout
3. Enter card details on Stripe page
4. Complete payment → Redirects back to your site
5. PDF is unlocked

## Environment Variables Needed:

In your `.env.local`:
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

In Supabase Dashboard → Edge Functions → Environment Variables:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```