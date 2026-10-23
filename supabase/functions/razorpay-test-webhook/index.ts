// Mane & Oggarane — Razorpay Test Mode webhook endpoint.
// Public HTTPS endpoint for Razorpay; protected by Razorpay's raw-body HMAC,
// NOT by Vercel Authentication or a Supabase user JWT.
// Fail closed when provider credentials or webhook secret are not configured.
import {createClient} from 'npm:@supabase/supabase-js@2.57.0';

type Json = Record<string, unknown>;
type ProviderPayment = {id:string;order_id:string;status:string;amount:number;currency:string};
type ProviderRefund = {id:string;payment_id:string;status:string;amount:number;currency:string};
function reply(status:number,body:Json):Response {
  return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
}
function object(value:unknown):Json {
  return value!==null && typeof value==='object' && !Array.isArray(value)?value as Json:{};
}
function value(x:unknown):string {return typeof x==='string'?x:'';}
function entity(event:Json,key:'payment'|'order'|'refund'):Json {
  return object(object(object(event.payload)[key]).entity);
}
async function authentic(raw:Uint8Array,signature:string,secret:string):Promise<boolean>{
  if(!secret||!/^[0-9a-f]{64}$/i.test(signature))return false;
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const digest=new Uint8Array(await crypto.subtle.sign('HMAC',key,raw));
  const provided=Uint8Array.from(signature.match(/../g)!.map(hex=>parseInt(hex,16)));
  let diff=0;for(let i=0;i<digest.length;i++)diff|=digest[i]^provided[i];
  return diff===0;
}
async function razorpay(path:string,apiKey:string,apiSecret:string):Promise<Json>{
  const result=await fetch('https://api.razorpay.com/v1/'+path,{
    headers:{Authorization:'Basic '+btoa(apiKey+':'+apiSecret),'Accept':'application/json'},
    signal:AbortSignal.timeout(6500)
  });
  if(!result.ok)throw new Error('Canonical provider API lookup failed ('+result.status+')');
  return object(await result.json());
}
async function refundTotal(paymentId:string,key:string,secret:string):Promise<{total:number;latestId:string}>{
  let total=0,latestId='',skip=0;
  // Never trust a truncated refund list: refuse to reconcile if the cap is exceeded.
  for(let page=0;page<20;page++){
    const response=await razorpay('payments/'+encodeURIComponent(paymentId)+'/refunds?count=100&skip='+skip,key,secret);
    const items=response.items;
    if(!Array.isArray(items))throw new Error('Invalid provider refund list');
    for(const entry of items){
      const refund=object(entry) as unknown as ProviderRefund;
      if(refund.payment_id!==paymentId)throw new Error('Provider refund/payment mismatch');
      if(refund.status==='processed'){
        if(refund.currency!=='INR'||!Number.isSafeInteger(refund.amount)||refund.amount<=0)throw new Error('Invalid processed refund');
        total+=refund.amount;
        latestId=refund.id;
      }
    }
    if(items.length<100)return {total,latestId};
    skip+=items.length;
  }
  throw new Error('Refund pagination incomplete; manual review required');
}
Deno.serve(async (request:Request)=>{
  if(request.method!=='POST')return reply(405,{error:'Method not allowed'});
  const hookSecret=Deno.env.get('RAZORPAY_WEBHOOK_SECRET')||'';
  const apiKey=Deno.env.get('RAZORPAY_KEY_ID')||'';
  const apiSecret=Deno.env.get('RAZORPAY_KEY_SECRET')||'';
  const dbUrl=Deno.env.get('SUPABASE_URL')||'';
  const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  // This endpoint is intentionally limited to TEST MODE during staging.
  if(!hookSecret||!apiKey.startsWith('rzp_test_')||!apiSecret||!dbUrl||!serviceKey){
    return reply(503,{error:'Test webhook is not configured'});
  }
  const eventId=request.headers.get('x-razorpay-event-id')||'';
  const signature=request.headers.get('x-razorpay-signature')||'';
  if(!eventId||eventId.length>120||!/^[a-zA-Z0-9_-]+$/.test(eventId))return reply(400,{error:'Invalid event ID'});
  const contentLength=Number(request.headers.get('content-length')||'0');
  if(contentLength>262144)return reply(413,{error:'Payload too large'});
  const raw=new Uint8Array(await request.arrayBuffer());
  if(raw.length===0||raw.length>262144)return reply(413,{error:'Invalid payload size'});
  if(!await authentic(raw,signature,hookSecret))return reply(403,{error:'Invalid signature'});
  let evt:Json;
  try {evt=object(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw)));}
  catch{return reply(400,{error:'Invalid JSON'});}
  const type=value(evt.event);
  if(!type||type.length>100)return reply(400,{error:'Invalid event type'});
  try{
    const db=createClient(dbUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:previous,error:readError}=await db.from('payment_events').select('id').eq('id',eventId).maybeSingle();
    if(readError)throw readError;
    if(previous)return reply(200,{ok:true,duplicate:true});
    if(type==='payment.captured'||type==='order.paid'){
      const snapshot=entity(evt,'payment');
      const providerOrderId=value(snapshot.order_id)||value(entity(evt,'order').id);
      // order.paid includes the order entity, but a verified captured payment is
      // mandatory before money/order state changes. An event lacking a payment
      // entity must be retried/reconciled rather than optimistically marked paid.
      const paymentId=value(snapshot.id);
      if(!providerOrderId||!paymentId)throw new Error('Captured-payment reconciliation needs a payment entity');
      const {data:order,error:orderError}=await db.from('orders').select('id,total_paise').eq('razorpay_order_id',providerOrderId).maybeSingle();
      if(orderError)throw orderError;
      if(order){
        const canonical=await razorpay('payments/'+encodeURIComponent(paymentId),apiKey,apiSecret) as unknown as ProviderPayment;
        if(canonical.status!=='captured'||canonical.order_id!==providerOrderId||canonical.currency!=='INR'||canonical.amount!==order.total_paise){
          throw new Error('Canonical payment validation failed');
        }
        const {error}=await db.rpc('mark_order_paid',{p_order_id:order.id,p_rzp_order:providerOrderId,p_rzp_payment:canonical.id});
        if(error)throw error;
      }
    } else if(type==='refund.processed'){
      const snapshot=entity(evt,'refund');
      const paymentId=value(snapshot.payment_id);
      if(!paymentId)throw new Error('Refund has no payment ID');
      const {data:order,error:orderError}=await db.from('orders').select('id,total_paise,razorpay_payment_id').eq('razorpay_payment_id',paymentId).maybeSingle();
      if(orderError)throw orderError;
      if(order){
        const {total,latestId}=await refundTotal(paymentId,apiKey,apiSecret);
        if(total<1||total>order.total_paise||!latestId)throw new Error('Refund sum invalid or not yet canonical');
        const {error}=await db.rpc('confirm_provider_refund',{p_order_id:order.id,p_refund_id:latestId,p_processed_total_paise:total});
        if(error)throw error;
      }
    } else if(type==='payment.failed'){
      // Failed attempts may be retried on the same Razorpay order.
      // Never cancel a later, correctly captured payment based on a failed attempt.
    }
    // Only mark as processed after all canonical validations and RPCs succeed.
    const {error:insertError}=await db.from('payment_events').insert({id:eventId,event_type:type});
    if(insertError&&insertError.code!=='23505')throw insertError;
    return reply(200,{ok:true});
  }catch(error){
    console.error('Razorpay Test webhook needs retry/review',error instanceof Error?error.message:'Unexpected error');
    return reply(500,{error:'Webhook reconciliation incomplete; provider retry required'});
  }
});
