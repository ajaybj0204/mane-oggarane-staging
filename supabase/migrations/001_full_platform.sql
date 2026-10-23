-- Run ONCE in a new Supabase project. Supabase Auth is the source of user identity.
-- All financial writes use SECURITY DEFINER RPC restricted to service_role.
create extension if not exists pgcrypto;
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '', phone text not null default '',
 role text not null default 'customer' check(role in ('customer','owner','manager','kitchen','rider')),
 marketing_consent boolean not null default false, points_balance integer not null default 0 check(points_balance>=0),
 created_at timestamptz not null default now()
);
create or replace function public.new_user_profile() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.profiles(id,display_name) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','')) on conflict(id) do nothing;
 return new;
end $$;
create trigger create_profile after insert on auth.users for each row execute function public.new_user_profile();

create table public.products (
 id text primary key, name text not null, description text not null default '', price integer not null check(price>0 and price<200000),
 category text not null check(category in ('veg','nonveg','combos','cafe')),
 image text, active boolean not null default true, veg boolean not null default true, featured boolean not null default false,
 stock_qty integer check(stock_qty is null or stock_qty>=0), sort_order integer not null default 100, updated_at timestamptz not null default now()
);
create table public.delivery_zones (
 id uuid primary key default gen_random_uuid(), pin_code text not null unique check(pin_code ~ '^[0-9]{6}$'),
 fee_paise integer not null default 0 check(fee_paise>=0), minimum_paise integer not null default 0 check(minimum_paise>=0),
 active boolean not null default true
);
create table public.settings (
 key text primary key,value jsonb not null,updated_at timestamptz not null default now()
);
insert into public.settings(key,value) values ('store', '{"name":"Mane & Oggarane","open":true,"pickup_enabled":true,"delivery_enabled":false,"support_phone":"","tax_rate_percent":0,"address":"","hours":"","booking_enabled":false}'::jsonb);

create table public.campaigns (
 id uuid primary key default gen_random_uuid(), name text not null, segment text not null default 'all',
 status text not null default 'draft' check(status in ('draft','active','paused','completed')),
 message text not null default '', starts_at timestamptz, ends_at timestamptz, created_at timestamptz default now()
);
create table public.coupons (
 id uuid primary key default gen_random_uuid(), code text not null unique,
 discount_type text not null check(discount_type in ('fixed','percent')),
 value integer not null check(value>0), max_discount_paise integer,
 minimum_paise integer not null default 0, max_uses integer check(max_uses is null or max_uses>0), uses integer not null default 0,
 active boolean not null default true, expires_at timestamptz,
 customer_id uuid references public.profiles(id), campaign_id uuid references public.campaigns(id), created_at timestamptz default now(),
 check((discount_type='percent' and value<=100) or discount_type='fixed')
);
create table public.orders (
 id uuid primary key default gen_random_uuid(), tracking_token text not null unique default encode(gen_random_bytes(24),'hex'),
 customer_id uuid references public.profiles(id), customer_name text not null,customer_email text not null,customer_phone text not null,
 fulfillment_type text not null check(fulfillment_type in ('delivery','pickup')),
 address jsonb, notes text not null default '',
 subtotal_paise integer not null check(subtotal_paise>=0),discount_paise integer not null default 0 check(discount_paise>=0),
 delivery_paise integer not null default 0 check(delivery_paise>=0),tax_paise integer not null default 0 check(tax_paise>=0),
 total_paise integer not null check(total_paise>0), coupon_id uuid references public.coupons(id),coupon_code text,
 payment_status text not null default 'pending' check(payment_status in ('pending','paid','refunded','partially_refunded','failed')),
 status text not null default 'awaiting_payment' check(status in ('awaiting_payment','placed','accepted','preparing','ready','out_for_delivery','delivered','cancelled')),
 razorpay_order_id text unique, razorpay_payment_id text unique, refund_id text, rider_id uuid references public.profiles(id),
 created_at timestamptz not null default now(),paid_at timestamptz,updated_at timestamptz not null default now()
);
create table public.order_items (
 id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id) on delete cascade,
 product_id text references public.products(id) on delete set null,name text not null,quantity integer not null check(quantity>0),
 unit_price_paise integer not null, line_total_paise integer not null
);
create table public.payment_events(id text primary key,event_type text not null,received_at timestamptz not null default now());
create table public.loyalty_ledger (
 id uuid primary key default gen_random_uuid(),customer_id uuid not null references public.profiles(id),
 order_id uuid references public.orders(id),reward_id uuid,kind text not null check(kind in ('earned','redeemed','adjustment')),
 points integer not null check(points<>0),note text not null default '',created_at timestamptz not null default now()
);
create unique index ledger_one_order_award on public.loyalty_ledger(order_id) where kind='earned';
create table public.rewards (
 id uuid primary key default gen_random_uuid(),name text not null,points_cost integer not null check(points_cost>0),
 discount_paise integer not null check(discount_paise>0),active boolean not null default true
);
insert into public.rewards(name,points_cost,discount_paise) values ('₹50 off your next order',100,5000),('₹100 off your next order',200,10000);
create table public.bookings (
 id uuid primary key default gen_random_uuid(),name text not null,email text not null,phone text not null,
 party_size integer not null check(party_size between 1 and 20),requested_at timestamptz not null,
 note text not null default '',status text not null default 'requested' check(status in ('requested','confirmed','declined','cancelled')),
 customer_id uuid references public.profiles(id),created_at timestamptz not null default now()
);
create table public.audit_log (id bigint generated by default as identity primary key, actor_id uuid, action text not null, object_id text,created_at timestamptz not null default now());

-- RLS enabled, with no direct public writes. Service-role API authorizes writes server-side.
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.settings enable row level security;
alter table public.campaigns enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_events enable row level security;
alter table public.loyalty_ledger enable row level security;
alter table public.rewards enable row level security;
alter table public.bookings enable row level security;
alter table public.audit_log enable row level security;
create policy "public can read available menu" on public.products for select to anon,authenticated using (active=true);
create policy "users read own profile" on public.profiles for select to authenticated using (id=auth.uid());
create policy "users read own orders" on public.orders for select to authenticated using(customer_id=auth.uid());
create policy "users read own order items" on public.order_items for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id and o.customer_id=auth.uid()));
create policy "users read own points" on public.loyalty_ledger for select to authenticated using(customer_id=auth.uid());
create policy "public can read rewards" on public.rewards for select to anon,authenticated using(active=true);

-- Secure, price-authoritative checkout creation. Only callable using private service credentials.
create or replace function public.create_checkout_order(
 p_customer_id uuid,p_name text,p_email text,p_phone text,p_fulfillment text,p_address jsonb,p_notes text,p_items jsonb,p_coupon text
) returns public.orders language plpgsql security definer set search_path=public as $$
declare v_product public.products%rowtype;v_item jsonb;v_order public.orders;v_qty int;v_subtotal int:=0;v_delivery int:=0;
 v_discount int:=0;v_tax int:=0;v_coupon public.coupons%rowtype;v_store jsonb;v_zone public.delivery_zones%rowtype;
 v_seen text[]:=array[]::text[];v_count integer:=0;
begin
 if p_name is null or length(trim(p_name))<2 or length(p_name)>100 or p_email !~* '^[^@ ]+@[^@ ]+\.[^@ ]+$' or p_phone !~ '^[+0-9 -]{8,18}$' then raise exception 'Invalid customer details';end if;
 if p_fulfillment not in ('pickup','delivery') then raise exception 'Invalid fulfillment type';end if;
 select value into v_store from public.settings where key='store';
 if coalesce((v_store->>'open')::boolean,false)=false then raise exception 'Store is closed';end if;
 if p_fulfillment='pickup' and coalesce((v_store->>'pickup_enabled')::boolean,false)=false then raise exception 'Pickup unavailable';end if;
 if p_fulfillment='delivery' and coalesce((v_store->>'delivery_enabled')::boolean,false)=false then raise exception 'Delivery unavailable';end if;
 if jsonb_typeof(p_items)!='array' or jsonb_array_length(p_items)<1 or jsonb_array_length(p_items)>30 then raise exception 'Invalid cart size';end if;
 for v_item in select * from jsonb_array_elements(p_items) loop
  v_count:=v_count+1;
  if jsonb_typeof(v_item)!='object' or (v_item->>'quantity') !~ '^[0-9]{1,2}$' then raise exception 'Invalid cart item';end if;
  v_qty:=(v_item->>'quantity')::int;
  if v_qty<1 or v_qty>20 or v_item->>'id'=any(v_seen) then raise exception 'Invalid or duplicate quantity';end if;
  v_seen:=array_append(v_seen,v_item->>'id');
  select * into v_product from public.products where id=v_item->>'id' and active=true for update;
  if not found then raise exception 'Dish unavailable';end if;
  if v_product.stock_qty is not null and v_product.stock_qty<v_qty then raise exception 'Insufficient stock: %',v_product.name;end if;
  v_subtotal:=v_subtotal+(v_qty*v_product.price*100);
 end loop;
 if v_subtotal<=0 then raise exception 'Empty cart';end if;
 if p_fulfillment='delivery' then
  if p_address is null or (p_address->>'line1') is null or length(trim(p_address->>'line1'))<5 or (p_address->>'pin_code') !~ '^[0-9]{6}$' then raise exception 'Full delivery address required';end if;
  select * into v_zone from public.delivery_zones where pin_code=p_address->>'pin_code' and active=true;
  if not found then raise exception 'This PIN code is outside our current delivery zones';end if;
  if v_subtotal<v_zone.minimum_paise then raise exception 'Delivery minimum not reached';end if;
  v_delivery:=v_zone.fee_paise;
 end if;
 if nullif(trim(coalesce(p_coupon,'')),'') is not null then
  select * into v_coupon from public.coupons where upper(code)=upper(trim(p_coupon)) and active=true and (expires_at is null or expires_at>now()) for update;
  if not found or (v_coupon.max_uses is not null and v_coupon.uses>=v_coupon.max_uses) or v_subtotal<v_coupon.minimum_paise or (v_coupon.customer_id is not null and v_coupon.customer_id is distinct from p_customer_id) then raise exception 'Coupon is invalid, expired, or not eligible';end if;
  if v_coupon.discount_type='fixed' then v_discount:=least(v_subtotal,v_coupon.value);else
   v_discount:=floor(v_subtotal*v_coupon.value/100.0)::int;
   if v_coupon.max_discount_paise is not null then v_discount:=least(v_discount,v_coupon.max_discount_paise);end if;
  end if;
 end if;
 v_tax:=round(greatest(0,v_subtotal-v_discount)*coalesce((v_store->>'tax_rate_percent')::numeric,0)/100.0)::int;
 insert into public.orders(customer_id,customer_name,customer_email,customer_phone,fulfillment_type,address,notes,subtotal_paise,discount_paise,delivery_paise,tax_paise,total_paise,coupon_id,coupon_code)
 values(p_customer_id,trim(p_name),lower(trim(p_email)),trim(p_phone),p_fulfillment,p_address,left(coalesce(p_notes,''),500),v_subtotal,v_discount,v_delivery,v_tax,v_subtotal-v_discount+v_delivery+v_tax,
 case when v_coupon.id is null then null else v_coupon.id end,case when v_coupon.id is null then null else v_coupon.code end)
 returning * into v_order;
 for v_item in select * from jsonb_array_elements(p_items) loop
  select * into v_product from public.products where id=v_item->>'id';v_qty:=(v_item->>'quantity')::int;
  insert into public.order_items(order_id,product_id,name,quantity,unit_price_paise,line_total_paise)
   values(v_order.id,v_product.id,v_product.name,v_qty,v_product.price*100,v_qty*v_product.price*100);
 end loop;
 return v_order;
end $$;

-- payment signature/provider status is verified in the server API before invoking this RPC.
create or replace function public.mark_order_paid(p_order_id uuid,p_rzp_order text,p_rzp_payment text)
returns public.orders language plpgsql security definer set search_path=public as $$
declare v_order public.orders;v_coupon public.coupons%rowtype;
begin
 select * into v_order from public.orders where id=p_order_id for update;
 if not found or v_order.razorpay_order_id is distinct from p_rzp_order then raise exception 'Payment/order mismatch';end if;
 if v_order.payment_status='paid' then
  if v_order.razorpay_payment_id is distinct from p_rzp_payment then raise exception 'Different payment already recorded';end if;
  return v_order;
 end if;
 if v_order.status='cancelled' or v_order.payment_status!='pending' then raise exception 'Order not payable';end if;
 if v_order.coupon_id is not null then
  select * into v_coupon from public.coupons where id=v_order.coupon_id for update;
  -- Codes are reserved until payment capture, so never claim delivery of a coupon beyond its limit.
  if v_coupon.max_uses is not null and v_coupon.uses>=v_coupon.max_uses then raise exception 'Coupon use limit reached; manual refund required';end if;
  update public.coupons set uses=uses+1 where id=v_order.coupon_id;
 end if;
 update public.orders set payment_status='paid',status='placed',razorpay_payment_id=p_rzp_payment,paid_at=now(),updated_at=now()
 where id=p_order_id returning * into v_order;
 -- Inventory deducted only after confirmed capture (subsequent stock must still be verified).
 update public.products p set stock_qty=greatest(0, p.stock_qty-i.quantity) from public.order_items i
 where i.order_id=p_order_id and i.product_id=p.id and p.stock_qty is not null;
 return v_order;
end $$;

-- Controlled order state transition. Award exactly once, after delivery completion.
create or replace function public.transition_order(p_order_id uuid,p_status text,p_actor uuid)
returns public.orders language plpgsql security definer set search_path=public as $$
declare v_order public.orders;v_points int;v_role text;
begin
 select role into v_role from public.profiles where id=p_actor;
 if v_role not in ('owner','manager','kitchen','rider') then raise exception 'Access denied';end if;
 select * into v_order from public.orders where id=p_order_id for update;
 if not found then raise exception 'Order missing';end if;
 if v_order.payment_status!='paid' or v_order.status='cancelled' then raise exception 'Unpaid/cancelled order';end if;
 if v_role='rider' and (v_order.rider_id is distinct from p_actor or p_status not in ('out_for_delivery','delivered')) then raise exception 'Not your delivery';end if;
 if not ((v_order.status='placed' and p_status in ('accepted','cancelled')) or
          (v_order.status='accepted' and p_status in ('preparing','cancelled')) or
          (v_order.status='preparing' and p_status in ('ready','cancelled')) or
          (v_order.status='ready' and p_status in ('out_for_delivery','delivered','cancelled')) or
          (v_order.status='out_for_delivery' and p_status='delivered')) then raise exception 'Invalid status transition';end if;
 if p_status='out_for_delivery' and v_order.fulfillment_type='pickup' then raise exception 'Pickup orders cannot be out for delivery';end if;
 update public.orders set status=p_status,updated_at=now() where id=p_order_id returning * into v_order;
 if p_status='delivered' and v_order.customer_id is not null then
  v_points:=floor((v_order.subtotal_paise-v_order.discount_paise)/10000.0)::int;
  -- 1 point for every ₹100 of eligible paid order subtotal.
  if v_points>0 then
    insert into public.loyalty_ledger(customer_id,order_id,kind,points,note)
     values(v_order.customer_id,p_order_id,'earned',v_points,'Completed order') on conflict do nothing;
    if found then update public.profiles set points_balance=points_balance+v_points where id=v_order.customer_id;end if;
  end if;
 end if;
 return v_order;
end $$;

create or replace function public.redeem_reward(p_user uuid,p_reward uuid)
returns text language plpgsql security definer set search_path=public as $$
declare v_profile public.profiles;v_reward public.rewards;v_code text;
begin
 select * into v_profile from public.profiles where id=p_user for update;
 select * into v_reward from public.rewards where id=p_reward and active=true;
 if not found then raise exception 'Reward unavailable';end if;
 if v_profile.points_balance<v_reward.points_cost then raise exception 'Not enough points';end if;
 v_code:='MNO'||upper(substr(encode(gen_random_bytes(8),'hex'),1,12));
 update public.profiles set points_balance=points_balance-v_reward.points_cost where id=p_user;
 insert into public.loyalty_ledger(customer_id,reward_id,kind,points,note) values(p_user,p_reward,'redeemed',-v_reward.points_cost,v_reward.name);
 insert into public.coupons(code,discount_type,value,max_uses,minimum_paise,active,expires_at,customer_id)
 values(v_code,'fixed',v_reward.discount_paise,1,v_reward.discount_paise+100,true,now()+interval '30 days',p_user);
 return v_code;
end $$;

-- Guest and customer web clients cannot invoke privileged RPCs directly.
revoke all on function public.create_checkout_order(uuid,text,text,text,text,jsonb,text,jsonb,text) from public,anon,authenticated;
revoke all on function public.mark_order_paid(uuid,text,text) from public,anon,authenticated;
revoke all on function public.transition_order(uuid,text,uuid) from public,anon,authenticated;
revoke all on function public.redeem_reward(uuid,uuid) from public,anon,authenticated;
grant execute on function public.create_checkout_order(uuid,text,text,text,text,jsonb,text,jsonb,text) to service_role;
grant execute on function public.mark_order_paid(uuid,text,text) to service_role;
grant execute on function public.transition_order(uuid,text,uuid) to service_role;
grant execute on function public.redeem_reward(uuid,uuid) to service_role;
-- Product images are public read; only backend service credentials can upload.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy "public read product images" on storage.objects for select to public using(bucket_id='product-images');
