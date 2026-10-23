/** Safe offline acceptance checks. NEVER creates payments or sends refunds. */
import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');const file=p=>fs.readFileSync(path.join(root,p),'utf8');
const cases=[
 ['Customer nav excludes unconditional Owner link',()=>{const h=file('components/Header.tsx');assert.match(h,/isOwner&&<Link href="\/owner">Owner<\/Link>/);assert.doesNotMatch(h,/<Link href="\/owner">Owner<\/Link>(?!})/)}],
 ['Staff permissions remain server enforced',()=>{const a=file('app/api/admin/[resource]/route.ts');assert.match(a,/staffFromRequest\(req,roles\)/)}],
 ['Account-linked order history requires auth',()=>{const a=file('app/api/me/orders/route.ts');assert.match(a,/if\(!u\)return fail\('Sign in first',401\)/);assert.match(a,/\.eq\('customer_id',u\.id\)/)}],
 ['Tracking requires private token',()=>{const a=file('app/api/track/route.ts');assert.match(a,/\.eq\('tracking_token',token\)/);assert.doesNotMatch(a, /customer_phone|customer_email|\baddress\b/)}],
 ['Tracking timeline supports delivery and pickup',()=>{const s=file('lib/order-status.ts');assert.match(s,/out_for_delivery/);assert.match(s,/stepsFor/)}],
 ['Tracking uses background polling',()=>{const s=file('app/track/page.tsx');assert.match(s,/setInterval\(/);assert.match(s,/15000/)}],
 ['Server-side price calculation',()=>{const s=file('app/api/checkout/route.ts');assert.match(s,/rpc\('create_checkout_order'/);assert.match(file('supabase/migrations/006_stock_and_coupon_reservations.sql'),/v_product.price\*100/)}],
 ['Razorpay signature verified',()=>{const s=file('app/api/payments/verify/route.ts');assert.match(s,/verifyCheckout\(/);assert.match(s,/payment.status!=='captured'/)}],
 ['Razorpay webhook signature verified',()=>{const s=file('app/api/payments/webhook/route.ts');assert.match(s,/verifyWebhook\(/);assert.match(s,/confirm_provider_refund/)}],
 ['Refund requests have unique order guard and live-mode opt-in',()=>{const s=file('app/api/admin/orders/[id]/refund/route.ts');assert.match(s,/refund_requests/);assert.match(s,/RAZORPAY_ALLOW_LIVE_REFUNDS/);assert.match(file('supabase/migrations/007_refund_safety.sql'),/order_id uuid primary key/)}],
 ['Coupons validated in database',()=>{const s=file('supabase/migrations/003_campaign_coupon_audience.sql');assert.match(s,/coupon_is_eligible/)}],
 ['Loyalty points issued on delivery, once only',()=>{const s=file('supabase/migrations/001_full_platform.sql');assert.match(s,/if p_status='delivered'/);assert.match(s,/ledger_one_order_award/)}],
 ['Delivery zones enforce PIN and minimum',()=>{const s=file('supabase/migrations/006_stock_and_coupon_reservations.sql');assert.match(s,/delivery_zones/);assert.match(s,/minimum_paise/)}],
 ['Reduced-motion WebGL fallback',()=>{const s=file('components/HeroExperience.tsx');assert.match(s,/prefers-reduced-motion/);assert.match(s,/hero-fallback/)}]
];let errors=0;for(const [name,fn] of cases){try{fn();console.log('PASS',name)}catch(e){console.error('FAIL',name,e.message);errors++}}
console.log(`\n${cases.length-errors}/${cases.length} static acceptance checks passed`);process.exitCode=errors?1:0;
