-- Migration: Add approved_at field to Lost_Post and Found_Post tables
-- This field stores the timestamp when a post was approved by admin

-- Add approved_at to Lost_Post
ALTER TABLE "Lost_Post" 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

-- Add approved_at to Found_Post
ALTER TABLE "Found_Post" 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

-- Update existing approved posts: set approved_at = updated_at if status = 'Approved'
UPDATE "Lost_Post" 
SET approved_at = updated_at 
WHERE status = 'Approved' AND approved_at IS NULL;

UPDATE "Found_Post" 
SET approved_at = updated_at 
WHERE status = 'Approved' AND approved_at IS NULL;

