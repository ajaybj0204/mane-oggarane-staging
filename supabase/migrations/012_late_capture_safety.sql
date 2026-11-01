-- Late-capture safety (1 Nov 2026).
-- 1) A payment captured after reservation_expires_at but BEFORE cleanup released the order is
--    still honoured: reservations (stock + coupon) are untouched until release, so the only
--    things that make an order unpayable are status='cancelled' or a non-pending payment status.
-- 2) A payment captured AFTER release is recorded in payment_reviews for the owner to refund or
--    confirm, instead of making the webhook fail and retry forever.
create table if not exists public.payment_reviews (
 id bigint generated always as identity primary key,
 order_id uuid not null references public.orders(id) on delete restrict,
 razorpay_payment_id text not null unique,
 amount_paise integer,
 reason text not null,
 status text not null default 'open' check (status in ('open','refunded','confirmed','dismissed')),
 created_at timestamptz not null default now(),
 resolved_at timestamptz
);
create index if not exists payment_reviews_order_idx on public.payment_reviews(order_id);
alter table public.payment_reviews enable row level security;
revoke all on public.payment_reviews from public, anon, authenticated;
grant select,insert,update on public.payment_reviews to service_role;

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
 if v_order.status<>'awaiting_payment' or v_order.payment_status<>'pending' then raise exception 'Order expired or not payable; reconcile captured payment';end if;
 if v_order.coupon_id is not null then
  select * into v_coupon from public.coupons where id=v_order.coupon_id for update;
  if not v_order.coupon_reserved or v_coupon.reserved<1 then raise exception 'Coupon reservation expired; manual refund required';end if;
  update public.coupons set uses=uses+1,reserved=reserved-1 where id=v_order.coupon_id;
  update public.orders set coupon_reserved=false where id=p_order_id;
 end if;
 update public.orders set payment_status='paid',status='placed',razorpay_payment_id=p_rzp_payment,paid_at=now(),updated_at=now()
 where id=p_order_id returning * into v_order;
 return v_order;
end $$;
revoke all on function public.mark_order_paid(uuid,text,text) from public,anon,authenticated;
grant execute on function public.mark_order_paid(uuid,text,text) to service_role;
