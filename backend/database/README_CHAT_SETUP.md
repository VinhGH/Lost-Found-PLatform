# 💬 Chat Module Setup Guide

## Hướng dẫn cài đặt tính năng Chat

### 📋 Yêu cầu

- PostgreSQL database đã setup
- Đã có bảng `Match_Post` và `Account` (từ schema chính)
- pgAdmin hoặc psql CLI để chạy SQL

---

## 🚀 Cách cài đặt

### Option 1: Sử dụng pgAdmin (GUI)

1. **Mở pgAdmin** và kết nối đến database `lostandfound_db`

2. **Mở Query Tool**:
   - Right-click vào database → Query Tool

3. **Load file SQL**:
   - File → Open → Chọn `setup_chat_schema.sql`

4. **Execute** (F5 hoặc nút Execute/Refresh)

5. **Kiểm tra kết quả**:
   ```sql
   -- Kiểm tra các bảng đã được tạo
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('Conversation', 'ConversationParticipant', 'Message');
   ```

### Option 2: Sử dụng psql CLI

```bash
# Kết nối database
psql -U postgres -d lostandfound_db

# Chạy file SQL
\i backend/database/setup_chat_schema.sql

# Kiểm tra tables
\dt

# Exit
\q
```

### Option 3: Sử dụng Node.js script

Tạo file `backend/scripts/setupChat.js`:

```javascript
import { supabase } from '../src/config/db.js';
import fs from 'fs';

const setupChatSchema = async () => {
  try {
    const sql = fs.readFileSync('./database/setup_chat_schema.sql', 'utf8');
    
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('✅ Chat schema setup successfully!');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
};

setupChatSchema();
```

Chạy:
```bash
cd backend
node scripts/setupChat.js
```

---

## 📊 Database Schema

### Bảng `Conversation`
Lưu thông tin cuộc hội thoại giữa các user.

| Column | Type | Description |
|--------|------|-------------|
| conversation_id | SERIAL PRIMARY KEY | ID cuộc hội thoại |
| match_id | INTEGER | ID của match (FK to Match_Post) |
| created_at | TIMESTAMP | Thời gian tạo |
| updated_at | TIMESTAMP | Thời gian cập nhật |

### Bảng `ConversationParticipant`
Lưu người tham gia cuộc hội thoại.

| Column | Type | Description |
|--------|------|-------------|
| participant_id | SERIAL PRIMARY KEY | ID participant |
| conversation_id | INTEGER | ID cuộc hội thoại (FK) |
| account_id | INTEGER | ID user (FK to Account) |
| joined_at | TIMESTAMP | Thời gian tham gia |
| last_read_at | TIMESTAMP | Lần đọc tin nhắn gần nhất |

### Bảng `Message`
Lưu tin nhắn trong cuộc hội thoại.

| Column | Type | Description |
|--------|------|-------------|
| message_id | SERIAL PRIMARY KEY | ID tin nhắn |
| conversation_id | INTEGER | ID cuộc hội thoại (FK) |
| sender_id | INTEGER | ID người gửi (FK to Account) |
| message | TEXT | Nội dung tin nhắn |
| is_read | BOOLEAN | Đã đọc chưa |
| created_at | TIMESTAMP | Thời gian gửi |
| updated_at | TIMESTAMP | Thời gian cập nhật |
| deleted_at | TIMESTAMP | Thời gian xóa (soft delete) |

---

## 🧪 Test API

### 1. Tạo Conversation từ Match

```bash
POST /api/chat/conversations
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "match_id": 1
}
```

### 2. Lấy danh sách Conversations

```bash
GET /api/chat/conversations
Authorization: Bearer YOUR_TOKEN
```

### 3. Gửi Message

```bash
POST /api/chat/conversations/1/messages
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "message": "Xin chào! Đây có phải đồ của bạn không?"
}
```

### 4. Lấy Messages trong Conversation

```bash
GET /api/chat/conversations/1/messages
Authorization: Bearer YOUR_TOKEN
```

---

## 🔧 Troubleshooting

### Lỗi: Foreign key constraint fails

**Nguyên nhân**: Bảng `Match_Post` hoặc `Account` chưa tồn tại.

**Giải pháp**: Chạy schema chính trước:
```bash
psql -U postgres -d lostandfound_db -f backend/database/LostandFound_full_schema.sql
```

### Lỗi: Permission denied

**Nguyên nhân**: User không có quyền tạo bảng.

**Giải pháp**: 
```sql
GRANT ALL PRIVILEGES ON DATABASE lostandfound_db TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

### Lỗi: Table already exists

**Nguyên nhân**: Bảng đã tồn tại từ lần chạy trước.

**Giải pháp**: Script đã có DROP TABLE, chạy lại script là được.

---

## 📝 Sample Data (Optional)

Để test, bạn có thể insert sample data:

```sql
-- Tạo conversation từ match_id = 1
INSERT INTO "Conversation" (match_id) VALUES (1);

-- Thêm participants (giả sử account_id 1 và 2 tồn tại)
INSERT INTO "ConversationParticipant" (conversation_id, account_id) 
VALUES 
  (1, 1),
  (1, 2);

-- Gửi messages
INSERT INTO "Message" (conversation_id, sender_id, message) 
VALUES 
  (1, 1, 'Xin chào, tôi nghĩ đây là đồ của bạn!'),
  (1, 2, 'Cảm ơn bạn rất nhiều! Tôi có thể đến lấy ở đâu?'),
  (1, 1, 'Bạn có thể đến thư viện DTU vào 2h chiều nay nhé!');
```

---

## ✅ Verify Installation

Kiểm tra xem setup thành công chưa:

```sql
-- 1. Kiểm tra tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%onversation%' OR table_name = 'Message';

-- 2. Kiểm tra foreign keys
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('Conversation', 'ConversationParticipant', 'Message');

-- 3. Kiểm tra indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('Conversation', 'ConversationParticipant', 'Message');
```

---

## 🎯 Next Steps

Sau khi setup xong database:

1. ✅ **Test Backend API** - Dùng Postman/Thunder Client
2. ✅ **Tạo Frontend Chat UI** - Component để hiển thị chat
3. ✅ **Real-time Updates** - Có thể dùng Socket.IO hoặc polling
4. ✅ **Notifications** - Thông báo khi có tin nhắn mới

---

## 📚 Related Files

- **Schema**: `backend/database/setup_chat_schema.sql`
- **Controller**: `backend/src/modules/chat/chatController.js`
- **Model**: `backend/src/modules/chat/chatModel.js`
- **Routes**: `backend/src/modules/chat/chatRoutes.js`

---

## 🆘 Support

Nếu gặp vấn đề, check:
1. Backend logs: `console.log` trong `chatController.js`
2. Database logs: pgAdmin query history
3. Network logs: Browser DevTools → Network tab

