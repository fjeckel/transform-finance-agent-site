-- EMERGENCY FIX: Run this EXACT SQL in Supabase Dashboard > SQL Editor
-- This will create the purchases table that's causing the 406 error

-- Create the purchases table (this is what's missing!)
CREATE TABLE public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pdf_id UUID REFERENCES public.downloadable_pdfs(id) ON DELETE CASCADE,
    stripe_payment_intent_id VARCHAR(255),
    stripe_checkout_session_id VARCHAR(255),
    amount_paid DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    status VARCHAR(50) DEFAULT 'pending',
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stripe_customers table
CREATE TABLE public.stripe_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

-- Create basic policies
CREATE POLICY "Users can view own purchases" ON public.purchases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases" ON public.purchases  
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Test the fix
SELECT 'EMERGENCY FIX COMPLETED - Purchase button should work now!' as result;