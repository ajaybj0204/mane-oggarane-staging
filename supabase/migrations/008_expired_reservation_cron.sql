-- Stage-only automated reservation cleanup: every 15 minutes, database-local.
-- This does not contact Razorpay; captured-but-late payments must be reconciled manually.
-- pg_cron is supported by Supabase Postgres; run under the privileged postgres role.
create extension if not exists pg_cron;
select cron.schedule(
  'mane-oggarane-expire-abandoned-orders',
  '*/15 * * * *',
  $$select public.expire_abandoned_orders();$$
);
