-- Add verification_code to products (unique code manufacturers print on packaging)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'verification_code') THEN
    ALTER TABLE products ADD COLUMN verification_code text UNIQUE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'description') THEN
    ALTER TABLE products ADD COLUMN description text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'registered_by') THEN
    ALTER TABLE products ADD COLUMN registered_by text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'image_url') THEN
    ALTER TABLE products ADD COLUMN image_url text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'region') THEN
    ALTER TABLE reports ADD COLUMN region text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scans' AND column_name = 'product_id') THEN
    ALTER TABLE scans ADD COLUMN product_id uuid;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_verification_code ON products(verification_code);
CREATE INDEX IF NOT EXISTS idx_scans_product_id ON scans(product_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

-- Seed sample products (product_name is the NOT NULL column, name is the alias)
INSERT INTO products (product_name, name, brand, category, batch_number, manufacture_date, expiry_date, fda_approved, country_of_origin, barcode, verification_code, registered_by)
SELECT 'Paracetamol 500mg', 'Paracetamol 500mg', 'Kinapharma', 'Medicine', 'KNP-2024-A1', '2024-01-15', '2026-01-14', true, 'Ghana', '6001234567890', 'VGH-KINA-5001-PCMX', 'Kinapharma Ltd'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '6001234567890');

INSERT INTO products (product_name, name, brand, category, batch_number, manufacture_date, expiry_date, fda_approved, country_of_origin, barcode, verification_code, registered_by)
SELECT 'Cowbell Milk', 'Cowbell Milk', 'Promasidor', 'Food & Drink', 'PMD-2025-B3', '2025-03-01', '2027-02-28', true, 'Nigeria', '6009876543210', 'VGH-PROM-5002-CWBL', 'Promasidor Ghana'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '6009876543210');

INSERT INTO products (product_name, name, brand, category, batch_number, manufacture_date, expiry_date, fda_approved, country_of_origin, barcode, verification_code, registered_by)
SELECT 'Pura Spray', 'Pura Spray', 'Pura Ltd', 'Agro-input', 'PUR-2025-C7', '2025-06-01', '2027-05-31', true, 'Ghana', '6005555555555', 'VGH-PURA-5003-SPRY', 'Pura Agrochemicals Ltd'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '6005555555555');
