# Mane & Oggarane — Owner-information prelaunch release

**Prepared:** 24 October 2026  
**Status:** DRAFT PR, no merge, no domain cutover, no live charges, no changes to existing Supabase staging data.

## Owner-supplied public facts

- Brand / public restaurant name: **Mane & Oggarane**.
- Pickup address: **APC Circle Road, Jigani Industrial Area Phase 1, Ittina Nagar, Jigani, Anekal Taluk, Bengaluru, Karnataka 560105**.
- Operating hours provided as every week 8 AM–10 PM; displayed for planning as **daily, 8:00 AM–10:00 PM IST**. This assumes all seven days; owner should confirm holidays/exception days before opening.
- Public support email: **explorexplorer02@gmail.com**; no business telephone number was supplied.
- **Pickup-only**; no delivery or table reservations.
- Owner reports **32-dish menu approved**. A read-only staging snapshot of product names, ₹ prices, categories and veg flags is stored in `lib/approved-prelaunch-menu.ts` for the prelaunch menu. Images, stock, descriptions and allergens are not imported. All 32 prior descriptions were blank. Do not imply recipe/allergen approvals or rights to staging's third-party images.
- Owner reports **business policies approved**, but exact approved refund/cancellation, privacy, grievance and retention **wording/documents** were not supplied. `/policies` accurately labels existing content as placeholders; do NOT claim approved policy text is published.
- Owner reports **FSSAI approved** and Razorpay Live KYC approved; exact licence number, registered legal entity, applicability to online food sales and Razorpay activation of the intended website/domain were not independently validated.

## Critical domain clarification

Owner wrote **Explorexdeals** as the owned domain. This is a **label, not an actionable fully qualified domain name**. Exact suffix such as `.com` or `.in`, domain registrant control and whether it is intended as the restaurant's public identity must be confirmed. **Do not infer, invent, purchase or configure DNS** from this incomplete hostname.

## Source changes (only active when NEXT_PUBLIC_SITE_PHASE=prelaunch)

- Home: branded **Opening Soon** panel with actual owner-supplied public pickup details, hours and email; no online-order CTA or loyalty promise.
- Menu API: if **both** `MNO_SITE_PHASE=prelaunch` and `NEXT_PUBLIC_SITE_PHASE=prelaunch`, serve the approved 32-item read-only *preview* without contacting or copying the development database or credentials. This is not a production checkout catalog/seed.
- Menu UI: show dishes and prices, but no add-to-basket control, cart or checkout link; explicitly state that descriptions/allergens are pending.
- Navigation: public prelaunch nav hides basket, signup/account entry, reward and order CTAs; preserves owner/staff links for authorized roles.
- Booking and account creation: public prelaunch UI hides booking form and signup option; server-side booking and payment entry points were already blocked by the prior release. **Disabling public signup at production Supabase Auth is still essential** because direct Auth API signup bypasses UI.
- Footer/policies: show email, location, hours and pickup-only notes in prelaunch; still call out unfinished policy text.
- Existing Vercel private staging stays on existing settings and unchanged routes. None of these content changes are in `main` until explicitly reviewed/merged.

## Strict launch gates — no payments or public cutover

1. Confirm exact **hostname including TLD** and owner control; approve its use for this restaurant. Check domain/website approvals in Razorpay Live and identity-consistent branding.
2. Obtain the **actual approved policy text** (refund/cancellation timing, privacy, data retention, consumer grievance contact, returns, food issues) and FSSAI disclosure details. Do not invent approved language.
3. Confirm operating hours every day including holidays/closing dates, support arrangements, and pickup readiness, staff, lead times. FSSAI and Razorpay status are user-reported.
4. Review all **32** dish prices (₹), availability, actual descriptions, allergens, photographs/usage licences and tax handling; only then authorize an import into a separate production database.
5. Provision **commercially permitted** independent production hosting and a separate production Supabase project only after budget approval. Do not reuse `zkowkikjsrfqqqsfrfwv` or test keys. Configure separate secrets, backup/restore, MFA, SMTP, monitoring, table grants/RLS and the expired-order cleanup job. No such production environment was created in this PR.
6. Set both prelaunch phase flags and run `npm run qa:prelaunch` with a valid production HTTPS FQDN and separate production Supabase credentials. Public registration should remain disabled until final readiness.
7. Razorpay in existing code remains **test-only**. A separate reviewed live payment + webhook integration, refund reconciliation and a controlled provider E2E transaction are required before final owner authorization to accept any paid orders. No live keys are deployed or accepted here.

**Approval scope:** this release prepares a read-only *coming-soon* site and verified public contact information, not a fully approved restaurant opening. No new billable infrastructure, DNS, user signup, paid orders or refunds were initiated by this work.

**References:** [prior production handoff](PRODUCTION_PRELAUNCH_HANDOFF_2026-10-24.md) and [final staging QA](FINAL_STAGING_QA_2026-10-24.md).
