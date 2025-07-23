-- Migration: Add Stripe monetization support
-- Created: 2025-01-23
-- Description: Add pricing, purchases, and download tokens for PDF monetization

-- Add pricing fields to existing downloadable_pdfs table
ALTER TABLE public.downloadable_pdfs 
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_price_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'EUR';

-- Create purchases table to track user purchases
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pdf_id UUID REFERENCES public.downloadable_pdfs(id) ON DELETE CASCADE,
  stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255),
  amount_paid DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  status VARCHAR(50) DEFAULT 'pending',
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  refunded_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stripe_customers table for customer mapping
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create download_tokens table for secure content delivery
CREATE TABLE IF NOT EXISTS public.download_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  download_count INTEGER DEFAULT 0,
  max_downloads INTEGER DEFAULT 5,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_pdf_id ON public.purchases(pdf_id);
CREATE INDEX IF NOT EXISTS idx_purchases_stripe_payment_intent ON public.purchases(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON public.purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON public.purchases(created_at);

CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON public.stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_id ON public.stripe_customers(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_download_tokens_purchase_id ON public.download_tokens(purchase_id);
CREATE INDEX IF NOT EXISTS idx_download_tokens_token ON public.download_tokens(token);
CREATE INDEX IF NOT EXISTS idx_download_tokens_expires_at ON public.download_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_downloadable_pdfs_is_premium ON public.downloadable_pdfs(is_premium);
CREATE INDEX IF NOT EXISTS idx_downloadable_pdfs_price ON public.downloadable_pdfs(price);

-- Enable Row Level Security
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for purchases
CREATE POLICY "Users can view their own purchases" ON public.purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases" ON public.purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for stripe_customers
CREATE POLICY "Users can view their own stripe customer data" ON public.stripe_customers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stripe customer data" ON public.stripe_customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stripe customer data" ON public.stripe_customers
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for download_tokens (more restrictive - API only)
CREATE POLICY "Service role can manage download tokens" ON public.download_tokens
  FOR ALL USING (auth.role() = 'service_role');

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON public.purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stripe_customers_updated_at BEFORE UPDATE ON public.stripe_customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to cleanup expired download tokens (to be called by cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_download_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.download_tokens 
    WHERE expires_at < NOW()
    AND download_count = 0; -- Keep tokens that have been used for audit purposes
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT ON public.purchases TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.stripe_customers TO authenticated;
GRANT ALL ON public.download_tokens TO service_role;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Update downloadable_pdfs table permissions to allow price updates by admins
-- (This assumes there's an admin role or we use service_role for admin operations)

COMMENT ON TABLE public.purchases IS 'Tracks user purchases of premium PDFs through Stripe';
COMMENT ON TABLE public.stripe_customers IS 'Maps Supabase users to Stripe customer IDs';
COMMENT ON TABLE public.download_tokens IS 'Secure tokens for accessing purchased PDF content';
COMMENT ON COLUMN public.downloadable_pdfs.price IS 'Price in the specified currency (e.g., EUR)';
COMMENT ON COLUMN public.downloadable_pdfs.is_premium IS 'Whether this PDF requires payment to access';
COMMENT ON COLUMN public.downloadable_pdfs.stripe_price_id IS 'Stripe Price ID for this product';