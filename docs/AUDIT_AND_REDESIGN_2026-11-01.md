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

---

## Round 2 (same day) — business content, payment safety, chatbot, retention, sales packaging

| Area | Change | Status |
|---|---|---|
| Business details | Hours (Mon–Sun 9 AM–10 PM), Jigani address saved in `settings`; `lib/business.ts` reads them; blank phone/email/FSSAI are hidden, never faked | Applied to staging DB + migration 011 |
| Menu | Researched descriptions for all 32 dishes (style only; no allergen/nutrition claims) | Applied to staging DB + migration 011 |
| Policies | `/terms`, `/privacy` (DPDP Act basics), `/refund-policy` (5–7 working-day refunds), `/delivery-policy`, `/contact`, `/policies`; footer links — the five pages Razorpay checks | Code |
| Finding #1 cleanup | `/api/cron/expire` now **checks Razorpay before releasing** each expired order (captured → mark paid; none → release; API error → retry next run). Vercel Cron daily 02:00 IST (`vercel.json`) | Code; runs after merge to production |
| Finding #2 late capture | `mark_order_paid` honours late payments while reservations are still held; once released, payment goes to new `payment_reviews` table (webhook returns 200, no infinite retries). Owner sees and resolves them in **Growth & retention** | Migration 012 applied; Supabase webhook redeployed (v5); Next.js routes in code |
| Finding #3 drift | Migration 010 mirrors the live ₹40 / free-above-₹100 checkout function | Repo |
| Finding #4 coupon wildcard | `%`/`_` escaped in the quote API | Code |
| Finding #7 RLS perf | `auth.uid()` wrapped in `select` on 4 policies | Migration 013 applied |
| Chatbot | Free rules-based assistant (`lib/assistant.ts`, `/api/assistant`, `KitchenAssistant`): live menu, PIN check, fees, hours, address, ordering, payments, refunds, rewards, login help, signed-in customer's own latest order; refuses secrets; rate-limited 40/10 min (migration 014); no transcripts stored | Code + migration applied |
| Retention | Owner **Growth & retention** tab (7/30/90/365 days): new/returning, repeat rate, AOV, revenue, 2nd-order conversion, inactive 30/60, points, coupons, campaign-attributed sales (labelled as attribution, not lift), top dishes, Test Mode warning | Code |
| Customer | "Order again" on past orders; saved-address picker at checkout | Code |
| Sales | `docs/SALES_KIT.md`, `docs/CLIENT_ONBOARDING.md`, `docs/DEMO_AND_SAAS_ROADMAP.md`; `NEXT_PUBLIC_DEMO_MODE` banner | Docs/code |

**Verified:** typecheck; build incl. qa:source 30/30 + qa:logic 8/8; payment SQL suite (incl. new late-capture cases) executed on staging inside a forced rollback — all passed; 40-question chatbot battery; Playwright chat/basket/Esc/mobile placement; no overflow 320–1600 px on all new pages.

**Still needed from the owner:** support phone + email (refund/cancel policy points customers to them), FSSAI number before live payments, Preview env vars on Vercel to test the PR preview with real data.
