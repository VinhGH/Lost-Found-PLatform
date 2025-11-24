-- Reset timestamps for testing
-- This will set all timestamps to current time for testing purposes

-- Reset Lost_Post timestamps
UPDATE "Lost_Post" 
SET 
  created_at = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP,
  approved_at = CASE 
    WHEN status = 'Approved' THEN CURRENT_TIMESTAMP 
    ELSE approved_at 
  END
WHERE deleted_at IS NULL;

-- Reset Found_Post timestamps
UPDATE "Found_Post" 
SET 
  created_at = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP,
  approved_at = CASE 
    WHEN status = 'Approved' THEN CURRENT_TIMESTAMP 
    ELSE approved_at 
  END
WHERE deleted_at IS NULL;

