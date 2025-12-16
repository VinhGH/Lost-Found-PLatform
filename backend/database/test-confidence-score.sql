-- ============================================================================
-- AI Matching Confidence Score - Database Test Queries
-- ============================================================================
-- File: backend/database/test-confidence-score.sql
-- Purpose: Test và verify AI matching confidence scores trong database
-- NOTE: All table names MUST be quoted due to PascalCase naming
-- ============================================================================

-- ============================================================================
-- 1. XEM TẤT CẢ MATCHES VỚI CONFIDENCE SCORE
-- ============================================================================

SELECT 
  m.match_id,
  m.lost_post_id,
  m.found_post_id,
  m.confidence_score,
  ROUND(m.confidence_score * 100, 2) AS percentage,
  CASE 
    WHEN m.confidence_score >= 0.8 THEN '🟢 High (>=80%)'
    WHEN m.confidence_score >= 0.6 THEN '🟡 Regular (60-79%)'
    WHEN m.confidence_score >= 0.45 THEN '⚪ Hidden (45-59%)'
    ELSE '🔴 Invalid (<45%)'
  END AS display_status,
  l.post_title AS lost_title,
  l.item_name AS lost_item,
  f.post_title AS found_title,
  f.item_name AS found_item,
  m.matched_at
FROM "Match_Post" m
JOIN "Lost_Post" l ON m.lost_post_id = l.lost_post_id
JOIN "Found_Post" f ON m.found_post_id = f.found_post_id
ORDER BY m.confidence_score DESC;

-- ============================================================================
-- 2. THỐNG KÊ CONFIDENCE SCORE THEO CATEGORY
-- ============================================================================

SELECT 
  CASE 
    WHEN confidence_score >= 0.8 THEN 'High (>=80%)'
    WHEN confidence_score >= 0.6 THEN 'Regular (60-79%)'
    WHEN confidence_score >= 0.45 THEN 'Hidden (45-59%)'
    ELSE 'Invalid (<45%)'
  END AS category,
  COUNT(*) AS count,
  ROUND(AVG(confidence_score) * 100, 2) AS avg_percentage,
  ROUND(MIN(confidence_score) * 100, 2) AS min_percentage,
  ROUND(MAX(confidence_score) * 100, 2) AS max_percentage
FROM "Match_Post"
GROUP BY category
ORDER BY avg_percentage DESC;

-- ============================================================================
-- 3. XEM MATCHES ĐƯỢC TẠO TRONG 1 GIỜ QUA
-- ============================================================================

SELECT 
  match_id,
  lost_post_id,
  found_post_id,
  confidence_score,
  ROUND(confidence_score * 100, 2) AS percentage,
  matched_at,
  EXTRACT(EPOCH FROM (NOW() - matched_at))/60 AS minutes_ago
FROM "Match_Post"
WHERE matched_at > NOW() - INTERVAL '1 hour'
ORDER BY matched_at DESC;

-- ============================================================================
-- 4. XEM MATCHES THEO USER (ACCOUNT_ID)
-- ============================================================================

-- Thay YOUR_ACCOUNT_ID bằng account_id thực tế
WITH user_matches AS (
  SELECT 
    m.match_id,
    m.confidence_score,
    ROUND(m.confidence_score * 100, 2) AS percentage,
    m.matched_at,
    l.post_title AS lost_title,
    l.account_id AS lost_owner,
    f.post_title AS found_title,
    f.account_id AS found_owner
  FROM "Match_Post" m
  JOIN "Lost_Post" l ON m.lost_post_id = l.lost_post_id
  JOIN "Found_Post" f ON m.found_post_id = f.found_post_id
  WHERE l.account_id = 1 OR f.account_id = 1  -- Thay 1 bằng YOUR_ACCOUNT_ID
)
SELECT * FROM user_matches
ORDER BY confidence_score DESC;

-- ============================================================================
-- 5. KIỂM TRA POSTS APPROVED TRONG 30 NGÀY (ĐỂ MATCHING)
-- ============================================================================

SELECT 
  'Lost' AS post_type,
  COUNT(*) AS count,
  MIN(approved_at) AS oldest_approved,
  MAX(approved_at) AS newest_approved
FROM "Lost_Post"
WHERE status = 'Approved' 
  AND approved_at > NOW() - INTERVAL '30 days'
  AND deleted_at IS NULL

UNION ALL

SELECT 
  'Found' AS post_type,
  COUNT(*) AS count,
  MIN(approved_at) AS oldest_approved,
  MAX(approved_at) AS newest_approved
FROM "Found_Post"
WHERE status = 'Approved' 
  AND approved_at > NOW() - INTERVAL '30 days'
  AND deleted_at IS NULL;

-- ============================================================================
-- 6. TÌM MATCHES CHO MỘT POST CỤ THỂ
-- ============================================================================

-- Thay 55 bằng lost_post_id thực tế
SELECT 
  m.match_id,
  m.confidence_score,
  ROUND(m.confidence_score * 100, 2) AS percentage,
  f.post_title AS matched_found_post,
  f.item_name,
  f.description,
  m.matched_at
FROM "Match_Post" m
JOIN "Found_Post" f ON m.found_post_id = f.found_post_id
WHERE m.lost_post_id = 55
ORDER BY m.confidence_score DESC;

-- Hoặc tìm matches cho found post
-- Thay 43 bằng found_post_id thực tế
SELECT 
  m.match_id,
  m.confidence_score,
  ROUND(m.confidence_score * 100, 2) AS percentage,
  l.post_title AS matched_lost_post,
  l.item_name,
  l.description,
  m.matched_at
FROM "Match_Post" m
JOIN "Lost_Post" l ON m.lost_post_id = l.lost_post_id
WHERE m.found_post_id = 43
ORDER BY m.confidence_score DESC;

-- ============================================================================
-- 7. XEM MATCHES THEO NGƯỠNG CONFIDENCE
-- ============================================================================

-- High confidence matches (>= 80%)
SELECT 
  m.match_id,
  ROUND(m.confidence_score * 100, 2) AS percentage,
  l.post_title AS lost_title,
  f.post_title AS found_title,
  m.matched_at
FROM "Match_Post" m
JOIN "Lost_Post" l ON m.lost_post_id = l.lost_post_id
JOIN "Found_Post" f ON m.found_post_id = f.found_post_id
WHERE m.confidence_score >= 0.8
ORDER BY m.confidence_score DESC;

-- Regular matches (60-79%)
SELECT 
  m.match_id,
  ROUND(m.confidence_score * 100, 2) AS percentage,
  l.post_title AS lost_title,
  f.post_title AS found_title,
  m.matched_at
FROM "Match_Post" m
JOIN "Lost_Post" l ON m.lost_post_id = l.lost_post_id
JOIN "Found_Post" f ON m.found_post_id = f.found_post_id
WHERE m.confidence_score >= 0.6 AND m.confidence_score < 0.8
ORDER BY m.confidence_score DESC;

-- Hidden matches (45-59%) - Tạo nhưng không hiển thị trên UI
SELECT 
  m.match_id,
  ROUND(m.confidence_score * 100, 2) AS percentage,
  l.post_title AS lost_title,
  f.post_title AS found_title,
  m.matched_at
FROM "Match_Post" m
JOIN "Lost_Post" l ON m.lost_post_id = l.lost_post_id
JOIN "Found_Post" f ON m.found_post_id = f.found_post_id
WHERE m.confidence_score >= 0.45 AND m.confidence_score < 0.6
ORDER BY m.confidence_score DESC;

-- ============================================================================
-- 8. KIỂM TRA DUPLICATE MATCHES
-- ============================================================================

-- Tìm matches bị duplicate (cùng lost_post_id và found_post_id)
SELECT 
  lost_post_id,
  found_post_id,
  COUNT(*) AS duplicate_count,
  ARRAY_AGG(match_id) AS match_ids,
  ARRAY_AGG(ROUND(confidence_score * 100, 2)) AS percentages,
  ARRAY_AGG(matched_at) AS matched_dates
FROM "Match_Post"
GROUP BY lost_post_id, found_post_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- ============================================================================
-- 9. XEM TOP 10 MATCHES CAO NHẤT
-- ============================================================================

SELECT 
  m.match_id,
  ROUND(m.confidence_score * 100, 2) AS percentage,
  l.post_title AS lost_title,
  l.item_name AS lost_item,
  f.post_title AS found_title,
  f.item_name AS found_item,
  m.matched_at,
  EXTRACT(EPOCH FROM (NOW() - m.matched_at))/3600 AS hours_ago
FROM "Match_Post" m
JOIN "Lost_Post" l ON m.lost_post_id = l.lost_post_id
JOIN "Found_Post" f ON m.found_post_id = f.found_post_id
ORDER BY m.confidence_score DESC
LIMIT 10;

-- ============================================================================
-- 10. PHÂN TÍCH MATCHES THEO CATEGORY
-- ============================================================================

SELECT 
  c.name AS category_name,
  COUNT(m.match_id) AS match_count,
  ROUND(AVG(m.confidence_score) * 100, 2) AS avg_confidence,
  ROUND(MIN(m.confidence_score) * 100, 2) AS min_confidence,
  ROUND(MAX(m.confidence_score) * 100, 2) AS max_confidence
FROM "Match_Post" m
JOIN "Lost_Post" l ON m.lost_post_id = l.lost_post_id
JOIN "Category" c ON l.category_id = c.category_id
GROUP BY c.name
ORDER BY match_count DESC;

-- ============================================================================
-- 11. XEM MATCHES VỚI IMAGES
-- ============================================================================

-- Matches có ảnh (để kiểm tra text + image scoring)
SELECT 
  m.match_id,
  ROUND(m.confidence_score * 100, 2) AS percentage,
  l.post_title AS lost_title,
  (SELECT COUNT(*) FROM "Lost_Post_Images" WHERE lost_post_id = l.lost_post_id) AS lost_image_count,
  f.post_title AS found_title,
  (SELECT COUNT(*) FROM "Found_Post_Images" WHERE found_post_id = f.found_post_id) AS found_image_count,
  m.matched_at
FROM "Match_Post" m
JOIN "Lost_Post" l ON m.lost_post_id = l.lost_post_id
JOIN "Found_Post" f ON m.found_post_id = f.found_post_id
WHERE EXISTS (
  SELECT 1 FROM "Lost_Post_Images" WHERE lost_post_id = l.lost_post_id
) AND EXISTS (
  SELECT 1 FROM "Found_Post_Images" WHERE found_post_id = f.found_post_id
)
ORDER BY m.confidence_score DESC;

-- ============================================================================
-- 12. DELETE TEST MATCHES (CLEANUP)
-- ============================================================================

-- ⚠️ CẢNH BÁO: Chỉ chạy khi cần cleanup test data
-- Xóa matches có confidence < 45% (invalid)
-- DELETE FROM "Match_Post" WHERE confidence_score < 0.45;

-- Xóa matches cũ hơn 90 ngày
-- DELETE FROM "Match_Post" WHERE matched_at < NOW() - INTERVAL '90 days';

-- ============================================================================
-- 13. INSERT TEST MATCH (CHO TESTING)
-- ============================================================================

-- ⚠️ CẢNH BÁO: Chỉ dùng cho testing
-- Tạo test match với confidence score cụ thể
/*
INSERT INTO "Match_Post" (lost_post_id, found_post_id, confidence_score, matched_at)
VALUES 
  (55, 43, 0.85, NOW()),  -- High confidence
  (56, 44, 0.72, NOW()),  -- Regular
  (57, 45, 0.55, NOW());  -- Hidden
*/

-- ============================================================================
-- 14. VERIFY MATCH CREATION LOGIC
-- ============================================================================

-- Kiểm tra xem có posts nào chưa có matches không
WITH posts_with_matches AS (
  SELECT DISTINCT lost_post_id AS post_id, 'lost' AS type FROM "Match_Post"
  UNION
  SELECT DISTINCT found_post_id AS post_id, 'found' AS type FROM "Match_Post"
)
SELECT 
  'Lost' AS post_type,
  COUNT(*) AS posts_without_matches,
  ARRAY_AGG(l.lost_post_id) AS post_ids
FROM "Lost_Post" l
WHERE l.status = 'Approved'
  AND l.approved_at > NOW() - INTERVAL '30 days'
  AND l.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM posts_with_matches 
    WHERE post_id = l.lost_post_id AND type = 'lost'
  )

UNION ALL

SELECT 
  'Found' AS post_type,
  COUNT(*) AS posts_without_matches,
  ARRAY_AGG(f.found_post_id) AS post_ids
FROM "Found_Post" f
WHERE f.status = 'Approved'
  AND f.approved_at > NOW() - INTERVAL '30 days'
  AND f.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM posts_with_matches 
    WHERE post_id = f.found_post_id AND type = 'found'
  );

-- ============================================================================
-- 15. XEM NOTIFICATION ĐƯỢC TẠO CHO MATCHES
-- ============================================================================

-- Kiểm tra notifications cho matches
SELECT 
  n.notification_id,
  n.account_id,
  n.type,
  n.message,
  n.is_read,
  n.created_at,
  m.match_id,
  ROUND(m.confidence_score * 100, 2) AS match_percentage
FROM "Notification" n
JOIN "Match_Post" m ON n.match_id = m.match_id
WHERE n.type = 'match'
ORDER BY n.created_at DESC;

-- ============================================================================
-- 16. XEM CONVERSATIONS TỪ MATCHES
-- ============================================================================

-- Kiểm tra conversations được tạo từ matches
SELECT 
  c.conversation_id,
  c.match_id,
  m.confidence_score,
  ROUND(m.confidence_score * 100, 2) AS percentage,
  l.post_title AS lost_title,
  f.post_title AS found_title,
  c.created_at AS conversation_created,
  m.matched_at,
  (SELECT COUNT(*) FROM "Message" WHERE conversation_id = c.conversation_id) AS message_count
FROM "Conversation" c
JOIN "Match_Post" m ON c.match_id = m.match_id
JOIN "Lost_Post" l ON m.lost_post_id = l.lost_post_id
JOIN "Found_Post" f ON m.found_post_id = f.found_post_id
ORDER BY c.created_at DESC;

-- ============================================================================
-- 17. PHÂN TÍCH MATCHES THEO LOCATION
-- ============================================================================

-- Matches theo địa điểm
SELECT 
  loc.building,
  loc.room,
  COUNT(m.match_id) AS match_count,
  ROUND(AVG(m.confidence_score) * 100, 2) AS avg_confidence
FROM "Match_Post" m
JOIN "Lost_Post" l ON m.lost_post_id = l.lost_post_id
JOIN "Location" loc ON l.location_id = loc.location_id
GROUP BY loc.building, loc.room
ORDER BY match_count DESC;

-- ============================================================================
-- 18. XEM MATCHES VỚI ACCOUNT INFO
-- ============================================================================

-- Matches với thông tin user
SELECT 
  m.match_id,
  ROUND(m.confidence_score * 100, 2) AS percentage,
  l.post_title AS lost_title,
  la.user_name AS lost_by,
  la.email AS lost_email,
  f.post_title AS found_title,
  fa.user_name AS found_by,
  fa.email AS found_email,
  m.matched_at
FROM "Match_Post" m
JOIN "Lost_Post" l ON m.lost_post_id = l.lost_post_id
JOIN "Account" la ON l.account_id = la.account_id
JOIN "Found_Post" f ON m.found_post_id = f.found_post_id
JOIN "Account" fa ON f.account_id = fa.account_id
ORDER BY m.confidence_score DESC
LIMIT 20;

-- ============================================================================
-- 19. KIỂM TRA MATCHES THEO THỜI GIAN
-- ============================================================================

-- Thống kê matches theo ngày trong tuần qua
SELECT 
  DATE(matched_at) AS match_date,
  COUNT(*) AS match_count,
  ROUND(AVG(confidence_score) * 100, 2) AS avg_confidence,
  COUNT(CASE WHEN confidence_score >= 0.8 THEN 1 END) AS high_matches,
  COUNT(CASE WHEN confidence_score >= 0.6 AND confidence_score < 0.8 THEN 1 END) AS regular_matches,
  COUNT(CASE WHEN confidence_score >= 0.45 AND confidence_score < 0.6 THEN 1 END) AS hidden_matches
FROM "Match_Post"
WHERE matched_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(matched_at)
ORDER BY match_date DESC;

-- ============================================================================
-- 20. COMPREHENSIVE MATCH REPORT
-- ============================================================================

-- Báo cáo tổng hợp về matching system
SELECT 
  'Total Matches' AS metric,
  COUNT(*)::TEXT AS value
FROM "Match_Post"

UNION ALL

SELECT 
  'High Confidence (>=80%)' AS metric,
  COUNT(*)::TEXT AS value
FROM "Match_Post"
WHERE confidence_score >= 0.8

UNION ALL

SELECT 
  'Regular Confidence (60-79%)' AS metric,
  COUNT(*)::TEXT AS value
FROM "Match_Post"
WHERE confidence_score >= 0.6 AND confidence_score < 0.8

UNION ALL

SELECT 
  'Hidden Matches (45-59%)' AS metric,
  COUNT(*)::TEXT AS value
FROM "Match_Post"
WHERE confidence_score >= 0.45 AND confidence_score < 0.6

UNION ALL

SELECT 
  'Invalid Matches (<45%)' AS metric,
  COUNT(*)::TEXT AS value
FROM "Match_Post"
WHERE confidence_score < 0.45

UNION ALL

SELECT 
  'Average Confidence Score' AS metric,
  ROUND(AVG(confidence_score) * 100, 2)::TEXT || '%' AS value
FROM "Match_Post"

UNION ALL

SELECT 
  'Matches with Conversations' AS metric,
  COUNT(DISTINCT match_id)::TEXT AS value
FROM "Conversation"
WHERE match_id IS NOT NULL

UNION ALL

SELECT 
  'Matches Today' AS metric,
  COUNT(*)::TEXT AS value
FROM "Match_Post"
WHERE DATE(matched_at) = CURRENT_DATE;

-- ============================================================================
-- END OF TEST QUERIES
-- ============================================================================
