-- Create unified Post VIEW
-- This VIEW combines Lost_Post and Found_Post into a single virtual table
-- to support AI matching queries

CREATE OR REPLACE VIEW "Post" AS
SELECT 
    -- Unified Post_id: prefix 'L' for lost, 'F' for found + original ID
    CONCAT('L', lost_post_id) AS "Post_id",
    'lost' AS "Post_type",
    post_title AS "Post_Title",
    item_name AS "Item_name",
    description AS "Description",
    status AS "Status",
    created_at AS "Created_at",
    approved_at AS "Approved_at",
    account_id AS "Account_id",
    location_id AS "Location_id",
    category_id AS "Category_id"
FROM "Lost_Post"
WHERE deleted_at IS NULL

UNION ALL

SELECT 
    CONCAT('F', found_post_id) AS "Post_id",
    'found' AS "Post_type",
    post_title AS "Post_Title",
    item_name AS "Item_name",
    description AS "Description",
    status AS "Status",
    created_at AS "Created_at",
    approved_at AS "Approved_at",
    account_id AS "Account_id",
    location_id AS "Location_id",
    category_id AS "Category_id"
FROM "Found_Post"
WHERE deleted_at IS NULL;

-- Grant permissions
GRANT SELECT ON "Post" TO authenticated;
GRANT SELECT ON "Post" TO anon;
GRANT SELECT ON "Post" TO service_role;

-- Add comment
COMMENT ON VIEW "Post" IS 'Unified view combining Lost_Post and Found_Post tables for AI matching queries';
