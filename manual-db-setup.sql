-- Manual Database Setup for Purchase System
-- Run this in Supabase SQL Editor if migrations haven't been applied

-- First, check if purchases table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'purchases') THEN
        -- Create purchases table
        CREATE TABLE public.purchases (
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
        
        RAISE NOTICE 'Created purchases table';
    ELSE
        RAISE NOTICE 'Purchases table already exists';
    END IF;
END $$;

-- Add stripe_checkout_session_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'purchases' 
        AND column_name = 'stripe_checkout_session_id'
    ) THEN
        ALTER TABLE public.purchases 
        ADD COLUMN stripe_checkout_session_id VARCHAR(255);
        
        RAISE NOTICE 'Added stripe_checkout_session_id column';
    ELSE
        RAISE NOTICE 'stripe_checkout_session_id column already exists';
    END IF;
END $$;

-- Create stripe_customers table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stripe_customers') THEN
        CREATE TABLE public.stripe_customers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
            stripe_customer_id VARCHAR(255) UNIQUE NOT NULL,
            email VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Created stripe_customers table';
    ELSE
        RAISE NOTICE 'stripe_customers table already exists';
    END IF;
END $$;

-- Create download_tokens table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'download_tokens') THEN
        CREATE TABLE public.download_tokens (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE,
            token VARCHAR(255) UNIQUE NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            max_downloads INTEGER DEFAULT 5,
            download_count INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Created download_tokens table';
    ELSE
        RAISE NOTICE 'download_tokens table already exists';
    END IF;
END $$;

-- Add constraints and indexes
DO $$
BEGIN
    -- Add unique constraint for checkout session ID
    IF NOT EXISTS (
        SELECT constraint_name FROM information_schema.table_constraints 
        WHERE table_name = 'purchases' 
        AND constraint_name = 'unique_checkout_session_id'
    ) THEN
        ALTER TABLE public.purchases 
        ADD CONSTRAINT unique_checkout_session_id 
        UNIQUE (stripe_checkout_session_id);
        
        RAISE NOTICE 'Added unique constraint for checkout session ID';
    END IF;

    -- Add constraint to ensure at least one Stripe identifier exists
    IF NOT EXISTS (
        SELECT constraint_name FROM information_schema.table_constraints 
        WHERE table_name = 'purchases' 
        AND constraint_name = 'check_stripe_identifiers'
    ) THEN
        ALTER TABLE public.purchases 
        ADD CONSTRAINT check_stripe_identifiers 
        CHECK (
            stripe_payment_intent_id IS NOT NULL OR 
            stripe_checkout_session_id IS NOT NULL
        );
        
        RAISE NOTICE 'Added constraint for Stripe identifiers';
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_pdf_id ON public.purchases(pdf_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON public.purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_checkout_session_id ON public.purchases(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_intent_id ON public.purchases(stripe_payment_intent_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (with proper error handling)
DO $$
BEGIN
    -- Policy for viewing purchases
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'purchases' 
        AND policyname = 'Users can view their own purchases'
    ) THEN
        CREATE POLICY "Users can view their own purchases" ON public.purchases
            FOR SELECT USING (auth.uid() = user_id);
        RAISE NOTICE 'Created policy: Users can view their own purchases';
    END IF;

    -- Policy for inserting purchases
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'purchases' 
        AND policyname = 'Users can insert their own purchases'
    ) THEN
        CREATE POLICY "Users can insert their own purchases" ON public.purchases
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        RAISE NOTICE 'Created policy: Users can insert their own purchases';
    END IF;

    -- Policy for viewing customer records
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'stripe_customers' 
        AND policyname = 'Users can view their own customer records'
    ) THEN
        CREATE POLICY "Users can view their own customer records" ON public.stripe_customers
            FOR SELECT USING (auth.uid() = user_id);
        RAISE NOTICE 'Created policy: Users can view their own customer records';
    END IF;

    -- Policy for viewing download tokens
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'download_tokens' 
        AND policyname = 'Users can view their own download tokens'
    ) THEN
        CREATE POLICY "Users can view their own download tokens" ON public.download_tokens
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.purchases 
                    WHERE purchases.id = download_tokens.purchase_id 
                    AND purchases.user_id = auth.uid()
                )
            );
        RAISE NOTICE 'Created policy: Users can view their own download tokens';
    END IF;
END $$;

SELECT 'Database setup completed successfully!' as result;