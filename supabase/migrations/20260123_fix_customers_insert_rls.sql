-- Fix overly permissive INSERT policy for customers table
-- This migration adds validation constraints to prevent abuse

-- Drop the insecure policy
DROP POLICY IF EXISTS "Anyone can register" ON customers;

-- Create a more restrictive INSERT policy with validation
CREATE POLICY "Anyone can register with validation" ON customers
  FOR INSERT
  WITH CHECK (
    -- Ensure required fields are not empty
    name IS NOT NULL AND
    LENGTH(TRIM(name)) > 0 AND
    LENGTH(TRIM(name)) <= 255 AND

    -- Validate phone number (Vietnamese format)
    phone IS NOT NULL AND
    phone ~ '^0[0-9]{9}$' AND  -- Must be 10 digits starting with 0

    -- Validate bracelet code
    bracelet_code IS NOT NULL AND
    LENGTH(TRIM(bracelet_code)) >= 6 AND
    LENGTH(TRIM(bracelet_code)) <= 50 AND

    -- Ensure has_existing_code is a boolean
    has_existing_code IS NOT NULL AND

    -- Prevent pre-setting winner status
    (has_won = false OR has_won IS NULL) AND
    prize_name IS NULL
  );

-- Add a function to validate bracelet code activation
-- This ensures the bracelet code exists and is not already activated
CREATE OR REPLACE FUNCTION validate_bracelet_code_for_registration()
RETURNS TRIGGER AS $$
BEGIN
  -- If user provided a bracelet code (has_existing_code = true)
  IF NEW.has_existing_code = true THEN
    -- Check if the code exists and is not activated
    IF NOT EXISTS (
      SELECT 1 FROM bracelet_codes
      WHERE code = NEW.bracelet_code
      AND is_activated = false
    ) THEN
      RAISE EXCEPTION 'Mã vòng tay không hợp lệ hoặc đã được sử dụng';
    END IF;
  ELSE
    -- If system-generated code, ensure it doesn't already exist
    IF EXISTS (
      SELECT 1 FROM customers WHERE bracelet_code = NEW.bracelet_code
    ) THEN
      RAISE EXCEPTION 'Mã số đã tồn tại, vui lòng thử lại';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to validate before insert
DROP TRIGGER IF EXISTS validate_bracelet_code_trigger ON customers;
CREATE TRIGGER validate_bracelet_code_trigger
  BEFORE INSERT ON customers
  FOR EACH ROW
  EXECUTE FUNCTION validate_bracelet_code_for_registration();

-- Add comments for documentation
COMMENT ON POLICY "Anyone can register with validation" ON customers IS
'Allows public registration with strict validation: valid name, Vietnamese phone format (10 digits), valid bracelet code, and prevents pre-setting winner status.';

COMMENT ON FUNCTION validate_bracelet_code_for_registration() IS
'Validates bracelet code before customer registration. Ensures existing codes are valid and unused, and generated codes are unique.';

-- Additional security: Add a unique index on phone to prevent duplicate registrations
-- This also helps prevent race conditions
CREATE UNIQUE INDEX IF NOT EXISTS customers_phone_idx ON customers(phone);

-- Add check constraints at database level for extra security
ALTER TABLE customers
  DROP CONSTRAINT IF EXISTS customers_name_not_empty,
  DROP CONSTRAINT IF EXISTS customers_phone_format,
  DROP CONSTRAINT IF EXISTS customers_bracelet_code_not_empty;

ALTER TABLE customers
  ADD CONSTRAINT customers_name_not_empty
    CHECK (LENGTH(TRIM(name)) > 0 AND LENGTH(TRIM(name)) <= 255),
  ADD CONSTRAINT customers_phone_format
    CHECK (phone ~ '^0[0-9]{9}$'),
  ADD CONSTRAINT customers_bracelet_code_not_empty
    CHECK (LENGTH(TRIM(bracelet_code)) >= 6 AND LENGTH(TRIM(bracelet_code)) <= 50);
