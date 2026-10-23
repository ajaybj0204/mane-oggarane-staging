# Mane & Oggarane — Integrated Upgrade Guide

**Audience:** Windows 11 / VS Code / Next.js. **This is ONE complete source replacement, not a series of demo stages.**

## What changed

- **Owner-only nav:** the "Owner" header tab is only rendered for a Supabase-verified `owner` role; managers/kitchen/riders see "Staff Console" instead; customers see neither. Server-side staff authorization remains enforced. Manually visiting `/owner` as a customer displays a staff-only access page with NO management data.
- **Order tracking:** `/orders` shows a signed-in customer's complete recent order history; `/track?id=...&token=...` now has distinct pickup/delivery status timelines, order items, payment status, and refresh every 15 seconds when visible. Customers can access tracking from the header, footer, checkout confirmation, and My Account. Guests can reopen their last order while the checkout browser session remains active. No fake GPS/ETA.
- **Food storytelling / 3D:** enhanced moving kadai/spices/steam and a Kannada cooking-story section. Original user-supplied Stitch references are preserved. This is a stylized 3D scene, NOT a photorealistic 3D scanned kitchen or actual cooking-video animation.
- **Retention Studio:** audience choices, server-side audience validation and coupon editing validation. Existing dashboard supports campaign drafts, customer segments, reward redemption, consent and coupons. It does **not** send WhatsApp/SMS messages.
- **Delivery:** owner can configure PIN codes, charges and minimums. Delivery orders progress through placed → accepted → preparing → ready → out_for_delivery → delivered. Pickup orders do not show out_for_delivery. Customer timeline auto-updates by polling.
- **Razorpay:** existing Test Mode order capture and signature verification remain; failure and pending UX is explicit. The refund endpoint now refuses live refunds unless `RAZORPAY_ALLOW_LIVE_REFUNDS=true`, claims one refund request per order, and avoids blind retries. Signed webhooks reconcile processed refunds against Razorpay totals and update/refund loyalty points when possible. If points were already spent, it records manual review instead of silently allowing a negative balance.
- **Offline QA:** `npm run qa:source` and `npm run qa:http` (the latter tests the running local app without authorizing payment or sending refunds).

## 1 — Safely update your local project (most important)

**DO NOT DELETE YOUR WORKING `.env.local` OR CHANGE ANY API KEYS.**

1. Stop both Next.js instances: in their VS Code terminals press `Ctrl + C`. Keep one instance only, preferably on `localhost:3000`.
2. Open your current project folder in Windows File Explorer. **Copy `.env.local` to a private location** outside the project, e.g. an unshared Desktop folder. Never upload it here, to GitHub, or to a chat.
3. Rename the current project folder to `Mane_Oggarane_Backup` (this preserves your current work and lets you roll back).
4. Extract **`Mane_Oggarane_Integrated_Upgrade.zip`**. It contains a folder `Mane_Oggarane_Integrated_Upgrade`. Open that folder in VS Code (the folder with `package.json`).
5. Copy **only your `.env.local`** from the private backup into the upgraded project root beside `package.json`.
6. In VS Code terminal in the NEW folder, run `npm install`, then `npm run dev`. The upgraded project pins Next.js 15.5.28 and React/React DOM 19.1.10 to incorporate the October 2026 security patches. Update these deliberately after testing. Use the printed Local URL. If it is 3001, change `NEXT_PUBLIC_APP_URL` and Supabase Auth Site/redirect URLs to match as needed.
7. Verify `/menu`, `/orders`, `/owner`, and `/track` (via an order in My Account). Do not reuse stale cache from the old running server.
8. `npm run qa:source` and `npm run typecheck` then `npm run build`. The full build must pass on your Windows installation before considering deployment.

**Existing Supabase data persists.** Replacing files in VS Code does not delete your Supabase database. Your two already verified orders and reward balances remain there.

## 2 — Database upgrade

**Already completed via connected Supabase plugin for your existing `mane-oggarane-dev` project:**

- Migration `refund_safety_and_loyalty_reconciliation` (source `supabase/migrations/007_refund_safety.sql`) successfully applied and its table/function verified.
- **Do not re-run the original 001–006 schema or seed files**, or you'll get duplicate objects/seed rows.
- For a **different new database**, first apply `001` through `006`, then `007` once.

## 3 — Test Owner-only navigation

1. In your normal Chrome profile, sign in as your actual owner account; the **Owner** header tab should be visible.
2. Open an Incognito Chrome window and sign in as a normal customer. Confirm **Owner is absent** and **Track Order is present**.
3. As customer, manually type `/owner`: you should see a polite staff-only access page, not order/customer data.
4. In Incognito, enter `/api/admin/orders` directly: expected HTTP 403. Never trust header visibility as the authorization mechanism.

## 4 — Test customer order tracking

1. Customer: go to `/orders` and open the most recent order. The tracking page shows product list, total, payment state, and a status timeline.
2. Owner: go to `/owner` → **Kitchen orders**. Use an **uncompleted Razorpay TEST order** and transition through only the offered next statuses.
3. Customer: keep the tracking page open. It refreshes about every 15 seconds when visible, or click **Refresh status**. Pickup should show ready → delivered; delivery adds out_for_delivery. No fake GPS map/arrival ETA.
4. To validate privacy, tracking with a missing/wrong token must return HTTP 400/404; unprivileged users must not see someone else's order history.

## 5 — Test Delivery Zones (owner must set real test values)

**Current connected project's delivery is disabled and has zero PIN zones.** We deliberately did not choose your delivery territory.

1. Owner → Delivery zones → Add New. Use a genuine PIN code you want to TEST, e.g. only if it really belongs to your intended service area. Specify the delivery fee in **paise**: ₹40 → `4000`; minimum ₹200 → `20000`. Keep the zone active for the test.
2. Owner → Restaurant settings → Edit → enable **Delivery**; leave Pickup enabled and store Open. Save.
3. Customer cart ≥ minimum → Checkout → Delivery → use your test PIN and a valid test address. Razorpay must be in **Test Mode**.
4. Owner Kitchen Orders: accepted → preparing → ready → out_for_delivery → delivered. Assign an actual registered rider if available; otherwise no GPS tracking is implied.
5. Customer sees updated stages on `/orders` / `/track`.
6. Attempt a non-listed PIN: checkout must reject it before payment.
7. Turn Delivery OFF again if you're not ready to receive delivery orders.

## 6 — Test Retention Studio

**Currently zero coupons and zero campaigns; the development account has two sample loyalty rewards.**

1. Owner → Retention Studio: create a **draft** campaign with a segment such as `first_time`, `returning`, `inactive`, or `loyal`. Read the segment cards in Customer Segments. This drafts an offer; it **does not send messages**.
2. Owner → Coupons: add a TEST code and associate it with that campaign. For example fixed discount ₹20 → `value=2000` (paise), min spend ₹100 → `minimum_paise=10000`. Use an appropriate maximum usage, no promise to customers before testing.
3. Set the campaign Active once its audience/consent rules are reviewed, then test the code on an eligible **test** account. Test that an ineligible segment and expired/inactive code cannot claim the discount.
4. Verify order discount and coupon use counts. Coupon-attributed sales are **not proven incremental revenue**.
5. Earn points with paid completed test orders; in My Account, redeem a reward **only when point balance is sufficient**; confirm one-use reward code behavior.
6. Deactivate the test campaign/coupon after the test if not intended for customers.

## 7 — Test payment failures, refunds and security

1. Use **Razorpay Test Mode only**. Choose Razorpay's documented failed Netbanking/test flow; the website must NOT mark the order Paid and must offer tracking rather than forcing another charge.
2. Verify the existing payment signature checks and amount checking; never paste your Razorpay Secret or Supabase Secret into browser code.
3. To test refunds, choose a **new TEST order** that has been captured. Owner → Kitchen Orders → Request refund, accept the confirmation **once**. The API now writes an exclusive refund request record; duplicates return HTTP 409.
4. Razorpay's `refund.processed` webhook needs a publicly reachable test endpoint and matching separate webhook secret. A webhook will not reach `localhost` directly. Before real launch, test the webhook and ensure `payment_status` and loyalty ledger reconcile. Partial refunds are flagged for review.
5. No actual test refund was issued automatically as part of this upgrade. If no webhook reaches the local app, the refund remains pending confirmation; examine the provider dashboard.
6. Run `npm run qa:source`. While the local server runs, in PowerShell run `$env:BASE_URL='http://localhost:3000'; npm run qa:http` (change 3000 to 3001 if needed). All HTTP checks are unauthenticated negative tests and do not initiate payments/refunds.
7. Supabase security advisor currently warns **leaked-password protection is disabled**. Check [password security documentation](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) and enable it if your plan supports it. No unrestricted SELECT is granted for the refund_request table.
8. Before production: audit outdated Next.js/dependencies with `npm audit`, run typecheck/build, test unauthorized access, coupon race conditions, duplicate webhooks, refund retry, CORS/CSRF, rate limiting, mobile, accessibility, realistic delivery policies and Indian compliance requirements. `npm audit fix --force` can introduce breaking changes; review updates instead.

## Limits and honest production status

- The integrated ZIP is runnable **source**, not a claim of a fully tested production website. Here the dependencies couldn't be installed because of npm registry/network timeouts; therefore no full `next build`, real browser interaction, real Razorpay failure/refund, or live delivery order was completed for this upgraded version.
- The 14 automated **static acceptance checks passed**, and TypeScript/TSX syntax parsing passed for all 47 source files. These are not replacements for full build, role-based browser tests, or real payments.
- Your original two Test Mode payments/delivered orders totaling ₹745 and loyalty awards were independently verified in Supabase **before upgrade**. They are untouched.
- Real live agent messaging, live courier GPS/ETA, full multi-tenant isolation, formal penetration testing, and photorealistic animated cooking sequences are NOT included. Real cooking footage/models require separate licensed or custom assets. No image file is needed to test the functional changes.
