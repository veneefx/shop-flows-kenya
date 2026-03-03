
-- Promotions table for discount rules, bundles, flash sales, coupons
CREATE TABLE public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'discount', -- discount, bundle, flash_sale, coupon
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT DEFAULT 'percentage', -- percentage, fixed
  discount_value NUMERIC NOT NULL DEFAULT 0,
  min_order_amount NUMERIC DEFAULT 0,
  max_uses INTEGER DEFAULT NULL,
  used_count INTEGER NOT NULL DEFAULT 0,
  coupon_code TEXT,
  product_ids UUID[] DEFAULT '{}',
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can manage promotions"
ON public.promotions FOR ALL
USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = promotions.shop_id AND shops.user_id = auth.uid()));

CREATE POLICY "Admins can manage all promotions"
ON public.promotions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view active promotions"
ON public.promotions FOR SELECT
USING (is_active = true AND (ends_at IS NULL OR ends_at > now()));

CREATE TRIGGER update_promotions_updated_at
BEFORE UPDATE ON public.promotions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add unique index on coupon codes per shop
CREATE UNIQUE INDEX idx_promotions_coupon_code ON public.promotions(shop_id, coupon_code) WHERE coupon_code IS NOT NULL;
