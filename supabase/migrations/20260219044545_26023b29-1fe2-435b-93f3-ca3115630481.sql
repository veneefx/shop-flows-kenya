
-- Fix: Orders public insert - restrict to only what's needed
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
CREATE POLICY "Public can insert orders" ON public.orders 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND is_active = true)
  );

-- Fix: Service can insert transactions - restrict to authenticated or valid shop context
DROP POLICY IF EXISTS "Service can insert transactions" ON public.transactions;
CREATE POLICY "Service can insert transactions" ON public.transactions 
  FOR INSERT WITH CHECK (
    shop_id IS NOT NULL AND 
    EXISTS (SELECT 1 FROM public.shops WHERE id = shop_id AND is_active = true)
  );
