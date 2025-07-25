-- Add stripe_checkout_session_id column to purchases table
-- This allows tracking of Stripe Checkout sessions alongside payment intents

ALTER TABLE public.purchases 
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id VARCHAR(255);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_purchases_checkout_session_id 
ON public.purchases(stripe_checkout_session_id);

-- Add unique constraint to prevent duplicate processing
ALTER TABLE public.purchases 
ADD CONSTRAINT unique_checkout_session_id 
UNIQUE (stripe_checkout_session_id);

-- Update the purchases table to make stripe_payment_intent_id nullable
-- since checkout sessions might not always have a payment intent immediately
ALTER TABLE public.purchases 
ALTER COLUMN stripe_payment_intent_id DROP NOT NULL;

-- Add a constraint to ensure at least one Stripe identifier exists
ALTER TABLE public.purchases 
ADD CONSTRAINT check_stripe_identifiers 
CHECK (
  stripe_payment_intent_id IS NOT NULL OR 
  stripe_checkout_session_id IS NOT NULL
);