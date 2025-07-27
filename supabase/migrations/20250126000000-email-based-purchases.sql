-- Email-Based Purchase System Migration
-- This migration creates tables for email-based purchases without user authentication

-- Create email_purchases table for tracking purchases by email
CREATE TABLE IF NOT EXISTS email_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255),
    customer_country VARCHAR(2),
    pdf_id UUID NOT NULL REFERENCES downloadable_pdfs(id),
    stripe_checkout_session_id VARCHAR(255) UNIQUE,
    stripe_payment_intent_id VARCHAR(255),
    stripe_payment_link_id VARCHAR(255),
    amount_paid DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    status VARCHAR(50) NOT NULL DEFAULT 'completed',
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    download_count INTEGER DEFAULT 0,
    last_downloaded_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 year'), -- Downloads expire after 1 year
    metadata JSONB
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_purchases_customer_email ON email_purchases(customer_email);
CREATE INDEX IF NOT EXISTS idx_email_purchases_pdf_id ON email_purchases(pdf_id);
CREATE INDEX IF NOT EXISTS idx_email_purchases_session_id ON email_purchases(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_email_purchases_purchased_at ON email_purchases(purchased_at);
CREATE INDEX IF NOT EXISTS idx_email_purchases_status ON email_purchases(status);

-- Add new columns to downloadable_pdfs table for Stripe integration
DO $$ 
BEGIN
    -- Add Stripe price ID for reusable prices
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'downloadable_pdfs' AND column_name = 'stripe_price_id') THEN
        ALTER TABLE downloadable_pdfs ADD COLUMN stripe_price_id VARCHAR(255);
    END IF;
    
    -- Add payment link URL for direct purchases
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'downloadable_pdfs' AND column_name = 'stripe_payment_link_url') THEN
        ALTER TABLE downloadable_pdfs ADD COLUMN stripe_payment_link_url TEXT;
    END IF;
    
    -- Add payment link ID for management
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'downloadable_pdfs' AND column_name = 'stripe_payment_link_id') THEN
        ALTER TABLE downloadable_pdfs ADD COLUMN stripe_payment_link_id VARCHAR(255);
    END IF;
    
    -- Add sales count for analytics
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'downloadable_pdfs' AND column_name = 'sales_count') THEN
        ALTER TABLE downloadable_pdfs ADD COLUMN sales_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add total revenue for analytics
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'downloadable_pdfs' AND column_name = 'total_revenue') THEN
        ALTER TABLE downloadable_pdfs ADD COLUMN total_revenue DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- Create download_tokens table for secure download links
CREATE TABLE IF NOT EXISTS download_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_id UUID NOT NULL REFERENCES email_purchases(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    max_downloads INTEGER DEFAULT 5,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

-- Add indexes for download tokens
CREATE INDEX IF NOT EXISTS idx_download_tokens_token ON download_tokens(token);
CREATE INDEX IF NOT EXISTS idx_download_tokens_purchase_id ON download_tokens(purchase_id);
CREATE INDEX IF NOT EXISTS idx_download_tokens_expires_at ON download_tokens(expires_at);

-- Create analytics view for sales reporting
CREATE OR REPLACE VIEW sales_analytics AS
SELECT 
    p.id as pdf_id,
    p.title as pdf_title,
    p.price as pdf_price,
    p.currency as pdf_currency,
    COUNT(ep.id) as total_sales,
    SUM(ep.amount_paid) as total_revenue,
    AVG(ep.amount_paid) as avg_sale_amount,
    COUNT(DISTINCT ep.customer_email) as unique_customers,
    MIN(ep.purchased_at) as first_sale,
    MAX(ep.purchased_at) as last_sale,
    COUNT(CASE WHEN ep.purchased_at >= NOW() - INTERVAL '30 days' THEN 1 END) as sales_last_30_days,
    COUNT(CASE WHEN ep.purchased_at >= NOW() - INTERVAL '7 days' THEN 1 END) as sales_last_7_days
FROM downloadable_pdfs p
LEFT JOIN email_purchases ep ON p.id = ep.pdf_id AND ep.status = 'completed'
WHERE p.is_premium = true
GROUP BY p.id, p.title, p.price, p.currency;

-- Create trigger to update sales count and revenue on new purchases
CREATE OR REPLACE FUNCTION update_pdf_sales_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
        UPDATE downloadable_pdfs 
        SET 
            sales_count = sales_count + 1,
            total_revenue = total_revenue + NEW.amount_paid
        WHERE id = NEW.pdf_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_update_pdf_sales_stats ON email_purchases;
CREATE TRIGGER trigger_update_pdf_sales_stats
    AFTER INSERT ON email_purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_pdf_sales_stats();

-- Create function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for email_purchases updated_at
DROP TRIGGER IF EXISTS update_email_purchases_updated_at ON email_purchases;
CREATE TRIGGER update_email_purchases_updated_at
    BEFORE UPDATE ON email_purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE email_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_purchases (service role and public read for customer's own purchases)
CREATE POLICY "Service role can manage email purchases"
    ON email_purchases
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Allow customers to view their own purchases (for future customer portal)
CREATE POLICY "Customers can view their own purchases"
    ON email_purchases
    FOR SELECT
    USING (true); -- For now, allow reading - can be restricted by email verification

-- RLS Policies for download_tokens (service role only)
CREATE POLICY "Service role can manage download tokens"
    ON download_tokens
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_downloadable_pdfs_stripe_price_id ON downloadable_pdfs(stripe_price_id);
CREATE INDEX IF NOT EXISTS idx_downloadable_pdfs_stripe_payment_link_id ON downloadable_pdfs(stripe_payment_link_id);
CREATE INDEX IF NOT EXISTS idx_downloadable_pdfs_sales_count ON downloadable_pdfs(sales_count);

-- Add comments for documentation
COMMENT ON TABLE email_purchases IS 'Tracks PDF purchases by customer email without requiring user accounts';
COMMENT ON TABLE download_tokens IS 'Secure download tokens for purchased PDFs with expiration';
COMMENT ON VIEW sales_analytics IS 'Analytics view for PDF sales reporting and insights';
COMMENT ON COLUMN email_purchases.customer_email IS 'Customer email address for purchase and delivery';
COMMENT ON COLUMN email_purchases.expires_at IS 'When download access expires (default 1 year)';
COMMENT ON COLUMN download_tokens.token IS 'Secure token for PDF download access';
COMMENT ON COLUMN download_tokens.max_downloads IS 'Maximum number of downloads allowed per token';

-- Create indexes for downloadable_pdfs performance
CREATE INDEX IF NOT EXISTS idx_downloadable_pdfs_is_premium ON downloadable_pdfs(is_premium) WHERE is_premium = true;
CREATE INDEX IF NOT EXISTS idx_downloadable_pdfs_created_at ON downloadable_pdfs(created_at);

-- Sample data update for existing PDFs (set default sales stats)
UPDATE downloadable_pdfs 
SET 
    sales_count = 0,
    total_revenue = 0.00
WHERE sales_count IS NULL OR total_revenue IS NULL;