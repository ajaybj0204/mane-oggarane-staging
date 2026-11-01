-- Mirrors live staging migration 20261023105908 "fix_reward_redemption_pgcrypto_path".
-- On Supabase, pgcrypto lives in the "extensions" schema, so gen_random_bytes must be on the path.
create or replace function public.redeem_reward(p_user uuid,p_reward uuid)
returns text language plpgsql security definer set search_path=pg_catalog, extensions as $$
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
revoke all on function public.redeem_reward(uuid,uuid) from public,anon,authenticated;
grant execute on function public.redeem_reward(uuid,uuid) to service_role;
