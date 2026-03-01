
-- Credit accounts table for tracking customer credit
CREATE TABLE public.credit_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  credit_limit numeric NOT NULL DEFAULT 0,
  balance numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can manage credit accounts"
  ON public.credit_accounts FOR ALL
  USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = credit_accounts.shop_id AND shops.user_id = auth.uid()));

CREATE POLICY "Admins can manage all credit accounts"
  ON public.credit_accounts FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Credit payments table
CREATE TABLE public.credit_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_account_id uuid NOT NULL REFERENCES public.credit_accounts(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  method text NOT NULL DEFAULT 'cash',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can manage credit payments"
  ON public.credit_payments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM credit_accounts ca
    JOIN shops s ON s.id = ca.shop_id
    WHERE ca.id = credit_payments.credit_account_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all credit payments"
  ON public.credit_payments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_credit_accounts_updated_at
  BEFORE UPDATE ON public.credit_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
