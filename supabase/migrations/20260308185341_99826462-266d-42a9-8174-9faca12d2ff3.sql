ALTER TABLE public.shops 
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS privacy_policy text,
  ADD COLUMN IF NOT EXISTS terms_of_service text,
  ADD COLUMN IF NOT EXISTS refund_policy text;