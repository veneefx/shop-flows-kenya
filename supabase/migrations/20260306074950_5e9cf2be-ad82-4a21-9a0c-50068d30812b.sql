
-- Fix ALL RLS policies: convert from RESTRICTIVE to PERMISSIVE
-- The issue is all policies are RESTRICTIVE which requires at least one PERMISSIVE to grant access

-- REVIEWS
DROP POLICY IF EXISTS "Public can read approved reviews" ON public.reviews;
CREATE POLICY "Public can read approved reviews" ON public.reviews FOR SELECT USING (is_approved = true);

DROP POLICY IF EXISTS "Anyone can submit a review" ON public.reviews;
CREATE POLICY "Anyone can submit a review" ON public.reviews FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage reviews" ON public.reviews;
CREATE POLICY "Admins can manage reviews" ON public.reviews FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- PRODUCTS
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products" ON public.products FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Shop owners can manage products" ON public.products;
CREATE POLICY "Shop owners can manage products" ON public.products FOR ALL USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = products.shop_id AND shops.user_id = auth.uid()));

-- ORDERS
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
CREATE POLICY "Public can insert orders" ON public.orders FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM shops WHERE shops.id = orders.shop_id AND shops.is_active = true));

DROP POLICY IF EXISTS "Shop owners can view orders" ON public.orders;
CREATE POLICY "Shop owners can manage orders" ON public.orders FOR ALL USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = orders.shop_id AND shops.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- SHOPS
DROP POLICY IF EXISTS "Public can view active shops" ON public.shops;
CREATE POLICY "Public can view active shops" ON public.shops FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Users can manage own shops" ON public.shops;
CREATE POLICY "Users can manage own shops" ON public.shops FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all shops" ON public.shops;
CREATE POLICY "Admins can manage all shops" ON public.shops FOR ALL USING (has_role(auth.uid(), 'admin'));

-- PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ACTIVITY_LOGS
DROP POLICY IF EXISTS "Shop owners can view activity logs" ON public.activity_logs;
CREATE POLICY "Shop owners can view activity logs" ON public.activity_logs FOR SELECT USING (EXISTS (SELECT 1 FROM shops s WHERE s.id = activity_logs.shop_id AND s.user_id = auth.uid()));

DROP POLICY IF EXISTS "Shop owners can insert activity logs" ON public.activity_logs;
CREATE POLICY "Shop owners can insert activity logs" ON public.activity_logs FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM shops s WHERE s.id = activity_logs.shop_id AND s.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all activity logs" ON public.activity_logs;
CREATE POLICY "Admins can manage all activity logs" ON public.activity_logs FOR ALL USING (has_role(auth.uid(), 'admin'));

-- CREDIT_ACCOUNTS
DROP POLICY IF EXISTS "Shop owners can manage credit accounts" ON public.credit_accounts;
CREATE POLICY "Shop owners can manage credit accounts" ON public.credit_accounts FOR ALL USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = credit_accounts.shop_id AND shops.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all credit accounts" ON public.credit_accounts;
CREATE POLICY "Admins can manage all credit accounts" ON public.credit_accounts FOR ALL USING (has_role(auth.uid(), 'admin'));

-- CREDIT_PAYMENTS
DROP POLICY IF EXISTS "Shop owners can manage credit payments" ON public.credit_payments;
CREATE POLICY "Shop owners can manage credit payments" ON public.credit_payments FOR ALL USING (EXISTS (SELECT 1 FROM credit_accounts ca JOIN shops s ON s.id = ca.shop_id WHERE ca.id = credit_payments.credit_account_id AND s.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all credit payments" ON public.credit_payments;
CREATE POLICY "Admins can manage all credit payments" ON public.credit_payments FOR ALL USING (has_role(auth.uid(), 'admin'));

-- PROMOTIONS
DROP POLICY IF EXISTS "Public can view active promotions" ON public.promotions;
CREATE POLICY "Public can view active promotions" ON public.promotions FOR SELECT USING (is_active = true AND (ends_at IS NULL OR ends_at > now()));

DROP POLICY IF EXISTS "Shop owners can manage promotions" ON public.promotions;
CREATE POLICY "Shop owners can manage promotions" ON public.promotions FOR ALL USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = promotions.shop_id AND shops.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all promotions" ON public.promotions;
CREATE POLICY "Admins can manage all promotions" ON public.promotions FOR ALL USING (has_role(auth.uid(), 'admin'));

-- TRANSACTIONS
DROP POLICY IF EXISTS "Shop owners can view transactions" ON public.transactions;
CREATE POLICY "Shop owners can view transactions" ON public.transactions FOR SELECT USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = transactions.shop_id AND shops.user_id = auth.uid()));

DROP POLICY IF EXISTS "Service can insert transactions" ON public.transactions;
CREATE POLICY "Service can insert transactions" ON public.transactions FOR INSERT WITH CHECK (shop_id IS NOT NULL AND EXISTS (SELECT 1 FROM shops WHERE shops.id = transactions.shop_id AND shops.is_active = true));

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
CREATE POLICY "Admins can view all transactions" ON public.transactions FOR ALL USING (has_role(auth.uid(), 'admin'));

-- SUBSCRIPTIONS
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create subscriptions" ON public.subscriptions;
CREATE POLICY "Users can create subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can manage all subscriptions" ON public.subscriptions FOR ALL USING (has_role(auth.uid(), 'admin'));

-- USER_ROLES
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Enable realtime for activity_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
