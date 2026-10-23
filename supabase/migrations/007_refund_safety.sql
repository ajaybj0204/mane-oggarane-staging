-- Integrated upgrade: one refund request per restaurant order, server-side audit and
-- idempotent full refund + conditional loyalty reversal. Apply ONCE after 001..006.
-- This does not trigger a Razorpay refund by itself.
create table if not exists public.refund_requests (
 order_id uuid primary key references public.orders(id) on delete restrict,
 requested_by uuid references public.profiles(id),
 requested_amount_paise integer not null check(requested_amount_paise>0),
 provider_refund_id text unique,
 status text not null default 'initiated' check(status in ('initiated','requested','processed','needs_review')),
 needs_loyalty_review boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.refund_requests enable row level security;
revoke all on public.refund_requests from public, anon, authenticated;
grant select,insert,update on public.refund_requests to service_role;

-- Called only by a service-role server after Razorpay confirms canonical refund totals.
-- Does NOT allow browsers to mark refunds or mint/deduct points.
create or replace function public.confirm_provider_refund(
 p_order_id uuid, p_refund_id text, p_processed_total_paise integer
) returns public.orders language plpgsql security definer set search_path=public as $$
declare v_order public.orders;v_earned integer;v_already integer;v_to_reverse integer;v_balance integer;
begin
 select * into v_order from public.orders where id=p_order_id for update;
 if not found or p_refund_id is null or p_refund_id='' or p_processed_total_paise<=0 then raise exception 'Refund reconciliation data invalid';end if;
 if v_order.razorpay_payment_id is null then raise exception 'No provider payment to refund';end if;
 if p_processed_total_paise < v_order.total_paise then
   update public.orders set payment_status='partially_refunded',refund_id=p_refund_id,updated_at=now() where id=p_order_id returning * into v_order;
   update public.refund_requests set status='needs_review',provider_refund_id=p_refund_id,needs_loyalty_review=true,updated_at=now()
   where order_id=p_order_id;
   return v_order;
 end if;
 if v_order.payment_status <> 'refunded' then
   update public.orders set payment_status='refunded',refund_id=p_refund_id,status='cancelled',updated_at=now() where id=p_order_id returning * into v_order;
   if v_order.customer_id is not null then
     select coalesce(sum(points),0) into v_earned from public.loyalty_ledger where order_id=p_order_id and kind='earned';
     select coalesce(sum(-points),0) into v_already from public.loyalty_ledger where order_id=p_order_id and kind='adjustment' and points<0;
     v_to_reverse:=greatest(v_earned-v_already,0);
     if v_to_reverse>0 then
       select points_balance into v_balance from public.profiles where id=v_order.customer_id for update;
       if v_balance >= v_to_reverse then
         insert into public.loyalty_ledger(customer_id,order_id,kind,points,note)
         values(v_order.customer_id,p_order_id,'adjustment',-v_to_reverse,'Full provider refund: loyalty points reversed');
         update public.profiles set points_balance=points_balance-v_to_reverse where id=v_order.customer_id;
       else
         insert into public.audit_log(actor_id,action,object_id)
         values(null,'refund.loyalty_review_required',p_order_id::text);
         update public.refund_requests set needs_loyalty_review=true,status='needs_review',updated_at=now() where order_id=p_order_id;
       end if;
     end if;
   end if;
 end if;
 update public.refund_requests set
   status=case when needs_loyalty_review then 'needs_review' else 'processed' end,
   provider_refund_id=p_refund_id,updated_at=now() where order_id=p_order_id;
 return v_order;
end $$;
revoke all on function public.confirm_provider_refund(uuid,text,integer) from public,anon,authenticated;
grant execute on function public.confirm_provider_refund(uuid,text,integer) to service_role;
