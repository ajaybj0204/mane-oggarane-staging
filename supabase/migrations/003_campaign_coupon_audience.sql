-- Coupon audience is validated by the database, not client UI.
-- Recreate checkout function with segment eligibility checking from migration 001.
-- This supplementary function deliberately does NOT trust user-provided customer labels.
create or replace function public.coupon_is_eligible(p_coupon_id uuid,p_customer_id uuid)
returns boolean language plpgsql stable security definer set search_path=public as $$
declare v_campaign public.campaigns%rowtype;v_coupon public.coupons%rowtype;v_orders int;v_spend bigint;v_latest timestamptz;
begin
 select * into v_coupon from public.coupons where id=p_coupon_id;
 if not found then return false;end if;
 if v_coupon.campaign_id is null then return true;end if;
 select * into v_campaign from public.campaigns where id=v_coupon.campaign_id;
 if not found or v_campaign.status<>'active' or (v_campaign.starts_at is not null and v_campaign.starts_at>now()) or (v_campaign.ends_at is not null and v_campaign.ends_at<now()) then return false;end if;
 if v_campaign.segment='all' then return true;end if;
 if p_customer_id is null then return false;end if;
 select count(*),coalesce(sum(total_paise),0),max(created_at) into v_orders,v_spend,v_latest from public.orders
 where customer_id=p_customer_id and payment_status='paid';
 return case v_campaign.segment
 when 'new' then v_orders=0
 when 'first_time' then v_orders=1
 when 'returning' then v_orders between 2 and 4
 when 'loyal' then v_orders>=5
 when 'high_value' then v_spend>=100000
 when 'inactive' then v_latest<now()-interval '30 days'
 when 'at_risk' then v_orders>=2 and v_latest<now()-interval '14 days' and v_latest>=now()-interval '30 days'
 else false end;
end $$;
revoke all on function public.coupon_is_eligible(uuid,uuid) from public,anon,authenticated;
grant execute on function public.coupon_is_eligible(uuid,uuid) to service_role;
-- Insert eligibility guard into the checkout RPC from migration 001 in migration 004.
