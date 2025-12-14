-- Migration: Add views column to Lost_Post and Found_Post tables
-- Purpose: Track view count for posts to display in "Bài đăng của tôi" tab
-- Date: 2025-12-03

-- Add views column to Lost_Post table
ALTER TABLE "Lost_Post" 
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Add views column to Found_Post table
ALTER TABLE "Found_Post" 
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Add index for better performance when querying by views
CREATE INDEX IF NOT EXISTS idx_lost_post_views ON "Lost_Post"(views DESC);
CREATE INDEX IF NOT EXISTS idx_found_post_views ON "Found_Post"(views DESC);

-- Add check constraint to ensure views is non-negative
-- Note: PostgreSQL does not support IF NOT EXISTS for constraints
-- If constraint already exists, this will fail (safe to ignore)
DO $$ 
BEGIN
    ALTER TABLE "Lost_Post" 
    ADD CONSTRAINT chk_lost_post_views_positive CHECK (views >= 0);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE "Found_Post" 
    ADD CONSTRAINT chk_found_post_views_positive CHECK (views >= 0);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Update existing posts to have 0 views (in case column already exists with NULL values)
UPDATE "Lost_Post" SET views = 0 WHERE views IS NULL;
UPDATE "Found_Post" SET views = 0 WHERE views IS NULL;

-- Verify migration
SELECT 
    'Lost_Post' as table_name,
    COUNT(*) as total_posts,
    SUM(views) as total_views,
    AVG(views) as avg_views
FROM "Lost_Post"
UNION ALL
SELECT 
    'Found_Post' as table_name,
    COUNT(*) as total_posts,
    SUM(views) as total_views,
    AVG(views) as avg_views
FROM "Found_Post";
