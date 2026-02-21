
-- Add unique constraint on shops.user_id to prevent duplicate shops per user
-- First ensure only one shop per user exists (already cleaned up via data fix)
ALTER TABLE public.shops ADD CONSTRAINT shops_user_id_unique UNIQUE (user_id);
