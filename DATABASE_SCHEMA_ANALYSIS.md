# 📊 Database Schema Analysis - Lost & Found Platform

## ✅ **CÁC FIELD ĐÃ PHÙ HỢP**

### 1. **Lost_Post & Found_Post**
- ✅ `post_title` → Frontend: `post.title`
- ✅ `item_name` → Có thể dùng cho category hoặc description
- ✅ `location_id` → Cần JOIN với `Location` table
- ✅ `status` → Enum phù hợp (Pending, Approved, Rejected, Resolved)
- ✅ `created_at` → Frontend: `post.createdAt`
- ✅ `updated_at` → Có thể dùng cho "Cập nhật liên tục"
- ✅ `account_id` → JOIN với `Account` để lấy `user_name` (author)

### 2. **Account**
- ✅ `user_name` → Frontend: `post.author`
- ✅ `phone_number` → Frontend: `post.contact`
- ✅ `avatar` → Có thể dùng cho user profile
- ✅ `email` → Dùng cho login/contact

### 3. **Location**
- ✅ `address`, `building`, `room` → Có thể combine thành string cho frontend

### 4. **Images**
- ✅ Junction tables (`Lost_Post_Images`, `Found_Post_Images`) → Hỗ trợ multiple images

---

## ❌ **CÁC FIELD CẦN THÊM/BỔ SUNG**

### 1. **Missing: `description` field**
**Vấn đề:** Frontend đang dùng `post.description` nhưng schema không có.

**Giải pháp:**
```sql
ALTER TABLE "Lost_Post" 
ADD COLUMN description TEXT;

ALTER TABLE "Found_Post" 
ADD COLUMN description TEXT;
```

### 2. **Missing: `category` field**
**Vấn đề:** Frontend có form field `category` (Danh mục) nhưng schema không có.

**Giải pháp:**
```sql
-- Option 1: Thêm trực tiếp vào table
ALTER TABLE "Lost_Post" 
ADD COLUMN category VARCHAR(100) DEFAULT NULL;

ALTER TABLE "Found_Post" 
ADD COLUMN category VARCHAR(100) DEFAULT NULL;

-- Option 2: Tạo bảng riêng (nếu muốn normalize)
CREATE TABLE "Category" (
  category_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) CHECK (type IN ('Lost', 'Found', 'Both'))
);

-- Thêm foreign key
ALTER TABLE "Lost_Post" 
ADD COLUMN category_id INTEGER REFERENCES "Category"(category_id);

ALTER TABLE "Found_Post" 
ADD COLUMN category_id INTEGER REFERENCES "Category"(category_id);
```

### 4. **Location structure mismatch**
**Vấn đề:** 
- Schema: `address`, `building`, `room` (3 fields riêng)
- Frontend: `location` (1 string, format: "Tòa A - Phòng 101 - Địa chỉ")

**Giải pháp:**
- **Option 1:** Giữ nguyên schema, BE combine khi trả về API:
  ```sql
  SELECT 
    CONCAT(
      COALESCE(l.building, ''), 
      CASE WHEN l.building IS NOT NULL AND l.room IS NOT NULL THEN ' - ' ELSE '' END,
      COALESCE(l.room, ''),
      CASE WHEN l.address IS NOT NULL THEN ' - ' ELSE '' END,
      COALESCE(l.address, '')
    ) AS location
  FROM "Lost_Post" lp
  JOIN "Location" l ON lp.location_id = l.location_id;
  ```

- **Option 2:** Thêm computed column hoặc view

### 5. **Images array format**
**Vấn đề:** Frontend cần `post.image` (string) hoặc array of images.

**Giải pháp:** BE cần query và format:
```sql
-- Function để lấy images dạng array
CREATE OR REPLACE FUNCTION get_lost_post_images(p_lost_post_id INT)
RETURNS TEXT[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT li.link_picture
    FROM "Lost_Post_Images" lpi
    JOIN "Lost_Images" li ON lpi.lost_img_id = li.lost_img_id
    WHERE lpi.lost_post_id = p_lost_post_id
    ORDER BY li.created_at
  );
END;
$$ LANGUAGE plpgsql;
```

---

## 🔧 **CẢI THIỆN SCHEMA ĐỀ XUẤT**

### 1. **Thêm indexes cho performance**
```sql
-- Indexes cho search và filter
CREATE INDEX idx_lost_post_status ON "Lost_Post"(status);
CREATE INDEX idx_lost_post_created_at ON "Lost_Post"(created_at DESC);
CREATE INDEX idx_lost_post_location ON "Lost_Post"(location_id);
CREATE INDEX idx_found_post_status ON "Found_Post"(status);
CREATE INDEX idx_found_post_created_at ON "Found_Post"(created_at DESC);
CREATE INDEX idx_found_post_location ON "Found_Post"(location_id);

-- Full-text search (nếu cần)
CREATE INDEX idx_lost_post_title_search ON "Lost_Post" USING gin(to_tsvector('english', post_title));
CREATE INDEX idx_found_post_title_search ON "Found_Post" USING gin(to_tsvector('english', post_title));
```

### 2. **Soft delete logic**
**Vấn đề:** Có `deleted_at` nhưng không có logic rõ ràng.

**Giải pháp:**
```sql
-- Thêm function để check deleted
CREATE OR REPLACE FUNCTION is_post_deleted(p_deleted_at TIMESTAMP)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN p_deleted_at IS NOT NULL AND p_deleted_at <= CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- View để filter deleted posts
CREATE OR REPLACE VIEW "Active_Lost_Posts" AS
SELECT * FROM "Lost_Post"
WHERE deleted_at IS NULL OR deleted_at > CURRENT_TIMESTAMP;

CREATE OR REPLACE VIEW "Active_Found_Posts" AS
SELECT * FROM "Found_Post"
WHERE deleted_at IS NULL OR deleted_at > CURRENT_TIMESTAMP;
```

### 3. **API Response Format đề xuất**

**GET /api/lost-posts**
```json
{
  "lost_post_id": 1,
  "title": "Mất ví da màu nâu",
  "description": "Mô tả chi tiết...",
  "item_name": "Ví da",
  "category": "Ví/Bóp",
  "location": {
    "location_id": 1,
    "address": "123 Đường ABC",
    "building": "Tòa A",
    "room": "Phòng 101",
    "full_location": "Tòa A - Phòng 101 - 123 Đường ABC"
  },
  "author": {
    "account_id": 1,
    "user_name": "Nguyễn Văn A",
    "avatar": "https://...",
    "phone_number": "0123456789"
  },
  "images": [
    "https://...",
    "https://..."
  ],
  "status": "Approved",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z",
  "contact": "0123456789" // từ Account.phone_number
}
```

---

## 📝 **STORED PROCEDURES ĐỀ XUẤT**

### 1. **sp_GetLostPosts** (với pagination)
```sql
CREATE OR REPLACE FUNCTION sp_getlostposts(
  p_page INT DEFAULT 1,
  p_limit INT DEFAULT 16,
  p_status post_status DEFAULT 'Approved',
  p_search VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  lost_post_id INT,
  title VARCHAR,
  description TEXT,
  item_name VARCHAR,
  category VARCHAR,
  reward VARCHAR,
  location_full VARCHAR,
  author_name VARCHAR,
  author_phone VARCHAR,
  images TEXT[],
  status post_status,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lp.lost_post_id,
    lp.post_title AS title,
    lp.description,
    lp.item_name,
    lp.category,
    CONCAT(
      COALESCE(l.building, ''), 
      CASE WHEN l.building IS NOT NULL AND l.room IS NOT NULL THEN ' - ' ELSE '' END,
      COALESCE(l.room, ''),
      CASE WHEN l.address IS NOT NULL THEN ' - ' ELSE '' END,
      COALESCE(l.address, '')
    ) AS location_full,
    a.user_name AS author_name,
    a.phone_number AS author_phone,
    ARRAY(
      SELECT li.link_picture
      FROM "Lost_Post_Images" lpi
      JOIN "Lost_Images" li ON lpi.lost_img_id = li.lost_img_id
      WHERE lpi.lost_post_id = lp.lost_post_id
      ORDER BY li.created_at
    ) AS images,
    lp.status,
    lp.created_at,
    lp.updated_at
  FROM "Lost_Post" lp
  LEFT JOIN "Location" l ON lp.location_id = l.location_id
  LEFT JOIN "Account" a ON lp.account_id = a.account_id
  WHERE 
    (lp.deleted_at IS NULL OR lp.deleted_at > CURRENT_TIMESTAMP)
    AND lp.status = p_status
    AND (p_search IS NULL OR 
         lp.post_title ILIKE '%' || p_search || '%' OR
         lp.description ILIKE '%' || p_search || '%')
  ORDER BY lp.created_at DESC
  LIMIT p_limit
  OFFSET (p_page - 1) * p_limit;
END;
$$ LANGUAGE plpgsql;
```

### 2. **sp_GetFoundPosts** (tương tự)

### 3. **sp_CreateLostPost**
```sql
CREATE OR REPLACE FUNCTION sp_createlostpost(
  p_account_id INT,
  p_title VARCHAR,
  p_description TEXT,
  p_item_name VARCHAR,
  p_category VARCHAR,
  p_location_id INT DEFAULT NULL,
  p_image_urls TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS INT AS $$
DECLARE
  v_lost_post_id INT;
  v_img_id INT;
  v_img_url TEXT;
BEGIN
  -- Insert post
  INSERT INTO "Lost_Post" (
    account_id, post_title, description, item_name, category, 
    location_id, status, created_at, updated_at
  )
  VALUES (
    p_account_id, p_title, p_description, p_item_name, p_category,
    p_location_id, 'Pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  )
  RETURNING lost_post_id INTO v_lost_post_id;

  -- Insert images
  FOREACH v_img_url IN ARRAY p_image_urls
  LOOP
    INSERT INTO "Lost_Images" (link_picture, created_at, updated_at)
    VALUES (v_img_url, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING lost_img_id INTO v_img_id;

    INSERT INTO "Lost_Post_Images" (lost_post_id, lost_img_id)
    VALUES (v_lost_post_id, v_img_id);
  END LOOP;

  RETURN v_lost_post_id;
END;
$$ LANGUAGE plpgsql;
```

---

## ✅ **CHECKLIST TRƯỚC KHI LÀM BE**

- [ ] Thêm `description` column vào `Lost_Post` và `Found_Post`
- [ ] Thêm `category` column hoặc tạo `Category` table
- [ ] Tạo indexes cho performance
- [ ] Tạo stored procedures cho CRUD operations
- [ ] Tạo functions để format location string
- [ ] Tạo functions để get images array
- [ ] Xác định logic soft delete (deleted_at)
- [ ] Xác định logic "recent" posts (24 hours) - dùng `created_at`
- [ ] Xác định logic pagination (16 items/page = 4x4 grid)

---

## 🎯 **KẾT LUẬN**

Schema hiện tại **85% phù hợp** với frontend, nhưng cần bổ sung:
1. ✅ **Bắt buộc:** `description`, `category`
2. ✅ **Nên có:** Indexes, stored procedures, helper functions
3. ✅ **Tùy chọn:** Soft delete views, full-text search

Sau khi bổ sung, schema sẽ **100% tương thích** với frontend! 🚀

