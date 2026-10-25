# Mane & Oggarane: approved delivery and promotion policy

Owner decision (October 2026):
- Delivery service area: at most **15 km straight-line radius**, in all directions from the restaurant in Jigani. Precise restaurant coordinates and reliable customer destination coordinates must be verified before eligibility can be enforced.
- Delivery fee: **₹40 for eligible merchandise subtotals at or below ₹100**.
- **Free delivery for eligible merchandise subtotals strictly above ₹100**.
- Promotions: **no new discounts active** until owner creates genuine product-specific offers with a complete server-validated pricing model.
- Google sign-in: wanted, but keep disabled/unverified as a customer promise until Supabase Google provider credentials and redirects are configured and tested.
- Keep SMS and other unconfigured chargeable services off.

This change records `delivery_radius_km=15` and `delivery_base_fee_paise=4000`, and implements the amount policy on the read-only quote API and atomic Postgres order creator. It intentionally **does not** turn on delivery: the current database has zero zones and PIN-only lookup is not a reliable 15-km validation. Broadly activating an entire postal area would allow out-of-radius addresses. Do not use an unverified client-reported GPS value as proof of delivery eligibility.

Before enabling deliveries, implement server-side location validation using confirmed restaurant origin and destination coordinates or a sufficiently trusted address-resolution service, plus an enforceable fail-closed distance check in both quote and order creation. Verify boundary tests (inside, exactly 15 km, outside), geocoding failures, and fee thresholds ₹99/₹100/₹101. Delivery remains disabled pending this service-validation step.

Run repository `npm run qa:source`, `npm run qa:logic`, `npm run typecheck`, and `npm run build`. Apply migration 010 to a backed-up environment and check SQL function definitions and rollback before live rollout. No live payment keys are authorized.
