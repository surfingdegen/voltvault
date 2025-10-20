-- Add thumbnail column if it doesn't exist
ALTER TABLE videos ADD COLUMN IF NOT EXISTS thumbnail TEXT;

-- Remove display_order if not being used
-- (or we can keep it for future use)
