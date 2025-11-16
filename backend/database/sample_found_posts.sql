-- Sample Found Posts Data
-- Chạy script này trong Supabase SQL Editor để tạo dữ liệu mẫu

-- Bài 1: Nhặt được ví
INSERT INTO "Found_Post" (
  account_id, 
  post_title, 
  description, 
  item_name,
  location_id,
  category_id,
  status,
  created_at,
  updated_at
) VALUES (
  15, -- admin account
  'Nhặt được ví da màu đen',
  'Nhặt được ví da màu đen ở khu vực bãi xe B2 sáng nay. Bên trong có một số thẻ và giấy tờ. Ai mất xin liên hệ để xác minh và nhận lại.',
  'Ví da đen',
  1,
  1, -- Ví/Túi
  'Approved',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
);

-- Bài 2: Nhặt được laptop
INSERT INTO "Found_Post" (
  account_id, 
  post_title, 
  description, 
  item_name,
  location_id,
  category_id,
  status,
  created_at,
  updated_at
) VALUES (
  15,
  'Nhặt được laptop Dell màu bạc',
  'Nhặt được laptop Dell màu bạc tại thư viện tầng 3 chiều hôm qua. Máy còn trong túi xách đen, có sticker DTU. Chủ nhân vui lòng liên hệ và cung cấp thông tin để xác minh.',
  'Laptop Dell',
  2,
  3, -- Laptop
  'Approved',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
);

-- Bài 3: Nhặt được chìa khóa
INSERT INTO "Found_Post" (
  account_id, 
  post_title, 
  description, 
  item_name,
  location_id,
  category_id,
  status,
  created_at,
  updated_at
) VALUES (
  15,
  'Nhặt được móc chìa khóa có móc xe Honda',
  'Nhặt được móc chìa khóa màu đỏ có gắn logo Honda, có khoảng 3-4 chiếc chìa. Nhặt được ở căng tin DTU. Ai mất vui lòng liên hệ.',
  'Móc chìa khóa Honda',
  3,
  4, -- Chìa khóa
  'Approved',
  NOW() - INTERVAL '3 hours',
  NOW() - INTERVAL '3 hours'
);

-- Bài 4: Nhặt được sách
INSERT INTO "Found_Post" (
  account_id, 
  post_title, 
  description, 
  item_name,
  location_id,
  category_id,
  status,
  created_at,
  updated_at
) VALUES (
  15,
  'Nhặt được sách giáo trình Toán cao cấp',
  'Nhặt được cuốn sách Toán cao cấp A1 tại phòng học B1-305. Bên trong có ghi tên và MSSV. Chủ nhân vui lòng đến văn phòng khoa hoặc liên hệ số điện thoại.',
  'Sách Toán cao cấp',
  4,
  5, -- Sách vở
  'Approved',
  NOW() - INTERVAL '5 hours',
  NOW() - INTERVAL '5 hours'
);

-- Bài 5: Nhặt được tai nghe
INSERT INTO "Found_Post" (
  account_id, 
  post_title, 
  description, 
  item_name,
  location_id,
  category_id,
  status,
  created_at,
  updated_at
) VALUES (
  15,
  'Nhặt được tai nghe AirPods',
  'Nhặt được tai nghe AirPods Pro màu trắng ở sân bóng DTU. Case còn đầy đủ. Ai mất vui lòng liên hệ và mô tả chi tiết để nhận lại.',
  'AirPods Pro',
  5,
  6, -- Phụ kiện
  'Approved',
  NOW() - INTERVAL '8 hours',
  NOW() - INTERVAL '8 hours'
);

-- Bài 6: Nhặt được túi xách
INSERT INTO "Found_Post" (
  account_id, 
  post_title, 
  description, 
  item_name,
  location_id,
  category_id,
  status,
  created_at,
  updated_at
) VALUES (
  15,
  'Nhặt được túi xách nữ màu hồng',
  'Nhặt được túi xách nữ màu hồng nhạt ở khu vực thư viện. Bên trong có một số đồ dùng cá nhân. Ai mất vui lòng liên hệ để xác minh và nhận lại đồ.',
  'Túi xách hồng',
  2,
  1, -- Ví/Túi
  'Approved',
  NOW() - INTERVAL '12 hours',
  NOW() - INTERVAL '12 hours'
);

-- Bài 7: Nhặt được đồng hồ
INSERT INTO "Found_Post" (
  account_id, 
  post_title, 
  description, 
  item_name,
  location_id,
  category_id,
  status,
  created_at,
  updated_at
) VALUES (
  15,
  'Nhặt được đồng hồ nam Casio',
  'Nhặt được đồng hồ đeo tay nam hiệu Casio màu đen ở phòng tập gym DTU. Ai mất vui lòng liên hệ và mô tả đặc điểm để nhận lại.',
  'Đồng hồ Casio',
  6,
  6, -- Phụ kiện
  'Pending',
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '1 hour'
);

-- Bài 8: Nhặt được thẻ sinh viên
INSERT INTO "Found_Post" (
  account_id, 
  post_title, 
  description, 
  item_name,
  location_id,
  category_id,
  status,
  created_at,
  updated_at
) VALUES (
  15,
  'Nhặt được thẻ sinh viên DTU',
  'Nhặt được thẻ sinh viên DTU có tên Nguyễn Văn A, MSSV 1234567. Nhặt ở bãi xe A1. Bạn nào mất vui lòng liên hệ hoặc đến văn phòng đào tạo nhận lại.',
  'Thẻ sinh viên',
  1,
  7, -- Khác
  'Pending',
  NOW() - INTERVAL '30 minutes',
  NOW() - INTERVAL '30 minutes'
);

-- Kiểm tra kết quả
SELECT 
  found_post_id,
  post_title,
  item_name,
  status,
  created_at
FROM "Found_Post"
ORDER BY created_at DESC;

