
-- Add variant fields to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS sizes text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS colors text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS brand text,
ADD COLUMN IF NOT EXISTS sku text,
ADD COLUMN IF NOT EXISTS weight text,
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
