# Mane & Oggarane — consolidated Test Mode payment-readiness batch

**Scope:** protected Vercel staging, Razorpay **Test Mode**, Supabase project \`mane-oggarane-dev\` (\`zkowkikjsrfqqqsfrfwv\`). This is **not** authorization to accept live payments.

## Why the receiver runs on Supabase

Vercel Authentication protects every deployment. Razorpay cannot complete an interactive Vercel sign-in, so Razorpay must **not** be directed to the protected \`/api/payments/webhook\` URL. The site itself remains private. The narrowly scoped webhook receiver is a separate Supabase Edge Function at:

\`https://zkowkikjsrfqqqsfrfwv.supabase.co/functions/v1/razorpay-test-webhook\`

It is publicly reachable without Supabase JWT because Razorpay has none. The function authenticates **every POST using the raw-body Razorpay HMAC SHA-256 signature**. It fails closed without all required secrets and only permits \`rzp_test_\` API key IDs. No service-role key or webhook secret appears in the browser code.

## Setup (only manual configuration still required)

1. In Supabase Dashboard → **Edge Functions → Secrets**, configure:
   - \`RAZORPAY_WEBHOOK_SECRET\`: the **same independent Test Mode webhook secret** configured in the Razorpay Dashboard and Vercel staging.
   - \`RAZORPAY_KEY_ID\`: your existing **rzp_test_...** key ID.
   - \`RAZORPAY_KEY_SECRET\`: the matching existing Razorpay **Test Mode API secret**.
   - **Do not** paste these values into GitHub, ChatGPT, screenshots, or the website. **Do not** change \`SUPABASE_URL\` / \`SUPABASE_SERVICE_ROLE_KEY\` defaults provided to Edge Functions.
2. Confirm the Edge Function \`razorpay-test-webhook\` is deployed with \`verify_jwt=false\`. This only disables the **Supabase JWT gateway**: all webhook POSTs still require the Razorpay HMAC signature.
3. In **Razorpay Dashboard → Test Mode → Webhooks**, add/edit the URL above, choose the same webhook secret, and subscribe to \`payment.captured\`, \`order.paid\`, \`payment.failed\`, and \`refund.processed\`. Keep the existing protected Vercel URL **out** of the webhook target list.
4. Confirm Vercel **All Deployments Authentication** remains enabled and \`RAZORPAY_ALLOW_LIVE_REFUNDS=false\`. Never configure a live webhook on this test endpoint.

## What happens per event

- **payment.captured**: HMAC verification → canonical Razorpay payment lookup → order ID, INR, status and amount validation → existing idempotent \`mark_order_paid\` RPC.
- **order.paid**: independently fetch the canonical captured payment; reconcile only if exactly one matching captured payment is found.
- **payment.failed**: record signed event without cancelling the whole Razorpay order or overwriting any later captured payment.
- **refund.processed**: fetch canonical refund records for the payment (including pagination), total only **processed** refunds, then call the existing \`confirm_provider_refund\` RPC. Partial refunds require manual review.
- **retries**: deduplicate via Razorpay's actual \`x-razorpay-event-id\` header in \`payment_events\`, written only after processing. If an event cannot safely reconcile, return non-2xx for Razorpay retries and inspect logs.
- If a provider payment is captured **after the reservation expires**, the database deliberately refuses ordinary fulfillment. Manually verify and resolve/refund the paid provider transaction; do not treat it as safely deliverable.

## One consolidated QA pass

No real money is involved; use existing **test** customers and orders and Razorpay's official Test Mode simulation:

| Test | Expected result |
|---|---|
| Anonymous GET to receiver | 405, no state change |
| Unsigned POST with event-id header (after secrets configured) | 403, no state change |
| Tampered JSON with a once-valid signature | 403, no state change |
| Signed \`payment.failed\` attempt | Logged, no paid order overwritten |
| Signed captured payment | One order paid, amount and currency exact |
| Replay the same provider event ID | 200 duplicate, no double settlement |
| Signed full refund, after trusted admin test-mode refund | Refund status reconciled once; points reversed or flagged |
| Signed partial refund | \`partially_refunded\`, loyalty/manual-review flag |
| Mobile user account / order tracking after deployment | No regression |
| Vercel incognito visit | Requires Vercel Authentication |

For read-only API checks, run \`npm run qa:webhook\` with \`WEBHOOK_TEST_URL\` set locally. This **does not** send signed payment events. For webhook delivery, inspect Razorpay Test Mode webhook delivery logs and Supabase Edge Function logs. Do not mark complete solely because a deployment built.

## Known boundaries and next approval

- Supabase secrets and Razorpay dashboard webhook configuration are **manual** because the assistant's connector cannot set provider secrets or Razorpay webhook destinations.
- Refund requests remain owner/manager-only, one per order, and require canonical provider reconciliation.
- Late captured payments, abandoned-order cron scheduling, missing webhook notifications/alerting, provider timeouts and real refund/failed-payment tests still require explicit acceptance before live customers.
- Never disable Vercel Authentication just to make a webhook reachable.
- Current Vercel Hobby staging is not a substitute for commercially permitted production hosting.
