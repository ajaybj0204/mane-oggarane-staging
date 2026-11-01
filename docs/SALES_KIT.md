# Sales kit — Restaurant Direct Ordering & Customer Retention

_Use Mane & Oggarane as the live demo. Sell the outcome — **own your customers and stop paying 20–30% on repeat orders** — not "a website"._

## 1. The pitch in one breath
> "Swiggy and Zomato are great for *finding* new customers, but you pay them 18–28% (plus GST, ads and discounts) every time the *same* customer orders again. I give you your own branded ordering site with rewards and a customer dashboard, so regulars order directly from you. You pay a small monthly fee, not a commission."

## 2. Why owners care (use their numbers)
Aggregator base commission is typically **18–25%**, plus 18% GST on the commission, plus ads, packaging and co-funded discounts — many owners lose **30–40%** of an order's value. Razorpay's standard fee on direct orders is **2% + GST (~2.36%)**.

**Worked example (fill in with the owner's figures):**

| | Aggregator | Direct (this product) |
|---|---|---|
| 20 repeat orders/day × ₹350 × 30 days | ₹2,10,000 | ₹2,10,000 |
| Commission 22% + 18% GST | − ₹54,516 | — |
| Payment gateway 2.36% | (inside commission) | − ₹4,956 |
| Your monthly fee (Growth plan) | — | − ₹2,499 |
| **Kept by restaurant** | **₹1,55,484** | **₹2,02,545** |

Difference ≈ **₹47,000 / month** on just 20 repeat orders a day. Be honest about the catch: for direct delivery the restaurant needs its own delivery staff or a hyperlocal partner (Porter, Rapido, Shadowfax, etc.) — pickup orders have no delivery cost at all.

## 3. Packages (recommended launch pricing)

| | **Starter** | **Growth** ⭐ | **Pro** |
|---|---|---|---|
| One-time setup | ₹14,999 | ₹24,999 | ₹39,999 |
| Monthly | ₹1,499 | ₹2,499 | ₹3,999 |
| Branded ordering site (menu, basket, checkout, tracking) | ✓ | ✓ | ✓ |
| Razorpay online payments + refunds | ✓ | ✓ | ✓ |
| PIN-code delivery zones & pickup | ✓ | ✓ | ✓ |
| Owner dashboard (orders, menu, prices, sold-out) | ✓ | ✓ | ✓ |
| Policy pages (Razorpay-ready) | ✓ | ✓ | ✓ |
| Loyalty points, rewards & coupons | — | ✓ | ✓ |
| Growth & retention dashboard | — | ✓ | ✓ |
| Kitchen assistant chatbot | — | ✓ | ✓ |
| Custom design from the restaurant's own photos | basic | ✓ | ✓ premium |
| Monthly report + 30-min strategy call | — | — | ✓ |
| Support | WhatsApp, 48 h | WhatsApp, 24 h | Priority, same day |

**Launch offer ideas:** first 3 restaurants get setup at 50% in exchange for a testimonial; or "first month free, cancel anytime". Annual prepay = 2 months free.

**Your costs per client** (keep margins healthy): you need **Vercel Pro (~$20/month per seat; one seat can host many client sites)** because Vercel's free plan forbids commercial use, and **Supabase Pro ($25/month per organisation, plus about $10/month compute per extra project)** because free projects pause after 7 days of inactivity. With a shared org that is roughly **₹850–1,000 per client per month** plus ~₹3,800 fixed. Razorpay fees are paid by the restaurant from its own account.

## 4. 15-minute demo script
1. **Homepage (1 min)** — "This is *your* brand, in Kannada and English." Show the hero and stories.
2. **Menu (3 min)** — Veg/Non-veg toggle, filters, search, add dishes, leaf basket. On a phone: sticky basket bar.
3. **Chatbot (2 min)** — Ask "Do you deliver to 560102?", "dishes under ₹150", "how do rewards work". It answers from *their* live menu and rules — no AI subscription.
4. **Checkout (3 min)** — Sign in with Google → bill preview → Razorpay **test** payment (card 4111 1111 1111 1111). "Prices are always recalculated on the server — nobody can tamper with them."
5. **Tracking (1 min)** — live status timeline.
6. **Owner dashboard (4 min)** — kitchen orders → change status; mark a dish sold out; **Growth & retention**: new vs returning customers, repeat rate, inactive 30/60-day lists, coupon results.
7. **Close (1 min)** — "Every customer who orders here becomes *your* customer: name, phone, history. Want me to set this up with your menu this week?"

## 5. Objection handling
- **"Customers won't leave Swiggy."** — Don't ask them to. Keep aggregators for discovery; put a QR card in every aggregator bag and on tables: "Order direct next time, get 10% off + reward points."
- **"I don't have delivery boys."** — Start with pickup + 2–3 nearby PIN codes, or use a hyperlocal partner per order.
- **"Too expensive."** — It pays for itself with roughly 3–4 repeat orders a day (show the table).
- **"Is payment safe?"** — Razorpay is RBI-authorised; card/UPI details never touch the restaurant's server.
- **"Who owns the data?"** — The restaurant. Their own database, exportable any time.

## 6. What the restaurant must provide before going live
FSSAI licence number (legally required for online food sales), GSTIN if registered, bank account + KYC for Razorpay, support phone/WhatsApp + email, menu with prices and photos, delivery PIN codes and fee rule, opening hours, logo.
