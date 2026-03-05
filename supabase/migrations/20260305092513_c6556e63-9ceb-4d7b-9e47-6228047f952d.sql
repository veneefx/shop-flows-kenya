-- Receipt branding columns on shops
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS receipt_intro_text text DEFAULT 'Quality You Can Trust';
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS receipt_slogan text DEFAULT 'Your Trusted Neighborhood Store';
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS receipt_thank_you text DEFAULT 'THANK YOU FOR SHOPPING WITH US';
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS receipt_paybill text;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS receipt_paybill_account text;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS receipt_till text;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS receipt_show_paybill boolean DEFAULT true;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS receipt_show_till boolean DEFAULT false;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS receipt_show_qr boolean DEFAULT false;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS receipt_qr_url text;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS receipt_logo_url text;

-- Activity logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  actor_user_id uuid,
  event_type text NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  message text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'activity_logs' AND policyname = 'Admins can manage all activity logs'
  ) THEN
    CREATE POLICY "Admins can manage all activity logs"
      ON public.activity_logs
      FOR ALL
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'activity_logs' AND policyname = 'Shop owners can view activity logs'
  ) THEN
    CREATE POLICY "Shop owners can view activity logs"
      ON public.activity_logs
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.shops s
          WHERE s.id = activity_logs.shop_id
            AND s.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'activity_logs' AND policyname = 'Shop owners can insert activity logs'
  ) THEN
    CREATE POLICY "Shop owners can insert activity logs"
      ON public.activity_logs
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.shops s
          WHERE s.id = activity_logs.shop_id
            AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_activity_logs_shop_created_at ON public.activity_logs(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_event_type ON public.activity_logs(event_type);

-- Order activity trigger
CREATE OR REPLACE FUNCTION public.log_order_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (shop_id, actor_user_id, event_type, action, entity_type, entity_id, message, metadata)
    VALUES (
      NEW.shop_id,
      auth.uid(),
      'order',
      'created',
      'order',
      NEW.id::text,
      'New order created: ' || NEW.customer_phone,
      jsonb_build_object('status', NEW.status, 'total', NEW.total)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO public.activity_logs (shop_id, actor_user_id, event_type, action, entity_type, entity_id, message, metadata)
      VALUES (
        NEW.shop_id,
        auth.uid(),
        'order',
        'status_changed',
        'order',
        NEW.id::text,
        'Order status changed from ' || COALESCE(OLD.status, 'unknown') || ' to ' || COALESCE(NEW.status, 'unknown'),
        jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
      );
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_activity ON public.orders;
CREATE TRIGGER trg_orders_activity
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.log_order_activity();

-- Product activity trigger (includes stock changes)
CREATE OR REPLACE FUNCTION public.log_product_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (shop_id, actor_user_id, event_type, action, entity_type, entity_id, message, metadata)
    VALUES (
      NEW.shop_id,
      auth.uid(),
      'product',
      'created',
      'product',
      NEW.id::text,
      'Product created: ' || NEW.name,
      jsonb_build_object('name', NEW.name, 'stock', NEW.stock, 'price', NEW.price)
    );

  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.stock IS DISTINCT FROM OLD.stock THEN
      INSERT INTO public.activity_logs (shop_id, actor_user_id, event_type, action, entity_type, entity_id, message, metadata)
      VALUES (
        NEW.shop_id,
        auth.uid(),
        'inventory',
        'stock_adjusted',
        'product',
        NEW.id::text,
        'Stock updated for ' || NEW.name || ': ' || OLD.stock || ' → ' || NEW.stock,
        jsonb_build_object('name', NEW.name, 'old_stock', OLD.stock, 'new_stock', NEW.stock)
      );
    ELSE
      INSERT INTO public.activity_logs (shop_id, actor_user_id, event_type, action, entity_type, entity_id, message, metadata)
      VALUES (
        NEW.shop_id,
        auth.uid(),
        'product',
        'updated',
        'product',
        NEW.id::text,
        'Product updated: ' || NEW.name,
        jsonb_build_object('name', NEW.name)
      );
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.activity_logs (shop_id, actor_user_id, event_type, action, entity_type, entity_id, message, metadata)
    VALUES (
      OLD.shop_id,
      auth.uid(),
      'product',
      'deleted',
      'product',
      OLD.id::text,
      'Product deleted: ' || OLD.name,
      jsonb_build_object('name', OLD.name)
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_products_activity ON public.products;
CREATE TRIGGER trg_products_activity
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.log_product_activity();