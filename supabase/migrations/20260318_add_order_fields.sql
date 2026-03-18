-- Add missing order fields for better tracking
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS subtotal_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash';

-- Update existing orders to have consistent data
UPDATE public.orders SET 
  total_amount = total,
  subtotal_amount = total,
  discount_amount = 0,
  payment_method = 'cash'
WHERE total_amount IS NULL;
