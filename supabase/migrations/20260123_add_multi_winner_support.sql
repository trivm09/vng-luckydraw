-- Add multi-winner support to draw_settings table
-- This migration adds fields to support drawing 1-10 winners simultaneously

-- Add new columns to draw_settings table
ALTER TABLE draw_settings
ADD COLUMN IF NOT EXISTS draw_mode INTEGER DEFAULT 1 CHECK (draw_mode >= 1 AND draw_mode <= 10),
ADD COLUMN IF NOT EXISTS winning_codes TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS winning_names TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS winning_count INTEGER DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN draw_settings.draw_mode IS 'Number of winners to draw: 1-10';
COMMENT ON COLUMN draw_settings.winning_codes IS 'Array of winning bracelet codes';
COMMENT ON COLUMN draw_settings.winning_names IS 'Array of winning customer names';
COMMENT ON COLUMN draw_settings.winning_count IS 'Actual number of winners drawn';

-- Migrate existing single winner data (if any exists)
UPDATE draw_settings
SET
  winning_codes = CASE
    WHEN winning_code IS NOT NULL AND winning_code != '' THEN ARRAY[winning_code]
    ELSE '{}'
  END,
  winning_names = CASE
    WHEN winning_name IS NOT NULL AND winning_name != '' THEN ARRAY[winning_name]
    ELSE '{}'
  END,
  winning_count = CASE
    WHEN winning_code IS NOT NULL AND winning_code != '' THEN 1
    ELSE 0
  END
WHERE winning_code IS NOT NULL OR winning_name IS NOT NULL;

-- Add index on customers.has_won for faster eligible customer queries
CREATE INDEX IF NOT EXISTS idx_customers_has_won ON customers(has_won) WHERE has_won = false;

-- Note: Keeping old winning_code and winning_name columns for backward compatibility
-- They will be populated with the first winner's data
