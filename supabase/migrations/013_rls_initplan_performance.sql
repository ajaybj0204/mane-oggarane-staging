-- Performance only: evaluate auth.uid() once per query instead of once per row
-- (Supabase advisor "auth_rls_initplan"). Access semantics are unchanged.
alter policy "users read own orders" on public.orders using (customer_id = (select auth.uid()));
alter policy "users read own points" on public.loyalty_ledger using (customer_id = (select auth.uid()));
alter policy "users read own profile" on public.profiles using (id = (select auth.uid()));
alter policy "users read own order items" on public.order_items using (exists (select 1 from public.orders o where o.id = order_items.order_id and o.customer_id = (select auth.uid())));
