-- ================================================
-- Simple Script to Delete Account by Email
-- Run this in Supabase SQL Editor
-- Replace 'thaivinh2@dtu.edu.vn' with your email
-- ================================================

-- Get account_id first
DO $$
DECLARE
    v_account_id INTEGER;
    v_email VARCHAR(255) := 'thaivinh2@dtu.edu.vn';
BEGIN
    -- Get account_id
    SELECT account_id INTO v_account_id
    FROM "Account"
    WHERE email = v_email;
    
    IF v_account_id IS NULL THEN
        RAISE NOTICE 'Account not found: %', v_email;
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found account_id: % for email: %', v_account_id, v_email;
    
    -- Step 1: Delete OTP verifications
    DELETE FROM otp_verifications WHERE email = v_email;
    RAISE NOTICE '✓ Deleted OTP verifications';
    
    -- Step 2: Delete Lost_Post_Images (via Lost_Post)
    DELETE FROM "Lost_Post_Images"
    WHERE lost_post_id IN (
        SELECT lost_post_id FROM "Lost_Post" WHERE account_id = v_account_id
    );
    RAISE NOTICE '✓ Deleted Lost_Post_Images';
    
    -- Step 3: Delete Found_Post_Images (via Found_Post)
    DELETE FROM "Found_Post_Images"
    WHERE found_post_id IN (
        SELECT found_post_id FROM "Found_Post" WHERE account_id = v_account_id
    );
    RAISE NOTICE '✓ Deleted Found_Post_Images';
    
    -- Step 4: Delete Match_Post (via found_post_id or lost_post_id)
    DELETE FROM "Match_Post" 
    WHERE found_post_id IN (SELECT found_post_id FROM "Found_Post" WHERE account_id = v_account_id)
       OR lost_post_id IN (SELECT lost_post_id FROM "Lost_Post" WHERE account_id = v_account_id);
    RAISE NOTICE '✓ Deleted Match_Post';
    
    -- Step 5: Delete Lost_Post
    DELETE FROM "Lost_Post" WHERE account_id = v_account_id;
    RAISE NOTICE '✓ Deleted Lost_Post';
    
    -- Step 6: Delete Found_Post
    DELETE FROM "Found_Post" WHERE account_id = v_account_id;
    RAISE NOTICE '✓ Deleted Found_Post';
    
    -- Step 7: Delete Notification (has ON DELETE CASCADE, but delete explicitly)
    DELETE FROM "Notification" WHERE account_id = v_account_id;
    RAISE NOTICE '✓ Deleted Notification';
    
    -- Step 8: Delete Email_log
    DELETE FROM "Email_log" WHERE account_id = v_account_id;
    RAISE NOTICE '✓ Deleted Email_log';
    
    -- Step 9: Finally delete Account
    DELETE FROM "Account" WHERE account_id = v_account_id;
    RAISE NOTICE '✓ Deleted Account';
    
    RAISE NOTICE '✅ Successfully deleted account and all related data!';
END $$;

-- Verify deletion
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM "Account" WHERE email = 'thaivinh2@dtu.edu.vn') 
        THEN 'Account still exists ❌'
        ELSE 'Account deleted successfully ✅'
    END AS status;

