# Client onboarding — one restaurant, one isolated deployment

Each restaurant gets its **own Supabase project, own Vercel project, own Razorpay account**. Data, payments and staff are fully isolated. Target: live in **2–3 working days** once the owner sends the checklist items.

## Day 0 — Collect (send the owner this list)
- [ ] Restaurant legal/brand name, logo (PNG/SVG), brand colours if any
- [ ] Address, opening hours, support phone/WhatsApp, support email
- [ ] FSSAI licence/registration number (**required before live payments**), GSTIN if any, tax % to charge (0 if prices are tax-inclusive)
- [ ] Menu: name, category, veg/non-veg, price, photo, short description, allergens (kitchen-confirmed)
- [ ] Delivery PIN codes, fee rule (e.g. ₹40 up to ₹100, free above), pickup yes/no
- [ ] Owner + manager emails (for staff roles)
- [ ] Razorpay: owner creates their own account and completes KYC (bank account, PAN)

## Day 1 — Provision (≈2 hours)
1. **GitHub**: create the client repo from this template (`mane-oggarane-staging`) → `<client>-ordering`.
2. **Supabase**: new project in your Pro org, region **ap-south-1 (Mumbai)**. Run `supabase/migrations/001…014` in order. Delete the Mane & Oggarane seed menu (002) or replace it with the client's menu.
3. **Settings row** (`settings.key='store'`): name, address, hours, opening_time/closing_time, support_phone, support_email, fssai_number, tax_rate_percent, delivery/pickup flags.
4. **Delivery zones**: insert the client's PIN codes. If the fee rule differs, change it in **both** `create_checkout_order` (migration 010) **and** `app/api/checkout/quote/route.ts`, plus `DELIVERY_RULES` in `lib/business.ts`.
5. **Auth**: enable Google provider; set Site URL + redirect URLs to the client domain; turn on leaked-password protection (Pro).
6. **Storage**: upload dish photos to the `products` bucket (don't hot-link external URLs).
7. **Vercel**: new project from the client repo; set env vars for **Production and Preview**:
   `NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, RAZORPAY_KEY_ID (rzp_test_ first), RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, CRON_SECRET, RATE_LIMIT_SALT, NEXT_PUBLIC_APP_URL`.
8. **Branding**: replace `public/mane-oggarane-logo.png`, `public/theme/*` art, `BUSINESS_DEFAULTS` in `lib/business.ts`, homepage copy/Kannada lines, `app/layout.tsx` metadata.
9. **Webhook**: deploy `supabase/functions/razorpay-test-webhook` (verify_jwt=false) and point a Razorpay **Test Mode** webhook at it (`payment.captured`, `order.paid`, `refund.processed`, `payment.failed`).

## Day 2 — Test in Test Mode (≈1 hour)
- [ ] `npm run typecheck && npm run build` (runs qa:source + qa:logic)
- [ ] Run `scripts/final-payment-qa-rollback.sql` in the SQL editor — must end with the ROLLED BACK pass line
- [ ] Phone + desktop: browse, filter, add, sign in with Google, checkout delivery (valid + invalid PIN), checkout pickup, pay with test card, track order
- [ ] Delivery fee boundaries: subtotal ₹99/₹100 → ₹40, ₹101 → free (or the client's rule)
- [ ] Owner: accept → preparing → ready → delivered; check points credited; refund one test order
- [ ] Chatbot: hours, address, a PIN check, "dishes under ₹150", "track my order"
- [ ] Policy pages show the client's details; footer links work

## Day 3 — Go live (owner approval required in writing)
1. Owner confirms menu, prices, policies and FSSAI number on the preview.
2. **Live payments are deliberately blocked in code** (`lib/razorpay.ts` rejects non-`rzp_test_` keys). Enabling them is a reviewed, separate change: update that guard, the refund route guard, and switch the webhook to live mode. Never do this without the owner's sign-off.
3. Attach the custom domain in Vercel; update Supabase auth redirect URLs and `NEXT_PUBLIC_APP_URL`.
4. Submit the site + policy URLs in the Razorpay dashboard (Terms, Privacy, Refunds, Shipping/Delivery, Contact).
5. Hand over: owner login, staff roles, a 20-minute training call, the printable QR "Order direct" card.

## Monthly maintenance (what the subscription covers)
- Dependency + security updates; Supabase advisor check; Vercel error logs
- Review **Growth & retention → Payments needing attention** with the owner
- Menu/price/photo changes on request (within plan limits)
- Monthly report: orders, revenue, repeat rate, inactive customers, coupon results
