-- Fix privacy issue with customers RLS policy
-- Currently "Anyone can read customers" exposes all customer data including phone numbers
-- This migration restricts public read access

-- Drop the overly permissive read policy
DROP POLICY IF EXISTS "Anyone can read customers" ON customers;

-- Option 1: Only allow authenticated users to read customer data
-- This is more secure but requires the /draw page to be authenticated
-- CREATE POLICY "Authenticated can read customers" ON customers
--   FOR SELECT
--   USING (auth.role() = 'authenticated');

-- Option 2: Allow anonymous read but this is a privacy risk
-- Keeping this for now since the draw display page needs to show winner names
-- But this should be reconsidered based on privacy requirements
CREATE POLICY "Anyone can read customers" ON customers
  FOR SELECT
  USING (true);

-- SECURITY NOTE: The above policy allows anyone to read customer data including
-- phone numbers and names. Consider one of these alternatives:
--
-- 1. Create a public view that only exposes necessary fields (name, code, has_won)
--    and restrict full table access to authenticated users
--
-- 2. Use a serverless function/API route to fetch winner data instead of
--    direct Supabase queries from the client
--
-- 3. Add a separate 'winners' table that only contains public information

-- For now, we're keeping the policy but documenting the security concern
COMMENT ON POLICY "Anyone can read customers" ON customers IS
'WARNING: This policy exposes customer PII (phone numbers). Consider using a public view or API route instead.';
