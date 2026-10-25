-- Free delivery is strictly ABOVE the configured eligible merchandise subtotal (default ₹100).\n-- Does not enable new delivery zones or turn on deliveries.\nupdate public.settings set value=jsonb_set(value,'{free_delivery_threshold_paise}','10000'::jsonb,true) where key='store' and not(value ? 'free_delivery_threshold_paise');
-- Business rules only; keep delivery switched off until true 15km location validation is deployed.
update public.settings set value=value || '{"delivery_base_fee_paise":4000,"delivery_radius_km":15}'::jsonb where key='store';\ncreate or replace function public.create_checkout_order(
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
  v_delivery:=case when v_subtotal>coalesce((v_store->>'free_delivery_threshold_paise')::integer,10000) then 0 else coalesce((v_store->>'delivery_base_fee_paise')::integer,4000) end;
 end if;
 if nullif(trim(coalesce(p_coupon,'')),'') is not null then
  select * into v_coupon from public.coupons where upper(code)=upper(trim(p_coupon)) and active=true and (expires_at is null or expires_at>now()) for update;
  if not found or (v_coupon.max_uses is not null and v_coupon.uses+v_coupon.reserved>=v_coupon.max_uses) or v_subtotal<v_coupon.minimum_paise or (v_coupon.customer_id is not null and v_coupon.customer_id is distinct from p_customer_id) then raise exception 'Coupon is invalid, expired, or not eligible';end if;
  if not public.coupon_is_eligible(v_coupon.id,p_customer_id) then raise exception 'Coupon not eligible for this account';end if;
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
 -- Reserve finite stock and a limited coupon for this checkout, atomically.
 update public.products p set stock_qty=p.stock_qty-i.quantity from public.order_items i
 where i.order_id=v_order.id and i.product_id=p.id and p.stock_qty is not null;
 if v_coupon.id is not null then
  update public.coupons set reserved=reserved+1 where id=v_coupon.id;
  update public.orders set coupon_reserved=true where id=v_order.id;
 end if;
 return v_order;
end $$;\n