# Purchase Button Troubleshooting Guide

## 🐛 Current Issue: 406 Error & Timeout

The error `"Purchase check timed out for PDF"` and `406 status code` indicates the database tables for purchases haven't been created yet.

## 🔧 **IMMEDIATE FIX NEEDED:**

### 1. Apply Database Migration

**Go to [Supabase Dashboard > SQL Editor](https://supabase.com/dashboard/project/aumijfxmeclxweojrefa/sql)** and run this SQL:

```sql
-- Copy and paste the entire content of manual-db-setup.sql
```

This will create:
- ✅ `purchases` table
- ✅ `stripe_customers` table  
- ✅ `download_tokens` table
- ✅ Proper indexes and constraints
- ✅ Row Level Security policies

### 2. Verify Tables Created

After running the SQL, check that these queries work:

```sql
-- Should return table info
SELECT * FROM information_schema.tables WHERE table_name = 'purchases';

-- Should return empty result (no error)
SELECT * FROM purchases LIMIT 1;
```

### 3. Test Purchase Button

After applying the database changes:
- ✅ The timeout error should disappear
- ✅ Purchase status check should work
- ✅ Debug panel should show proper data

## 🚨 **Root Cause Analysis:**

| Issue | Cause | Status |
|-------|-------|---------|
| 406 Error | `purchases` table doesn't exist | 🔴 **CRITICAL** |
| Timeout | Database query failing | 🔴 **CRITICAL** |  
| Purchase check failing | Missing database schema | 🔴 **CRITICAL** |

## 🔍 **Enhanced Debugging:**

The updated code now provides better error logging:

```javascript
// Check browser console for these messages:
"Purchase status check error: {error, code, message, details, hint}"
"Purchases table or column not found - database migration may be needed"
```

## ✅ **Verification Steps:**

1. **Database Setup**: Run `manual-db-setup.sql` in Supabase
2. **Check Console**: Look for improved error messages
3. **Test Purchase**: Try clicking purchase button
4. **Debug Panel**: Verify all environment variables are ✓

## 🎯 **Expected Results After Fix:**

- ❌ ~~Purchase check timed out~~
- ❌ ~~406 status code~~
- ✅ Purchase status loads quickly
- ✅ Debug panel shows proper data
- ✅ Purchase button works correctly

## 📋 **Quick Status Check:**

Run this in Supabase SQL Editor to verify setup:

```sql
-- Check if all tables exist
SELECT 
    table_name,
    CASE WHEN table_name IN ('purchases', 'stripe_customers', 'download_tokens') 
         THEN '✅ EXISTS' 
         ELSE '❌ MISSING' 
    END as status
FROM information_schema.tables 
WHERE table_name IN ('purchases', 'stripe_customers', 'download_tokens')
ORDER BY table_name;
```

The purchase button will work perfectly once the database schema is applied! 🚀