-- ================================================
-- Complete Setup for OTP Verifications
-- Run this ENTIRE script in Supabase SQL Editor
-- ================================================

-- Step 1: Create the table
CREATE TABLE IF NOT EXISTS otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_verifications(email);
CREATE INDEX IF NOT EXISTS idx_otp_code ON otp_verifications(otp_code);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_is_used ON otp_verifications(is_used);

-- Step 3: Grant permissions
GRANT ALL ON TABLE otp_verifications TO authenticated;
GRANT ALL ON TABLE otp_verifications TO anon;
GRANT ALL ON TABLE otp_verifications TO service_role;

-- Step 4: Disable RLS for development (enable for production)
ALTER TABLE otp_verifications DISABLE ROW LEVEL SECURITY;

-- Step 5: Add comments
COMMENT ON TABLE otp_verifications IS 'Stores OTP codes for email verification during registration';
COMMENT ON COLUMN otp_verifications.payload IS 'JSON payload containing registration data (e.g., password)';
COMMENT ON COLUMN otp_verifications.expires_at IS 'OTP expiration timestamp (typically 5 minutes from creation)';

-- Verify the table was created
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'otp_verifications'
ORDER BY ordinal_position;

