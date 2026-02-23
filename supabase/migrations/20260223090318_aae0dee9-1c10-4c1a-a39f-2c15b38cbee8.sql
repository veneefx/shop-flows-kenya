
-- Add video ad URL for featured products and adult flag
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_adult boolean DEFAULT false;
