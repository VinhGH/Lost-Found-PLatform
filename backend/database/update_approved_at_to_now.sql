-- Update approved_at to current time for all approved posts
-- This will reset the display time to "Vừa xong" for all approved posts

-- Update Lost_Post
UPDATE "Lost_Post" 
SET approved_at = CURRENT_TIMESTAMP 
WHERE status = 'Approved' AND approved_at IS NOT NULL;

-- Update Found_Post
UPDATE "Found_Post" 
SET approved_at = CURRENT_TIMESTAMP 
WHERE status = 'Approved' AND approved_at IS NOT NULL;

