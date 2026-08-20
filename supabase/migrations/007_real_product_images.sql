-- Real product image metadata — no stock URLs as catalog truth

ALTER TABLE products ADD COLUMN IF NOT EXISTS image_source_type TEXT DEFAULT 'UNKNOWN';
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_owner_id UUID;

COMMENT ON COLUMN products.image_source_type IS
  'TAILOR_UPLOAD | CUSTOMER_UPLOAD | AI_GENERATED | SYSTEM_ASSET | THREE_D_RENDER | UNKNOWN';

-- Unpublish any products still pointing at known stock hosts
UPDATE products
SET
  published = FALSE,
  available = FALSE,
  image_url = NULL,
  image_source_type = 'BLOCKED_STOCK',
  updated_at = NOW()
WHERE image_url IS NOT NULL
  AND (
    image_url ILIKE '%unsplash.com%'
    OR image_url ILIKE '%pexels.com%'
    OR image_url ILIKE '%loremflickr.com%'
    OR image_url ILIKE '%placehold%'
    OR image_url ILIKE '%picsum.photos%'
  );

-- Ensure product_images has source metadata when table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'product_images'
  ) THEN
    ALTER TABLE product_images ADD COLUMN IF NOT EXISTS image_source_type TEXT DEFAULT 'TAILOR_UPLOAD';
    ALTER TABLE product_images ADD COLUMN IF NOT EXISTS alt_text TEXT;
    ALTER TABLE product_images ADD COLUMN IF NOT EXISTS public_url TEXT;
  END IF;
END $$;
