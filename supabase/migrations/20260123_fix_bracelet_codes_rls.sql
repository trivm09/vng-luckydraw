-- Fix overly permissive RLS policy for bracelet_codes
-- This migration restricts UPDATE access to be more secure

-- Drop the insecure policy that allows anyone to update
DROP POLICY IF EXISTS "Anyone can update bracelet_codes" ON bracelet_codes;

-- Option 1: Only allow activating codes (changing is_activated from false to true)
-- This is needed for the public registration form
CREATE POLICY "Anyone can activate unused bracelet_codes" ON bracelet_codes
  FOR UPDATE
  USING (is_activated = false)  -- Can only update codes that are not yet activated
  WITH CHECK (
    is_activated = true AND      -- Can only set to activated
    activated_at IS NOT NULL     -- Must set activation timestamp
  );

-- Note: The "Authenticated full access bracelet_codes" policy still allows
-- admins to have full control over bracelet codes (insert, update, delete).
-- This is defined as:
-- CREATE POLICY "Authenticated full access bracelet_codes" ON bracelet_codes
--   FOR ALL USING (auth.role() = 'authenticated');

-- Add a comment for documentation
COMMENT ON POLICY "Anyone can activate unused bracelet_codes" ON bracelet_codes IS
'Allows public registration form to activate bracelet codes. Only allows changing is_activated from false to true with a timestamp.';
