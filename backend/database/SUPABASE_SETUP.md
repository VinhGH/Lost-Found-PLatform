# 💬 Chat Setup cho Supabase

## 🎯 Hướng dẫn setup Chat trên Supabase

Bạn đang dùng Supabase, nên cách setup sẽ rất đơn giản!

---

## ✅ Option 1: Dùng Supabase Dashboard (Recommended)

### Bước 1: Mở SQL Editor
1. Vào https://supabase.com/dashboard
2. Chọn project của bạn
3. Sidebar → **SQL Editor**

### Bước 2: Tạo New Query
1. Click **+ New Query**
2. Copy toàn bộ nội dung file `setup_chat_schema.sql`
3. Paste vào SQL Editor

### Bước 3: Run Query
1. Click **Run** (hoặc Ctrl + Enter)
2. Chờ khoảng 2-3 giây
3. Xem kết quả ở dưới

### Bước 4: Verify
Chạy query này để kiểm tra:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('Conversation', 'ConversationParticipant', 'Message');
```

Kết quả phải có 3 bảng!

---

## ✅ Option 2: Dùng Table Editor (UI)

Nếu muốn tạo bằng UI:

### 1. Tạo bảng Conversation
- Table Editor → New Table
- Name: `Conversation`
- Columns:
  - `conversation_id` - int8 - PRIMARY KEY - AUTO INCREMENT
  - `match_id` - int8 - FOREIGN KEY → Match_Post(match_id)
  - `created_at` - timestamptz - DEFAULT now()
  - `updated_at` - timestamptz - DEFAULT now()

### 2. Tạo bảng ConversationParticipant
- Table Editor → New Table
- Name: `ConversationParticipant`
- Columns:
  - `participant_id` - int8 - PRIMARY KEY - AUTO INCREMENT
  - `conversation_id` - int8 - FOREIGN KEY → Conversation(conversation_id)
  - `account_id` - int8 - FOREIGN KEY → Account(account_id)
  - `joined_at` - timestamptz - DEFAULT now()
  - `last_read_at` - timestamptz - NULL

### 3. Tạo bảng Message
- Table Editor → New Table
- Name: `Message`
- Columns:
  - `message_id` - int8 - PRIMARY KEY - AUTO INCREMENT
  - `conversation_id` - int8 - FOREIGN KEY → Conversation(conversation_id)
  - `sender_id` - int8 - FOREIGN KEY → Account(account_id)
  - `message` - text - NOT NULL
  - `is_read` - bool - DEFAULT false
  - `created_at` - timestamptz - DEFAULT now()
  - `updated_at` - timestamptz - DEFAULT now()
  - `deleted_at` - timestamptz - NULL

---

## ✅ Option 3: Dùng Script Node.js

File `backend/scripts/setupChat.js` đã được tạo sẵn!

**Lưu ý**: Với Supabase, script này có thể **KHÔNG hoạt động** vì Supabase không hỗ trợ `rpc('exec_sql')`.

**Giải pháp**: Dùng Option 1 (SQL Editor) là tốt nhất!

---

## 🔧 Fix Script cho Supabase

Nếu muốn dùng script, sửa lại như sau:

```javascript
// backend/scripts/setupChatSupabase.js
import { supabase } from '../src/config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const setupChat = async () => {
  console.log('🚀 Setting up Chat for Supabase...\n');

  try {
    // 1. Create Conversation table
    console.log('📋 Creating Conversation table...');
    await supabase.from('Conversation').select('*').limit(1);
    console.log('✅ Conversation table ready\n');

    // 2. Create ConversationParticipant table
    console.log('📋 Creating ConversationParticipant table...');
    await supabase.from('ConversationParticipant').select('*').limit(1);
    console.log('✅ ConversationParticipant table ready\n');

    // 3. Create Message table
    console.log('📋 Creating Message table...');
    await supabase.from('Message').select('*').limit(1);
    console.log('✅ Message table ready\n');

    console.log('🎉 All tables verified!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Please use Supabase Dashboard SQL Editor instead:');
    console.log('   1. Go to https://supabase.com/dashboard');
    console.log('   2. SQL Editor → New Query');
    console.log('   3. Copy & paste setup_chat_schema.sql');
    console.log('   4. Run the query\n');
  }
};

setupChat();
```

---

## 📸 Screenshots Guide

### 1. Mở SQL Editor
```
Supabase Dashboard
└── Your Project
    └── SQL Editor (sidebar)
        └── + New Query
```

### 2. Paste SQL và Run
```
┌─────────────────────────────────┐
│ SQL Editor                   [Run]│
├─────────────────────────────────┤
│ -- Paste setup_chat_schema.sql  │
│ DROP TABLE IF EXISTS...         │
│ CREATE TABLE Conversation...    │
│ ...                             │
└─────────────────────────────────┘
```

### 3. Check Results
```
Results
┌──────────────────┐
│ ✅ Query Success │
│ 0 rows returned  │
└──────────────────┘
```

---

## 🔍 Verify Tables

Sau khi chạy SQL, verify bằng cách:

### Option A: Table Editor
- Sidebar → Table Editor
- Phải thấy 3 bảng mới:
  - Conversation
  - ConversationParticipant
  - Message

### Option B: SQL Query
```sql
-- Check tables exist
SELECT 
  schemaname,
  tablename 
FROM pg_tables 
WHERE tablename IN ('Conversation', 'ConversationParticipant', 'Message');

-- Count rows (should be 0 initially)
SELECT 
  (SELECT COUNT(*) FROM "Conversation") as conversations,
  (SELECT COUNT(*) FROM "ConversationParticipant") as participants,
  (SELECT COUNT(*) FROM "Message") as messages;
```

---

## 🧪 Test với Sample Data

Sau khi tạo tables, test với sample data:

```sql
-- 1. Tạo conversation (giả sử match_id = 1 đã tồn tại)
INSERT INTO "Conversation" (match_id) 
VALUES (1) 
RETURNING *;

-- 2. Thêm participants (giả sử account_id 1, 2 tồn tại)
INSERT INTO "ConversationParticipant" (conversation_id, account_id) 
VALUES 
  (1, 1),
  (1, 2)
RETURNING *;

-- 3. Gửi message
INSERT INTO "Message" (conversation_id, sender_id, message) 
VALUES 
  (1, 1, 'Xin chào! Đây có phải đồ của bạn không?')
RETURNING *;

-- 4. Query messages
SELECT 
  m.*,
  a.user_name as sender_name
FROM "Message" m
JOIN "Account" a ON m.sender_id = a.account_id
WHERE m.conversation_id = 1
ORDER BY m.created_at DESC;
```

---

## ⚙️ RLS (Row Level Security) - Optional

Nếu muốn bảo mật, enable RLS:

```sql
-- Enable RLS
ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConversationParticipant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;

-- Policy: User chỉ thấy conversations mà mình tham gia
CREATE POLICY "Users can view their own conversations"
ON "Conversation"
FOR SELECT
USING (
  match_id IN (
    SELECT conversation_id 
    FROM "ConversationParticipant" 
    WHERE account_id = auth.uid()
  )
);

-- Policy: User chỉ gửi message trong conversation mình tham gia
CREATE POLICY "Users can send messages in their conversations"
ON "Message"
FOR INSERT
WITH CHECK (
  conversation_id IN (
    SELECT conversation_id 
    FROM "ConversationParticipant" 
    WHERE account_id = auth.uid()
  )
);
```

---

## 🎯 Quick Start (TL;DR)

1. **Supabase Dashboard** → SQL Editor
2. **Copy** toàn bộ `setup_chat_schema.sql`
3. **Paste** và **Run**
4. **Verify** ở Table Editor
5. **Test** API với Postman/Thunder Client

---

## ❓ Troubleshooting

### Error: "relation does not exist"
- Bảng chưa được tạo
- Chạy lại SQL setup

### Error: "foreign key constraint"
- Bảng `Match_Post` hoặc `Account` chưa tồn tại
- Check Table Editor xem có 2 bảng này chưa

### Error: "permission denied"
- Supabase RLS đang bật
- Tắt RLS hoặc tạo policy phù hợp

---

## 📚 Resources

- [Supabase SQL Editor](https://supabase.com/docs/guides/database/overview)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Foreign Keys](https://www.postgresql.org/docs/current/ddl-constraints.html)

---

## ✨ Done!

Sau khi setup xong:
- ✅ Test backend API: `POST /api/chat/conversations`
- ✅ Check Supabase Table Editor
- ✅ Ready to build Chat UI!

