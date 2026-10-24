# Mane & Oggarane — Consolidated Production-Preparation Handoff
**Prepared:** 24 October 2026 · **Outcome:** prelaunch-ready *source code*, not public commercial go-live authorization.

## User-confirmed facts (not independently verified against certificates/accounts)
- FSSAI approval: **reported approved**; verify that the licence, address, food-business category and online food-selling scope fit the operating entity.
- Razorpay Live KYC: **reported approved**; separately confirm the *owned production domain* / website approval, settlement configuration and enabled payment methods in Razorpay Dashboard.
- Domain: **already owned**, exact hostname and DNS ownership not supplied; no DNS updates performed.
- Budget: **low**; no upgrades or subscriptions purchased.
- Restaurant facts: **pending**. Therefore no live orders or payment initiation.

## Actual connected staging audit (read-only)
- Supabase `mane-oggarane-dev` project `zkowkikjsrfqqqsfrfwv` is healthy and contains 32 active dishes.
- Public store settings currently have **no support phone, pickup address or opening hours**; **all 32 dishes lack descriptions** (though images exist). Prices/photos must still be approved as genuine.
- Delivery is off; there are zero active delivery PIN zones. Keep **pickup-only** at initial launch unless fulfillment is staffed and delivery zones reviewed.
- `pg_cron` is not installed; prior `008_expired_reservation_cron.sql` remains **unapplied** because a tool safety check blocked activation.
- Supabase Security Advisor: backend-only tables have RLS with no client policies; that is an intentional denied-by-default pattern subject to grants audit. **Leaked-password protection disabled**: owner should review Auth settings for the actual production project.
- The real ₹145 Razorpay **Test Mode** payment and full refund, plus idempotence/expiry/partial refund rollback-only SQL checks, already passed. These are not live-provider tests.

## Isolation design — DO NOT reuse staging data or secrets
1. Keep the existing GitHub repository and baseline `baseline/staging-final-qa-v1-2026-10-24`. Keep existing Vercel Authentication ON and dev Supabase project unchanged.
2. When authorized, provision a **separate Supabase production project** under the correct business owner; choose an appropriate data region, plan, backup policy and spending cap. Do not use the staging project `zkowkikjsrfqqqsfrfwv`.
3. Review and apply migration files `001` through `007` **in numerical order** to the *new empty database*. Do not copy staging Auth users, test customer contact details, orders, payments, coupons/points or API keys. Import only an approved real menu and necessary legitimate configuration. The sample menu seed must be reviewed for realistic content.
4. Review the optional `008` expiry-cron migration in the **new production DB** and schedule `expire_abandoned_orders()` every 15 minutes only with authorized approval. Confirm `cron.job` and job run history; devise incident handling for captured payments arriving after expiry.
5. Configure the business-controlled owner account, staff roles, SMTP/email reliability, Auth site/redirect URLs, MFA/security settings, RLS/grants, backups/restore drill and uptime/error alerts. Put secret credentials only in the production host/project secret stores.
6. Use a **different commercial-use-permitted hosting project**, separately from protected staging, with a domain you own. Attach DNS only after preflight and business review. For a public coming-soon site, set `MNO_SITE_PHASE=prelaunch` and `NEXT_PUBLIC_SITE_PHASE=prelaunch` for the server and build environments.
7. In **prelaunch** the source displays a coming-soon checkout message and blocks checkout, booking requests, rewards redemption and owner refund initiation at the server. Existing staging defaults are unchanged. Public account registration and profile editing are not fully suppressed by this gate: **disable public signup in production Supabase Auth settings until approved** if you want a strictly read-only site. The owner can still configure the back office.
8. Run `npm run qa:source`, `npm run typecheck`, `npm run build` and `npm run qa:prelaunch` with environment variables securely sourced from the **future production environment**. The preflight deliberately fails until the real isolated host/domain/project information exists. It prints check labels, never secret values.
9. Do NOT generate/install Razorpay Live keys at this stage. This repository's provider helper explicitly rejects non-`rzp_test_` keys. The existing Supabase webhook `razorpay-test-webhook` is TEST only and must not be repointed to live. A **separately reviewed production payment receiver** with live-key scoping, signature checks, retries, dedupe, monitoring and a controlled live capture/refund acceptance run is still required.
10. Only after business policies, licensed operation scope, real menu, domain verification, email, backup, cron, hosting compliance, payment security and final sign-off are complete should the team propose a separate explicit live-activation release. Neither setting a variable nor attaching the domain bypasses those requirements.

## Mandatory business information still owed by restaurant owner
| Field | Why it matters |
|---|---|
| Exact owned hostname / DNS provider | Configure domain and HTTPS without touching staging |
| Legal operating name and correct FSSAI licence/category | Public disclosures and compliance review |
| Pickup/kitchen public address, opening hours, support phone/email | Customer collection, contact and dispute resolution |
| Verified actual menu, photos, prices, availability, descriptions and allergens | No misleading orders, accurate food safety information |
| Pickup lead time, cancellation cutoff, refund timing, refund contact and terms | Razorpay/consumer expectations; replace placeholder `/policies` |
| GST/tax handling as advised by accountant, delivery decision and responsible staff | Correct totals, lawful invoicing and fulfillment |
| Privacy notice, retention, grievance contact and real email SMTP | Responsible handling of customer records |
| Domain website verification and live payment methods/settlement approved in Razorpay | Live enablement prerequisites |

The `/policies` page currently contains **starter placeholders**, NOT approved legal notices. These cannot be invented from the staging project and must be finalized by the actual business.

## Cost-aware hosting recommendation (current published list prices, before taxes/usage)
- **Least migration risk:** Vercel **Pro $20/month** for commercial Next.js hosting and Supabase **Pro from $25/month** for production data backups/availability: **about $45/month baseline** before local taxes, usage, domain renewal, email and Razorpay fees. Commercial use is not permitted under Vercel Hobby. Free Supabase projects may pause from inactivity and lack managed backups.
- **Lower-cost alternate needs separate testing:** Cloudflare Workers can host full-stack Next.js with adapter/vinext compatibility work, but the current project (Next.js 15 + Node crypto + server routes) has not been compatibility-tested. Do not migrate the live checkout blindly to save a fee.
- Keep **staging on existing no-cost tools** only if their terms permit the private noncommercial staging use. No paid plan purchase has been made.

Pricing references: [Vercel Pro](https://vercel.com/pricing), [Vercel Hobby terms](https://vercel.com/docs/plans/hobby), [Supabase pricing](https://supabase.com/pricing), [Supabase backups](https://supabase.com/docs/guides/platform/backups), [Cloudflare Next.js options](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/).

## Manual final sign-off conditions
- [ ] Owner provides exact hostname, business address/hours/support, real menu, ingredients/allergens and approved legal policies.
- [ ] Licence and Razorpay production-domain/settlement coverage verified by owner.
- [ ] Separate paid/commercial-compatible production infra provisioned with backups, DNS, SMTP, secrets and monitoring.
- [ ] Prelaunch preflight passes, private staging remains protected and unchanged.
- [ ] Database expiry Cron operational and provider-failure, duplicate, partial-refund and loyalty edge cases independently accepted.
- [ ] New live payment integration reviewed, live test transaction and refund reconciled, provider dashboard settlement verified.
- [ ] Authorized owner explicitly approves public ordering and live collections.

**Release rule:** This changes the *code's readiness and guardrails*, not the current public availability. NO real charges. NO automatic live flip. NO DNS changes. NO new projects/subscriptions or database schema changes in existing staging.
