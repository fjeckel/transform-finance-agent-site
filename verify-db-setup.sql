-- Quick Database Verification Script
-- Run this in Supabase SQL Editor to check if setup was successful

-- Check if tables exist
SELECT 
    table_name,
    table_type,
    CASE 
        WHEN table_name IN ('purchases', 'stripe_customers', 'download_tokens') 
        THEN '✅ REQUIRED TABLE EXISTS' 
        ELSE '🔍 OTHER TABLE' 
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public'
    AND table_name IN ('purchases', 'stripe_customers', 'download_tokens', 'downloadable_pdfs')
ORDER BY table_name;

-- Check table columns for purchases table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'purchases' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('purchases', 'stripe_customers', 'download_tokens')
ORDER BY tablename, policyname;

-- Test basic queries
SELECT 'Testing purchases table...' as test;
SELECT COUNT(*) as purchase_count FROM public.purchases;

SELECT 'Testing stripe_customers table...' as test;
SELECT COUNT(*) as customer_count FROM public.stripe_customers;

SELECT 'Testing download_tokens table...' as test;
SELECT COUNT(*) as token_count FROM public.download_tokens;

-- Check downloadable_pdfs table (should already exist)
SELECT 'Testing downloadable_pdfs table...' as test;
SELECT COUNT(*) as pdf_count FROM public.downloadable_pdfs;

SELECT 'All tests completed!' as result;