# Mane & Oggarane — Final consolidated staging QA (24 October 2026)

**Scope:** private Vercel staging, Supabase development database `mane-oggarane-dev`, Razorpay **Test Mode only**. Not a public commercial launch, not live-payment authorization.

## Verified from real provider-connected testing

- A registered customer paid **₹145** on the protected staging website for order **E8179037** (Davangere Benne Dosa, pickup).
- The order became `paid / placed`; independent webhook events `payment.captured` and `order.paid` were recorded.
- Owner requested one full ₹145 Test Mode refund. `refund.processed` was recorded; order became `refunded / cancelled`, `refund_requests.status=processed`, `needs_loyalty_review=false`.
- No loyalty points were awarded on that undelivered refunded order. This is expected; it does **not** prove a spent-points clawback case.

## Verified by rollback-only database transaction (no provider charges/refunds)

The exact SQL is `scripts/final-payment-qa-rollback.sql`, executed successfully against development Supabase on 24 October 2026. All synthetic writes were rolled back.

1. First payment capture marks an eligible pending order paid.
2. Repeat of the same payment is idempotent.
3. A different second payment reference is rejected.
4. Late capture against an expired order reservation is rejected.
5. Releasing an expired unpaid reservation succeeds once; repeating the release is a harmless no-op.
6. Partial provider refund updates status to `partially_refunded` and flags manual review.
7. Partial-then-full refund reaches `refunded / cancelled`; review flag is retained conservatively.
8. Full provider refund of an ordinary paid order updates state and is idempotent when reconfirmed.
9. Duplicate webhook event IDs cannot create two `payment_events` records.
10. Anonymous/authenticated direct access to privileged payment/refund DB functions is denied.

### Important boundary
Database simulations verify SQL behavior but do not prove actual Razorpay **provider-generated failure/retry**, duplicate HTTP event delivery, partial refund issuance, network outages, a spent-points loyalty clawback, or chargebacks. Those have not been exercised as real provider events.

## New code safeguards in this release

- Server-side Razorpay helper **refuses all non-`rzp_test_` credentials**, preventing accidental live charging on this staging branch.
- Owner refund endpoint also rejects non-Test Mode keys, independent of `RAZORPAY_ALLOW_LIVE_REFUNDS`.
- Database/refund state update errors are checked rather than silently ignored.
- Refund request update is conditional on an outstanding `initiated/requested` state: a fast `refund.processed` webhook can't be overwritten back to `requested`.
- `npm run qa:source` includes test-mode and owner/manager guard assertions.

## Reservation expiry job: migration prepared, not enabled

**MANUAL OPERATOR ITEM:** The environment did not have `pg_cron` installed. An attempt to apply the database migration automatically was **blocked by safety checks**; it was **not applied**. The operator can review `supabase/migrations/008_expired_reservation_cron.sql` and apply it in the Supabase SQL Editor if approved. It installs Supabase `pg_cron` and schedules `public.expire_abandoned_orders()` every 15 minutes. Check `cron.job` and job run history after setup. This does not invoke Razorpay or reconcile late provider captures.

Until approved and scheduled, **automatic pending-order reservation cleanup is not running**. Current read-only inspection found **zero** pending expired/unpaid orders. Keep track of reservations until the cron is enabled.

## Current security advisor findings

- Database audit: service-only tables such as payment events, refund requests, settings and rate limits have RLS enabled without public policies. That is intentional for backend-only access; keep reviewing grants and server authorization.
- **Supabase Auth warning:** leaked-password protection is currently disabled (see [password security guide](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)). Review dashboard eligibility/availability before public launch.
- Read-only post-test inspection: **0** synthetic QA orders, **0** synthetic QA event IDs, **0** expired pending orders, **0** refunds awaiting review; real Test Mode refund webhook remains recorded.

## Security and operational pre-launch boundaries

- Vercel staging remains login-protected; the only public provider callback is a dedicated signed, Test Mode Supabase Edge Function.
- Confirm production hosting permits commercial use. Existing Vercel Hobby staging must not be advertised as a commercial production deployment.
- Delivery remains disabled until real operating PIN codes, pricing and fulfillment process are configured.
- Business legal pages, allergen/ingredient facts, business identity, tax, real food photos, support contact and policy compliance require the owner’s review.
- Monitor logs and alerts; establish backup/restore procedures and test data recovery before real customer data/payment handling.
- Production security review, real failed/partial provider refund tests and fraud/dispute policy are outstanding. Do not enable live payments.

## Release and recovery

Previous stable payment baseline: `baseline/staging-payment-code-v1-2026-10-23`.
New consolidated final QA will be tagged with `baseline/staging-final-qa-v1-2026-10-24` after successful Vercel build and merge. Leave the earlier baseline untouched.
