# Safe public demo + SaaS roadmap

## Part A — Safe public demo for restaurant owners

**Goal:** a link you can send to any owner that works without logins to Vercel, takes no real money, exposes no real customer, and can't be broken by strangers.

**Setup (free / near-free):**
1. **Separate Supabase project** `mane-oggarane-demo` (2nd free project; free tier allows two active projects — keep it awake with a weekly visit or an uptime ping, since free projects pause after 7 days idle).
2. **Separate Vercel project** `mane-oggarane-demo` from the same repo, **no deployment protection**, env `NEXT_PUBLIC_DEMO_MODE=true`, Razorpay **Test Mode** keys only. The code already refuses live keys.
3. Seed demo data only: the menu, 3 rewards, 2 coupons, ~40 fictional customers and ~150 fictional test orders spread over 90 days so the Growth dashboard has realistic shape. Use `@example.invalid` emails and 99999-prefixed phone numbers.
4. **Customer side:** anyone can sign up and pay with test card `4111 1111 1111 1111`. A demo banner says no real orders or payments happen.
5. **Owner side:** do **not** give strangers an owner account. Two safe options:
   - *Guided:* you run the owner dashboard during the call (screen-share or your phone).
   - *Self-serve:* create a `demo-owner@…` account with the **manager** role on the demo project only, and reset the demo database nightly (re-run the seed). Everything they change disappears by morning.
6. Never copy real customers or real orders into the demo project.

**Approval needed from you:** creating the second Supabase + Vercel projects (both free), and choosing guided vs self-serve owner access.

## Part B — SaaS roadmap (after 3–5 paying single-tenant clients)

**Phase 1 — Productised single-tenant (now).** One codebase, one deployment per client, config in `settings` + `lib/business.ts`. Lowest risk; each client's data is physically separate.

**Phase 2 — Configuration-driven (next).** Move every client-specific value (branding, colours, copy, Kannada lines, delivery fee rule, PIN codes, tax) into the database and a theme JSON so a new client needs **no code change**. Add a one-command provisioning script (create Supabase project, run migrations, set env, deploy).

**Phase 3 — Multi-tenant SaaS.** Only when onboarding volume justifies it:
- Add `restaurant_id` to every table; **RLS on every table keyed by tenant + role**; all RPCs take and check the tenant.
- Tenant resolution by subdomain/custom domain (Vercel middleware).
- Per-tenant Razorpay via **Razorpay Route / partner (sub-merchant) accounts** so money settles to each restaurant, never through you.
- Self-serve signup, plans and billing (Razorpay Subscriptions), usage limits, admin console for you.
- **Security review before launch:** cross-tenant isolation tests in CI, penetration test, DPDP processor agreement with each restaurant (you become a data processor).
- **Cost:** one Supabase Pro org + compute sized to load; Vercel Pro. Cheaper per client than single-tenant at scale, but a single bug can now leak data across restaurants — which is why this phase waits.

**Recommendation:** sell Phase 1 now, build Phase 2 while onboarding clients 2–5, start Phase 3 only with steady demand.
