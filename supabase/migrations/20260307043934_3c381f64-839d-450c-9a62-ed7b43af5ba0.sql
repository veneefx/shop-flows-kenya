
-- Fix ALL RESTRICTIVE policies to PERMISSIVE across all tables

-- activity_logs
DROP POLICY IF EXISTS "Shop owners can view activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Shop owners can insert activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Admins can manage all activity logs" ON public.activity_logs;

CREATE POLICY "Shop owners can view activity logs" ON public.activity_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM shops s WHERE s.id = activity_logs.shop_id AND s.user_id = auth.uid()));
CREATE POLICY "Shop owners can insert activity logs" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM shops s WHERE s.id = activity_logs.shop_id AND s.user_id = auth.uid()));
CREATE POLICY "Admins can manage all activity logs" ON public.activity_logs FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- credit_accounts
DROP POLICY IF EXISTS "Shop owners can manage credit accounts" ON public.credit_accounts;
DROP POLICY IF EXISTS "Admins can manage all credit accounts" ON public.credit_accounts;

CREATE POLICY "Shop owners can manage credit accounts" ON public.credit_accounts FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = credit_accounts.shop_id AND shops.user_id = auth.uid()));
CREATE POLICY "Admins can manage all credit accounts" ON public.credit_accounts FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- credit_payments
DROP POLICY IF EXISTS "Shop owners can manage credit payments" ON public.credit_payments;
DROP POLICY IF EXISTS "Admins can manage all credit payments" ON public.credit_payments;

CREATE POLICY "Shop owners can manage credit payments" ON public.credit_payments FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM credit_accounts ca JOIN shops s ON s.id = ca.shop_id WHERE ca.id = credit_payments.credit_account_id AND s.user_id = auth.uid()));
CREATE POLICY "Admins can manage all credit payments" ON public.credit_payments FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- orders
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Shop owners can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;

CREATE POLICY "Public can insert orders" ON public.orders FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM shops WHERE shops.id = orders.shop_id AND shops.is_active = true));
CREATE POLICY "Shop owners can manage orders" ON public.orders FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = orders.shop_id AND shops.user_id = auth.uid()));
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- products
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
DROP POLICY IF EXISTS "Shop owners can manage products" ON public.products;

CREATE POLICY "Public can view active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Shop owners can manage products" ON public.products FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = products.shop_id AND shops.user_id = auth.uid()));

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- promotions
DROP POLICY IF EXISTS "Public can view active promotions" ON public.promotions;
DROP POLICY IF EXISTS "Shop owners can manage promotions" ON public.promotions;
DROP POLICY IF EXISTS "Admins can manage all promotions" ON public.promotions;

CREATE POLICY "Public can view active promotions" ON public.promotions FOR SELECT USING ((is_active = true) AND ((ends_at IS NULL) OR (ends_at > now())));
CREATE POLICY "Shop owners can manage promotions" ON public.promotions FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = promotions.shop_id AND shops.user_id = auth.uid()));
CREATE POLICY "Admins can manage all promotions" ON public.promotions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- reviews
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.reviews;
DROP POLICY IF EXISTS "Public can read approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can manage reviews" ON public.reviews;

CREATE POLICY "Anyone can submit a review" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can read approved reviews" ON public.reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Admins can manage reviews" ON public.reviews FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));

-- shops
DROP POLICY IF EXISTS "Users can manage own shops" ON public.shops;
DROP POLICY IF EXISTS "Public can view active shops" ON public.shops;
DROP POLICY IF EXISTS "Admins can manage all shops" ON public.shops;

CREATE POLICY "Users can manage own shops" ON public.shops FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Public can view active shops" ON public.shops FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage all shops" ON public.shops FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can create subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.subscriptions;

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create subscriptions" ON public.subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all subscriptions" ON public.subscriptions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- transactions
DROP POLICY IF EXISTS "Shop owners can view transactions" ON public.transactions;
DROP POLICY IF EXISTS "Service can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;

CREATE POLICY "Shop owners can view transactions" ON public.transactions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = transactions.shop_id AND shops.user_id = auth.uid()));
CREATE POLICY "Service can insert transactions" ON public.transactions FOR INSERT WITH CHECK ((shop_id IS NOT NULL) AND (EXISTS (SELECT 1 FROM shops WHERE shops.id = transactions.shop_id AND shops.is_active = true)));
CREATE POLICY "Admins can view all transactions" ON public.transactions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
