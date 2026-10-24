# Mane & Oggarane — Upgrade implementation checkpoint (2026-10-24)

## Architecture audited
Next.js 15 App Router, React 19, TypeScript, Supabase Auth/Postgres, Razorpay Test Mode, Vercel. Existing `products.veg`, menu API, customer account, inventory and coupon reservation order RPC are reused. Staging and production-prelaunch have distinct phase gates.

## Implemented in PR #7
- Persistent Veg / Non-Veg / Both choice shared by home and menu (local browser preference; no change to identity records).
- Menu search, availability, category, and Under ₹150 selection use the existing server-provided `price` and explicit `veg` field.
- Homepage featured dishes and category images respect food preference.
- Food choice available on account page.
- Google OAuth entry through existing Supabase Auth; **not functional without enabling provider/callback configuration**, and not a substitute for SMS OTP.
- Source regression assertions added; Vercel builds must be checked before merging.

## Not yet implemented or externally configured
- SMS OTP: not included in this release; requires a working provider, verified OTP flow, cooldown, and complete abuse testing before shipping.
- Google OAuth: enable Google provider, configure credentials and allowed redirect URLs, then test callback.
- Promotions and offer pricing: existing coupons apply at checkout but do **not** implement product-specific original/offer prices. Do not advertise a sample '50% off Durne Biryani' as live without verified product, image and admin-configured discount rules.
- Free delivery above ₹100: currently delivery zones determine fee. Server-side checkout RPC requires a reviewed additive migration and delivery eligibility design. Do not claim free delivery is active.
- Address book, saved dishes, feedback and appearance: no schema/API rollout in PR #7. Secure RLS and migration required.
- Full non-reserving quote stage: checkout currently creates a pending DB order and Razorpay provider order when 'Review final bill' is clicked. Do not claim this is only a quote. This requires a pricing preview API/RPC that does not reserve stock/coupon, and fresh atomic validation before placing order.
- Mobile payment and authentication browser E2E QA is pending.
- Under ₹150 currently uses product base selling price only; promotion-price eligibility awaits authoritative item-offer architecture.
- This application is currently a **single-restaurant** deployment, not a production-safe multitenant SaaS.

## QA and rollout
From repository root: `npm ci`, `npm run qa:source`, `npm run qa:logic`, `npm run typecheck`, `npm run build`.
Only merge after a green preview build and scenario testing. Keep the separate existing rollback point. No database migrations executed and no environment variable values changed under PR #7.
Read `docs/PAYMENT_STAGING_RELEASE.md` and `docs/FINAL_STAGING_QA_2026-10-24.md` for existing payment release limits.
