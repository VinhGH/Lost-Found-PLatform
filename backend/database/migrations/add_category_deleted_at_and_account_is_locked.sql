-- Instructions to run this migration:
-- 
-- Option 1: Using Supabase Dashboard (Recommended)
-- 1. Go to https://supabase.com/dashboard
-- 2. Select your project
-- 3. Go to SQL Editor
-- 4. Copy and paste the SQL below
-- 5. Click "Run"
--
-- Option 2: Using psql command line
-- psql -h [HOST] -p [PORT] -d postgres -U [USER] -f add_category_deleted_at_and_account_is_locked.sql
--
-- ============================================================================

-- Add deleted_at column to Category table for soft delete
ALTER TABLE "Category" 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

-- Add is_locked column to Account table for lock/unlock functionality
ALTER TABLE "Account" 
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;

-- Create index on deleted_at for better query performance
CREATE INDEX IF NOT EXISTS idx_category_deleted_at ON "Category"(deleted_at);

-- Create index on is_locked for better query performance
CREATE INDEX IF NOT EXISTS idx_account_is_locked ON "Account"(is_locked);

-- Comments
COMMENT ON COLUMN "Category".deleted_at IS 'Soft delete timestamp - NULL means active, non-NULL means deleted';
COMMENT ON COLUMN "Account".is_locked IS 'Account lock status - FALSE means unlocked, TRUE means locked';

-- Verify the changes
SELECT 
    'Category' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'Category' AND column_name IN ('deleted_at')
UNION ALL
SELECT 
    'Account' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'Account' AND column_name IN ('is_locked');
