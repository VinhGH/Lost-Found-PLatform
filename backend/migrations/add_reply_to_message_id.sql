-- Add reply_to_message_id column to Message table
-- This allows messages to reference other messages for reply functionality

ALTER TABLE "Message" 
ADD COLUMN IF NOT EXISTS reply_to_message_id INTEGER;

-- Add foreign key constraint to ensure reply_to_message_id references a valid message
ALTER TABLE "Message"
ADD CONSTRAINT fk_reply_to_message
FOREIGN KEY (reply_to_message_id) 
REFERENCES "Message"(message_id)
ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_message_reply_to 
ON "Message"(reply_to_message_id);

-- Add comment for documentation
COMMENT ON COLUMN "Message".reply_to_message_id IS 'ID of the message being replied to (null if not a reply)';
