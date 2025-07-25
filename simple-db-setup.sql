-- Simple Database Setup (Run this if manual-db-setup.sql has issues)
-- This version creates tables without complex constraint checking

-- Drop tables if they exist (CAREFUL - this will delete data!)
-- Uncomment only if you want to start fresh:
-- DROP TABLE IF EXISTS public.download_tokens CASCADE;
-- DROP TABLE IF EXISTS public.purchases CASCADE;
-- DROP TABLE IF EXISTS public.stripe_customers CASCADE;

-- Create purchases table
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pdf_id UUID REFERENCES public.downloadable_pdfs(id) ON DELETE CASCADE,
    stripe_payment_intent_id VARCHAR(255),
    stripe_checkout_session_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    amount_paid DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    status VARCHAR(50) DEFAULT 'pending',
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    refunded_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stripe_customers table
CREATE TABLE IF NOT EXISTS public.stripe_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create download_tokens table
CREATE TABLE IF NOT EXISTS public.download_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    max_downloads INTEGER DEFAULT 5,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_pdf_id ON public.purchases(pdf_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON public.purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_checkout_session_id ON public.purchases(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_intent_id ON public.purchases(stripe_payment_intent_id);

-- Enable RLS
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can insert their own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can view their own customer records" ON public.stripe_customers;
DROP POLICY IF EXISTS "Users can view their own download tokens" ON public.download_tokens;

-- Create new policies
CREATE POLICY "Users can view their own purchases" ON public.purchases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases" ON public.purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own customer records" ON public.stripe_customers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own download tokens" ON public.download_tokens
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.purchases 
            WHERE purchases.id = download_tokens.purchase_id 
            AND purchases.user_id = auth.uid()
        )
    );

-- Verify setup
SELECT 
    'purchases' as table_name,
    COUNT(*) as row_count
FROM public.purchases
UNION ALL
SELECT 
    'stripe_customers' as table_name,
    COUNT(*) as row_count
FROM public.stripe_customers
UNION ALL
SELECT 
    'download_tokens' as table_name,
    COUNT(*) as row_count
FROM public.download_tokens;

SELECT 'Database setup completed successfully!' as result;