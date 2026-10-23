/**
 * Mane & Oggarane read-only acceptance suite (2026-10).
 * Place in your EXISTING Next.js project root, beside package.json.
 * Run with an already-started local server: node Mane_Oggarane_One_Shot_QA.mjs
 * NEVER creates orders, charges, refunds, zones, coupons or accounts.
 * Reads .env.local locally; never prints credentials or customer PII.
 */
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const base = process.cwd();
const warnings = [], failures = [], results = [];
const add = (category, test, outcome, note = '') => {
  results.push({category,test,outcome,note});
  if(outcome==='WARN') warnings.push(`${test}: ${note}`);
  if(outcome==='FAIL') failures.push(`${test}: ${note}`);
  console.log(`${outcome.padEnd(5)} ${category.padEnd(10)} ${test}${note ? ' — '+note : ''}`);
};
if (!fs.existsSync(path.join(base,'package.json'))) {
  console.error('Open the Next.js project root containing package.json before running this test.');
  process.exit(1);
}
console.log('Mane & Oggarane — ONE-SHOT LOCAL + DATABASE QA\n');
const envFile = path.join(base,'.env.local');
if (fs.existsSync(envFile)) {
  // Safe read of local, private env: values are never logged, uploaded, or added to report.
  try { process.loadEnvFile(envFile); add('LOCAL','Environment file detected','PASS'); }
  catch(e) { add('LOCAL','Environment file detected','WARN','Could not load .env.local'); }
} else add('LOCAL','Environment file detected','WARN','.env.local not found');

const npm = process.platform==='win32' ? 'npm.cmd':'npm';
for (const [label,script] of [['Source acceptance','qa:source'],['Order-state logic','qa:logic'],['HTTP access and rejection','qa:http']]) {
  const args = ['run',script];
  const start=Date.now();
  const cmd=process.platform==='win32' ? `${npm} run ${script}` : undefined;
  const r=process.platform==='win32'
    ?spawnSync('cmd.exe',['/d','/s','/c',cmd],{cwd:base,env:{...process.env,BASE_URL:process.env.BASE_URL||process.env.NEXT_PUBLIC_APP_URL||'http://localhost:3000'},encoding:'utf8',timeout:60000,maxBuffer:200000})
    :spawnSync(npm,args,{cwd:base,env:{...process.env,BASE_URL:process.env.BASE_URL||process.env.NEXT_PUBLIC_APP_URL||'http://localhost:3000'},encoding:'utf8',timeout:60000,maxBuffer:200000});
  if(r.error || r.status!==0) add('LOCAL',label, 'FAIL',(r.stderr||r.stdout||r.error?.message||'No output').trim().slice(-500));
  else add('LOCAL',label,'PASS',`Completed in ${Math.ceil((Date.now()-start)/1000)}s`);
}

let db;
const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(projectUrl) || !secret || secret.startsWith('YOUR_')) {
  add('DATABASE','Connected read-only audit','WARN','Supabase credentials not configured locally');
} else {
  try {
    const {createClient} = await import('@supabase/supabase-js');
    db = createClient(projectUrl, secret, {auth:{persistSession:false,autoRefreshToken:false}});
  } catch(e) { add('DATABASE','Connected read-only audit','WARN','Supabase SDK import failed'); }
}
const get = async (table,cols='*') => {
  const {data,error} = await db.from(table).select(cols).limit(500);
  if(error) throw new Error(`Unable to read ${table}: ${error.message}`);
  return data || [];
};
let findings={};
if(db) {
  try {
    const [zones, orders, coupons, campaigns, refunds, profiles, rewards, ledger, settings] = await Promise.all([
      get('delivery_zones','id,pin_code,active,fee_paise,minimum_paise'),
      get('orders','id,status,payment_status,fulfillment_type,total_paise,coupon_code,razorpay_payment_id,customer_id,created_at'),
      get('coupons','code,uses,reserved,max_uses,active'),
      get('campaigns','id,status'),
      get('refund_requests','order_id,status,provider_refund_id,needs_loyalty_review'),
      get('profiles','id,role,points_balance'),
      get('rewards','name,points_cost,active'),
      get('loyalty_ledger','order_id,kind,points'),
      get('settings','key,value')
    ]);
    const store=settings.find(s=>s.key==='store')?.value||{};
    const activeZones=zones.filter(z=>z.active);
    const paid=orders.filter(o=>o.payment_status==='paid');
    const delivery=orders.filter(o=>o.fulfillment_type==='delivery');
    const unfulfilled=orders.filter(o=>o.status==='awaiting_payment' || ['placed','accepted','preparing','ready','out_for_delivery'].includes(o.status));
    const invalidPaid=paid.filter(o=>!o.razorpay_payment_id);
    const invalidDelivered=orders.filter(o=>o.status==='delivered' && !['paid','refunded','partially_refunded'].includes(o.payment_status));
    const oversoldCoupons=coupons.filter(c=>c.max_uses!=null && c.uses+c.reserved>c.max_uses);
    const redeemed=ledger.filter(l=>l.kind==='redeemed');
    const rewardCodes=coupons.filter(c=>c.code?.startsWith('MNO'));
    const awardCount=new Map();
    for (const l of ledger) if(l.kind==='earned' && l.order_id) awardCount.set(l.order_id,(awardCount.get(l.order_id)||0)+1);
    const duplicateAwards=[...awardCount.values()].filter(x=>x>1).length;
    findings = {
      delivery_enabled:Boolean(store.delivery_enabled), active_delivery_zones:activeZones.length,
      delivery_orders:delivery.length, total_orders:orders.length,
      paid_orders:paid.length, unfulfilled_orders:unfulfilled.length,
      failed_orders:orders.filter(o=>o.payment_status==='failed').length,
      coupons:coupons.length, campaigns:campaigns.length,
      refund_requests:refunds.length, refunds_pending:refunds.filter(r=>r.status!=='processed').length,
      redeemed_ledger_entries:redeemed.length, reward_coupons:rewardCodes.length,
      customer_count:profiles.filter(p=>p.role==='customer').length,
      owner_count:profiles.filter(p=>p.role==='owner').length,
      active_rewards:rewards.filter(r=>r.active).length
    };
    add('DATABASE','Database read access','PASS');
    add('DELIVERY','Zone setup',activeZones.length>0?'PASS':'WARN',`${activeZones.length} active zone(s), delivery ${store.delivery_enabled?'ON':'OFF'}; no PIN invented`);
    add('DELIVERY','Paid delivery order exists',delivery.some(o=>o.payment_status==='paid')?'PASS':'WARN',`${delivery.length} delivery order(s) so far; no real rider GPS implied`);
    add('PAYMENTS','Captured order reference consistency',invalidPaid.length?'FAIL':'PASS',`${invalidPaid.length} paid order(s) missing Razorpay payment ID`);
    add('PAYMENTS','Delivered orders have valid payment state',invalidDelivered.length?'FAIL':'PASS',`${invalidDelivered.length} delivered order(s) with invalid payment state`);
    add('PAYMENTS','Failure case evidenced',findings.failed_orders?'PASS':'WARN',`${findings.failed_orders} failed order(s) in database; Test Mode bank failure must be run separately`);
    add('COUPONS','Usage never exceeds cap',oversoldCoupons.length?'FAIL':'PASS',`${oversoldCoupons.length} coupon(s) oversubscribed`);
    add('RETENTION','No duplicate loyalty earn per order',duplicateAwards?'FAIL':'PASS',`${duplicateAwards} duplicate earned-entry order(s)`);
    add('RETENTION','Reward redemption persisted',redeemed.length?'PASS':'WARN',`${redeemed.length} redemption(s), ${rewardCodes.length} generated reward coupon(s)`);
    add('REFUNDS','Refund-request safeguard table','PASS',`${refunds.length} refund request(s)`);
    add('REFUNDS','Provider-processed refund verified',refunds.some(r=>r.status==='processed')?'PASS':'WARN',`${refunds.length} request(s); requires provider + signed webhook to prove end-to-end`);
    add('RETENTION','Campaigns configured',campaigns.length?'PASS':'WARN',`${campaigns.length} campaign(s); drafts do not send external messages`);
  } catch(e) {
    add('DATABASE','Connected read-only audit','FAIL',String(e.message||e).slice(0,300));
  }
}
console.log('\nTOTAL: '+results.filter(r=>r.outcome==='PASS').length+' passed, '+warnings.length+' warnings, '+failures.length+' failed.');
console.log('A warning means NOT YET TESTED, not necessarily a defect.');
console.log('No order, payment, delivery setting, coupon, refund, or user record was changed.');
const report={created_at:new Date().toISOString(),base_url:process.env.BASE_URL||process.env.NEXT_PUBLIC_APP_URL||'http://localhost:3000',results,findings,limits:['No Razorpay provider or live webhook verification','No bank-failure simulation','No delivery order created','No refund requested or issued','No penetration or compliance audit']};
const reportFile=path.join(base,'mane_qa_report.json');
fs.writeFileSync(reportFile,JSON.stringify(report,null,2));
console.log('Report: mane_qa_report.json (no customer PII or secrets).');
if(failures.length)process.exitCode=1;
