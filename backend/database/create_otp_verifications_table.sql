-- Create otp_verifications table for OTP email verification
-- This table stores OTP codes sent via email for account registration

CREATE TABLE IF NOT EXISTS otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index for faster lookups
    CONSTRAINT unique_active_otp UNIQUE NULLS NOT DISTINCT (email, otp_code, is_used)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_verifications(email);
CREATE INDEX IF NOT EXISTS idx_otp_code ON otp_verifications(otp_code);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_is_used ON otp_verifications(is_used);

-- Add comment
COMMENT ON TABLE otp_verifications IS 'Stores OTP codes for email verification during registration';
COMMENT ON COLUMN otp_verifications.payload IS 'JSON payload containing registration data (e.g., password)';
COMMENT ON COLUMN otp_verifications.expires_at IS 'OTP expiration timestamp (typically 5 minutes from creation)';

