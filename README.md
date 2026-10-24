# Mane & Oggarane — Integrated full-stack restaurant platform

**Production preparation (24 October 2026):** A separate public *prelaunch* build is now supported using `MNO_SITE_PHASE=prelaunch` and `NEXT_PUBLIC_SITE_PHASE=prelaunch`; checkout, bookings, reward redemptions and refund initiation are denied server-side. Existing private staging defaults are unchanged, and live Razorpay payments remain hard-disabled. See **[Consolidated Production-Prelaunch Handoff](docs/PRODUCTION_PRELAUNCH_HANDOFF_2026-10-24.md)**. Run `npm run qa:prelaunch` only after configuring a distinct production domain/project. This is **not** live-launch approval.


**Current status (24 October 2026):** the charcoal/saffron café redesign is deployed to private Vercel staging, Razorpay Test Mode captured-payment + full-refund flow was confirmed, and rollback-only database QA passed. **This is not production-ready/live-payment authorization.** See the [Final Staging QA Release](docs/FINAL_STAGING_QA_2026-10-24.md) for verified evidence and outstanding launch gates, including the **manually pending** pg_cron expiry schedule. The published app no longer mounts the old WebGL homepage experience.


## Payment-readiness batch · October 2026 (private Vercel staging)

The redesigned, 3D-free cafe UI has been deployed on protected Vercel staging. Its public Razorpay callback cannot pass Vercel Authentication. The separate Supabase Edge Function in `supabase/functions/razorpay-test-webhook/` is the intended signed **Test Mode** receiver. See **[PAYMENT_STAGING_RELEASE.md](docs/PAYMENT_STAGING_RELEASE.md)** for the consolidated setup, manual Supabase secrets, Razorpay dashboard webhook destination, and safe acceptance test matrix.

Run `npm run qa:source`, `npm run qa:logic`, `npm run typecheck`, `npm run build`, and (after configuring secrets) `WEBHOOK_TEST_URL=https://<your-project>.supabase.co/functions/v1/razorpay-test-webhook npm run qa:webhook`. This does not replace actual Test Mode signed webhook/refund verification. **Do not accept live payments yet.**


**Brand:** Mane & Oggarane (ಮನೆ & ಒಗ್ಗರಣೆ) · **Purpose:** flagship portfolio project and reusable restaurant technology foundation.

This repository integrates the **supplied Stitch screens/assets** with a Next.js customer storefront, a live Supabase/Postgres backend, Razorpay order and payment validation, owner operations, delivery/pickup, loyalty, coupons, customer segmentation and an interactive WebGL cooking-pot scene. This is a **source-code deliverable**, not a hosted deployment or a claim of completed live-payment testing.

## What is implemented

- Responsive Kannada/English homepage, animated three-dimensional WebGL tempering pot, CSS-3D curved culinary categories, accessible static/reduced-motion fallback, kitchen story, responsive 32-dish seed menu.
- Customer menu search/category filters, persistent browser basket, secure price-authoritative checkout, guest or registered orders, private tracking tokens, order history and tracking.
- Supabase email/password signup, profile, marketing consent, password reset, customer points ledger and redeemable one-use, customer-specific reward coupons.
- Razorpay provider-order creation, browser checkout, signature validation, canonical captured-payment status verification, signed webhook confirmation, idempotent marking of paid orders, refund requests and webhook states.
- Staff-role-checked owner console: restaurant settings, real menu create/edit/archive/restore, product-image upload/library, PIN-code delivery zones, order management, rider assignment, booking requests, coupons, loyalty rewards, campaign drafts, retention segments and analytics.
- Atomic Postgres RPC for item prices, coupon eligibility, inventory reservation, limited-coupon reservations, paid-order finalization, stock release on failure/expiry, staff-controlled order progression, loyalty credit on delivered orders only, points redemption.
- Imported Stitch HTML and image snapshots under `reference/` to guide further visual refinement.

## Status and limitations — READ BEFORE USING REAL MONEY

The source has passed **TypeScript/TSX syntax parsing**, file/route auditing, and JSON checks in the authoring environment. **npm packages could not be installed because registry network resolution was unavailable, so a full Next.js build and browser end-to-end test were not possible here.** None of your live Supabase/Razorpay accounts were connected. **Do not accept live customer payments until the deployment and payment paths are tested and signed off.**

- The 3D kadai is a functioning **stylized Three.js scene**, not a finished photorealistic Blender food-preparation cinematic. Curved gallery perspective uses CSS 3D and can be enhanced later using real footage/assets.
- Visual design is derived from Stitch, not a pixel-perfect reproduction of every exported HTML screen. Original Stitch screens are bundled in `reference/`.
- Real restaurant product photographs, exact prices, food safety/allergen information, business identity, operating hours, government compliance details, delivery locations, tax settings, terms/privacy/refund policies, and staff accounts **must be supplied/configured by the business owner**.
- Razorpay integration is designed for **test mode initially**; real fees and provider requirements apply to live transactions.
- Retention segmentation and coupon attribution are implemented; **no WhatsApp/SMS/email marketing messages are dispatched**. Campaigns record draft/status and can be associated with onsite coupons; external sending requires a separate opted-in provider integration.
- Multi-tenant SaaS account isolation has **not** been implemented. The code can be deployed for a single restaurant at a time; create separate Supabase projects/business configurations for separate clients.
- Table bookings are an owner-switchable **request flow**, not instant-confirmation inventory or paid reservations.
- Gross sales statistics are not accounting or net-of-refunds; aggregation has described recent-row limits.
- Late captures or chargebacks require reconciliation. Refunds after loyalty was already spent need a defined points-clawback policy/manual review. Configure alerts/provider dashboards to monitor them before going live.

## Local setup

1. Install **Node.js 22 or later**, and run `npm install` from this folder.
2. Create a new free-tier-compatible **Supabase project**. Copy `.env.example` to `.env.local`; enter your own Supabase URL, publishable/anon key, **private** service-role key, Razorpay **test** key/secret, independent webhook secret, a long `CRON_SECRET` and `RATE_LIMIT_SALT`.
3. Open Supabase **SQL Editor** and execute each file in `supabase/migrations/` **in numeric order**: `001` through `006`. `002` contains the illustrative 32 sample dishes and uses externally hosted Stitch food images. The schema is **single-restaurant**. Check errors between each script. The `storage` bucket for product images is created in `001`.
4. In Supabase Auth settings, enable email/password login and configure your site URL, allowed redirect URLs (including `/reset-password`) and email confirmation preferences. Use a real SMTP provider when needed for customer email deliverability.
5. Sign up with your OWN owner email at `/login`, then manually grant the first trusted owner from the Supabase SQL editor (replace the email string):

   ```sql
   update public.profiles set role='owner' where id=(select id from auth.users where email='owner@example.com');
   ```

   **Do not permit unverified users to appoint themselves owners.** There is no public owner-signup endpoint.
6. Set up Razorpay test keys. Create a webhook pointing to `https://YOUR-DOMAIN/api/payments/webhook`, with the **same separate webhook secret** you configured, subscribing to `payment.captured`, `order.paid`, `refund.processed`. Standard Checkout must capture payments in the expected mode. Test successful/failed/pending cases.
7. Configure automated order-reservation expiration: in Supabase enable the `pg_cron` extension when available and schedule `select public.expire_abandoned_orders();` every 10–15 minutes from a privileged context, **or** call `GET /api/cron/expire` on a trusted schedule with the `Authorization: Bearer <CRON_SECRET>` header. Without this, abandoned unpaid orders temporarily hold finite stock and limited coupons. Check cron availability/cost with your provider.
8. Start with `npm run dev`, browse `http://localhost:3000`, log in as owner, configure menu truthfully, store status, delivery PIN codes and prices. Restaurant settings default to pickup enabled, delivery disabled, booking disabled, zero taxes pending owner configuration.
9. Run `npm run build` and `npm run audit:project`, fix all errors, then conduct the test matrix below. Never put a service-role key, Razorpay secret or webhook secret in a client component or screenshot.
10. Deploy to a hosting platform supporting Next.js 15 App Router; configure the same environment variables server-side. Use HTTPS. Verify provider webhook can reach the public domain, and configure an error/incident alert channel.

## Product tour

| Page | Purpose |
|---|---|
| `/` | WebGL cooking-pot hero, Kannada storytelling and 3D curved kitchen cards |
| `/menu` | Shared backend menu, food categories, searchable basket |
| `/checkout` | Guest/customer details, delivery PIN checks, server-created Razorpay order |
| `/track?id=...&token=...` | Private order and verified payment status |
| `/login`, `/reset-password` | Supabase sign-in, signup and recovery |
| `/account` | Account settings, opt-in preference, order history, loyalty and coupons |
| `/rewards` | Earn/redeem explanation and link to actual balance |
| `/story` | Editable future family story, Kannada quotes |
| `/booking` | Disabled by default; request confirmation if enabled |
| `/owner` | Role-protected operations, Retention Studio and CMS |
| `/policies` | Owner-to-replace policy information, explicitly a placeholder |

## API routes

- `GET /api/menu`
- `POST /api/checkout`
- `POST /api/payments/verify`, `POST /api/payments/webhook`
- `GET /api/track?id=&token=`
- `GET/PATCH /api/me`, `GET /api/me/orders`, `POST /api/me/rewards`
- `GET/POST/PATCH /api/admin/[resource]` for supported resources; `GET /api/admin/segments`, `GET/DELETE /api/admin/media`, `POST /api/admin/upload`
- `POST /api/admin/orders/[id]/refund`
- `POST /api/bookings`
- `GET /api/cron/expire` (private bearer secret)

## Critical end-to-end test matrix (not yet executed)

- [ ] Install packages, run TypeScript checks and build successfully.
- [ ] Inspect homepage on mobile/desktop; verify accessible 3D fallback, performance and reduced-motion behavior.
- [ ] Run migration scripts on fresh database; confirm 32 sample dishes are visible from two browsers.
- [ ] Sign up with email confirmation, log in/out, reset password; confirm no customer can access admin APIs.
- [ ] Create, edit, replace image, hide and restore a dish; verify public menu refresh without redeploy.
- [ ] Test cart tampering and server price validation; prevent negative quantities, duplicate dish IDs, unsupported delivery PIN and exhausted coupon.
- [ ] Test real Razorpay **test-mode** authorized, captured, failed and abandoned orders, bad signature, webhook replay, duplicate provider payment, wrong amount and retry.
- [ ] Confirm reserved stock releases when provider creation fails or an unpaid order expires; confirm schedule works.
- [ ] Confirm restaurant/coupon/staff limits under concurrent checkout traffic.
- [ ] Test order lifecycle, rider assignment, only allowed transitions, refunds and payment settlement reconciliation.
- [ ] Confirm points never appear for unpaid or cancelled orders, never double-credit, reward codes are personal and single use.
- [ ] Review marketing opt-in changes, retention segment accuracy and coupon-attribution caveats.
- [ ] Have owner validate prices/photos/ingredients/tax, refund policies and business compliance before changing from test to live.
- [ ] Conduct independent threat modeling, API abuse tests, accessibility/performance audits, monitoring and disaster recovery checks before public launch.

## Zero-cost-first strategy

Free tool tiers can support prototyping, but Supabase, hosting bandwidth, verified messaging, actual payment processing, delivery, and business compliance may incur charges. This project does not require buying Blender or design software. Never promise indefinite zero running cost.

## Design reference files

- `reference/home-stitch-original.html`, `reference/menu-stitch-original.html`, `reference/owner-stitch-original.html`, `reference/loyalty-stitch-original.html`
- `reference/*-screen.png`, `reference/STITCH_DESIGN.md`
- `public/mane-oggarane-logo.png`

© Branding and exact final identity need owner and trademark review prior to public launch.

## October 2026 integrated upgrade

See **[UPGRADE_GUIDE.md](UPGRADE_GUIDE.md)** for replacing the existing Windows project without losing `.env.local`, testing staff-only navigation and live customer order tracking, test-mode payment/refund protections, delivery/retention test scenarios, and production limitations. Migration 007 is already applied to the connected `mane-oggarane-dev` project (do not reapply 001–006). Run `npm run qa:source` and `npm run qa:http` to test locally without initiating any charges.
