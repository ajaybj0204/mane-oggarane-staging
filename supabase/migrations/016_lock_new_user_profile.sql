-- Trigger-only function: never callable through the REST RPC endpoint (matches live staging grants).
revoke all on function public.new_user_profile() from public, anon, authenticated;
grant execute on function public.new_user_profile() to service_role;
