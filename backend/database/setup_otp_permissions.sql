-- ================================================
-- Setup Permissions for otp_verifications table
-- Run this in Supabase SQL Editor AFTER creating the table
-- ================================================

-- Grant all privileges on otp_verifications table
GRANT ALL ON TABLE otp_verifications TO authenticated;
GRANT ALL ON TABLE otp_verifications TO anon;
GRANT ALL ON TABLE otp_verifications TO service_role;

-- Disable RLS for development (OPTIONAL - enable for production)
ALTER TABLE otp_verifications DISABLE ROW LEVEL SECURITY;

-- If you want to keep RLS enabled, create policies instead:
/*
CREATE POLICY "Allow all operations for service role"
ON otp_verifications
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow insert for anon users"
ON otp_verifications
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow select for anon users"
ON otp_verifications
FOR SELECT
TO anon
USING (true);
*/

