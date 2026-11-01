import {staffFromRequest,serviceDb} from '../../../../lib/supabase';import {respond,fail,jsonBody,text} from '../../../../lib/api';
export const dynamic='force-dynamic';
const DAY=86400000;
type O={customer_id:string|null;total_paise:number;discount_paise:number;coupon_code:string|null;created_at:string;id:string;status:string;payment_status:string};

/**
 * Owner growth & retention metrics. Definitions (shown in the dashboard):
 * - Qualifying order: payment captured (paid) and not cancelled/refunded.
 * - New customer (period): first-ever qualifying order falls inside the period.
 * - Returning customer (period): ordered in the period AND had a qualifying order before it.
 * - Repeat-customer rate: customers with 2+ qualifying orders ÷ customers with 1+ (all time).
 * - Second-order conversion: customers whose first order is 14+ days old who have ordered again.
 * - Inactive 30/60: last qualifying order 30+/60+ days ago.
 * - Campaign-attributed sales: qualifying orders using a coupon linked to a campaign.
 *   This is attribution, NOT proof of extra (incremental) sales.
 */
export async function GET(req:Request){
 const staff=await staffFromRequest(req,['owner','manager']);if(!staff)return fail('Manager access required',403);
 const days=Math.min(365,Math.max(7,Number(new URL(req.url).searchParams.get('days'))||30));
 try{
  const db=serviceDb();const now=Date.now();const since=now-days*DAY;
  const [{data:orders,error:oe},{data:ledger},{data:coupons},{data:reviews}]=await Promise.all([
   db.from('orders').select('id,customer_id,total_paise,discount_paise,coupon_code,created_at,status,payment_status').in('payment_status',['paid','partially_refunded','refunded']).order('created_at',{ascending:true}).limit(20000),
   db.from('loyalty_ledger').select('kind,points,created_at').gte('created_at',new Date(since).toISOString()).limit(20000),
   db.from('coupons').select('code,campaign_id'),
   db.from('payment_reviews').select('id,order_id,razorpay_payment_id,amount_paise,reason,status,created_at').eq('status','open').order('created_at',{ascending:false}).limit(50)]);
  if(oe)throw oe;
  const q=(orders||[]).filter((o:O)=>o.payment_status==='paid'&&o.status!=='cancelled') as O[];
  const inPeriod=q.filter(o=>Date.parse(o.created_at)>=since);
  const byCustomer=new Map<string,number[]>();
  for(const o of q){if(!o.customer_id)continue;const a=byCustomer.get(o.customer_id)||[];a.push(Date.parse(o.created_at));byCustomer.set(o.customer_id,a)}
  let newC=0,returning=0,repeat=0,eligible2=0,converted2=0,inactive30=0,inactive60=0;
  const activeInPeriod=new Set(inPeriod.map(o=>o.customer_id).filter(Boolean) as string[]);
  for(const [id,ts] of byCustomer){
   const first=ts[0],last=ts[ts.length-1];
   if(first>=since)newC++;else if(activeInPeriod.has(id))returning++;
   if(ts.length>=2)repeat++;
   if(now-first>=14*DAY){eligible2++;if(ts.length>=2)converted2++}
   if(now-last>=30*DAY)inactive30++;if(now-last>=60*DAY)inactive60++;
  }
  const revenue=inPeriod.reduce((s,o)=>s+o.total_paise,0);
  const campaignCodes=new Set((coupons||[]).filter(c=>c.campaign_id).map(c=>String(c.code).toUpperCase()));
  const withCoupon=inPeriod.filter(o=>o.coupon_code);const campaign=withCoupon.filter(o=>campaignCodes.has(String(o.coupon_code).toUpperCase()));
  const ids=inPeriod.map(o=>o.id);
  const top=new Map<string,{name:string;qty:number;revenue:number}>();
  for(let i=0;i<ids.length;i+=500){const {data:items}=await db.from('order_items').select('product_id,name,quantity,line_total_paise').in('order_id',ids.slice(i,i+500));for(const it of items||[]){const x=top.get(it.product_id)||{name:it.name,qty:0,revenue:0};x.qty+=it.quantity;x.revenue+=it.line_total_paise;top.set(it.product_id,x)}}
  const pts=(kind:string)=>(ledger||[]).filter(l=>l.kind===kind).reduce((s,l)=>s+Math.abs(l.points),0);
  const testMode=(process.env.RAZORPAY_KEY_ID||'rzp_test_').startsWith('rzp_test_');
  return respond({days,testMode,metrics:{
   qualifyingOrders:inPeriod.length,revenuePaise:revenue,aovPaise:inPeriod.length?Math.round(revenue/inPeriod.length):0,
   customersInPeriod:activeInPeriod.size,newCustomers:newC,returningCustomers:returning,
   ordersPerCustomer:activeInPeriod.size?+(inPeriod.filter(o=>o.customer_id).length/activeInPeriod.size).toFixed(2):0,
   repeatRate:byCustomer.size?Math.round(repeat/byCustomer.size*100):0,customersAllTime:byCustomer.size,
   secondOrderConversion:eligible2?Math.round(converted2/eligible2*100):null,secondOrderEligible:eligible2,
   inactive30,inactive60,pointsEarned:pts('earned'),pointsRedeemed:pts('redeemed'),
   couponOrders:withCoupon.length,couponDiscountPaise:withCoupon.reduce((s,o)=>s+o.discount_paise,0),
   campaignOrders:campaign.length,campaignRevenuePaise:campaign.reduce((s,o)=>s+o.total_paise,0)},
   topDishes:[...top.values()].sort((a,b)=>b.qty-a.qty).slice(0,5),
   paymentReviews:reviews||[]});
 }catch(e){console.error('retention',e);return fail('Could not load retention metrics',503)}
}

/** Owner resolves a late-payment review after acting in the Razorpay dashboard. */
export async function PATCH(req:Request){
 const staff=await staffFromRequest(req,['owner','manager']);if(!staff)return fail('Manager access required',403);
 const b=await jsonBody(req);const id=Number(b?.id);const status=text(b?.status,20);
 if(!Number.isInteger(id)||!['refunded','confirmed','dismissed'].includes(status))return fail('Invalid review update');
 try{const db=serviceDb();const {error}=await db.from('payment_reviews').update({status,resolved_at:new Date().toISOString()}).eq('id',id).eq('status','open');if(error)throw error;
  await db.from('audit_log').insert({actor_id:staff.id,action:'payment_review.'+status,object_id:String(id)});return respond({ok:true})}
 catch(e){console.error('review update',e);return fail('Could not update review',503)}
}
