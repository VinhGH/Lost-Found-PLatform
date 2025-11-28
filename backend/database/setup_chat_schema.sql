-- ================================================
-- 💬 Chat Module - PostgreSQL Schema
-- Version: 1.0
-- Description: Schema for Chat/Messaging feature
-- ================================================

-- ===========================
-- Drop tables if exist (for rebuild)
-- ===========================
DROP TABLE IF EXISTS "Message" CASCADE;
DROP TABLE IF EXISTS "ConversationParticipant" CASCADE;
DROP TABLE IF EXISTS "Conversation" CASCADE;

-- ===========================
-- TABLE: Conversation
-- Lưu thông tin cuộc hội thoại giữa các user
-- Mỗi conversation được tạo từ 1 match
-- ===========================
CREATE TABLE "Conversation" (
  conversation_id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key to Match_Post table
  CONSTRAINT fk_conversation_match 
    FOREIGN KEY (match_id) 
    REFERENCES "Match_Post"(match_id) 
    ON DELETE CASCADE
);

-- Index for faster lookup
CREATE INDEX idx_conversation_match_id ON "Conversation"(match_id);
CREATE INDEX idx_conversation_created_at ON "Conversation"(created_at DESC);

-- ===========================
-- TABLE: ConversationParticipant
-- Lưu thông tin người tham gia cuộc hội thoại
-- Many-to-Many relationship giữa Conversation và Account
-- ===========================
CREATE TABLE "ConversationParticipant" (
  participant_id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL,
  account_id INTEGER NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_read_at TIMESTAMP,
  
  -- Foreign keys
  CONSTRAINT fk_participant_conversation 
    FOREIGN KEY (conversation_id) 
    REFERENCES "Conversation"(conversation_id) 
    ON DELETE CASCADE,
    
  CONSTRAINT fk_participant_account 
    FOREIGN KEY (account_id) 
    REFERENCES "Account"(account_id) 
    ON DELETE CASCADE,
    
  -- Unique constraint: Mỗi user chỉ tham gia 1 lần trong 1 conversation
  CONSTRAINT unique_participant 
    UNIQUE (conversation_id, account_id)
);

-- Indexes for faster lookup
CREATE INDEX idx_participant_conversation_id ON "ConversationParticipant"(conversation_id);
CREATE INDEX idx_participant_account_id ON "ConversationParticipant"(account_id);

-- ===========================
-- TABLE: Message
-- Lưu tin nhắn trong cuộc hội thoại
-- ===========================
CREATE TABLE "Message" (
  message_id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  
  -- Foreign keys
  CONSTRAINT fk_message_conversation 
    FOREIGN KEY (conversation_id) 
    REFERENCES "Conversation"(conversation_id) 
    ON DELETE CASCADE,
    
  CONSTRAINT fk_message_sender 
    FOREIGN KEY (sender_id) 
    REFERENCES "Account"(account_id) 
    ON DELETE CASCADE,
    
  -- Check constraints
  CONSTRAINT check_message_not_empty 
    CHECK (LENGTH(TRIM(message)) > 0),
    
  CONSTRAINT check_message_length 
    CHECK (LENGTH(message) <= 5000)
);

-- Indexes for faster lookup
CREATE INDEX idx_message_conversation_id ON "Message"(conversation_id);
CREATE INDEX idx_message_sender_id ON "Message"(sender_id);
CREATE INDEX idx_message_created_at ON "Message"(created_at DESC);
CREATE INDEX idx_message_is_read ON "Message"(is_read);

-- ===========================
-- Triggers for updated_at
-- ===========================

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for Conversation table
CREATE TRIGGER update_conversation_updated_at
  BEFORE UPDATE ON "Conversation"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for Message table
CREATE TRIGGER update_message_updated_at
  BEFORE UPDATE ON "Message"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================
-- Comments for documentation
-- ===========================
COMMENT ON TABLE "Conversation" IS 'Lưu thông tin cuộc hội thoại giữa các user, được tạo từ match';
COMMENT ON TABLE "ConversationParticipant" IS 'Lưu thông tin người tham gia cuộc hội thoại';
COMMENT ON TABLE "Message" IS 'Lưu tin nhắn trong cuộc hội thoại';

COMMENT ON COLUMN "Conversation".match_id IS 'ID của match tạo ra conversation này';
COMMENT ON COLUMN "ConversationParticipant".last_read_at IS 'Thời điểm user đọc tin nhắn gần nhất';
COMMENT ON COLUMN "Message".is_read IS 'Đánh dấu tin nhắn đã được đọc hay chưa';
COMMENT ON COLUMN "Message".deleted_at IS 'Soft delete - tin nhắn đã bị xóa';

-- ===========================
-- Sample Data (Optional)
-- ===========================
-- Uncomment below to insert sample data for testing

/*
-- Sample: Create conversation from match_id = 1
INSERT INTO "Conversation" (match_id) VALUES (1);

-- Sample: Add participants to conversation
-- Assuming account_id 1 and 2 exist
INSERT INTO "ConversationParticipant" (conversation_id, account_id) 
VALUES 
  (1, 1),
  (1, 2);

-- Sample: Send messages
INSERT INTO "Message" (conversation_id, sender_id, message) 
VALUES 
  (1, 1, 'Xin chào, tôi nghĩ đây là đồ của bạn!'),
  (1, 2, 'Cảm ơn bạn rất nhiều! Tôi có thể đến lấy ở đâu?'),
  (1, 1, 'Bạn có thể đến thư viện DTU vào 2h chiều nay nhé!');
*/

-- ===========================
-- Permissions (Optional)
-- ===========================
-- Grant permissions to your database user
-- GRANT ALL PRIVILEGES ON TABLE "Conversation" TO your_db_user;
-- GRANT ALL PRIVILEGES ON TABLE "ConversationParticipant" TO your_db_user;
-- GRANT ALL PRIVILEGES ON TABLE "Message" TO your_db_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_db_user;

-- ===========================
-- Success message
-- ===========================
DO $$
BEGIN
  RAISE NOTICE '✅ Chat schema created successfully!';
  RAISE NOTICE '📋 Tables created:';
  RAISE NOTICE '   - Conversation';
  RAISE NOTICE '   - ConversationParticipant';
  RAISE NOTICE '   - Message';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Next steps:';
  RAISE NOTICE '   1. Verify tables: SELECT * FROM "Conversation";';
  RAISE NOTICE '   2. Test backend API: POST /api/chat/conversations';
  RAISE NOTICE '   3. Check permissions if needed';
END $$;

