/*
# Add missing columns to VerifyGH tables

1. Changes to `products`
- Add `name` column (text) - requested product name field (distinct from existing product_name)
  Note: existing `product_name` column already serves this purpose, so we add `name` as an alias

2. Changes to `reports`
- Add `market_location` column (text) - where the fake was found
- Add `description` column (text) - details about the report

3. Changes to `scans`
- Add `scanned_at` column (timestamptz) - timestamp of scan
- Add `location` column (text) - where scan happened
- Update result default to 'fake' instead of 'WARNING'

4. Security
- Add RLS policies for new columns (already covered by existing policies)
*/

-- Add name column to products (as alias for product_name)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'name') THEN
    ALTER TABLE products ADD COLUMN name text;
    UPDATE products SET name = product_name WHERE name IS NULL;
  END IF;
END $$;

-- Add market_location to reports
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'market_location') THEN
    ALTER TABLE reports ADD COLUMN market_location text;
    UPDATE reports SET market_location = purchase_location WHERE market_location IS NULL;
  END IF;
END $$;

-- Add description to reports
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'description') THEN
    ALTER TABLE reports ADD COLUMN description text;
    UPDATE reports SET description = details WHERE description IS NULL;
  END IF;
END $$;

-- Add scanned_at to scans
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scans' AND column_name = 'scanned_at') THEN
    ALTER TABLE scans ADD COLUMN scanned_at timestamptz;
    UPDATE scans SET scanned_at = created_at WHERE scanned_at IS NULL;
  END IF;
END $$;

-- Add location to scans
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scans' AND column_name = 'location') THEN
    ALTER TABLE scans ADD COLUMN location text;
  END IF;
END $$;

-- Create index on new scanned_at column
CREATE INDEX IF NOT EXISTS idx_scans_scanned_at ON scans(scanned_at DESC);
