-- ================================================
-- Setup Permissions for Supabase
-- Run this in Supabase SQL Editor
-- ================================================

-- Grant all privileges on all tables to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Grant all privileges on all sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Specific grants for Account table
GRANT ALL ON TABLE "Account" TO authenticated;
GRANT ALL ON TABLE "Account" TO anon;
GRANT ALL ON TABLE "Account" TO service_role;

-- Specific grants for other tables
GRANT ALL ON TABLE "Location" TO authenticated, anon, service_role;
GRANT ALL ON TABLE "Post" TO authenticated, anon, service_role;
GRANT ALL ON TABLE "Images" TO authenticated, anon, service_role;
GRANT ALL ON TABLE "Post_Images" TO authenticated, anon, service_role;
GRANT ALL ON TABLE "Match_Post" TO authenticated, anon, service_role;
GRANT ALL ON TABLE "Notification" TO authenticated, anon, service_role;

-- Disable RLS for development (OPTIONAL - enable for production)
ALTER TABLE "Account" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Location" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Post" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Images" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Post_Images" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Match_Post" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" DISABLE ROW LEVEL SECURITY;

-- If you want to keep RLS enabled, create policies instead:
-- Example policy for Account table:
/*
CREATE POLICY "Allow all operations for service role"
ON "Account"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow read for authenticated users"
ON "Account"
FOR SELECT
TO authenticated
USING (true);
*/

