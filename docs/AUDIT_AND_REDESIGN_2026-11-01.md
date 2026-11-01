# Audit + heritage redesign — 1 November 2026

## Scope of this change
Visual redesign of the **header, homepage hero, "Stories from our kitchen" section and the menu/ordering page** to match the two approved reference images. No API routes, database functions, payment code or business rules were changed.

## What was inspected
- Repo `main` @ `0c3fc78` (Next 15.5.28, React 19.1.10, supabase-js 2.57), all 20 API routes, `lib/*`, migrations 001–009.
- Supabase `mane-oggarane-dev`: tables, RLS policies, function grants, extensions, migration history, live function definitions, advisors.
- Vercel `mane-oggarane-staging`: latest deployments and protection settings.

## Findings (verified unless marked otherwise)

| # | Severity | Finding | Evidence |
|---|---|---|---|
| 1 | P0 | **Abandoned-order cleanup never runs.** `pg_cron` is not installed (migration 008 was never applied) and `vercel.json` has no cron. Two orders (₹290, 24 Oct) are still `awaiting_payment` with expired reservations and Razorpay order IDs. | `cron.job` missing; `vercel.json`; orders query |
| 2 | P0 | **Late captured payments become a stuck webhook.** If a payment is captured after `reservation_expires_at`, `mark_order_paid` raises, the webhook returns 500, Razorpay retries indefinitely, and the money is captured against a cancelled order with no review queue. | `007/006` SQL, `payments/webhook/route.ts` |
| 3 | P1 | **Repo ↔ database drift.** The live `create_checkout_order` contains the ₹40 / free-above-₹100 rule (DB migration `delivery_fee_threshold_100_rupees`) but no repo migration contains it; repo migration 006 still charges the zone fee. A fresh client deployment from this repo would bill ₹40 even when the quote shows free delivery. DB migration history also lacks 001–006 and 008. | `list_migrations`, `pg_get_functiondef` |
| 4 | P1 | **Coupon lookup in the quote API uses `ilike` with raw input**, so `%`/`_` act as wildcards (e.g. `SAVE%`). Final checkout uses exact matching, so no discount can be obtained, but the quote can probe unknown codes or 503 on multiple matches. | `checkout/quote/route.ts` |
| 5 | P1 | **Dish photos are hot-linked from `lh3.googleusercontent.com/aida-public/…`** (temporary design-tool URLs). They should be moved into Supabase Storage before launch. | `products.image` |
| 6 | P2 | Leaked-password protection disabled (dashboard toggle; may require a paid Supabase plan). | Security advisor |
| 7 | P2 | 4 RLS policies call `auth.uid()` unwrapped (`orders`, `order_items`, `loyalty_ledger`, `profiles`) — performance only. | `pg_policies` |
| 8 | Info | 9 tables have RLS on with no policies — **intended** (server-only via service role). All 10 SECURITY DEFINER functions are executable only by `service_role`/`postgres`. Do not add public policies. | `pg_policies`, function ACLs |
| 9 | Info | All 32 dishes have no description; all use unlimited stock. | `products` |

## Redesign implementation
- `app/heritage-theme.css` — design tokens (palette, type, radius, shadows, grain) + all new `mo-*` components; legacy pages inherit the palette.
- Fonts are now **self-hosted** via `@fontsource` (Playfair Display, Plus Jakarta Sans, Baloo Tamma 2 for Kannada, Noto Serif Kannada). The render-blocking Google Fonts `@import` was removed.
- `public/theme/*` — scenery and decor cut from the approved references. The AI-rendered logo/text baked into the reference art was removed; the **official logo file** is overlaid and every word (including Kannada) is live Unicode text.
- Homepage: new arched hero (`HeroExperience`), new `KitchenStories` (photos come from live menu records by dish id → category). Remaining homepage sections kept and re-themed.
- Menu: same filtering/cart logic; new layout, dark dish cards, heart-save, quantity stepper, "Only N left" badge for limited stock, empty-search reset, parchment "leaf basket".
- Mobile (<1100px): sticky cart bar + accessible bottom-sheet basket (Esc / scrim to close, header Basket link opens it). Status strip now shows only for preview/error states.

## Tests executed
- `tsc --noEmit` ✔ · `npm run build` ✔ (includes `qa:source` 30/30 and `qa:logic` 8/8).
- Playwright against local dev + production build with a menu fixture (Supabase and the image host are not reachable from the build sandbox): add/stepper/subtotal (₹420 for 2×145+130), Under ₹150 filter, empty state + reset, basket persistence across reload, mobile cart bar, drawer open/Esc close, header basket → drawer, mobile nav.
- No horizontal overflow at 320, 375, 390, 430, 768, 1024, 1280, 1448, 1600 px on `/`, `/menu`, `/checkout`, `/login`, `/rewards`, `/orders`, `/account`.
- **Not executed here:** real Supabase menu/photos in the browser, sign-in, Razorpay Test Mode payment. Check those on the Vercel preview.

## Kannada copy to confirm with a native reader
Hero: ಮನೆಯ ಊಟ, ಪ್ರೀತಿಯ ರುಚಿ. · Section: ಅಡಿಗೆ ಎಂದರೆ ಪ್ರೀತಿಯ ಅಭಿವ್ಯಕ್ತಿ. · Cards: ಬೆಳಗಿನ ತಾಜಾ ತಿಂಡಿಯ ಸಂತಸ / ಸ್ವಲ್ಪ ಖಾರ, ತುಂಬಾ ಪ್ರೀತಿ / ಪ್ರತಿ ಗುಟುಕಿನಲ್ಲೂ ಮನೆಯ ಮಮತೆ. The card lines in the reference image were garbled AI text, so these were rewritten.
