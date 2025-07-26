-- Enhanced Stripe Integration Migration
-- This migration adds tables for webhook event deduplication and payment analytics

-- Create webhook_events table for event deduplication
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'processing', -- processing, completed, failed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    retry_count INTEGER DEFAULT 0,
    error_message TEXT
);

-- Create payment_analytics table for comprehensive tracking
CREATE TABLE IF NOT EXISTS payment_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN,
    error_message TEXT,
    processing_time_ms INTEGER,
    amount DECIMAL(10,2),
    currency VARCHAR(3),
    user_id UUID REFERENCES auth.users(id),
    session_id VARCHAR(255),
    purchase_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add enhanced columns to purchases table if they don't exist
DO $$ 
BEGIN
    -- Add payment method tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'purchases' AND column_name = 'payment_method_types') THEN
        ALTER TABLE purchases ADD COLUMN payment_method_types TEXT[];
    END IF;
    
    -- Add conversion tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'purchases' AND column_name = 'conversion_source') THEN
        ALTER TABLE purchases ADD COLUMN conversion_source VARCHAR(100);
    END IF;
    
    -- Add processing time tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'purchases' AND column_name = 'processing_time_ms') THEN
        ALTER TABLE purchases ADD COLUMN processing_time_ms INTEGER;
    END IF;
    
    -- Add customer country
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'purchases' AND column_name = 'customer_country') THEN
        ALTER TABLE purchases ADD COLUMN customer_country VARCHAR(2);
    END IF;
    
    -- Add failed attempts counter
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'purchases' AND column_name = 'failed_attempts') THEN
        ALTER TABLE purchases ADD COLUMN failed_attempts INTEGER DEFAULT 0;
    END IF;
    
    -- Add updated_at timestamp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'purchases' AND column_name = 'updated_at') THEN
        ALTER TABLE purchases ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Create or replace function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for purchases table
DROP TRIGGER IF EXISTS update_purchases_updated_at ON purchases;
CREATE TRIGGER update_purchases_updated_at
    BEFORE UPDATE ON purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for webhook_events table
DROP TRIGGER IF EXISTS update_webhook_events_updated_at ON webhook_events;
CREATE TRIGGER update_webhook_events_updated_at
    BEFORE UPDATE ON webhook_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for webhook_events (service role only)
CREATE POLICY "Service role can manage webhook events"
    ON webhook_events
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for payment_analytics (service role and authenticated users can read their own data)
CREATE POLICY "Service role can manage payment analytics"
    ON payment_analytics
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can view their own payment analytics"
    ON payment_analytics
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create indexes for better performance on webhook_events
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_event_id ON webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);

-- Create indexes for payment_analytics
CREATE INDEX IF NOT EXISTS idx_payment_analytics_event_type ON payment_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_analytics_timestamp ON payment_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_payment_analytics_user_id ON payment_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_analytics_success ON payment_analytics(success);

-- Create indexes for enhanced purchases table
CREATE INDEX IF NOT EXISTS idx_purchases_updated_at ON purchases(updated_at);
CREATE INDEX IF NOT EXISTS idx_purchases_conversion_source ON purchases(conversion_source);

-- Create GIN index for payment_method_types array if column exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'purchases' AND column_name = 'payment_method_types') THEN
        CREATE INDEX IF NOT EXISTS idx_purchases_payment_method ON purchases USING GIN(payment_method_types);
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE webhook_events IS 'Tracks Stripe webhook events for deduplication and processing status';
COMMENT ON TABLE payment_analytics IS 'Comprehensive analytics for payment events and user behavior';
COMMENT ON COLUMN webhook_events.stripe_event_id IS 'Unique Stripe event ID for deduplication';
COMMENT ON COLUMN webhook_events.status IS 'Processing status: processing, completed, failed';
COMMENT ON COLUMN payment_analytics.event_type IS 'Type of payment event (checkout_session_completed, etc.)';
COMMENT ON COLUMN payment_analytics.event_data IS 'Full event data in JSON format';
COMMENT ON COLUMN payment_analytics.processing_time_ms IS 'Time taken to process the event in milliseconds';